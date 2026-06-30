import { FC, useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import * as ts from 'typescript'
import { Playground } from '../data/types'

interface CodeRunnerProps {
  playground: Playground
}

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

interface RunOutput {
  logs: string[]
  results: TestResult[]
  /** Ошибка компиляции/выполнения всего блока (а не отдельного теста) */
  fatal?: string
}

/**
 * Компилирует TS-код в JS прямо в браузере (без проверки типов —
 * только транспиляция, как ts.transpileModule). Возвращает JS и
 * синтаксические диагностики (тип-ошибки не проверяются — это делает Monaco).
 */
function compile(code: string): { js: string; diagnostics: string[] } {
  const result = ts.transpileModule(code, {
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      noEmitOnError: false,
    },
  })
  const diagnostics = (result.diagnostics ?? []).map(d =>
    ts.flattenDiagnosticMessageText(d.messageText, '\n'),
  )
  return { js: result.outputText, diagnostics }
}

/**
 * Выполняет пользовательский код и прогоняет тесты в изолированной функции.
 * Тесты получают доступ к объявленным в коде переменным/функциям через
 * общую область видимости и к хелперу expect().
 */
function runCode(userCode: string, tests: Playground['tests']): RunOutput {
  const logs: string[] = []

  const compiled = compile(userCode)
  if (compiled.diagnostics.length > 0) {
    return {
      logs,
      results: [],
      fatal: 'Синтаксическая ошибка:\n' + compiled.diagnostics.join('\n'),
    }
  }

  // мини-реализация expect(...).toEqual(...) с глубоким сравнением
  const harness = `
    const __logs = [];
    const console = {
      log: (...args) => __logs.push(args.map(__stringify).join(' ')),
      error: (...args) => __logs.push(args.map(__stringify).join(' ')),
      warn: (...args) => __logs.push(args.map(__stringify).join(' ')),
    };
    function __stringify(v) {
      if (typeof v === 'string') return v;
      try { return JSON.stringify(v); } catch { return String(v); }
    }
    function __deepEqual(a, b) {
      if (a === b) return true;
      if (typeof a !== typeof b) return false;
      if (a && b && typeof a === 'object') {
        const ka = Object.keys(a), kb = Object.keys(b);
        if (ka.length !== kb.length) return false;
        return ka.every(k => __deepEqual(a[k], b[k]));
      }
      return false;
    }
    function expect(actual) {
      return {
        toEqual: (expected) => {
          if (!__deepEqual(actual, expected))
            throw new Error('ожидалось ' + __stringify(expected) + ', получено ' + __stringify(actual));
          return true;
        },
        toBe: (expected) => {
          if (actual !== expected)
            throw new Error('ожидалось ' + __stringify(expected) + ', получено ' + __stringify(actual));
          return true;
        },
        toThrow: () => {
          let threw = false;
          try { actual(); } catch { threw = true; }
          if (!threw) throw new Error('ожидалось исключение, но его не было');
          return true;
        },
      };
    }
    const __results = [];
  `

  const testRunners = tests
    .map(
      t => `
    try {
      const __ok = (${t.assert});
      __results.push({ name: ${JSON.stringify(t.name)}, passed: __ok !== false });
    } catch (e) {
      __results.push({ name: ${JSON.stringify(t.name)}, passed: false, error: String(e && e.message || e) });
    }
  `,
    )
    .join('\n')

  const fullSource = `
    ${harness}
    try {
      ${compiled.js}
    } catch (e) {
      return { logs: __logs, results: [], fatal: String(e && e.message || e) };
    }
    ${testRunners}
    return { logs: __logs, results: __results };
  `

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(fullSource)
    const out = fn() as RunOutput
    return { logs: out.logs ?? logs, results: out.results ?? [], fatal: out.fatal }
  } catch (e) {
    return {
      logs,
      results: [],
      fatal: e instanceof Error ? e.message : String(e),
    }
  }
}

export const CodeRunner: FC<CodeRunnerProps> = ({ playground }) => {
  const [code, setCode] = useState(playground.starter)
  const [output, setOutput] = useState<RunOutput | null>(null)
  const [running, setRunning] = useState(false)

  const handleRun = useCallback(() => {
    setRunning(true)
    // даём UI отрисовать состояние "выполняется"
    setTimeout(() => {
      setOutput(runCode(code, playground.tests))
      setRunning(false)
    }, 0)
  }, [code, playground.tests])

  const reset = () => {
    setCode(playground.starter)
    setOutput(null)
  }

  const allPassed =
    output && !output.fatal && output.results.length > 0 && output.results.every(r => r.passed)

  return (
    <div className='rf-runner'>
      <div className='rf-runner-toolbar'>
        <span className='rf-runner-label'>Песочница — отредактируй и запусти</span>
        <div className='rf-runner-actions'>
          <button
            className='rf-runner-reset'
            onClick={reset}
          >
            Сбросить
          </button>
          <button
            className='rf-runner-run'
            onClick={handleRun}
            disabled={running}
          >
            {running ? 'Выполняется…' : '▶ Запустить'}
          </button>
        </div>
      </div>

      <div className='rf-runner-editor'>
        <Editor
          height='340px'
          defaultLanguage='typescript'
          theme='vs-dark'
          value={code}
          onChange={v => setCode(v ?? '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>

      {output && (
        <div className='rf-runner-output'>
          {output.fatal ? (
            <div className='rf-runner-fatal'>
              <strong>Ошибка выполнения:</strong> {output.fatal}
            </div>
          ) : (
            <>
              <div className={`rf-runner-summary${allPassed ? ' rf-runner-summary-ok' : ''}`}>
                {allPassed
                  ? `✓ Все тесты пройдены (${output.results.length})`
                  : `Пройдено ${output.results.filter(r => r.passed).length} из ${output.results.length}`}
              </div>

              <ul className='rf-runner-tests'>
                {output.results.map((r, i) => (
                  <li
                    key={i}
                    className={`rf-runner-test${r.passed ? ' rf-runner-test-ok' : ' rf-runner-test-fail'}`}
                  >
                    <span className='rf-runner-test-icon'>{r.passed ? '✓' : '✕'}</span>
                    <span className='rf-runner-test-name'>{r.name}</span>
                    {r.error && <span className='rf-runner-test-err'>{r.error}</span>}
                  </li>
                ))}
              </ul>

              {output.logs.length > 0 && (
                <pre className='rf-runner-console'>{output.logs.join('\n')}</pre>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

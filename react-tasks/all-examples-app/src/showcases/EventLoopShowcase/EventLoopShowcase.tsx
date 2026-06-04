import { useState, useEffect, useRef } from 'react'
import './styles.css'
import { CASES } from './data/cases'
import { DiagramNode } from './components/DiagramNode'
import { TimelineView } from './components/TimelineView'
import { ReactPageDemo } from './components/ReactPageDemo'

interface TooltipContent {
  title: string
  body: string
  sources: string[]
  priority: string
}

const TOOLTIPS = {
  stack: {
    title: 'Call Stack — Стек вызовов',
    body:
      'Синхронный стек выполнения инструкций (LIFO). JS однопоточен — пока стек не пуст, ни одна другая задача не может начаться. Все вызовы функций, console.log, синхронные операторы — выполняются здесь.',
    sources: ['function call', 'console.log', 'синхронные операторы'],
    priority: 'Высочайший — блокирует всё остальное',
  },
  microtasks: {
    title: 'Microtask Queue — Очередь микрозадач',
    body:
      'Очередь очищается ПОЛНОСТЬЮ (включая микрозадачи, добавленные в процессе очистки) перед тем, как Event Loop перейдет к рендерингу или макрозадаче. Опасность: бесконечный цикл микрозадач заморозит UI (starvation).',
    sources: [
      'Promise.then / catch / finally',
      'await (после первого приостанова)',
      'queueMicrotask(...)',
      'MutationObserver',
    ],
    priority: 'Выше макрозадач и рендера',
  },
  rendering: {
    title: 'Rendering Pipeline — Конвейер рендеринга',
    body:
      'Запускается с частотой экрана (~16.6мс при 60Гц). Порядок: requestAnimationFrame → Recalculate Style → Layout → Paint → Composite. Браузер может пропустить кадр, если визуальных изменений нет, или объединить несколько макрозадач до paint.',
    sources: [
      'requestAnimationFrame (rAF)',
      'ResizeObserver / IntersectionObserver',
      'Style / Layout / Paint',
    ],
    priority: 'По расписанию монитора (60/120 Гц)',
  },
  macrotasks: {
    title: 'Macrotask Queue — Очередь макрозадач (Tasks)',
    body:
      'За один тик Event Loop выполняет РОВНО ОДНУ макрозадачу, после чего сразу очищает очередь микрозадач. Между макрозадачами браузер успевает отрисовать кадр и обработать пользовательский ввод.',
    sources: [
      'setTimeout / setInterval',
      'События ввода (click, scroll, input)',
      'Сетевые ответы (fetch, XHR, WebSocket)',
      'postMessage / MessageChannel',
      'Парсинг HTML',
    ],
    priority: 'Низкий — по одной за тик',
  },
} satisfies Record<string, TooltipContent>

export function EventLoopShowcase() {
  const [activeCaseId, setActiveCaseId] = useState<string>('classic')
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playSpeed, setPlaySpeed] = useState<number>(1500)
  const [viewMode, setViewMode] = useState<'step' | 'timeline'>('step')
  const [quizMode, setQuizMode] = useState<boolean>(false)
  const [quizRevealed, setQuizRevealed] = useState<boolean>(false)
  const [quizGuess, setQuizGuess] = useState<string>('')

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeCase = CASES.find(c => c.id === activeCaseId) || CASES[0]
  const stepsCount = activeCase.steps.length
  const currentStep = activeCase.steps[stepIndex] || activeCase.steps[0]

  const handleCaseChange = (caseId: string) => {
    setActiveCaseId(caseId)
    setStepIndex(0)
    setIsPlaying(false)
    setQuizRevealed(false)
    setQuizGuess('')
  }

  const stepForward = () => {
    setStepIndex(prev => (prev < stepsCount - 1 ? prev + 1 : prev))
  }

  const stepBackward = () => {
    setStepIndex(prev => (prev > 0 ? prev - 1 : 0))
  }

  const resetSimulator = () => {
    setStepIndex(0)
    setIsPlaying(false)
    setQuizRevealed(false)
    setQuizGuess('')
  }

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStepIndex(prev => {
          if (prev < stepsCount - 1) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, playSpeed)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, playSpeed, stepsCount])

  const getPhaseClass = () => {
    switch (currentStep.phase) {
      case 'stack':
        return 'phase-stack'
      case 'microtasks':
        return 'phase-microtasks'
      case 'rendering':
      case 'paint':
        return 'phase-rendering'
      case 'macrotasks':
        return 'phase-macrotasks'
      case 'react-render':
      case 'react-commit':
        return 'phase-microtasks'
      default:
        return ''
    }
  }

  // Hide console output in quiz mode until revealed
  const consoleVisible = !quizMode || quizRevealed
  const displayedConsole = consoleVisible ? currentStep.console : []

  return (
    <div style={{ padding: '32px 0', maxWidth: 1100 }}>
      <div className='el-header'>
        <h1 className='el-title'>Визуальный симулятор Event Loop</h1>
        <p className='el-subtitle'>
          Пошаговое интерактивное обучение циклу событий в браузере, Node.js и React.
          Наблюдай за движением задач между Call Stack, очередями микро- и макрозадач,
          React Scheduler и Rendering Pipeline.
        </p>
      </div>

      {/* Case Selector Tabs */}
      <div className='el-tabs-container' style={{ marginBottom: 16 }}>
        {CASES.map(c => (
          <button
            key={c.id}
            onClick={() => handleCaseChange(c.id)}
            className={`el-tab-btn ${activeCaseId === c.id ? 'active' : ''}`}
          >
            {c.title}
            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 4,
                background: activeCaseId === c.id ? '#eff6ff' : '#cbd5e1',
                color: activeCaseId === c.id ? '#4f46e5' : '#475569',
              }}
            >
              {c.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Mode toggles */}
      <div className='el-mode-bar'>
        <div className='el-mode-group'>
          <span className='el-mode-label'>Режим:</span>
          <button
            className={`el-mode-btn ${viewMode === 'step' ? 'active' : ''}`}
            onClick={() => setViewMode('step')}
          >
            Пошагово
          </button>
          <button
            className={`el-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </button>
        </div>
        <div className='el-mode-group'>
          <label className='el-quiz-toggle'>
            <input
              type='checkbox'
              checked={quizMode}
              onChange={e => {
                setQuizMode(e.target.checked)
                setQuizRevealed(false)
              }}
            />
            <span>🧠 Quiz: угадай вывод перед просмотром</span>
          </label>
        </div>
      </div>

      {/* Quiz panel */}
      {quizMode && (
        <div className='el-quiz-panel'>
          <div className='el-quiz-title'>Что выведет console для кейса «{activeCase.title}»?</div>
          <textarea
            className='el-quiz-input'
            placeholder='Запиши предполагаемый порядок вывода (каждая строка с новой строки)...'
            value={quizGuess}
            onChange={e => setQuizGuess(e.target.value)}
            disabled={quizRevealed}
            rows={4}
          />
          {!quizRevealed ? (
            <button className='el-btn-primary' onClick={() => setQuizRevealed(true)}>
              Показать ответ
            </button>
          ) : (
            <div className='el-quiz-answer'>
              <div className='el-quiz-answer-title'>Правильный ответ:</div>
              <ol>
                {(activeCase.expectedOutput ?? []).map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Timeline view */}
      {viewMode === 'timeline' && (
        <TimelineView
          steps={activeCase.steps}
          currentIndex={stepIndex}
          onSelect={setStepIndex}
        />
      )}

      {/* Simulator Interactive Grid */}
      <div className='el-sim-grid'>
        {/* LEFT COLUMN */}
        <div className='el-left-panel'>
          <div className='el-explainer-panel'>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#1d4ed8',
                marginBottom: 4,
              }}
            >
              Шаг {stepIndex + 1} из {stepsCount}: {currentStep.phaseText}
              {currentStep.tMs !== undefined && (
                <span style={{ marginLeft: 8, color: '#64748b' }}>
                  · t ≈ {currentStep.tMs}мс
                </span>
              )}
            </div>
            <p className='el-explainer-text'>{currentStep.action}</p>
          </div>

          <div className='el-card'>
            <div className='el-card-header'>
              <span className='el-card-title'>Код примера</span>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>JavaScript</span>
            </div>
            <div className='el-code-editor'>
              {activeCase.code.map((lineText, idx) => {
                const isLineActive = currentStep.line === idx + 1
                return (
                  <div
                    key={idx}
                    className={`el-code-line ${isLineActive ? 'active' : ''}`}
                  >
                    <span className='el-code-line-num'>{idx + 1}</span>
                    <span>{lineText || ' '}</span>
                  </div>
                )
              })}
            </div>

            <div className='el-controls'>
              <div className='el-controls-buttons'>
                <button
                  className='el-btn-secondary'
                  onClick={stepBackward}
                  disabled={stepIndex === 0}
                  title='Назад'
                >
                  ◀
                </button>
                <button
                  className='el-btn-primary'
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? '⏸ Пауза' : '▶ Запустить авто'}
                </button>
                <button
                  className='el-btn-secondary'
                  onClick={stepForward}
                  disabled={stepIndex === stepsCount - 1}
                  title='Вперед'
                >
                  ▶
                </button>
                <button
                  className='el-btn-secondary'
                  onClick={resetSimulator}
                  title='Сбросить'
                >
                  🔄
                </button>
              </div>

              <div className='el-speed-control'>
                <span>Скорость: {Math.round(3000 - playSpeed)}мс</span>
                <input
                  type='range'
                  min='500'
                  max='2500'
                  step='250'
                  value={3000 - playSpeed}
                  onChange={e => setPlaySpeed(3000 - Number(e.target.value))}
                  className='el-slider'
                />
              </div>
            </div>
          </div>

          <div className='el-console'>
            <div className='el-console-header'>
              <span>
                Лог вывода (Console)
                {quizMode && !quizRevealed && (
                  <span style={{ marginLeft: 8, color: '#fbbf24' }}>· скрыто (quiz)</span>
                )}
              </span>
              <button
                onClick={() => setStepIndex(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Clear
              </button>
            </div>
            <div className='el-console-list'>
              {displayedConsole.length === 0 ? (
                <div className='el-console-empty'>
                  {quizMode && !quizRevealed && currentStep.console.length > 0
                    ? '🧠 Вывод скрыт. Нажми "Показать ответ" в Quiz панели.'
                    : 'В консоли пока нет записей...'}
                </div>
              ) : (
                displayedConsole.map((log, idx) => (
                  <div key={idx} className='el-console-line'>
                    &gt; {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className='el-right-panel'>
          <div className='el-card el-diagram-card'>
            <div
              className='el-card-title'
              style={{ alignSelf: 'flex-start', marginBottom: 12 }}
            >
              Цикл событий (Event Loop)
            </div>
            <div className='el-diagram-container'>
              <div className={`el-diagram-inner ${getPhaseClass()}`}>
                <div className='el-loop-center'>
                  <span>Текущая фаза:</span>
                  <div className='el-loop-center-phase'>{currentStep.phaseText}</div>
                </div>

                <DiagramNode
                  className={`node-stack ${currentStep.phase === 'stack' ? 'active' : ''}`}
                  label='CALL STACK'
                  sub='Синхронно'
                  tooltip={TOOLTIPS.stack}
                />
                <DiagramNode
                  className={`node-micro ${currentStep.phase === 'microtasks' ? 'active' : ''}`}
                  label='MICRO TASKS'
                  sub='Promise / await'
                  tooltip={TOOLTIPS.microtasks}
                />
                <DiagramNode
                  className={`node-render ${
                    currentStep.phase === 'rendering' || currentStep.phase === 'paint'
                      ? 'active'
                      : ''
                  }`}
                  label='RENDERING'
                  sub='rAF / Layout / Paint'
                  tooltip={TOOLTIPS.rendering}
                />
                <DiagramNode
                  className={`node-macro ${currentStep.phase === 'macrotasks' ? 'active' : ''}`}
                  label='MACRO TASKS'
                  sub='setTimeout / Event'
                  tooltip={TOOLTIPS.macrotasks}
                />
              </div>
            </div>

            {(currentStep.phase === 'react-render' || currentStep.phase === 'react-commit') && (
              <div className='el-react-overlay'>
                <span className='el-react-pill'>⚛ React Scheduler работает</span>
                <span className='el-react-sub'>
                  Внутри использует MessageChannel (macrotask), может прерываться каждые ~5мс
                </span>
              </div>
            )}
          </div>

          {activeCaseId === 'useQueryFlow' && (
            <ReactPageDemo step={currentStep} />
          )}
          {activeCaseId === 'reactRender' && (
            <ReactPageDemo step={currentStep} variant='render' />
          )}

          <div className='el-pools-grid'>
            <div className='el-stack-view'>
              <div className='el-stack-title'>
                <span>Стек вызовов (Call Stack)</span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                  LIFO (Последний вошел - первый вышел)
                </span>
              </div>
              <div className='el-stack-container'>
                {currentStep.stack.length === 0 ? (
                  <div className='el-queue-empty'>Стек пуст (движок спит)</div>
                ) : (
                  currentStep.stack.map((stackItem, idx) => (
                    <div key={idx} className='el-stack-item'>
                      {stackItem}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className='el-api-view'>
              <div className='el-stack-title'>
                <span>Web APIs & Фоновые потоки</span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                  Параллельное окружение
                </span>
              </div>
              <div className='el-api-container'>
                {currentStep.webApis.length === 0 ? (
                  <div className='el-queue-empty'>Нет фоновых задач</div>
                ) : (
                  currentStep.webApis.map((api, idx) => (
                    <div key={idx} className='el-api-item'>
                      <span>⚙️ {api.name}</span>
                      {api.detail && <span className='el-api-badge'>{api.detail}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className='el-queues-container'>
            <div className='el-queue-card'>
              <div className='el-queue-header'>
                <h4 className='el-queue-title' style={{ color: '#0891b2' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#06b6d4',
                    }}
                  ></span>
                  Очередь микрозадач (Microtask Queue)
                </h4>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                  FIFO • Приоритетная
                </span>
              </div>
              <div className='el-queue-list'>
                {currentStep.microtasks.length === 0 ? (
                  <div className='el-queue-empty'>Очередь микрозадач пуста</div>
                ) : (
                  currentStep.microtasks.map((task, idx) => (
                    <div key={idx} className='el-queue-item micro'>
                      {task}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className='el-queue-card'>
              <div className='el-queue-header'>
                <h4 className='el-queue-title' style={{ color: '#d97706' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#f59e0b',
                    }}
                  ></span>
                  Очередь макрозадач (Macrotask Queue / Tasks)
                </h4>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                  FIFO • Выполнение по одной
                </span>
              </div>
              <div className='el-queue-list'>
                {currentStep.macrotasks.length === 0 ? (
                  <div className='el-queue-empty'>Очередь макрозадач пуста</div>
                ) : (
                  currentStep.macrotasks.map((task, idx) => (
                    <div key={idx} className='el-queue-item macro'>
                      {task}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theory Section */}
      <div className='el-theory-section'>
        <h2 className='el-theory-title'>Справочник: Event Loop, React и асинхронность</h2>
        <div className='el-theory-grid'>
          <div className='el-theory-card'>
            <h4>Микрозадачи vs Макрозадачи</h4>
            <table className='el-theory-table'>
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Источники</th>
                  <th>Приоритет</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: '#0891b2', fontWeight: 700 }}>Microtask</td>
                  <td>
                    <code>Promise.then/catch</code>
                    <br />
                    <code>await</code>
                    <br />
                    <code>queueMicrotask</code>
                    <br />
                    <code>MutationObserver</code>
                  </td>
                  <td>
                    <strong>Высочайший.</strong> Очередь очищается полностью между макрозадачами.
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#d97706', fontWeight: 700 }}>Macrotask</td>
                  <td>
                    <code>setTimeout/Interval</code>
                    <br />
                    Пользовательский ввод
                    <br />
                    Сетевые ответы (HTTP)
                    <br />
                    <code>postMessage</code> / <code>MessageChannel</code>
                  </td>
                  <td>
                    <strong>Низкий.</strong> За один тик — только ОДНА макрозадача.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className='el-theory-card'>
            <h4>⚛ React 18 жизненный цикл</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>Scheduler:</strong> React использует <code>MessageChannel</code> чтобы планировать работу
                как макрозадачу с возможностью yield (concurrent mode).
              </li>
              <li>
                <strong>Render phase:</strong> вызов компонентов + reconciliation. Прерываема.
              </li>
              <li>
                <strong>Commit phase:</strong> DOM mutations. Синхронно.
              </li>
              <li>
                <strong>useLayoutEffect:</strong> синхронно сразу после commit, ДО paint. Для измерений DOM.
              </li>
              <li>
                <strong>Paint:</strong> браузер рисует пиксели.
              </li>
              <li>
                <strong>useEffect:</strong> асинхронно ПОСЛЕ paint. Для side-effects.
              </li>
              <li>
                <strong>flushSync:</strong> принудительный синхронный render+commit (выход из batching).
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>⚛ Automatic Batching (React 18)</h4>
            <ul className='el-theory-list'>
              <li>
                React 17: <code>setState</code> внутри <code>setTimeout</code>/<code>fetch.then</code>/нативного
                обработчика НЕ батчился → N рендеров на N апдейтов.
              </li>
              <li>
                React 18: <strong>всё</strong> батчится автоматически — один render на любое
                количество <code>setState</code> в пределах одного task'а.
              </li>
              <li>
                <strong>Когда нужен flushSync:</strong> измерить DOM между двумя setState, интегрировать с
                non-React кодом, который ожидает синхронный DOM.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>async / await</h4>
            <ul className='el-theory-list'>
              <li>
                <code>await x</code> = <code>Promise.resolve(x).then(continuation)</code>.
              </li>
              <li>
                Код ДО первого <code>await</code> выполняется <strong>синхронно</strong> вместе с вызовом
                async-функции.
              </li>
              <li>
                Код ПОСЛЕ <code>await</code> — это микрозадача, даже если справа от await не-промис.
              </li>
              <li>
                Каждый <code>await</code> = минимум одна микрозадача (так что 10 await'ов подряд = 10 микрозадач).
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>👁 MutationObserver</h4>
            <ul className='el-theory-list'>
              <li>
                Срабатывает <strong>как микрозадача</strong> после изменения DOM — не синхронно.
              </li>
              <li>
                <strong>Батчит</strong> мутации: 100 appendChild подряд → один вызов колбэка с 100 records.
              </li>
              <li>
                Опции наблюдения: <code>childList</code>, <code>attributes</code>, <code>characterData</code>,{' '}
                <code>subtree</code>, <code>attributeOldValue</code>.
              </li>
              <li>
                Используется React Hot Reload, Material UI Portal, библиотеками для отслеживания
                сторонних DOM-изменений.
              </li>
              <li>
                Не путать с <code>ResizeObserver</code>/<code>IntersectionObserver</code> — те
                выполняются <strong>не как микрозадачи</strong>, а в специальной фазе рендеринга
                между layout и paint.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>🔥 Microtask Starvation</h4>
            <ul className='el-theory-list'>
              <li>
                Микрозадачи очищаются <strong>полностью</strong> перед рендером и макрозадачами.
              </li>
              <li>
                Бесконечный <code>Promise.then(loop)</code> заморозит UI: рендер не произойдёт, клики не обработаются.
              </li>
              <li>
                Для длинных задач используй <code>setTimeout(0)</code>, <code>MessageChannel</code> или{' '}
                <code>scheduler.postTask</code>.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>Throttle / Debounce и Event Loop</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>Throttle:</strong> один вызов сразу (leading) + блокировка на N мс через{' '}
                <code>setTimeout</code> (macrotask).
              </li>
              <li>
                <strong>Debounce:</strong> сброс таймера на каждом событии — вызов произойдёт только
                после паузы.
              </li>
              <li>
                Оба паттерна "схлопывают" поток событий до фиксированной частоты, помогая UI
                оставаться отзывчивым.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>Конвейер рендеринга</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>~16.6мс</strong> на кадр при 60Hz, ~8.3мс при 120Hz.
              </li>
              <li>
                Порядок: микрозадачи → <code>rAF</code> → Style → Layout → Paint → Composite.
              </li>
              <li>
                Браузер может пропустить кадр, если визуальных изменений нет, или объединить несколько
                макрозадач до paint.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>Отличия в Node.js (Libuv)</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>Нет визуализации:</strong> отсутствуют фазы Rendering / rAF / Paint.
              </li>
              <li>
                <strong>process.nextTick():</strong> приоритет выше стандартной microtask queue.
              </li>
              <li>
                <strong>setImmediate():</strong> выполняется в фазе Check после Poll.
              </li>
              <li>
                Фазы: Timers → Pending → Idle/Prepare → Poll → Check → Close.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

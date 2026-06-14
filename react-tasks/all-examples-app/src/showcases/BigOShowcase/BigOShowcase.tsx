import { useEffect, useRef, useState } from 'react'
import './styles.css'
import { CASES, COMPLEXITY_INFO } from './data/cases'
import { ArrayView } from './components/ArrayView'
import { ComplexityChart } from './components/ComplexityChart'
import { ComplexityTable } from './components/ComplexityTable'

export function BigOShowcase() {
  const [activeCaseId, setActiveCaseId] = useState<string>(CASES[0].id)
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playSpeed, setPlaySpeed] = useState<number>(1600)
  const [showFullTheory, setShowFullTheory] = useState<boolean>(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeCase = CASES.find(c => c.id === activeCaseId) ?? CASES[0]
  const stepsCount = activeCase.steps.length
  const currentStep = activeCase.steps[stepIndex] ?? activeCase.steps[0]
  const info = COMPLEXITY_INFO[activeCase.badge]

  const handleCaseChange = (id: string) => {
    setActiveCaseId(id)
    setStepIndex(0)
    setIsPlaying(false)
  }

  const stepForward = () =>
    setStepIndex(prev => (prev < stepsCount - 1 ? prev + 1 : prev))
  const stepBackward = () => setStepIndex(prev => (prev > 0 ? prev - 1 : 0))
  const reset = () => {
    setStepIndex(0)
    setIsPlaying(false)
  }

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStepIndex(prev => {
          if (prev < stepsCount - 1) return prev + 1
          setIsPlaying(false)
          return prev
        })
      }, playSpeed)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, playSpeed, stepsCount])

  return (
    <div className='bo-root'>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className='bo-header'>
        <h1 className='bo-title'>Big O — как программисты считают сложность</h1>
        <p className='bo-subtitle'>
          Визуальный симулятор для новичков. Запусти алгоритм пошагово и посмотри глазами на то,
          сколько операций он делает на каждом шаге. Поймёшь, почему один алгоритм работает за
          секунду, а другой — за час, хотя оба «выглядят одинаково».
        </p>
      </div>

      {/* ── Big intro theory toggle ──────────────────────────────── */}
      <div className='bo-intro-card'>
        <button
          className='bo-intro-toggle'
          onClick={() => setShowFullTheory(s => !s)}
        >
          {showFullTheory ? '▼ Скрыть теорию' : '▶ Что такое Big O? (объясни как новичку)'}
        </button>
        {showFullTheory && (
          <div className='bo-intro-body'>
            <p>
              <strong>Big O</strong> — это способ ответить на вопрос:{' '}
              <em>«Как сильно вырастет время работы программы, если я подам ей в 10 раз больше данных?»</em>
            </p>
            <p>
              Нас НЕ интересует, сколько программа работает в секундах (это зависит от компьютера).
              Нас интересует, как РАСТЁТ время с ростом данных.
            </p>
            <ul>
              <li>
                <strong>O(1)</strong> — увеличил данные в 1000 раз → время осталось то же. 🏆
              </li>
              <li>
                <strong>O(n)</strong> — увеличил в 1000 раз → время выросло в 1000 раз. 👍
              </li>
              <li>
                <strong>O(n²)</strong> — увеличил в 1000 раз → время выросло в 1 000 000 раз. 😱
              </li>
            </ul>
            <p>
              💡 <strong>Главное правило:</strong> в Big O мы оцениваем <u>худший случай</u> и
              отбрасываем константы. <code>O(2n + 100)</code> = <code>O(n)</code>. Главное — это
              как растёт функция, а не сколько именно.
            </p>
          </div>
        )}
      </div>

      {/* ── Case tabs ────────────────────────────────────────────── */}
      <div className='bo-tabs'>
        {CASES.map(c => {
          const cinfo = COMPLEXITY_INFO[c.badge]
          return (
            <button
              key={c.id}
              onClick={() => handleCaseChange(c.id)}
              className={`bo-tab ${activeCaseId === c.id ? 'active' : ''}`}
              style={
                activeCaseId === c.id
                  ? { borderColor: cinfo.color, color: cinfo.color }
                  : undefined
              }
            >
              <span className='bo-tab-title'>{c.title}</span>
              <span
                className='bo-tab-badge'
                style={{ background: cinfo.color }}
              >
                {c.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Algorithm overview card ──────────────────────────────── */}
      <div className='bo-overview'>
        <div className='bo-overview-row'>
          <div
            className='bo-overview-badge'
            style={{ background: info.color }}
          >
            <span className='bo-overview-badge-emoji'>{info.emoji}</span>
            <span className='bo-overview-badge-text'>{activeCase.badge}</span>
          </div>
          <div className='bo-overview-verdict' style={{ color: info.color }}>
            {info.verdict}
          </div>
        </div>
        <div className='bo-overview-section'>
          <div className='bo-overview-label'>📖 Что делает алгоритм</div>
          <p>{activeCase.about}</p>
        </div>
        <div className='bo-overview-section'>
          <div className='bo-overview-label'>💡 Откуда берётся {activeCase.badge}</div>
          <p>{activeCase.intuition}</p>
        </div>
        <div className='bo-overview-section'>
          <div className='bo-overview-label'>🎯 Жизненная аналогия</div>
          <p>{activeCase.analogy}</p>
        </div>
      </div>

      {/* ── Main simulator grid ──────────────────────────────────── */}
      <div className='bo-grid'>
        {/* LEFT: code + console */}
        <div className='bo-left'>
          <div className='bo-step-banner'>
            <div className='bo-step-banner-head'>
              Шаг {stepIndex + 1} из {stepsCount}
            </div>
            <p className='bo-step-banner-text'>{currentStep.action}</p>
            {currentStep.hint && (
              <div className='bo-step-hint'>
                <span>💡</span> {currentStep.hint}
              </div>
            )}
          </div>

          <div className='bo-card'>
            <div className='bo-card-header'>
              <span>Код алгоритма</span>
              <span className='bo-card-sub'>JavaScript</span>
            </div>
            <div className='bo-code-editor'>
              {activeCase.code.map((line, idx) => {
                const isActive = currentStep.line === idx + 1
                return (
                  <div
                    key={idx}
                    className={`bo-code-line ${isActive ? 'active' : ''}`}
                  >
                    <span className='bo-code-num'>{idx + 1}</span>
                    <span className='bo-code-text'>{line || ' '}</span>
                  </div>
                )
              })}
            </div>

            <div className='bo-controls'>
              <button
                className='bo-btn'
                onClick={stepBackward}
                disabled={stepIndex === 0}
                title='Назад'
              >
                ◀
              </button>
              <button
                className='bo-btn bo-btn-primary'
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? '⏸ Пауза' : '▶ Запустить'}
              </button>
              <button
                className='bo-btn'
                onClick={stepForward}
                disabled={stepIndex === stepsCount - 1}
                title='Вперёд'
              >
                ▶
              </button>
              <button
                className='bo-btn'
                onClick={reset}
                title='Сброс'
              >
                🔄
              </button>
              <div className='bo-speed'>
                <span>Скорость:</span>
                <input
                  type='range'
                  min={500}
                  max={2800}
                  step={300}
                  value={3300 - playSpeed}
                  onChange={e => setPlaySpeed(3300 - Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Operations counter card */}
          <div className='bo-card bo-ops-card'>
            <div className='bo-card-header'>
              <span>Счётчик операций</span>
              <span className='bo-card-sub'>{activeCase.opsFormula(activeCase.n)}</span>
            </div>
            <div className='bo-ops-display'>
              <div
                className='bo-ops-value'
                style={{ color: info.color }}
              >
                {currentStep.ops}
              </div>
              <div className='bo-ops-label'>операций выполнено</div>
            </div>
            <div className='bo-ops-progress'>
              <div
                className='bo-ops-progress-bar'
                style={{
                  width: `${Math.min(100, (stepIndex / Math.max(1, stepsCount - 1)) * 100)}%`,
                  background: info.color,
                }}
              />
            </div>
            <div className='bo-ops-meta'>
              n = {activeCase.n} (размер входа этого примера)
            </div>
          </div>
        </div>

        {/* RIGHT: array view + chart + table */}
        <div className='bo-right'>
          <div className='bo-card'>
            <div className='bo-card-header'>
              <span>Что происходит с данными</span>
              {currentStep.vars && (
                <div className='bo-vars'>
                  {Object.entries(currentStep.vars).map(([k, v]) => (
                    <span key={k} className='bo-var'>
                      <code>{k}</code>={v}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ArrayView cells={currentStep.array} label='input' />
            {currentStep.secondary && (
              <ArrayView
                cells={currentStep.secondary}
                label={currentStep.secondaryLabel ?? 'result'}
              />
            )}
            <div className='bo-legend'>
              <span className='bo-legend-item'>
                <span className='bo-cell-mini bo-cell-idle' /> покой
              </span>
              <span className='bo-legend-item'>
                <span className='bo-cell-mini bo-cell-compared' /> сравнивается
              </span>
              <span className='bo-legend-item'>
                <span className='bo-cell-mini bo-cell-window' /> в окне поиска
              </span>
              <span className='bo-legend-item'>
                <span className='bo-cell-mini bo-cell-discarded' /> отброшено
              </span>
              <span className='bo-legend-item'>
                <span className='bo-cell-mini bo-cell-matched' /> найдено
              </span>
              <span className='bo-legend-item'>
                <span className='bo-cell-mini bo-cell-merged' /> в результате
              </span>
            </div>
          </div>

          <ComplexityChart highlight={activeCase.badge} />
        </div>
      </div>

      {/* ── Pitfalls section ─────────────────────────────────────── */}
      <div className='bo-pitfalls'>
        <div className='bo-pitfalls-title'>⚠️ Типичные ошибки новичков</div>
        <ul>
          {activeCase.pitfalls.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
        <div className='bo-source'>
          📁 Подробный разбор в репозитории: <code>{activeCase.source}</code>
        </div>
      </div>

      {/* ── Full comparison table ────────────────────────────────── */}
      <ComplexityTable highlight={activeCase.badge} />

      {/* ── Footer cheat-sheet ───────────────────────────────────── */}
      <div className='bo-cheat'>
        <div className='bo-cheat-title'>📊 Шпаргалка: от лучшего к худшему</div>
        <div className='bo-cheat-grid'>
          {(Object.keys(COMPLEXITY_INFO) as Array<keyof typeof COMPLEXITY_INFO>).map(c => {
            const cinfo = COMPLEXITY_INFO[c]
            return (
              <div
                key={c}
                className='bo-cheat-item'
                style={{ borderLeftColor: cinfo.color }}
              >
                <div className='bo-cheat-head'>
                  <span className='bo-cheat-emoji'>{cinfo.emoji}</span>
                  <span className='bo-cheat-name'>{c}</span>
                  <span
                    className='bo-cheat-verdict'
                    style={{ color: cinfo.color }}
                  >
                    {cinfo.verdict}
                  </span>
                </div>
                <div className='bo-cheat-desc'>{cinfo.description}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

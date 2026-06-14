import { useEffect, useMemo, useRef, useState } from 'react'
import './styles.css'
import { ALL_CASES, TOPIC_INFO, TOPICS } from './data'
import type { Topic } from './data/types'
import { SceneView } from './components/SceneView'

export function AlgoShowcase() {
  const [activeTopic, setActiveTopic] = useState<Topic>('Деревья')
  const [activeCaseId, setActiveCaseId] = useState<string>(
    ALL_CASES.find(c => c.topic === 'Деревья')?.id ?? ALL_CASES[0].id
  )
  const [stepIndex, setStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1700)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const casesInTopic = useMemo(
    () => ALL_CASES.filter(c => c.topic === activeTopic),
    [activeTopic]
  )
  const activeCase =
    ALL_CASES.find(c => c.id === activeCaseId) ?? casesInTopic[0] ?? ALL_CASES[0]
  const stepsCount = activeCase.steps.length
  const currentStep = activeCase.steps[stepIndex] ?? activeCase.steps[0]
  const topicInfo = TOPIC_INFO[activeCase.topic]

  const handleTopicChange = (topic: Topic) => {
    setActiveTopic(topic)
    const first = ALL_CASES.find(c => c.topic === topic)
    if (first) {
      setActiveCaseId(first.id)
      setStepIndex(0)
      setIsPlaying(false)
    }
  }
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
    <div className='ag-root'>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className='ag-header'>
        <h1 className='ag-title'>Алгоритмы и структуры данных</h1>
        <p className='ag-subtitle'>
          Визуальный курс для новичков. Каждая тема — это отдельная пошаговая анимация: ты видишь,
          как двигаются указатели, растёт стек вызовов, заполняется хэш-таблица. Объяснения на
          русском, как для джуна на первой неделе работы.
        </p>
      </div>

      {/* ── Topic tabs ───────────────────────────────────────────── */}
      <div className='ag-topics'>
        {TOPICS.map(t => {
          const info = TOPIC_INFO[t]
          const isActive = activeTopic === t
          return (
            <button
              key={t}
              onClick={() => handleTopicChange(t)}
              className={`ag-topic ${isActive ? 'active' : ''}`}
              style={isActive ? { borderColor: info.color, color: info.color } : undefined}
            >
              <span className='ag-topic-emoji'>{info.emoji}</span>
              <span className='ag-topic-name'>{t}</span>
            </button>
          )
        })}
      </div>

      {/* ── Topic intro ──────────────────────────────────────────── */}
      <div
        className='ag-topic-intro'
        style={{ borderLeftColor: topicInfo.color }}
      >
        <strong>{topicInfo.emoji} {activeCase.topic}.</strong> {topicInfo.description}
      </div>

      {/* ── Case sub-tabs ────────────────────────────────────────── */}
      <div className='ag-cases'>
        {casesInTopic.map(c => (
          <button
            key={c.id}
            onClick={() => handleCaseChange(c.id)}
            className={`ag-case-btn ${activeCaseId === c.id ? 'active' : ''}`}
          >
            <span className='ag-case-title'>{c.title}</span>
            <span className='ag-case-complexity'>{c.complexity}</span>
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────── */}
      <div className='ag-overview'>
        <div className='ag-overview-section'>
          <div className='ag-overview-label'>📖 Что делает алгоритм</div>
          <p>{activeCase.about}</p>
        </div>
        <div className='ag-overview-section'>
          <div className='ag-overview-label'>🎯 Когда применять</div>
          <p>{activeCase.whenToUse}</p>
        </div>
        <div className='ag-overview-section'>
          <div className='ag-overview-label'>💭 Аналогия</div>
          <p>{activeCase.analogy}</p>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────────── */}
      <div className='ag-grid'>
        {/* LEFT: code + step description */}
        <div className='ag-left'>
          <div
            className='ag-step-banner'
            style={{ borderColor: topicInfo.color }}
          >
            <div className='ag-step-banner-head' style={{ color: topicInfo.color }}>
              Шаг {stepIndex + 1} из {stepsCount} · операций: {currentStep.ops}
            </div>
            <p className='ag-step-banner-text'>{currentStep.action}</p>
            {currentStep.hint && (
              <div className='ag-step-hint'>💡 {currentStep.hint}</div>
            )}
          </div>

          <div className='ag-card'>
            <div className='ag-card-header'>
              <span>Код</span>
              <span className='ag-card-sub'>JavaScript</span>
            </div>
            <div className='ag-code'>
              {activeCase.code.map((line, idx) => {
                const isActive = currentStep.line === idx + 1
                return (
                  <div key={idx} className={`ag-code-line ${isActive ? 'active' : ''}`}>
                    <span className='ag-code-num'>{idx + 1}</span>
                    <span className='ag-code-text'>{line || ' '}</span>
                  </div>
                )
              })}
            </div>
            <div className='ag-controls'>
              <button className='ag-btn' onClick={stepBackward} disabled={stepIndex === 0}>
                ◀
              </button>
              <button
                className='ag-btn ag-btn-primary'
                onClick={() => setIsPlaying(p => !p)}
                style={{ background: topicInfo.color, borderColor: topicInfo.color }}
              >
                {isPlaying ? '⏸ Пауза' : '▶ Запустить'}
              </button>
              <button
                className='ag-btn'
                onClick={stepForward}
                disabled={stepIndex === stepsCount - 1}
              >
                ▶
              </button>
              <button className='ag-btn' onClick={reset}>
                🔄
              </button>
              <div className='ag-speed'>
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
        </div>

        {/* RIGHT: scene */}
        <div className='ag-right'>
          <div className='ag-card'>
            <div className='ag-card-header'>
              <span>Что происходит со структурой данных</span>
              <span className='ag-card-sub'>{activeCase.complexity}</span>
            </div>
            <SceneView scene={currentStep.scene} />
          </div>
        </div>
      </div>

      {/* ── Pitfalls ─────────────────────────────────────────────── */}
      <div className='ag-pitfalls'>
        <div className='ag-pitfalls-title'>⚠️ Типичные ошибки</div>
        <ul>
          {activeCase.pitfalls.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
        {activeCase.source && (
          <div className='ag-source'>
            📁 Связанный материал: <code>{activeCase.source}</code>
          </div>
        )}
      </div>
    </div>
  )
}

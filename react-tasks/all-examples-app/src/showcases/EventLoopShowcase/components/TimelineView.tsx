import type { Step, Phase } from '../data/cases'

const PHASE_LABEL: Record<Phase, string> = {
  stack: 'CALL STACK',
  microtasks: 'MICRO',
  rendering: 'RENDER',
  macrotasks: 'MACRO',
  idle: 'IDLE',
  'react-render': 'REACT RENDER',
  'react-commit': 'REACT COMMIT',
  paint: 'PAINT',
}

const PHASE_COLOR: Record<Phase, string> = {
  stack: '#8b5cf6',
  microtasks: '#06b6d4',
  rendering: '#22c55e',
  macrotasks: '#f59e0b',
  idle: '#94a3b8',
  'react-render': '#0ea5e9',
  'react-commit': '#6366f1',
  paint: '#22c55e',
}

export function TimelineView({
  steps,
  currentIndex,
  onSelect,
}: {
  steps: Step[]
  currentIndex: number
  onSelect: (idx: number) => void
}) {
  // Determine timeline bounds
  const times = steps.map(s => s.tMs ?? 0)
  const maxT = Math.max(...times, 1)
  const minT = 0

  // We'll use log-ish scaling for nicer distribution if range is large
  const scale = (t: number) => {
    if (maxT <= 20) return ((t - minT) / (maxT - minT)) * 100
    // Hybrid: emphasize 0-20ms region, then compress
    const earlyMax = 20
    if (t <= earlyMax) return (t / earlyMax) * 50 // first half of bar
    return 50 + ((t - earlyMax) / (maxT - earlyMax)) * 50
  }

  // Frame markers at multiples of 16.6ms within range
  const frameMarkers: number[] = []
  for (let f = 16.6; f <= maxT; f += 16.6) {
    frameMarkers.push(f)
  }

  return (
    <div className='el-timeline'>
      <div className='el-timeline-header'>
        <span className='el-timeline-title'>Timeline (виртуальное время)</span>
        <span className='el-timeline-legend'>
          <span className='el-tm-frame-dot' /> кадр 16.6мс ·{' '}
          <span style={{ color: '#4f46e5' }}>●</span> текущий шаг
        </span>
      </div>

      <div className='el-timeline-bar'>
        {/* Frame markers */}
        {frameMarkers.map((f, i) => (
          <div
            key={`frame-${i}`}
            className='el-timeline-frame'
            style={{ left: `${scale(f)}%` }}
            title={`Кадр ~${f.toFixed(1)}мс`}
          >
            <span>{f.toFixed(0)}мс</span>
          </div>
        ))}

        {/* Step dots */}
        {steps.map((s, i) => {
          const t = s.tMs ?? 0
          const left = scale(t)
          const color = PHASE_COLOR[s.phase]
          const isCurrent = i === currentIndex
          return (
            <button
              key={i}
              className={`el-timeline-dot ${isCurrent ? 'current' : ''}`}
              style={{
                left: `${left}%`,
                background: color,
                boxShadow: isCurrent ? `0 0 0 4px ${color}33` : 'none',
              }}
              onClick={() => onSelect(i)}
              title={`#${i + 1} · t≈${t}мс · ${s.phaseText}`}
            >
              <span className='el-timeline-dot-label'>{PHASE_LABEL[s.phase]}</span>
            </button>
          )
        })}
      </div>

      <div className='el-timeline-axis'>
        <span>0мс</span>
        <span>{(maxT / 2).toFixed(1)}мс</span>
        <span>{maxT.toFixed(1)}мс</span>
      </div>
    </div>
  )
}

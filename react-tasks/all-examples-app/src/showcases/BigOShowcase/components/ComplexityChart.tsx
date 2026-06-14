import type { Complexity } from '../data/cases'
import { COMPLEXITY_INFO } from '../data/cases'

const W = 360
const H = 200
const PAD = 24
const N_MAX = 20

function curve(c: Complexity): (n: number) => number {
  switch (c) {
    case 'O(1)':
      return () => 1
    case 'O(log n)':
      return n => Math.log2(n + 1)
    case 'O(n)':
      return n => n
    case 'O(n log n)':
      return n => n * Math.log2(n + 1)
    case 'O(n²)':
      return n => n * n
    case 'O(2ⁿ)':
      return n => Math.pow(2, n)
  }
}

const COMPLEXITIES: Complexity[] = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)']

export function ComplexityChart({ highlight }: { highlight?: Complexity }) {
  // For comparability we cap each curve to a logical "ceiling" so they all fit visually.
  // We use clipping at the chart's top edge for crazy curves like 2^n / n².
  const yMax = N_MAX * Math.log2(N_MAX + 1) // n log n as visual ceiling

  const xToPx = (n: number) => PAD + (n / N_MAX) * (W - 2 * PAD)
  const yToPx = (y: number) => H - PAD - Math.min(y, yMax) / yMax * (H - 2 * PAD)

  const buildPath = (c: Complexity) => {
    const f = curve(c)
    const pts: string[] = []
    for (let n = 1; n <= N_MAX; n += 0.5) {
      pts.push(`${xToPx(n).toFixed(1)},${yToPx(f(n)).toFixed(1)}`)
    }
    return `M ${pts.join(' L ')}`
  }

  return (
    <div className='bo-chart-block'>
      <div className='bo-chart-title'>Сравнение кривых сложности</div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className='bo-chart-svg'
        role='img'
        aria-label='Big O complexity comparison'
      >
        {/* axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke='#cbd5e1' strokeWidth={1} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke='#cbd5e1' strokeWidth={1} />
        <text x={W - PAD} y={H - 6} fontSize={10} fill='#64748b' textAnchor='end'>
          n (размер данных)
        </text>
        <text
          x={6}
          y={PAD + 4}
          fontSize={10}
          fill='#64748b'
        >
          операций
        </text>

        {/* grid */}
        {[0.25, 0.5, 0.75].map((p, i) => (
          <line
            key={i}
            x1={PAD}
            y1={PAD + (H - 2 * PAD) * p}
            x2={W - PAD}
            y2={PAD + (H - 2 * PAD) * p}
            stroke='#f1f5f9'
            strokeWidth={1}
          />
        ))}

        {/* curves */}
        {COMPLEXITIES.map(c => {
          const isActive = c === highlight
          return (
            <path
              key={c}
              d={buildPath(c)}
              stroke={COMPLEXITY_INFO[c].color}
              strokeWidth={isActive ? 3 : 1.5}
              fill='none'
              opacity={highlight && !isActive ? 0.25 : 1}
            />
          )
        })}
      </svg>

      <div className='bo-chart-legend'>
        {COMPLEXITIES.map(c => {
          const isActive = c === highlight
          return (
            <div
              key={c}
              className={`bo-chart-legend-item ${isActive ? 'active' : ''}`}
            >
              <span className='bo-chart-dot' style={{ background: COMPLEXITY_INFO[c].color }} />
              <span className='bo-chart-name'>{c}</span>
              <span className='bo-chart-emoji'>{COMPLEXITY_INFO[c].emoji}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

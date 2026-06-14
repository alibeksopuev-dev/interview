import type { ArrayCell } from '../data/cases'

export function ArrayView({
  cells,
  label,
}: {
  cells: ArrayCell[]
  label?: string
}) {
  return (
    <div className='bo-array-block'>
      {label && <div className='bo-array-label'>{label}</div>}
      <div className='bo-array-cells'>
        {cells.length === 0 ? (
          <div className='bo-array-empty'>пусто</div>
        ) : (
          cells.map((cell, idx) => (
            <div
              key={idx}
              className={`bo-cell bo-cell-${cell.state ?? 'idle'}`}
            >
              <div className='bo-cell-value'>{cell.value}</div>
              <div className='bo-cell-index'>{idx}</div>
              {cell.label && <div className='bo-cell-tag'>{cell.label}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

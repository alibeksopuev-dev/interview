import type { Complexity } from '../data/cases'
import { COMPLEXITY_INFO } from '../data/cases'
import DataTable, { Columns } from '../../../components/DataTable'

const SIZES = [10, 100, 1_000, 1_000_000]

function calc(c: Complexity, n: number): string {
  switch (c) {
    case 'O(1)':
      return '1'
    case 'O(log n)':
      return Math.ceil(Math.log2(n)).toString()
    case 'O(n)':
      return n.toLocaleString('ru-RU')
    case 'O(n log n)':
      return Math.ceil(n * Math.log2(n)).toLocaleString('ru-RU')
    case 'O(n²)': {
      const v = n * n
      if (v > 1e9) return v.toExponential(1)
      return v.toLocaleString('ru-RU')
    }
    case 'O(2ⁿ)': {
      if (n > 60) return '💀 ∞'
      const v = Math.pow(2, n)
      return v > 1e9 ? v.toExponential(1) : v.toLocaleString('ru-RU')
    }
  }
}

function calcRaw(c: Complexity, n: number): number {
  switch (c) {
    case 'O(1)':
      return 1
    case 'O(log n)':
      return Math.ceil(Math.log2(n))
    case 'O(n)':
      return n
    case 'O(n log n)':
      return Math.ceil(n * Math.log2(n))
    case 'O(n²)':
      return n * n
    case 'O(2ⁿ)':
      return Math.pow(2, n)
  }
}

const COMPLEXITIES: Complexity[] = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)']

interface ComplexityRow {
  id: number
  complexity: Complexity
}

const getColumns = (highlight?: Complexity): Columns<ComplexityRow> => [
  {
    label: 'Сложность',
    key: 'complexity',
    renderCell: (row) => {
      const isActive = row.complexity === highlight
      return (
        <span className={isActive ? 'bo-table-cell-highlight' : ''}>
          <span
            className='bo-table-dot'
            style={{ background: COMPLEXITY_INFO[row.complexity].color }}
          />
          <strong>{row.complexity}</strong>{' '}
          <span className='bo-table-emoji'>{COMPLEXITY_INFO[row.complexity].emoji}</span>
        </span>
      )
    },
    comparator: (a, b, direction) => {
      const idxA = COMPLEXITIES.indexOf(a.complexity)
      const idxB = COMPLEXITIES.indexOf(b.complexity)
      return direction === 'asc' ? idxA - idxB : idxB - idxA
    },
  },
  ...SIZES.map(n => ({
    label: `n = ${n.toLocaleString('ru-RU')}`,
    key: `size-${n}`,
    renderCell: (row: ComplexityRow) => {
      const isActive = row.complexity === highlight
      return (
        <span className={`${isActive ? 'bo-table-cell-highlight' : ''} bo-table-num`}>
          {calc(row.complexity, n)}
        </span>
      )
    },
    comparator: (a: ComplexityRow, b: ComplexityRow, direction: 'asc' | 'desc') => {
      const valA = calcRaw(a.complexity, n)
      const valB = calcRaw(b.complexity, n)
      return direction === 'asc' ? valA - valB : valB - valA
    },
  })),
]

export function ComplexityTable({ highlight }: { highlight?: Complexity }) {
  const data: ComplexityRow[] = COMPLEXITIES.map((c, index) => ({
    id: index + 1,
    complexity: c,
  }))

  const columns = getColumns(highlight)

  return (
    <div className='bo-table-block'>
      <div className='bo-table-title'>Сколько операций для разных n</div>
      <DataTable data={data} columns={columns} />
      <div className='bo-table-hint'>
        💡 Один шаг — это ~1 наносекунда на современном CPU. Миллион операций = 1мс. Миллиард = 1
        секунда.
      </div>
    </div>
  )
}


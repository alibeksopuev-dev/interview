import { useState } from 'react'

type SortDirection = 'asc' | 'desc'

type ColumnDef<T> = Readonly<{
  label: string
  key: string
  renderCell: (row: T) => React.ReactNode
  comparator: (a: T, b: T, sortDirection: SortDirection) => number
}>

export type Columns<T> = ReadonlyArray<ColumnDef<T>>

function paginate<T>(data: Array<T>, currentPage: number, pageSize: number) {
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageData = data.slice(startIndex, endIndex)
  const totalPages = Math.ceil(data.length / pageSize)

  return {
    pageData,
    totalPages,
    startIndex,
    endIndex,
  }
}

const sortData = <T,>(data: Array<T>, columns: Columns<T>, sortField: string | null, sortDirection: SortDirection) => {
  const clonedData = data.slice()
  const comparator = columns.find(column => column.key === sortField)?.comparator
  if (!comparator) {
    return clonedData
  }
  return clonedData.sort((a, b) => comparator(a, b, sortDirection))
}

export default function DataTable<T extends { id: number }>({
  data,
  columns,
}: Readonly<{ data: Array<T>; columns: Columns<T> }>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const sortedData = sortData(data, columns, sortField, sortDirection)
  const { pageData, totalPages, startIndex, endIndex } = paginate(sortedData, currentPage, pageSize)

  return (
    <div>
      <h1>Data Table</h1>
      <table>
        <thead>
          <tr>
            {columns.map(({ label, key }) => (
              <th key={key}>
                <button
                  onClick={() => {
                    if (sortField !== key) {
                      setSortField(key)
                      setSortDirection('asc')
                    } else {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    }
                    setCurrentPage(1)
                  }}
                >
                  {label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.map(item => (
            <tr key={item.id}>
              {columns.map(column => (
                <td key={column.key}>{column.renderCell(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <div className='pagination'>
        <div>
          {startIndex + 1}-{endIndex} of {data.length}
        </div>
        <select
          aria-label='Page size'
          onChange={event => {
            setPageSize(Number(event.target.value))
            setCurrentPage(1)
          }}
        >
          {[10, 20, 50].map(pageSize => (
            <option
              key={pageSize}
              value={pageSize}
            >
              Show {pageSize}
            </option>
          ))}
        </select>
        <div className='pages'>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Prev
          </button>
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

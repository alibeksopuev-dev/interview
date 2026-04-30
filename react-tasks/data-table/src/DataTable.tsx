import { useState } from 'react'
import users from './data/users'

const columns = [
  { label: 'ID', key: 'id' },
  { label: 'Name', key: 'name' },
  { label: 'Age', key: 'age' },
  { label: 'Occupation', key: 'occupation' },
] as const

type SortField = (typeof columns)[number]['key']
type SortDirection = 'asc' | 'desc'
type User = (typeof users)[number]

const paginateUsers = (usersList: Array<User>, currentPage: number, pageSize: number) => {
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageUsers = usersList.slice(startIndex, endIndex)
  const totalPages = Math.ceil(usersList.length / pageSize)

  return {
    pageUsers,
    totalPages,
  }
}

const sortUsers = (usersList: Array<User>, sortField: SortField | null, sortDirection: SortDirection) => {
  const clonedUsers = usersList.slice()

  switch (sortField) {
    case 'id':
    case 'age': {
      return clonedUsers.sort((a, b) =>
        sortDirection === 'asc' ? a[sortField] - b[sortField] : b[sortField] - a[sortField],
      )
    }
    case 'name':
    case 'occupation': {
      return clonedUsers.sort((a, b) =>
        sortDirection === 'asc' ? a[sortField].localeCompare(b[sortField]) : b[sortField].localeCompare(a[sortField]),
      )
    }
    default: {
      return clonedUsers
    }
  }
}

export default function DataTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const sortedUsers = sortUsers(users, sortField, sortDirection)
  const { pageUsers, totalPages } = paginateUsers(sortedUsers, currentPage, pageSize)

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
          {pageUsers.map(({ id, name, age, occupation }) => (
            <tr key={id}>
              <td>{id}</td>
              <td>{name}</td>
              <td>{age}</td>
              <td>{occupation}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <div className='pagination'>
        <select
          aria-label='Page size'
          onChange={event => {
            setPageSize(Number(event.target.value))
            setCurrentPage(1)
          }}
        >
          {[5, 10, 20].map(pageSize => (
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

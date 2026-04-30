import { useState } from 'react'
import users from './data/users'

// TODO: Шаг 1 — добавить состояние currentPage и pageSize
// TODO: Шаг 2 — реализовать функцию paginateUsers
// TODO: Шаг 3 — добавить элементы управления пагинацией (Prev / Next)
// TODO: Шаг 4 — добавить select для выбора кол-ва строк на странице (5, 10, 20)
// TODO: Шаг 5 — отключить кнопки Prev/Next когда нельзя перейти

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

export default function DataTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const { pageUsers, totalPages } = paginateUsers(users, currentPage, pageSize)

  return (
    <div>
      <h1>Data Table</h1>
      <table>
        <thead>
          <tr>
            {[
              { label: 'ID', key: 'id' },
              { label: 'Name', key: 'name' },
              { label: 'Age', key: 'age' },
              { label: 'Occupation', key: 'occupation' },
            ].map(({ label, key }) => (
              <th key={key}>{label}</th>
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

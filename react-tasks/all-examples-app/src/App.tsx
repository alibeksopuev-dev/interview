import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import DataTable, { Columns } from './DataTableGeneric.tsx'
import users from './data/users.ts'
import houses from './data/houses.ts'
import { ThrottleShowcase } from './ThrottleExamples.tsx'
import { UseQueryShowcase } from './UseQueryShowcase.tsx'
import { SelectDataShowcase } from './SelectDataShowcase.tsx'

type User = (typeof users)[number]
type House = (typeof houses)[number]

const usersColumns: Columns<User> = [
  {
    label: 'ID',
    key: 'id',
    renderCell: (user: User) => user.id,
    comparator: (a: User, b: User, sortDirection) =>
      sortDirection === 'asc' ? a.id - b.id : b.id - a.id,
  },
  {
    label: 'Name',
    key: 'name',
    renderCell: (user: User) => user.name,
    comparator: (a: User, b: User, sortDirection) =>
      sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  },
  {
    label: 'Age',
    key: 'age',
    renderCell: (user: User) => `${user.age} years`,
    comparator: (a: User, b: User, sortDirection) =>
      sortDirection === 'asc' ? a.age - b.age : b.age - a.age,
  },
  {
    label: 'Occupation',
    key: 'occupation',
    renderCell: (user: User) => user.occupation,
    comparator: (a: User, b: User, sortDirection) =>
      sortDirection === 'asc'
        ? a.occupation.localeCompare(b.occupation)
        : b.occupation.localeCompare(a.occupation),
  },
]

const housesColumns: Columns<House> = [
  {
    label: 'ID',
    key: 'id',
    renderCell: (house: House) => house.id,
    comparator: (a: House, b: House, sortDirection) =>
      sortDirection === 'asc' ? a.id - b.id : b.id - a.id,
  },
  {
    label: 'Street',
    key: 'street',
    renderCell: (house: House) => house.street,
    comparator: (a: House, b: House, sortDirection) =>
      sortDirection === 'asc' ? a.street.localeCompare(b.street) : b.street.localeCompare(a.street),
  },
  {
    label: 'City',
    key: 'city',
    renderCell: (house: House) => house.city,
    comparator: (a: House, b: House, sortDirection) =>
      sortDirection === 'asc' ? a.city.localeCompare(b.city) : b.city.localeCompare(a.city),
  },
  {
    label: 'State',
    key: 'state',
    renderCell: (house: House) => house.state,
    comparator: (a: House, b: House, sortDirection) =>
      sortDirection === 'asc' ? a.state.localeCompare(b.state) : b.state.localeCompare(a.state),
  },
  {
    label: 'ZIP',
    key: 'zip',
    renderCell: (house: House) => house.zip,
    comparator: (a: House, b: House, sortDirection) =>
      sortDirection === 'asc' ? a.zip.localeCompare(b.zip) : b.zip.localeCompare(a.zip),
  },
  {
    label: 'Built year',
    key: 'built_year',
    renderCell: (house: House) => house.built_year,
    comparator: (a: House, b: House, sortDirection) =>
      sortDirection === 'asc' ? a.built_year - b.built_year : b.built_year - a.built_year,
  },
]

function DataTablePage() {
  return (
    <div className='page-content'>
      <DataTable
        data={users}
        columns={usersColumns}
      />
      <div style={{ marginTop: 32 }}>
        <DataTable
          data={houses}
          columns={housesColumns}
        />
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { to: '/data-table', label: 'DataTable', badge: 'Generic' },
  { to: '/throttle', label: 'Throttle', badge: 'Hook' },
  { to: '/use-query', label: 'useQuery', badge: 'Hook' },
  { to: '/select-data', label: 'selectData', badge: 'Filter' },
]

export default function App() {
  return (
    <div className='app-layout'>
      <aside className='app-sidebar'>
        <div className='sidebar-logo'>Interview</div>
        <nav className='sidebar-nav'>
          {NAV_ITEMS.map(({ to, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-active' : ''}`}
            >
              <span className='sidebar-link-label'>{label}</span>
              <span className='sidebar-link-badge'>{badge}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className='app-main'>
        <Routes>
          <Route
            path='/'
            element={
              <Navigate
                to='/data-table'
                replace
              />
            }
          />
          <Route
            path='/data-table'
            element={<DataTablePage />}
          />
          <Route
            path='/throttle'
            element={
              <div className='page-content'>
                <ThrottleShowcase />
              </div>
            }
          />
          <Route
            path='/use-query'
            element={
              <div className='page-content'>
                <UseQueryShowcase />
              </div>
            }
          />
          <Route
            path='/select-data'
            element={<SelectDataShowcase />}
          />
        </Routes>
      </main>
    </div>
  )
}

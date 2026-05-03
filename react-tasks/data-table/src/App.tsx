import DataTable, { Columns } from './DataTableGeneric.tsx'
import users from './data/users.ts'
import houses from './data/houses.ts'

type User = (typeof users)[number]
type House = (typeof houses)[number]

const usersColumns: Columns<User> = [
  {
    label: 'ID',
    key: 'id',
    renderCell: (user: User) => user.id,
    comparator: (a: User, b: User, sortDirection) => (sortDirection === 'asc' ? a.id - b.id : b.id - a.id),
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
    comparator: (a: User, b: User, sortDirection) => (sortDirection === 'asc' ? a.age - b.age : b.age - a.age),
  },
  {
    label: 'Occupation',
    key: 'occupation',
    renderCell: (user: User) => user.occupation,
    comparator: (a: User, b: User, sortDirection) =>
      sortDirection === 'asc' ? a.occupation.localeCompare(b.occupation) : b.occupation.localeCompare(a.occupation),
  },
]

const housesColumns: Columns<House> = [
  {
    label: 'ID',
    key: 'id',
    renderCell: (house: House) => house.id,
    comparator: (a: House, b: House, sortDirection) => (sortDirection === 'asc' ? a.id - b.id : b.id - a.id),
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

export default function App() {
  return (
    <div>
      <DataTable
        data={users}
        columns={usersColumns}
      />
      <hr />
      <DataTable
        data={houses}
        columns={housesColumns}
      />
    </div>
  )
}

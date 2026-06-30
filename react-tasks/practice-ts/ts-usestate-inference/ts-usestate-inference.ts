// Задача: createState — упрощённая имитация useState (чистый TS, без React).
// Сейчас initial не типизирован дженериком, поэтому при пустом массиве / null
// TS выводит never[] / null — в state нельзя положить ничего осмысленного.
//
// Открой этот файл в IDE, исправь реализацию ниже (добавь generic <T>)
// и запусти файл, чтобы проверить тесты в конце.

interface User {
  id: string
  name: string
}

function createState<T>(initial: T) {
  let value = initial
  const get = () => value
  const set = (v: T) => {
    value = v
  }
  return { get, set }
}

// ── Демонстрация ──────────────────────────────────────────────────────────

const usersState = createState<User[]>([])
const selectedState = createState<User | null>(null)

usersState.set([{ id: '1', name: 'Ann' }])
console.log(usersState.get()) // [{ id: '1', name: 'Ann' }]

selectedState.set({ id: '1', name: 'Ann' })
console.log(selectedState.get()) // { id: '1', name: 'Ann' }

selectedState.set(null)
console.log(selectedState.get()) // null

// ── Тесты ──────────────────────────────────────────────────────────────────

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`)
}

assertEqual(createState<User[]>([]).get(), [], 'createState<User[]>([]) изначально возвращает пустой массив')

const usersTest = createState<User[]>([])
usersTest.set([{ id: '1', name: 'Ann' }])
assertEqual(usersTest.get(), [{ id: '1', name: 'Ann' }], 'set/get корректно работают с массивом User')

const selectedTest = createState<User | null>(null)
selectedTest.set({ id: '2', name: 'Bob' })
assertEqual(selectedTest.get(), { id: '2', name: 'Bob' }, 'set/get корректно работают с User | null')

assertEqual(createState<User | null>(null).get(), null, 'начальное значение null допустимо для User | null')

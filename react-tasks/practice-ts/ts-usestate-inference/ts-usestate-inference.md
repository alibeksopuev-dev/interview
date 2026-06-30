# `useState` выводит тип как `never[]` / `null` навсегда

## Условие задачи

`useState([])` и `useState(null)` без явных дженериков выводят бесполезные типы:

```typescript
function UserList() {
  const [users, setUsers] = useState([])         // тип never[]
  const [selected, setSelected] = useState(null) // тип null

  useEffect(() => {
    fetchUsers().then(setUsers) // ошибка: User[] не присваивается never[]
  }, [])

  // selected.name — ошибка: null не имеет name
  return <div>{users.map(u => u.name)}</div> // u: never
}
```

Перепиши так, чтобы:
- `users` имел тип `User[]`, а не `never[]`;
- `selected` имел тип `User | null`, а не буквальный `null`.

Здесь это смоделировано чистым TypeScript без React — функцией `createState<T>(initial: T)`, имитирующей `useState` (`get`/`set` вместо `[value, setValue]`).

---

## Решение

```typescript
function createState<T>(initial: T) {
  let value = initial
  const get = () => value
  const set = (v: T) => { value = v }
  return { get, set }
}

interface User {
  id: string
  name: string
}

const usersState = createState<User[]>([])
const selectedState = createState<User | null>(null)

usersState.set([{ id: '1', name: 'Ann' }]) // ✅
selectedState.set({ id: '1', name: 'Ann' }) // ✅
selectedState.set(null) // ✅ — null тоже допустим
```

---

## Ключевые детали

### 1. Почему `useState([])` выводит `never[]`

Без явного дженерика TypeScript выводит тип параметра `initial` из переданного значения. Пустой массив `[]` сам по себе не содержит информации об элементах, и TS выбирает самый узкий возможный тип элемента — `never`. Получается `never[]`: массив, в который теоретически нельзя положить ни одно значение (любое значение шире, чем `never`), а `.map(u => ...)` даёт `u: never`.

### 2. Почему `useState(null)` выводит буквально `null`

Аналогично: единственное переданное значение — `null`, значит TS выводит тип параметра как `null`, а не как union с реальной сущностью. `selected.name` не компилируется (`null` не имеет полей), `setSelected(user)` не компилируется (`User` не присваивается `null`).

### 3. Явный generic решает обе проблемы

```typescript
const [users, setUsers] = useState<User[]>([])
const [selected, setSelected] = useState<User | null>(null)
```

Указывая `<T>` явно, мы говорим компилятору, какой тип должно иметь состояние, независимо от того, что можно вывести из начального значения. `T` перестаёт зависеть от формы `[]` / `null` и становится тем типом, который нужен по смыслу.

### 4. Перенос на `createState<T>`

```typescript
function createState<T>(initial: T) {
  let value = initial
  const get = () => value
  const set = (v: T) => { value = v }
  return { get, set }
}
```

`createState<User[]>([])` — `T` = `User[]`, значит `get(): User[]`, `set(v: User[])`.
`createState<User | null>(null)` — `T` = `User | null`, значит `set` принимает и `User`, и `null`.

---

## Частые вопросы

### Почему не указать тип через аннотацию переменной, а не дженерик функции?

Можно (`const [users, setUsers]: [User[], ...] = useState([])`), но это многословнее и легко забыть про `setUsers`. Явный generic у `useState<T>` / `createState<T>` — стандартный и более читаемый способ.

### А если начальное значение непустое, например `useState([{ id: '1', name: 'Ann' }])`?

Тогда TS сам выведет `{ id: string; name: string }[]` из литерала, и явный дженерик не обязателен — но он всё равно полезен, если тип должен быть шире литерала (например, допускать и другие поля или быть union).

### Чем это похоже на проблему с `keyof`-générique из `ts-keyof-generic`?

Там тоже компилятору не хватало явной параметризации (`<T, K extends keyof T>`), чтобы связать вход и выход типом. Здесь — чтобы связать начальное значение с желаемым типом состояния. Общий урок: где вывод типов недостаточен или вреден, дженерик нужно указывать руками.

---

## Сложность алгоритма

- **Временная сложность**: $O(1)$ — `get`/`set` это обращение к замыканию.
- **Пространственная сложность**: $O(1)$ для самого стейта (не считая хранимых данных).

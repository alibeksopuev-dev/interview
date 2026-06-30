import { RefactorTask } from './types'

/**
 * Практические задачи по TypeScript в контексте React.
 * Реальные примеры: пропсы, хуки, дженерики, дискриминируемые объединения,
 * утилитные типы, type guards, перегрузки, инференс. Все кейсы — из живого
 * React-кода, а не абстрактные упражнения по системе типов.
 */
export const TS_TASKS: RefactorTask[] = [
  // 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 'ts-children-type',
    title: 'children типизирован как any вместо ReactNode',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Обёрточный компонент принимает children: any. Из-за этого теряется проверка и в children можно передать что угодно. Типизируй корректно.',
    brokenCode: `function Card({ title, children }: { title: string; children: any }) {
  return (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  )
}`,
    bugs: [
      {
        title: 'children: any отключает проверки',
        detail:
          'any позволяет передать в children что угодно — функцию, объект, символ — и TS промолчит, а в рантайме React упадёт. Правильный тип для произвольного рендеримого контента — React.ReactNode.',
      },
      {
        title: 'PropsWithChildren — стандартный помощник',
        detail:
          'Можно не писать children вручную, а использовать React.PropsWithChildren<P>, который добавляет children?: ReactNode к твоим пропсам.',
      },
    ],
    fixedCode: `// Вариант 1 — явно ReactNode
function Card({ title, children }: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  )
}

// Вариант 2 — через PropsWithChildren
type CardProps = React.PropsWithChildren<{ title: string }>
function Card2({ title, children }: CardProps) {
  return <section><h3>{title}</h3>{children}</section>
}`,
    takeaway:
      'children рендеримого контента типизируй как React.ReactNode (или через PropsWithChildren), а не any. ReactNode покрывает строки, числа, элементы, массивы, null/undefined — ровно то, что React умеет отрисовать.',
  },

  // 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 'ts-event-handler',
    title: 'Тип события указан неверно — e.target.value не типизирован',
    level: 'middle',
    categories: ['typescript'],
    brief:
      'Обработчик принимает e: any (или просто Event), поэтому e.target.value и e.preventDefault не имеют типов. Используй правильные React-события.',
    brokenCode: `function Form() {
  const handleChange = (e: any) => {
    console.log(e.target.value) // тип unknown, опечатки не ловятся
  }
  const handleSubmit = (e: Event) => {
    e.preventDefault()          // Event есть, но это DOM-, не React-событие
  }

  return (
    <form onSubmit={handleSubmit as any}>
      <input onChange={handleChange} />
    </form>
  )
}`,
    bugs: [
      {
        title: 'e: any теряет типы target/currentTarget',
        detail:
          'e.target.value без типизации — any: опечатка e.taget пройдёт компиляцию. React-события имеют конкретные типы, привязанные к элементу.',
      },
      {
        title: 'DOM Event ≠ React SyntheticEvent',
        detail:
          'React оборачивает нативные события в SyntheticEvent. Тип DOM Event несовместим с React-обработчиком, поэтому пришлось писать as any — это сигнал неправильного типа.',
      },
      {
        title: 'Нужны параметризованные типы события',
        detail:
          'React.ChangeEvent<HTMLInputElement>, React.FormEvent<HTMLFormElement> и т.п. дают типизированные target/currentTarget.',
      },
    ],
    fixedCode: `function Form() {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value) // string, автокомплит работает
  }
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
    </form>
  )
}

// Подсказка: можно вывести тип прямо из пропса:
// const onClick: React.ComponentProps<'button'>['onClick'] = e => {...}`,
    takeaway:
      'Для обработчиков используй React-типы событий, параметризованные элементом: React.ChangeEvent<HTMLInputElement>, React.FormEvent<HTMLFormElement>, React.MouseEvent<HTMLButtonElement>. Они дают типизированные target/currentTarget и убирают as any.',
  },

  // 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 'ts-discriminated-props',
    title: 'Пропсы допускают невозможные комбинации',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'У кнопки есть href и onClick, оба опциональные. Тип разрешает указать оба или ни одного. Сделай так, чтобы это была либо ссылка, либо кнопка.',
    brokenCode: `interface ButtonProps {
  label: string
  href?: string          // ссылка
  onClick?: () => void   // кнопка
  external?: boolean      // имеет смысл только для href
}

function Button({ label, href, onClick, external }: ButtonProps) {
  if (href) return <a href={href} target={external ? '_blank' : undefined}>{label}</a>
  return <button onClick={onClick}>{label}</button>
}
// можно вызвать <Button label="x" /> — ни ссылки, ни обработчика`,
    bugs: [
      {
        title: 'Невозможные комбинации представимы',
        detail:
          'Тип разрешает { href, onClick } одновременно, или ни одного из них, или external без href. Логически это бессмыслица, но компилятор её пропускает — баги поведения.',
      },
      {
        title: 'Решение — discriminated union пропсов',
        detail:
          'Раздели тип на два варианта: «ссылка» (href обязателен, external опционален) и «кнопка» (onClick обязателен). Объедини через |. TS заставит выбрать ровно один вариант.',
      },
    ],
    fixedCode: `type ButtonProps =
  | { label: string; href: string; external?: boolean; onClick?: never }
  | { label: string; onClick: () => void; href?: never; external?: never }

function Button(props: ButtonProps) {
  if ('href' in props) {
    return (
      <a href={props.href} target={props.external ? '_blank' : undefined}>
        {props.label}
      </a>
    )
  }
  return <button onClick={props.onClick}>{props.label}</button>
}

// <Button label="x" /> — ошибка ✅
// <Button label="x" href="/a" onClick={fn} /> — ошибка ✅`,
    takeaway:
      'Когда наборы пропсов взаимоисключающие (ссылка vs кнопка, controlled vs uncontrolled), описывай их через discriminated union с onClick?: never / href?: never. Это запрещает невозможные комбинации на уровне типов, а не в рантайме.',
    playground: {
      starter: `// Задача: типизируй пропсы кнопки так, чтобы нельзя было
// передать href и onClick одновременно (или ни одного).
// Подсказка: discriminated union с onClick?: never / href?: never.

// TODO: сейчас тип слишком широкий — оба поля опциональны.
interface ButtonProps {
  label: string
  href?: string
  external?: boolean
  onClick?: () => void
}

// renderButton не рендерит JSX, а возвращает описание результата —
// так удобнее проверять поведение без React.
function renderButton(props: ButtonProps) {
  if (props.href) {
    return {
      tag: 'a' as const,
      label: props.label,
      href: props.href,
      target: props.external ? '_blank' : undefined,
    }
  }
  return {
    tag: 'button' as const,
    label: props.label,
    onClick: props.onClick,
  }
}

// ── Демонстрация (меняй по желанию) ──
console.log(renderButton({ label: 'Открыть', href: '/page', external: true }))
console.log(renderButton({ label: 'Сохранить', onClick: () => console.log('click') }))
`,
      tests: [
        {
          name: 'рендер ссылки возвращает tag "a" с href и target',
          assert: `expect(renderButton({ label: 'Открыть', href: '/page', external: true })).toEqual({ tag: 'a', label: 'Открыть', href: '/page', target: '_blank' })`,
        },
        {
          name: 'рендер ссылки без external оставляет target undefined',
          assert: `expect(renderButton({ label: 'Открыть', href: '/page' })).toEqual({ tag: 'a', label: 'Открыть', href: '/page', target: undefined })`,
        },
        {
          name: 'рендер кнопки возвращает tag "button" с onClick',
          assert: `const fn = () => {}; expect(renderButton({ label: 'Сохранить', onClick: fn })).toEqual({ tag: 'button', label: 'Сохранить', onClick: fn })`,
        },
      ],
    },
  },

  // 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 'ts-usestate-inference',
    title: 'useState выводит тип как never[] / null навсегда',
    level: 'middle',
    categories: ['typescript', 'hooks'],
    brief:
      'useState([]) и useState(null) выводят бесполезные типы, из-за которых дальше всё приходится приводить. Подскажи типы корректно.',
    brokenCode: `function UserList() {
  const [users, setUsers] = useState([])      // тип never[]
  const [selected, setSelected] = useState(null) // тип null

  useEffect(() => {
    fetchUsers().then(setUsers) // ошибка: User[] не присваивается never[]
  }, [])

  // selected.name — ошибка: null не имеет name
  return <div>{users.map(u => u.name)}</div> // u: never
}`,
    bugs: [
      {
        title: 'useState([]) выводит never[]',
        detail:
          'Пустой массив без аннотации даёт never[] — в него нельзя положить ничего осмысленного, а .map даёт элемент never. fetchUsers().then(setUsers) не скомпилируется.',
      },
      {
        title: 'useState(null) выводит тип null',
        detail:
          'Без дженерика тип состояния — буквально null, поэтому setSelected(user) и selected.name не работают. Нужно указать union с реальным типом.',
      },
    ],
    fixedCode: `function UserList() {
  // явный дженерик задаёт тип состояния
  const [users, setUsers] = useState<User[]>([])
  const [selected, setSelected] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers().then(setUsers) // ✅ User[]
  }, [])

  return (
    <div>
      {users.map(u => (
        <button key={u.id} onClick={() => setSelected(u)}>{u.name}</button>
      ))}
      {selected && <p>Выбран: {selected.name}</p>}
    </div>
  )
}`,
    takeaway:
      'Когда начальное значение useState пустое/null, задавай тип явно: useState<User[]>([]), useState<User | null>(null). Без этого TS выведет never[] или null, и любое осмысленное использование сломается.',
    playground: {
      starter: `// Задача: createState — упрощённая имитация useState (чистый TS,
// без React и без реальных хуков). Сейчас параметр initial не
// типизирован дженериком, поэтому при пустом массиве / null TS
// выводит never[] / null — в state нельзя положить ничего
// осмысленного.
//
// Подсказка: добавь явный generic-параметр <T> у createState
// и указывай его при вызове: createState<User[]>([]),
// createState<User | null>(null).

interface User {
  id: string
  name: string
}

function createState(initial) {
  let value = initial
  const get = () => value
  const set = (v) => { value = v }
  return { get, set }
}

// ── Демонстрация (меняй по желанию) ──
const usersState = createState([]) // должно быть User[]
const selectedState = createState(null) // должно быть User | null

usersState.set([{ id: '1', name: 'Ann' }])
console.log(usersState.get())

selectedState.set({ id: '1', name: 'Ann' })
console.log(selectedState.get())
`,
      tests: [
        {
          name: 'createState<User[]>([]) изначально возвращает пустой массив',
          assert: `expect(createState<User[]>([]).get()).toEqual([])`,
        },
        {
          name: 'set/get корректно работают с массивом User',
          assert: `const s = createState<User[]>([]); s.set([{ id: '1', name: 'Ann' }]); expect(s.get()).toEqual([{ id: '1', name: 'Ann' }])`,
        },
        {
          name: 'set/get корректно работают с User | null',
          assert: `const s = createState<User | null>(null); s.set({ id: '2', name: 'Bob' }); expect(s.get()).toEqual({ id: '2', name: 'Bob' })`,
        },
        {
          name: 'начальное значение null допустимо для User | null',
          assert: `expect(createState<User | null>(null).get()).toBe(null)`,
        },
      ],
    },
  },

  // 5 ─────────────────────────────────────────────────────────────────────
  {
    id: 'ts-as-cast-abuse',
    title: 'as для «убеждения» компилятора прячет реальную ошибку',
    level: 'senior',
    categories: ['typescript'],
    brief:
      'Код напичкан as, чтобы заглушить ошибки типов. Это маскирует баги. Перепиши на безопасные проверки.',
    brokenCode: `function handleResponse(json: unknown) {
  // силой приводим unknown к типу — никаких проверок
  const user = json as User
  return user.profile.email.toLowerCase()
  // если json другой формы — упадёт в рантайме
}

const el = document.getElementById('app') as HTMLDivElement
el.innerHTML = '...' // el может быть null — TS заглушён`,
    bugs: [
      {
        title: 'as обходит проверку типов, не проверяя значение',
        detail:
          'json as User не валидирует данные — это лишь обещание компилятору. Если реальный ответ другой, обращение к user.profile.email упадёт. as опасен на границе с внешними данными.',
      },
      {
        title: 'as HTMLDivElement скрывает возможный null',
        detail:
          'getElementById возвращает HTMLElement | null. Приведение через as прячет null, и el.innerHTML может упасть с "Cannot read properties of null".',
      },
      {
        title: 'Нужны type guards / валидация',
        detail:
          'Для внешних данных используй runtime-валидацию (zod) или явные проверки. Для DOM — проверку на null. as оставляй для случаев, когда ты ЗНАЕШЬ больше компилятора (редко).',
      },
    ],
    fixedCode: `import { z } from 'zod'

const UserSchema = z.object({
  profile: z.object({ email: z.string() }),
})

function handleResponse(json: unknown) {
  // валидируем в рантайме — гарантия формы
  const user = UserSchema.parse(json)
  return user.profile.email.toLowerCase()
}

const el = document.getElementById('app')
if (el instanceof HTMLDivElement) {
  el.innerHTML = '...' // тип сужен проверкой, null исключён
}`,
    takeaway:
      'as — это «поверь мне», а не проверка. На границе с внешними данными (API, localStorage, postMessage) валидируй в рантайме (zod/io-ts). Для DOM проверяй на null/instanceof. Частый as — запах того, что типы где-то неверны.',
  },

  // 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 'ts-generic-hook',
    title: 'Кастомный хук возвращает any вместо дженерика',
    level: 'senior',
    categories: ['typescript', 'hooks'],
    brief:
      'useLocalStorage хранит и возвращает значение как any. Сделай его дженериком, чтобы тип значения сохранялся.',
    brokenCode: `function useLocalStorage(key: string, initial: any): [any, (v: any) => void] {
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : initial
  })
  const set = (v: any) => {
    setValue(v)
    localStorage.setItem(key, JSON.stringify(v))
  }
  return [value, set]
}

// использование — тип потерян
const [count, setCount] = useLocalStorage('count', 0)
setCount('строка') // ошибки нет, но 0 ожидался числом`,
    bugs: [
      {
        title: 'any стирает тип хранимого значения',
        detail:
          'И value, и setValue — any. setCount("строка") при дефолте 0 не вызовет ошибку. Возвращаемый кортеж тоже any, поэтому ни автокомплита, ни безопасности.',
      },
      {
        title: 'Нужен generic-параметр T',
        detail:
          'Параметризуй хук <T> и выведи T из initial. Возвращай типизированный кортеж [T, Dispatch<SetStateAction<T>>], как у useState.',
      },
    ],
    fixedCode: `function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : initial
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// использование — T выводится из initial
const [count, setCount] = useLocalStorage('count', 0) // T = number
setCount('строка') // ошибка ✅
setCount(c => c + 1) // ✅ функциональный апдейт тоже типизирован`,
    takeaway:
      'Кастомные хуки делай дженериками: <T> связывает вход (initial) и выход. Возвращай типизированный кортеж [T, Dispatch<SetStateAction<T>>], чтобы хук вёл себя как useState — с инференсом и поддержкой функциональных апдейтов.',
  },

  // 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 'ts-record-vs-index',
    title: 'Индексная сигнатура [key: string] прячет undefined',
    level: 'senior',
    categories: ['typescript'],
    brief:
      'Словарь типизирован как { [key: string]: User }. Доступ по несуществующему ключу даёт «User», хотя там undefined. Включи безопасность.',
    brokenCode: `interface UserMap {
  [id: string]: User
}

function getName(map: UserMap, id: string) {
  // map[id] имеет тип User, даже если ключа нет —
  // .name упадёт в рантайме на undefined
  return map[id].name
}`,
    bugs: [
      {
        title: 'Индексная сигнатура врёт про наличие ключа',
        detail:
          'По умолчанию map[id] типизируется как User, даже когда ключа нет. TS не подсказывает, что результат может быть undefined — отсюда рантайм-падения на .name.',
      },
      {
        title: 'Решение — noUncheckedIndexedAccess или Partial/Record',
        detail:
          'Флаг tsconfig noUncheckedIndexedAccess делает доступ по индексу User | undefined. Альтернатива — Record<string, User | undefined> или явная проверка наличия ключа.',
      },
    ],
    fixedCode: `// tsconfig: "noUncheckedIndexedAccess": true
// тогда map[id] -> User | undefined автоматически

type UserMap = Record<string, User | undefined>

function getName(map: UserMap, id: string): string | undefined {
  const user = map[id]
  if (!user) return undefined // сужение убирает undefined
  return user.name
}

// или с optional chaining:
function getName2(map: UserMap, id: string) {
  return map[id]?.name
}`,
    takeaway:
      'Доступ по индексу к словарю потенциально даёт undefined. Включи noUncheckedIndexedAccess (или типизируй значение как T | undefined) и проверяй результат через guard / ?.. Иначе TS будет уверять, что ключ есть, а рантайм — падать.',
    playground: {
      starter: `// Задача: убери ложную гарантию "ключ есть" из UserMap.
// Подсказка: Record<string, User | undefined> + guard (или ?.) в getName.

interface User {
  id: string
  name: string
}

interface UserMap {
  [id: string]: User
}

function getName(map: UserMap, id: string) {
  // TODO: map[id] типизирован как User, даже если ключа нет —
  // .name может упасть в рантайме на undefined
  return map[id].name
}

// ── Демонстрация (меняй по желанию) ──
const map: UserMap = { '1': { id: '1', name: 'Ann' } }
console.log(getName(map, '1'))
`,
      tests: [
        {
          name: 'getName возвращает имя для существующего ключа',
          assert: `expect(getName({ '1': { id: '1', name: 'Ann' } }, '1')).toBe('Ann')`,
        },
        {
          name: 'getName возвращает undefined для несуществующего ключа без падения',
          assert: `expect(getName({ '1': { id: '1', name: 'Ann' } }, 'missing')).toBe(undefined)`,
        },
        {
          name: 'getName работает с несколькими ключами в словаре',
          assert: `expect(getName({ '1': { id: '1', name: 'Ann' }, '2': { id: '2', name: 'Bob' } }, '2')).toBe('Bob')`,
        },
        {
          name: 'getName возвращает undefined для пустого словаря',
          assert: `expect(getName({}, 'any')).toBe(undefined)`,
        },
      ],
    },
  },

  // 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 'ts-enum-vs-union',
    title: 'enum вместо union усложняет типы и раздувает бандл',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Статусы описаны через enum. Это генерирует рантайм-код и хуже выводится. Часто union строковых литералов лучше.',
    brokenCode: `enum Status {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

function Badge({ status }: { status: Status }) {
  // придётся импортировать enum везде, где задают статус
  return <span className={status}>{status}</span>
}
// <Badge status="idle" /> — ошибка, нужен Status.Idle`,
    bugs: [
      {
        title: 'enum генерирует рантайм-объект',
        detail:
          'В отличие от типов, enum компилируется в реальный JS-объект — добавляет код в бандл и не «стирается» при сборке (если не const enum, у которого свои подводные камни).',
      },
      {
        title: 'Хуже эргономика',
        detail:
          'Чтобы передать статус, нужно импортировать enum и писать Status.Idle вместо строки "idle". Union строковых литералов принимает обычные строки и проще в использовании.',
      },
    ],
    fixedCode: `// union строковых литералов — нулевой рантайм, отличный инференс
type Status = 'idle' | 'loading' | 'success' | 'error'

function Badge({ status }: { status: Status }) {
  return <span className={status}>{status}</span>
}

// <Badge status="idle" /> — работает и проверяется ✅

// если нужен перебор значений — массив as const + тип из него:
const STATUSES = ['idle', 'loading', 'success', 'error'] as const
type Status2 = (typeof STATUSES)[number]`,
    takeaway:
      'Для фиксированного набора строк предпочитай union строковых литералов ("a" | "b"): нулевой рантайм, лучше инференс, проще передавать как обычные строки. enum оставляй там, где реально нужен рантайм-объект. Нужен перебор — array as const + (typeof arr)[number].',
    playground: {
      starter: `// Задача: избавься от enum и перепиши на union строковых литералов.
// Подсказка: type Status = 'idle' | 'loading' | 'success' | 'error'
// плюс массив STATUSES as const + тип (typeof STATUSES)[number].
// TODO: замени enum Status на union + as const массив со списком статусов.

enum Status {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

function getBadgeLabel(status: Status): string {
  switch (status) {
    case Status.Idle:
      return 'Ожидание'
    case Status.Loading:
      return 'Загрузка'
    case Status.Success:
      return 'Готово'
    case Status.Error:
      return 'Ошибка'
  }
}

// ── Демонстрация (меняй по желанию) ──
console.log(getBadgeLabel(Status.Idle))
console.log(getBadgeLabel(Status.Success))
`,
      tests: [
        {
          name: 'getBadgeLabel принимает обычную строку "idle", а не Status.Idle',
          assert: `expect(getBadgeLabel('idle')).toBe('Ожидание')`,
        },
        {
          name: 'getBadgeLabel возвращает корректный текст для "loading"',
          assert: `expect(getBadgeLabel('loading')).toBe('Загрузка')`,
        },
        {
          name: 'getBadgeLabel возвращает корректный текст для "success" и "error"',
          assert: `expect(getBadgeLabel('success')).toBe('Готово') && expect(getBadgeLabel('error')).toBe('Ошибка')`,
        },
        {
          name: 'STATUSES содержит все четыре статуса в правильном порядке',
          assert: `expect(STATUSES).toEqual(['idle', 'loading', 'success', 'error'])`,
        },
      ],
    },
  },

  // 9 ─────────────────────────────────────────────────────────────────────
  {
    id: 'ts-component-props',
    title: 'Дублирование типов вместо ComponentProps',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Обёртка над <button> вручную перечисляет все HTML-атрибуты. Это неполно и быстро устаревает. Возьми типы у самого элемента.',
    brokenCode: `interface MyButtonProps {
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  // забыли className, aria-*, onMouseEnter, form, name, ...
  variant: 'primary' | 'ghost'
}

function MyButton({ variant, ...rest }: MyButtonProps) {
  return <button className={variant} {...rest} />
}
// <MyButton variant="primary" aria-label="x" /> — ошибка: нет aria-label`,
    bugs: [
      {
        title: 'Ручное перечисление атрибутов неполно',
        detail:
          'Перечислить все валидные атрибуты <button> вручную невозможно: className, aria-*, data-*, form, name, onFocus и десятки других. Любой непокрытый — ошибка типа при использовании.',
      },
      {
        title: 'Возьми готовый тип атрибутов',
        detail:
          'React.ComponentProps<"button"> (или ButtonHTMLAttributes<HTMLButtonElement>) уже содержит все валидные пропсы элемента. Расширь его своими кастомными полями.',
      },
    ],
    fixedCode: `// берём все нативные пропсы button и добавляем свои
interface MyButtonProps extends React.ComponentProps<'button'> {
  variant: 'primary' | 'ghost'
}

function MyButton({ variant, className, ...rest }: MyButtonProps) {
  return (
    <button
      className={[variant, className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}

// <MyButton variant="primary" aria-label="x" onMouseEnter={...} /> — ✅`,
    takeaway:
      'Для обёрток над DOM-элементами наследуй типы через React.ComponentProps<"button"> (или *HTMLAttributes) и добавляй кастомные пропсы — не перечисляй атрибуты вручную. ComponentPropsWithoutRef<"button"> — когда ref не нужен.',
  },

  // 10 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-type-guard',
    title: 'Проверка типа не сужает union — нужен type guard',
    level: 'senior',
    categories: ['typescript'],
    brief:
      'Функция проверяет вариант union булевой функцией, но TS не сужает тип после неё. Сделай user-defined type guard.',
    brokenCode: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }

function isCircle(s: Shape) {
  return s.kind === 'circle' // возвращает boolean, но не сужает тип
}

function area(s: Shape) {
  if (isCircle(s)) {
    return Math.PI * s.radius ** 2 // ошибка: radius нет на square
  }
  return s.side ** 2
}`,
    bugs: [
      {
        title: 'Функция возвращает boolean, а не type predicate',
        detail:
          'isCircle возвращает boolean. После if (isCircle(s)) TS НЕ знает, что s сузился до circle — поэтому s.radius считается ошибкой. Нужен предикат типа s is ....',
      },
      {
        title: 'Решение — user-defined type guard',
        detail:
          'Аннотируй возврат как s is { kind: "circle"; radius: number } (или через дискриминант). Тогда внутри ветки TS сузит тип.',
      },
    ],
    fixedCode: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }

// type guard: возвращаемый тип — предикат "s is ..."
function isCircle(s: Shape): s is Extract<Shape, { kind: 'circle' }> {
  return s.kind === 'circle'
}

function area(s: Shape) {
  if (isCircle(s)) {
    return Math.PI * s.radius ** 2 // s сужен до circle ✅
  }
  return s.side ** 2 // s сужен до square ✅
}

// Чаще проще сужать прямо по дискриминанту, без отдельной функции:
// if (s.kind === 'circle') { ... } — TS сужает автоматически`,
    takeaway:
      'Чтобы функция-проверка сужала тип, её возврат должен быть type predicate (arg is Type), а не boolean. Для discriminated union обычно достаточно проверки дискриминанта (s.kind === "circle") прямо в if — TS сузит сам, без отдельного guard.',
    playground: {
      starter: `// Задача: сделай так, чтобы isCircle сужал тип Shape после if.
// Подсказка: возвращаемый тип isCircle должен быть type predicate
// (s is ...), а не boolean.

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }

function isCircle(s: Shape): boolean {
  // TODO: замени boolean на type predicate s is Extract<Shape, { kind: 'circle' }>
  return s.kind === 'circle'
}

function area(s: Shape) {
  if (isCircle(s)) {
    return Math.PI * s.radius ** 2 // ошибка: radius нет на square, пока isCircle не сужает тип
  }
  return s.side ** 2
}

// ── Демонстрация (меняй по желанию) ──
console.log(area({ kind: 'circle', radius: 2 }))
console.log(area({ kind: 'square', side: 3 }))
`,
      tests: [
        {
          name: 'area считает площадь круга через Math.PI * radius ** 2',
          assert: `expect(area({ kind: 'circle', radius: 2 })).toBe(Math.PI * 4)`,
        },
        {
          name: 'area считает площадь квадрата через side ** 2',
          assert: `expect(area({ kind: 'square', side: 3 })).toBe(9)`,
        },
        {
          name: 'area корректно работает с радиусом 1',
          assert: `expect(area({ kind: 'circle', radius: 1 })).toBe(Math.PI)`,
        },
        {
          name: 'area корректно работает со стороной 5',
          assert: `expect(area({ kind: 'square', side: 5 })).toBe(25)`,
        },
      ],
    },
  },

  // 11 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-exhaustive-switch',
    title: 'switch по union не проверяет полноту — новый вариант проглатывается',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'switch обрабатывает варианты union, но при добавлении нового кейса TS молчит. Добавь проверку исчерпываемости через never.',
    brokenCode: `type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' } // добавили позже — забыли обработать

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment': return state + 1
    case 'decrement': return state - 1
    // 'reset' не обработан — TS не предупредил, баг молчит
    default: return state
  }
}`,
    bugs: [
      {
        title: 'default: return state глотает новые варианты',
        detail:
          'Когда добавляют новый тип экшена, default тихо его обрабатывает «как ничего». Компилятор не заставляет дописать case — баг находят только в рантайме.',
      },
      {
        title: 'Нужна проверка exhaustiveness через never',
        detail:
          'В default присвой action переменной типа never. Если остался необработанный вариант, его тип не never → ошибка компиляции, указывающая, что case забыт.',
      },
    ],
    fixedCode: `type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }

function assertNever(x: never): never {
  throw new Error('Необработанный вариант: ' + JSON.stringify(x))
}

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment': return state + 1
    case 'decrement': return state - 1
    case 'reset': return 0
    default:
      // если добавить новый Action и забыть case —
      // здесь будет ошибка компиляции ✅
      return assertNever(action)
  }
}`,
    takeaway:
      'Для switch по discriminated union добавляй exhaustiveness-проверку: в default передавай значение в assertNever(x: never). Любой новый необработанный вариант вызовет ошибку компиляции вместо тихого бага. Бесценно для редьюсеров и обработки событий.',
    playground: {
      starter: `// Задача: добавь exhaustiveness-проверку через assertNever(x: never).
// Подсказка: напиши function assertNever(x: never): never { throw new Error(...) }
// и вызови её в default вместо return state.
// TODO: замени "default: return state" на проверку через assertNever(action),
// чтобы новый необработанный вариант Action ловился на этапе компиляции.

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    case 'reset':
      return 0
    default:
      return state
  }
}

// ── Демонстрация (меняй по желанию) ──
console.log(reducer(0, { type: 'increment' }))
console.log(reducer(5, { type: 'reset' }))
`,
      tests: [
        {
          name: 'increment увеличивает state на 1',
          assert: `expect(reducer(0, { type: 'increment' })).toBe(1)`,
        },
        {
          name: 'decrement уменьшает state на 1',
          assert: `expect(reducer(5, { type: 'decrement' })).toBe(4)`,
        },
        {
          name: 'reset возвращает 0',
          assert: `expect(reducer(5, { type: 'reset' })).toBe(0)`,
        },
        {
          name: 'increment работает с произвольным state',
          assert: `expect(reducer(10, { type: 'increment' })).toBe(11)`,
        },
      ],
    },
  },

  // 12 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-optional-vs-undefined',
    title: 'Опциональный проп vs union с undefined — разное поведение',
    level: 'middle',
    categories: ['typescript'],
    brief:
      'Из-за exactOptionalPropertyTypes есть разница между field?: T и field: T | undefined. Разберись, где какая ошибка.',
    brokenCode: `interface Props {
  value: string | undefined // ОБЯЗАТЕЛЬНЫЙ проп, но может быть undefined
}

function Input({ value }: Props) {
  return <input value={value} />
}

// <Input /> — ошибка: value обязателен (даже undefined нужно передать явно)
// приходится писать <Input value={undefined} /> — некрасиво`,
    bugs: [
      {
        title: 'value: string | undefined — обязательный проп',
        detail:
          'Union с undefined НЕ делает проп опциональным. value обязателен — придётся передавать value={undefined} явно. Это путает потребителей компонента.',
      },
      {
        title: 'Нужен ? для необязательности',
        detail:
          'Опциональность задаёт знак вопроса: value?: string. Тогда <Input /> валиден. При exactOptionalPropertyTypes value?: string и value: string | undefined ещё и ведут себя по-разному при передаче undefined.',
      },
    ],
    fixedCode: `interface Props {
  value?: string // необязательный: можно не передавать
}

function Input({ value }: Props) {
  return <input value={value ?? ''} />
}

// <Input /> — ✅
// <Input value="x" /> — ✅

// Если включён exactOptionalPropertyTypes, то:
//   value?: string            — можно не передавать, но НЕЛЬЗЯ передать undefined
//   value?: string | undefined — можно и не передавать, и передать undefined`,
    takeaway:
      'Необязательность пропа задаёт ?, а не union с undefined: prop?: T позволяет не передавать проп, тогда как prop: T | undefined требует передавать его явно. При exactOptionalPropertyTypes различай prop?: T и prop?: T | undefined.',
  },

  // 13 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-readonly-props',
    title: 'Мутация пропсов/массива не ловится типами',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Компонент сортирует пришедший в пропсах массив на месте, мутируя данные родителя. Типы это не запрещают. Сделай данные readonly.',
    brokenCode: `function SortedList({ items }: { items: number[] }) {
  // .sort() мутирует исходный массив из пропсов!
  const sorted = items.sort((a, b) => a - b)
  return <ul>{sorted.map(i => <li key={i}>{i}</li>)}</ul>
}`,
    bugs: [
      {
        title: 'items.sort() мутирует пропс на месте',
        detail:
          'Array.prototype.sort сортирует исходный массив и возвращает ссылку на него же. items пришёл из родителя — мы тихо меняем его состояние. Источник трудноуловимых багов.',
      },
      {
        title: 'Типы не защищают от мутации',
        detail:
          'number[] разрешает push/sort/splice. Объяви пропс как readonly number[] (или ReadonlyArray<number>) — тогда мутирующие методы станут ошибкой компиляции.',
      },
    ],
    fixedCode: `function SortedList({ items }: { items: readonly number[] }) {
  // items.sort() теперь ошибка компиляции ✅
  // копируем перед сортировкой
  const sorted = [...items].sort((a, b) => a - b)
  // или toSorted() (ES2023): const sorted = items.toSorted((a,b)=>a-b)
  return <ul>{sorted.map(i => <li key={i}>{i}</li>)}</ul>
}`,
    takeaway:
      'Типизируй входные массивы/объекты как readonly (readonly T[], Readonly<T>) — это превращает случайные мутации (.sort, .push, присваивание полей) в ошибки компиляции. Перед мутацией копируй ([...arr]) или используй неизменяющие методы (toSorted, toReversed).',
    playground: {
      starter: `// Задача: getSortedList мутирует исходный массив через items.sort().
// TODO: сделай items: readonly number[] и копируй массив ([...items])
// перед сортировкой, чтобы исходные данные не менялись.

function getSortedList(items: number[]): number[] {
  return items.sort((a, b) => a - b)
}

// ── Демонстрация (меняй по желанию) ──
const original = [3, 1, 2]
console.log(getSortedList(original))
console.log(original) // не должен измениться
`,
      tests: [
        {
          name: 'возвращает отсортированный по возрастанию массив',
          assert: `expect(getSortedList([3, 1, 2])).toEqual([1, 2, 3])`,
        },
        {
          name: 'не мутирует исходный массив-аргумент',
          assert: `const original = [3, 1, 2]; getSortedList(original); expect(original).toEqual([3, 1, 2])`,
        },
        {
          name: 'работает с уже отсортированным массивом',
          assert: `expect(getSortedList([1, 2, 3])).toEqual([1, 2, 3])`,
        },
        {
          name: 'не мутирует исходный массив даже для другого набора данных',
          assert: `const original = [5, -1, 0, 2]; getSortedList(original); expect(original).toEqual([5, -1, 0, 2])`,
        },
      ],
    },
  },

  // 14 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-as-const',
    title: 'Литералы расширяются до string — теряется точный тип',
    level: 'middle',
    categories: ['typescript'],
    brief:
      'Конфиг-объект теряет точные типы: "primary" становится string, и его нельзя передать в проп с union. Зафиксируй через as const.',
    brokenCode: `const config = {
  variant: 'primary', // тип расширяется до string
  size: 'lg',
}

function Button(props: { variant: 'primary' | 'ghost'; size: 'sm' | 'lg' }) {
  return <button />
}

// ошибка: string не присваивается 'primary' | 'ghost'
<Button variant={config.variant} size={config.size} />`,
    bugs: [
      {
        title: 'Литералы в объекте расширяются (widening)',
        detail:
          'По умолчанию TS расширяет config.variant до string, а не "primary". Поэтому его нельзя передать в проп, ожидающий union литералов — типы не совпадают.',
      },
      {
        title: 'as const фиксирует литеральные типы',
        detail:
          'as const делает объект глубоко readonly и сохраняет точные литеральные типы: variant станет именно "primary". Тогда передача в union-проп работает.',
      },
    ],
    fixedCode: `const config = {
  variant: 'primary',
  size: 'lg',
} as const
// теперь config.variant: 'primary', config.size: 'lg'

function Button(props: { variant: 'primary' | 'ghost'; size: 'sm' | 'lg' }) {
  return <button />
}

<Button variant={config.variant} size={config.size} /> // ✅

// as const незаменим и для tuple, и для массивов-источников union:
const ROUTES = ['/home', '/about'] as const
type Route = (typeof ROUTES)[number] // '/home' | '/about'`,
    takeaway:
      'Без as const TS расширяет строковые/числовые литералы до string/number. Применяй as const к конфигам, кортежам и массивам, когда нужны точные литеральные типы — например, чтобы значение подходило под union-проп или порождало тип через (typeof arr)[number].',
    playground: {
      starter: `// Задача: зафиксируй литеральные типы через as const, чтобы
// applyButtonConfig(config.variant, config.size) не давал ошибку типа.
// TODO: добавь "as const" после объекта config — без него variant и size
// расширяются до string, и их нельзя передать в параметры с union-типом.

const config = {
  variant: 'primary',
  size: 'lg',
}

function applyButtonConfig(props: { variant: 'primary' | 'ghost'; size: 'sm' | 'lg' }): string {
  return \`\${props.variant}-\${props.size}\`
}

// Раскомментируй после добавления as const — без него здесь ошибка типов:
// console.log(applyButtonConfig({ variant: config.variant, size: config.size }))

// as const также нужен для кортежей-источников union:
const ROUTES = ['/home', '/about']
type Route = (typeof ROUTES)[number]

function isValidRoute(r: string): boolean {
  return (ROUTES as readonly string[]).includes(r)
}

// ── Демонстрация (меняй по желанию) ──
console.log(applyButtonConfig({ variant: 'primary', size: 'lg' }))
console.log(isValidRoute('/home'))
`,
      tests: [
        {
          name: 'applyButtonConfig с config.variant/config.size после as const даёт ожидаемую строку',
          assert: `expect(applyButtonConfig({ variant: 'primary', size: 'lg' })).toBe('primary-lg')`,
        },
        {
          name: 'applyButtonConfig работает с другой комбинацией литералов',
          assert: `expect(applyButtonConfig({ variant: 'ghost', size: 'sm' })).toBe('ghost-sm')`,
        },
        {
          name: 'isValidRoute находит существующий маршрут из ROUTES as const',
          assert: `expect(isValidRoute('/about')).toBe(true)`,
        },
        {
          name: 'isValidRoute отклоняет маршрут, которого нет в ROUTES',
          assert: `expect(isValidRoute('/missing')).toBe(false)`,
        },
      ],
    },
  },

  // 15 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-omit-pick',
    title: 'Копипаст типов вместо Pick/Omit',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Форма редактирования дублирует поля User вручную и рассинхронизируется с моделью. Выведи тип через утилиты.',
    brokenCode: `interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  role: 'admin' | 'user'
}

// ручная копия полей — при изменении User рассинхрон
interface EditUserForm {
  name: string
  email: string
  role: 'admin' | 'user'
}`,
    bugs: [
      {
        title: 'Дублирование структуры User',
        detail:
          'EditUserForm руками повторяет часть полей User. Когда User изменится (новое поле, смена типа), форма молча устареет. Производные типы лучше выводить из источника.',
      },
      {
        title: 'Pick / Omit держат типы в синхроне',
        detail:
          'Pick<User, "name" | "email" | "role"> или Omit<User, "id" | "createdAt"> выводят форму из User. Любое изменение модели автоматически отразится в производном типе.',
      },
    ],
    fixedCode: `interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  role: 'admin' | 'user'
}

// выбираем нужные поля
type EditUserForm = Pick<User, 'name' | 'email' | 'role'>

// или исключаем серверные/нередактируемые
type EditUserForm2 = Omit<User, 'id' | 'createdAt'>

// частичное обновление (PATCH):
type UserPatch = Partial<Omit<User, 'id'>>`,
    takeaway:
      'Производные типы выводи из источника через Pick/Omit/Partial/Required, а не копируй поля руками. Так формы, DTO и patch-типы остаются в синхроне с моделью: меняешь User — производные обновляются автоматически.',
  },

  // 16 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-function-overload',
    title: 'Функция с зависимостью возврата от аргумента возвращает union',
    level: 'senior',
    categories: ['typescript'],
    brief:
      'Хелпер возвращает строку или число в зависимости от флага, но тип возврата — всегда union. Уточни через перегрузки или дженерик.',
    brokenCode: `function getValue(asNumber: boolean): string | number {
  return asNumber ? 42 : 'text'
}

const a = getValue(true)  // тип string | number, хотя точно number
const b = getValue(false) // тип string | number, хотя точно string

// приходится приводить: (getValue(true) as number) + 1`,
    bugs: [
      {
        title: 'Возврат всегда union, теряется точность',
        detail:
          'Хотя при asNumber=true результат всегда число, тип возврата string | number. Потребителю приходится приводить — теряется безопасность и автокомплит.',
      },
      {
        title: 'Перегрузки уточняют связь аргумент → возврат',
        detail:
          'Function overloads позволяют описать: при true возврат number, при false — string. Реализация остаётся одна, а вызывающий код получает точный тип.',
      },
    ],
    fixedCode: `// сигнатуры-перегрузки
function getValue(asNumber: true): number
function getValue(asNumber: false): string
// реализация (её сигнатуру вызывающие не видят)
function getValue(asNumber: boolean): string | number {
  return asNumber ? 42 : 'text'
}

const a = getValue(true)  // number ✅
const b = getValue(false) // string ✅

// Альтернатива без перегрузок — conditional type:
function getValue2<B extends boolean>(b: B): B extends true ? number : string {
  return (b ? 42 : 'text') as any
}`,
    takeaway:
      'Когда тип результата зависит от аргумента, используй перегрузки функций (function f(x: true): A; function f(x: false): B) или conditional types вместо широкого union. Вызывающий код получает точный тип без ручных приведений.',
  },

  // 17 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-keyof-generic',
    title: 'Функция доступа к полю объекта возвращает any',
    level: 'senior',
    categories: ['typescript'],
    brief:
      'Хелпер get(obj, key) теряет связь между ключом и типом значения. Свяжи их через keyof и индексный доступ.',
    brokenCode: `function get(obj: any, key: string): any {
  return obj[key]
}

const user = { name: 'Ann', age: 30 }
const name = get(user, 'name') // any, а не string
const typo = get(user, 'naem') // any, опечатка не ловится`,
    bugs: [
      {
        title: 'any не связывает ключ и тип значения',
        detail:
          'get возвращает any: тип результата не зависит от ключа, а несуществующий ключ "naem" не вызывает ошибку. Теряется и проверка ключа, и тип возврата.',
      },
      {
        title: 'keyof + индексный доступ',
        detail:
          'Параметризуй <T, K extends keyof T>: ключ обязан быть реальным ключом объекта, а возврат — T[K] (тип значения по этому ключу).',
      },
    ],
    fixedCode: `function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { name: 'Ann', age: 30 }
const name = get(user, 'name') // string ✅
const age = get(user, 'age')   // number ✅
const typo = get(user, 'naem') // ошибка: 'naem' не ключ user ✅`,
    takeaway:
      'Для типобезопасного доступа к полям используй generic <T, K extends keyof T> и возвращай T[K]. keyof ограничивает ключ реальными свойствами, индексный доступ T[K] выводит точный тип значения. Так строятся типобезопасные get/pluck/sortBy.',
    playground: {
      starter: `// Задача: типизируй get так, чтобы тип результата
// зависел от ключа (string -> string, number -> number).
// Подсказка: generic <T, K extends keyof T> и возврат T[K].

function get(obj: any, key: string): any {
  return obj[key]
}

// ── Демонстрация (меняй по желанию) ──
const user = { name: 'Ann', age: 30 }
console.log(get(user, 'name'))
console.log(get(user, 'age'))
`,
      tests: [
        {
          name: 'get возвращает значение по строковому ключу',
          assert: `expect(get({ name: 'Ann', age: 30 }, 'name')).toBe('Ann')`,
        },
        {
          name: 'get возвращает значение по числовому полю',
          assert: `expect(get({ name: 'Ann', age: 30 }, 'age')).toBe(30)`,
        },
        {
          name: 'get работает с вложенным объектом как значением',
          assert: `expect(get({ profile: { city: 'NY' } }, 'profile')).toEqual({ city: 'NY' })`,
        },
      ],
    },
  },

  // 18 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-ref-type',
    title: 'useRef типизирован неверно — current нельзя присвоить или он null',
    level: 'middle',
    categories: ['typescript', 'hooks'],
    brief:
      'Два кейса useRef путают: DOM-ref и мутируемый ref. В одном current readonly, в другом вечно null. Разведи типы.',
    brokenCode: `function Timer() {
  // хотим хранить id таймера, но useRef<number>() даёт current: number | undefined,
  // а присваивание иногда «не разрешено» из-за неверной перегрузки
  const timer = useRef<number>(0)

  // DOM-ref: useRef без аргумента → current readonly, нельзя отдать в ref={}
  const inputRef = useRef<HTMLInputElement>()

  return <input ref={inputRef} /> // тип ref несовместим
}`,
    bugs: [
      {
        title: 'DOM-ref требует initial value null',
        detail:
          'Для ref на DOM-элемент нужно useRef<HTMLInputElement>(null). Без аргумента TS выбирает перегрузку RefObject с readonly current типа T | undefined, который несовместим с пропсом ref.',
      },
      {
        title: 'Мутируемый ref — initial без null',
        detail:
          'Для «коробочки» (id таймера, любое мутируемое значение) используется перегрузка MutableRefObject — её включает передача initial значения нужного типа. Тип id таймера лучше ReturnType<typeof setTimeout>.',
      },
    ],
    fixedCode: `function Timer() {
  // мутируемый ref-контейнер: current можно присваивать
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = () => {
    timer.current = setTimeout(() => {}, 1000) // ✅ присваивается
  }

  // DOM-ref: initial null → корректный RefObject<HTMLInputElement>
  const inputRef = useRef<HTMLInputElement>(null)

  return <input ref={inputRef} /> // ✅ совместимо
}`,
    takeaway:
      'Для DOM-ref пиши useRef<T>(null) — это даёт RefObject, совместимый с пропсом ref. Для мутируемого контейнера передавай initial значение (useRef(0), useRef<X | null>(null)) — получишь MutableRefObject с присваиваемым current. Тип id таймера — ReturnType<typeof setTimeout>.',
  },

  // 19 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-async-return',
    title: 'Тип возврата async-функции указан без Promise',
    level: 'middle',
    categories: ['typescript', 'async'],
    brief:
      'Сигнатура async-функции обещает User, хотя реально возвращает Promise<User>. И ошибки внутри проглатываются. Поправь типы.',
    brokenCode: `// заявлен User, но async всегда возвращает Promise
async function loadUser(id: string): User {
  const res = await fetch(\`/api/\${id}\`)
  return res.json() // тип any — не проверяется
}

function useUser(id: string) {
  const [user, setUser] = useState<User>()
  useEffect(() => {
    loadUser(id).then(setUser) // .then на User? путаница
  }, [id])
}`,
    bugs: [
      {
        title: 'async-функция не может возвращать не-Promise',
        detail:
          'Тип возврата async-функции обязан быть Promise<...> (или Awaitable). Аннотация : User либо вызовет ошибку, либо вводит в заблуждение — реально это Promise<User>.',
      },
      {
        title: 'res.json() возвращает any',
        detail:
          'fetch(...).json() имеет тип Promise<any> — данные не проверяются. Нужно типизировать результат (через дженерик-обёртку или валидацию), иначе any протекает дальше.',
      },
    ],
    fixedCode: `async function loadUser(id: string): Promise<User> {
  const res = await fetch(\`/api/\${id}\`)
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
  // типизируем распаршенный JSON (в идеале — валидируем zod-ом)
  return (await res.json()) as User
}

function useUser(id: string) {
  const [user, setUser] = useState<User>()
  useEffect(() => {
    let cancelled = false
    loadUser(id).then(u => !cancelled && setUser(u))
    return () => { cancelled = true }
  }, [id])
  return user
}`,
    takeaway:
      'Тип возврата async-функции — всегда Promise<T>. Не аннотируй её «голым» T. И помни: fetch(...).json() возвращает any — типизируй или валидируй результат, иначе any расползётся по коду.',
  },

  // 20 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-non-null-assertion',
    title: 'Оператор ! глушит null там, где он реально возможен',
    level: 'senior',
    categories: ['typescript'],
    brief:
      'Код усыпан non-null assertion (!), чтобы убрать null из типа. В части мест null реально приходит — оттуда и падения. Замени на безопасные проверки.',
    brokenCode: `function UserPage({ user }: { user: User | null }) {
  // ! убирает null из типа, но не из рантайма
  return (
    <div>
      <h1>{user!.name}</h1>
      <p>{user!.email}</p>
    </div>
  )
  // если user === null (ещё грузится) — краш на user!.name
}`,
    bugs: [
      {
        title: 'Non-null assertion не проверяет значение',
        detail:
          'user!.name говорит компилятору «здесь не null», но в рантайме user вполне может быть null (например, во время загрузки). Тогда — "Cannot read properties of null".',
      },
      {
        title: 'Нужно реальное сужение или ранний возврат',
        detail:
          'Вместо ! делай явную проверку (if (!user) return ...) или ?. — тогда и типы корректны, и рантайм безопасен. ! оставляй для случаев, когда null объективно невозможен.',
      },
    ],
    fixedCode: `function UserPage({ user }: { user: User | null }) {
  // ранний возврат сужает тип ниже до User
  if (!user) return <Spinner />

  return (
    <div>
      <h1>{user.name}</h1>   {/* null исключён проверкой */}
      <p>{user.email}</p>
    </div>
  )
}

// если поле опционально и допускает отсутствие — optional chaining:
// <p>{user.profile?.bio ?? 'Нет описания'}</p>`,
    takeaway:
      'Non-null assertion (!) лишь убирает null из типа, но не из рантайма. Если null реально возможен — используй ранний возврат для сужения или ?./??. Оставляй ! только там, где null объективно исключён (а лучше — настрой линтер запрещать его).',
  },

  // 21 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-generic-forwardref',
    title: 'Дженерик-компонент со ссылкой теряет параметр типа',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Типизированный <Select<T>> работает, но как только понадобилось пробросить ref, дженерик «схлопнулся» в unknown. Реши через ref-as-prop / правильный каст.',
    brokenCode: `// forwardRef плохо дружит с дженериками: T теряется
const Select = forwardRef(
  <T,>(
    props: { options: T[]; onChange: (v: T) => void },
    ref: React.Ref<HTMLSelectElement>,
  ) => {
    return <select ref={ref} />
  },
)
// при использовании T выводится как unknown — onChange(v: unknown)`,
    bugs: [
      {
        title: 'forwardRef стирает дженерик-параметр',
        detail:
          'Тип, который возвращает forwardRef, не дженерик — T фиксируется в момент оборачивания и «схлопывается» в unknown. onChange теряет тип элемента.',
      },
      {
        title: 'Решения: ref как проп (React 19) или каст обёртки',
        detail:
          'В React 19 проще: ref — обычный проп, дженерик сохраняется естественно. В React 18 — либо приведение типа forwardRef-обёртки к дженерик-сигнатуре, либо обёртка-функция.',
      },
    ],
    fixedCode: `// React 19: ref как проп — дженерик сохраняется
function Select<T>({
  options,
  onChange,
  ref,
}: {
  options: T[]
  onChange: (v: T) => void
  ref?: React.Ref<HTMLSelectElement>
}) {
  return (
    <select
      ref={ref}
      onChange={e => onChange(options[e.target.selectedIndex])}
    >
      {options.map((o, i) => <option key={i}>{String(o)}</option>)}
    </select>
  )
}

// <Select options={users} onChange={u => u.name} /> — T = User ✅

// React 18 (если forwardRef обязателен) — каст сохраняет дженерик:
// const Select = forwardRef(SelectInner) as <T>(
//   p: Props<T> & { ref?: React.Ref<HTMLSelectElement> }
// ) => JSX.Element`,
    takeaway:
      'forwardRef стирает дженерик-параметры. В React 19 проблема исчезает: принимай ref как обычный проп, и <Select<T>> сохраняет тип. В React 18 — приводи forwardRef-обёртку к дженерик-сигнатуре через as. Без этого T схлопывается в unknown.',
  },

  // 22 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-context-default',
    title: 'createContext с дефолтом null заставляет проверять null везде',
    level: 'middle',
    categories: ['typescript', 'hooks', 'patterns'],
    brief:
      'Контекст создан с null по умолчанию, поэтому useContext возвращает T | null и каждый потребитель пишет проверку. Спрячь её в хук-обёртку.',
    brokenCode: `const AuthContext = createContext<AuthValue | null>(null)

function Profile() {
  const auth = useContext(AuthContext)
  // приходится проверять null в КАЖДОМ потребителе
  if (!auth) throw new Error('no provider')
  return <span>{auth.user.name}</span>
}`,
    bugs: [
      {
        title: 'Тип T | null протекает во всех потребителей',
        detail:
          'Дефолт null нужен, чтобы поймать использование вне провайдера, но из-за него useContext возвращает AuthValue | null. Каждый компонент вынужден повторять проверку — шум и копипаст.',
      },
      {
        title: 'Инкапсулируй проверку в кастомный хук',
        detail:
          'Сделай useAuth(), который один раз проверяет null и бросает понятную ошибку, а наружу отдаёт уже не-null AuthValue. Потребители получают чистый тип.',
      },
    ],
    fixedCode: `const AuthContext = createContext<AuthValue | null>(null)

// единая точка проверки + сужение типа
function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth должен использоваться внутри <AuthProvider>')
  }
  return ctx // тип сужен до AuthValue
}

function Profile() {
  const auth = useAuth() // AuthValue, без null
  return <span>{auth.user.name}</span>
}`,
    takeaway:
      'Не разноси проверку null по всем потребителям контекста. Оставь дефолт null (для отлова отсутствия провайдера), но заверни useContext в кастомный хук, который проверяет null один раз и возвращает уже сужённый не-null тип.',
  },

  // 23 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-template-literal',
    title: 'Слабая типизация строковых ключей вместо template literal types',
    level: 'senior',
    categories: ['typescript'],
    brief:
      'Функция принимает CSS-переменную как string, поэтому опечатка в префиксе не ловится. Опиши формат через template literal type.',
    brokenCode: `// принимает любую строку — '--color', 'color', 'colr' одинаково ок
function setCssVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value)
}

setCssVar('color-primary', '#fff') // забыли '--' — баг молча`,
    bugs: [
      {
        title: 'string не описывает требуемый формат',
        detail:
          'CSS-переменная обязана начинаться с "--". Тип string этого не выражает: setCssVar("color-primary", ...) без префикса скомпилируется и тихо не сработает.',
      },
      {
        title: 'Template literal types задают шаблон строки',
        detail:
          'Тип `--${string}` требует префикс "--". Можно пойти дальше и описать допустимые имена через union токенов.',
      },
    ],
    fixedCode: `type CssVar = \`--\${string}\`

function setCssVar(name: CssVar, value: string) {
  document.documentElement.style.setProperty(name, value)
}

setCssVar('--color-primary', '#fff') // ✅
setCssVar('color-primary', '#fff')   // ошибка ✅

// можно ограничить набор через template literal + union:
type Token = 'primary' | 'secondary'
type ColorVar = \`--color-\${Token}\` // '--color-primary' | '--color-secondary'`,
    takeaway:
      'Template literal types описывают форму строки на уровне типа: `--${string}`, `/${string}`, `${Method} ${Path}`. Используй их для CSS-переменных, путей, ключей событий, чтобы опечатки в формате ловились компилятором, а не в рантайме.',
  },

  // 24 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-satisfies',
    title: 'Аннотация типа стирает точные ключи — нужен satisfies',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Объект конфигурации аннотирован типом, из-за чего теряется знание о конкретных ключах. satisfies проверяет соответствие, но сохраняет точный тип.',
    brokenCode: `type RouteConfig = Record<string, { title: string }>

// аннотация : RouteConfig стирает конкретные ключи
const routes: RouteConfig = {
  home: { title: 'Главная' },
  about: { title: 'О нас' },
}

// routes.hme — НЕ ошибка (тип Record<string, ...> допускает любой ключ)
// нельзя вывести union ключей: keyof typeof routes === string`,
    bugs: [
      {
        title: 'Аннотация расширяет тип до Record<string, ...>',
        detail:
          'const routes: RouteConfig говорит «это словарь со строковыми ключами». Конкретные ключи (home, about) теряются: routes.hme не ошибка, а keyof typeof routes === string. Нельзя вывести union роутов.',
      },
      {
        title: 'satisfies проверяет, но не расширяет',
        detail:
          'Оператор satisfies проверяет, что объект соответствует типу, НО сохраняет узкий выведенный тип. Получаешь и валидацию структуры, и точные ключи/значения.',
      },
    ],
    fixedCode: `type RouteConfig = Record<string, { title: string }>

// satisfies: проверка соответствия + сохранение точного типа
const routes = {
  home: { title: 'Главная' },
  about: { title: 'О нас' },
} satisfies RouteConfig

routes.home.title  // string ✅
routes.hme         // ошибка: нет такого ключа ✅
type Route = keyof typeof routes // 'home' | 'about' ✅

// бонус: если у элемента забыть title — тоже ошибка благодаря satisfies`,
    takeaway:
      'satisfies проверяет, что значение соответствует типу, но НЕ расширяет его — в отличие от аннотации :. Используй satisfies для конфигов/словарей, когда нужно одновременно валидировать структуру и сохранить точные ключи/литералы (для keyof, автокомплита, union-выводов).',
  },

  // 25 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-no-implicit-any-map',
    title: 'Параметры колбэков выводятся как any из нетипизированных данных',
    level: 'middle',
    categories: ['typescript'],
    brief:
      'Данные приходят как any[] (из JSON.parse), поэтому item в .map — any, и весь рендер теряет типы. Типизируй источник.',
    brokenCode: `function Report() {
  // JSON.parse возвращает any → rows: any
  const rows = JSON.parse(localStorage.getItem('rows') || '[]')

  return (
    <table>
      {rows.map((row) => ( // row: any
        <tr key={row.id}>
          <td>{row.amont}</td> {/* опечатка amont не ловится */}
        </tr>
      ))}
    </table>
  )
}`,
    bugs: [
      {
        title: 'JSON.parse возвращает any — тип расползается',
        detail:
          'rows получает тип any, поэтому row в .map тоже any: опечатка row.amont вместо amount не ловится, автокомплита нет. any от одного источника заражает весь компонент.',
      },
      {
        title: 'Типизируй на границе парсинга',
        detail:
          'Сразу после JSON.parse приведи/валидируй к конкретному типу (Row[]). Лучше — провалидируй (zod), т.к. as не гарантирует форму данных из localStorage.',
      },
    ],
    fixedCode: `interface Row {
  id: string
  amount: number
}

function Report() {
  // типизируем источник сразу (в идеале — валидируем)
  const raw = localStorage.getItem('rows')
  const rows: Row[] = raw ? (JSON.parse(raw) as Row[]) : []

  return (
    <table>
      <tbody>
        {rows.map(row => ( // row: Row
          <tr key={row.id}>
            <td>{row.amount}</td> {/* row.amont — ошибка ✅ */}
          </tr>
        ))}
      </tbody>
    </table>
  )
}`,
    takeaway:
      'any, попавший из нетипизированного источника (JSON.parse, fetch.json, сторонние либы), заражает весь поток данных — параметры колбэков становятся any. Типизируй/валидируй прямо на границе входа (Row[], zod-схема), чтобы дальше код был строго типизирован.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Продвинутый TypeScript в React (#26–45)
  // ═══════════════════════════════════════════════════════════════════════

  // 26 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-mapped-form-errors',
    title: 'Тип ошибок формы повторяет поля вручную',
    level: 'senior',
    categories: ['typescript', 'state'],
    brief:
      'Объект ошибок валидации руками дублирует все поля формы. При добавлении поля забывают про ошибку. Выведи через mapped type.',
    brokenCode: `interface LoginForm {
  email: string
  password: string
  remember: boolean
}

// дублируем поля руками — рассинхрон при изменении формы
interface FormErrors {
  email?: string
  password?: string
  remember?: string
}

const [errors, setErrors] = useState<FormErrors>({})`,
    bugs: [
      {
        title: 'FormErrors повторяет ключи LoginForm',
        detail:
          'Каждое поле перечислено дважды — в форме и в ошибках. Добавил поле в форму, забыл в FormErrors — валидация для него молча не типизируется. Производный тип должен выводиться из источника.',
      },
      {
        title: 'Mapped type генерирует структуру',
        detail:
          'Partial<Record<keyof LoginForm, string>> создаёт «все ключи формы → опциональная строка ошибки» автоматически. Меняешь форму — тип ошибок обновляется сам.',
      },
    ],
    fixedCode: `interface LoginForm {
  email: string
  password: string
  remember: boolean
}

// все ключи формы → опциональное сообщение об ошибке
type FormErrors = Partial<Record<keyof LoginForm, string>>

// или явный mapped type, если нужна кастомная трансформация:
type FormErrors2 = {
  [K in keyof LoginForm]?: string
}

const [errors, setErrors] = useState<FormErrors>({})
// errors.email, errors.password, errors.remember — типизированы ✅`,
    takeaway:
      'Типы, повторяющие ключи модели (ошибки, touched-флаги, dirty-состояние), выводи через mapped types: { [K in keyof T]?: ... } или Partial<Record<keyof T, V>>. Источник правды один — добавление поля автоматически отражается во всех производных.',
  },

  // 27 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-touched-mapped',
    title: 'Mapped type с трансформацией значений (touched/loading флаги)',
    level: 'senior',
    categories: ['typescript', 'state'],
    brief:
      'Нужен объект «по полю → грузится ли оно». Руками это копипаст. Построй mapped type, превращающий значения в boolean.',
    brokenCode: `interface Settings {
  theme: string
  fontSize: number
  notifications: boolean
}

// руками: для каждого поля — флаг "сохраняется ли оно сейчас"
interface SavingState {
  theme: boolean
  fontSize: boolean
  notifications: boolean
}`,
    bugs: [
      {
        title: 'Ручная трансформация типа значений',
        detail:
          'SavingState — это «те же ключи, но значения boolean». Писать руками — копипаст, который устаревает. Mapped type с заменой значения делает это формально.',
      },
      {
        title: 'Переиспользуемый generic-маппер',
        detail:
          'Можно вынести в утилиту Flags<T> = { [K in keyof T]: boolean } и применять к любой модели — для loading/touched/dirty состояний.',
      },
    ],
    fixedCode: `// переиспользуемый маппер: ключи T, значения boolean
type Flags<T> = {
  [K in keyof T]: boolean
}

interface Settings {
  theme: string
  fontSize: number
  notifications: boolean
}

type SavingState = Flags<Settings>
// { theme: boolean; fontSize: boolean; notifications: boolean }

const [saving, setSaving] = useState<Flags<Settings>>({
  theme: false,
  fontSize: false,
  notifications: false,
})`,
    takeaway:
      'Mapped type может не только копировать, но и трансформировать значения: { [K in keyof T]: boolean }. Выноси такие преобразования в переиспользуемые generic-утилиты (Flags<T>, Nullable<T>) и применяй к любым моделям для loading/touched/dirty-состояний.',
  },

  // 28 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-awaited-return',
    title: 'Тип данных дублируется вместо вывода из функции через Awaited/ReturnType',
    level: 'senior',
    categories: ['typescript', 'async'],
    brief:
      'Тип ответа API объявлен отдельно и расходится с тем, что реально возвращает fetcher. Выведи тип прямо из функции.',
    brokenCode: `async function fetchProducts() {
  const res = await fetch('/api/products')
  return res.json() as Promise<{ id: string; price: number }[]>
}

// руками копируем форму ответа — рассинхрон при изменении fetcher
interface Product {
  id: string
  price: number
}
const [products, setProducts] = useState<Product[]>([])`,
    bugs: [
      {
        title: 'Тип ответа объявлен дважды',
        detail:
          'Форма данных описана и в fetchProducts, и в interface Product. Поменяешь fetcher (добавишь поле) — Product устареет. Тип состояния лучше выводить из самой функции-загрузчика.',
      },
      {
        title: 'ReturnType + Awaited разворачивают Promise',
        detail:
          'Awaited<ReturnType<typeof fetchProducts>> берёт тип, который функция реально резолвит. Один источник правды — сигнатура fetcher.',
      },
    ],
    fixedCode: `async function fetchProducts() {
  const res = await fetch('/api/products')
  return res.json() as Promise<{ id: string; price: number }[]>
}

// выводим тип из того, что функция РЕАЛЬНО возвращает
type Products = Awaited<ReturnType<typeof fetchProducts>>
// { id: string; price: number }[]

type Product = Products[number] // элемент массива

const [products, setProducts] = useState<Products>([])`,
    takeaway:
      'Тип данных выводи из функции-источника: ReturnType<typeof fn> даёт тип возврата, Awaited<...> разворачивает Promise, [number] достаёт элемент массива. Так тип состояния всегда совпадает с тем, что реально приходит из загрузчика, без дублирования.',
  },

  // 29 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-infer-props',
    title: 'Тип пропсов чужого компонента копируется вручную',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Обёртка над сторонним компонентом дублирует его пропсы. При обновлении библиотеки они расходятся. Извлеки тип через ComponentProps.',
    brokenCode: `import { DatePicker } from 'some-ui-lib'

// руками копируем пропсы DatePicker — устареют при обновлении либы
interface WrapperProps {
  value: Date
  onChange: (d: Date) => void
  disabled?: boolean
  // ... остальные 20 пропсов не покрыты
}

function MyDatePicker(props: WrapperProps) {
  return <DatePicker {...props} />
}`,
    bugs: [
      {
        title: 'Ручная копия чужих пропсов',
        detail:
          'WrapperProps дублирует интерфейс DatePicker. При обновлении библиотеки (новые/изменённые пропсы) обёртка отстанет, а часть пропсов вообще не покрыта. Нужно извлечь тип из самого компонента.',
      },
      {
        title: 'React.ComponentProps<typeof Component>',
        detail:
          'ComponentProps<typeof DatePicker> достаёт точный тип пропсов компонента, даже если библиотека их не экспортирует. Можно добавить/убрать поля через intersection/Omit.',
      },
    ],
    fixedCode: `import { DatePicker } from 'some-ui-lib'

// извлекаем пропсы прямо из компонента (даже если тип не экспортирован)
type DatePickerProps = React.ComponentProps<typeof DatePicker>

// добавляем своё поле, остальное наследуем:
type WrapperProps = DatePickerProps & { label?: string }

function MyDatePicker({ label, ...props }: WrapperProps) {
  return (
    <label>
      {label}
      <DatePicker {...props} />
    </label>
  )
}`,
    takeaway:
      'Пропсы чужого/своего компонента извлекай через React.ComponentProps<typeof Component> — работает даже когда тип не экспортирован. Комбинируй с & и Omit, чтобы расширить или сузить набор. Никогда не переписывай чужие пропсы вручную.',
  },

  // 30 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-branded-id',
    title: 'Разные id перепутаны местами — типы их не различают',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'UserId и OrderId — оба string, поэтому их легко перепутать в аргументах. Введи branded types, чтобы компилятор их различал.',
    brokenCode: `function getOrder(userId: string, orderId: string) { /* ... */ }

const userId = 'u_1'
const orderId = 'o_99'

// аргументы перепутаны местами — оба string, ошибки нет
getOrder(orderId, userId) // компилируется, но логика сломана`,
    bugs: [
      {
        title: 'Структурная типизация не различает строки по смыслу',
        detail:
          'UserId и OrderId структурно одинаковы (string), поэтому TS позволяет передать один вместо другого. Перепутанные аргументы — частый и тихий баг.',
      },
      {
        title: 'Branded (nominal) types',
        detail:
          'Добавив фантомное поле через пересечение (string & { __brand: "UserId" }), делаем типы номинально различимыми. Прямое присваивание сырой строки запрещается — нужна явная фабрика.',
      },
    ],
    fixedCode: `// branded types: номинальное различие поверх string
type UserId = string & { readonly __brand: 'UserId' }
type OrderId = string & { readonly __brand: 'OrderId' }

// фабрики-конструкторы (единственный способ создать бренд)
const UserId = (id: string) => id as UserId
const OrderId = (id: string) => id as OrderId

function getOrder(userId: UserId, orderId: OrderId) { /* ... */ }

const userId = UserId('u_1')
const orderId = OrderId('o_99')

getOrder(orderId, userId) // ошибка: OrderId не присваивается UserId ✅
getOrder(userId, orderId) // ✅`,
    takeaway:
      'Когда несколько значений структурно одинаковы (разные id-строки, валюты, единицы), но семантически различны, используй branded types: T & { __brand: "X" }. Это даёт номинальную типизацию поверх структурной TS и ловит перепутанные аргументы на компиляции.',
  },

  // 31 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-reducer-typing',
    title: 'dispatch принимает что угодно — экшены не типизированы',
    level: 'senior',
    categories: ['typescript', 'state', 'hooks'],
    brief:
      'useReducer типизирован через any, поэтому dispatch глотает любые экшены, а в reducer action.payload — any. Типизируй через discriminated union.',
    brokenCode: `function reducer(state: any, action: any) {
  switch (action.type) {
    case 'add': return { ...state, items: [...state.items, action.item] }
    case 'remove': return { ...state, items: [] }
    default: return state
  }
}

const [state, dispatch] = useReducer(reducer, { items: [] })
dispatch({ type: 'adddd' }) // опечатка не ловится
dispatch({ type: 'add' })   // забыли item — не ловится`,
    bugs: [
      {
        title: 'state и action типизированы как any',
        detail:
          'reducer(state: any, action: any) отключает все проверки: опечатка в type, отсутствие нужного payload, неверная форма state — ничего не ловится. dispatch принимает любой объект.',
      },
      {
        title: 'Discriminated union для Action',
        detail:
          'Опиши State и Action (union по type с конкретным payload). Тогда dispatch требует валидный экшен, а внутри case TS сужает action и знает доступные поля.',
      },
    ],
    fixedCode: `interface State {
  items: string[]
}

type Action =
  | { type: 'add'; item: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add': return { ...state, items: [...state.items, action.item] }
    case 'remove':
      return { ...state, items: state.items.filter(i => i !== action.id) }
    case 'clear': return { ...state, items: [] }
  }
}

const [state, dispatch] = useReducer(reducer, { items: [] })
dispatch({ type: 'add', item: 'x' }) // ✅
dispatch({ type: 'add' })            // ошибка: нет item ✅
dispatch({ type: 'adddd' })          // ошибка: нет такого type ✅`,
    takeaway:
      'Типизируй useReducer строго: интерфейс State и Action как discriminated union по type с конкретным payload. Тогда dispatch требует валидный экшен, а в reducer внутри каждого case action сужается до своего варианта — с типизированными полями.',
  },

  // 32 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-polymorphic-as',
    title: 'Полиморфный компонент через as теряет пропсы целевого тега',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Компонент <Box as="a"> должен принимать пропсы того тега, который указан в as. Сейчас он их не знает. Типизируй полиморфно.',
    brokenCode: `// as есть, но пропсы целевого элемента не подтягиваются
function Box({ as, children, ...rest }: {
  as?: string
  children: React.ReactNode
}) {
  const Component = as || 'div'
  return <Component {...rest}>{children}</Component>
}

// <Box as="a" href="/x" /> — href не типизирован, может быть опечаткой`,
    bugs: [
      {
        title: 'as: string не связан с пропсами элемента',
        detail:
          'Когда as="a", компонент должен принимать href, target и т.д. Но тип as — просто string, а rest нетипизирован. href не проверяется, а для as="div" href должен быть запрещён.',
      },
      {
        title: 'Полиморфный generic-паттерн',
        detail:
          'Параметризуй компонент <T extends ElementType> и подмешай ComponentPropsWithoutRef<T>. Тогда набор пропсов зависит от значения as.',
      },
    ],
    fixedCode: `type BoxProps<T extends React.ElementType> = {
  as?: T
  children: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children'>

function Box<T extends React.ElementType = 'div'>({
  as,
  children,
  ...rest
}: BoxProps<T>) {
  const Component = as || 'div'
  return <Component {...rest}>{children}</Component>
}

// <Box as="a" href="/x" /> — href типизирован ✅
// <Box as="div" href="/x" /> — ошибка: у div нет href ✅`,
    takeaway:
      'Полиморфные компоненты (as-проп) типизируй через generic <T extends ElementType> + ComponentPropsWithoutRef<T>. Набор валидных пропсов тогда зависит от значения as: <Box as="a"> требует/разрешает href, <Box as="div"> — нет. Это паттерн дизайн-систем (Chakra, MUI).',
  },

  // 33 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-hoc-typing',
    title: 'HOC теряет типы оборачиваемого компонента',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'HOC withLoading возвращает компонент с пропсами any — пропсы исходного компонента теряются. Типизируй generic-ом.',
    brokenCode: `function withLoading(Component: any) {
  return function WithLoading(props: any) {
    if (props.loading) return <Spinner />
    return <Component {...props} />
  }
}

const UserCardWithLoading = withLoading(UserCard)
// пропсы UserCard потеряны: <UserCardWithLoading wrongProp={1} /> — ок`,
    bugs: [
      {
        title: 'Component: any и props: any стирают типы',
        detail:
          'HOC не сохраняет типы исходного компонента: обёрнутый компонент принимает любые пропсы, проверки нет. Нужно вывести P из переданного компонента.',
      },
      {
        title: 'Generic <P> + ComponentType<P>',
        detail:
          'Параметризуй HOC типом пропсов P. Принимай ComponentType<P>, возвращай компонент с пропсами P плюс добавленный loading.',
      },
    ],
    fixedCode: `function withLoading<P extends object>(
  Component: React.ComponentType<P>,
) {
  // обёрнутый компонент = исходные пропсы P + loading
  return function WithLoading(props: P & { loading?: boolean }) {
    const { loading, ...rest } = props
    if (loading) return <Spinner />
    return <Component {...(rest as P)} />
  }
}

const UserCardWithLoading = withLoading(UserCard)
// <UserCardWithLoading loading userId="1" /> — userId проверяется ✅
// <UserCardWithLoading wrongProp={1} /> — ошибка ✅`,
    takeaway:
      'HOC типизируй generic-ом по пропсам оборачиваемого компонента: <P>(C: ComponentType<P>) => ComponentType<P & ExtraProps>. Так обёрнутый компонент сохраняет типы исходного и добавляет свои. any в HOC рвёт всю типобезопасность ниже по дереву.',
  },

  // 34 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-render-prop',
    title: 'Render-prop типизирован как (data: any) => ReactNode',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Компонент с render-prop (или children-as-function) не передаёт тип данных в колбэк. Свяжи их через generic.',
    brokenCode: `function DataFetcher({ url, children }: {
  url: string
  children: (data: any) => React.ReactNode // data: any
}) {
  const [data, setData] = useState<any>(null)
  useEffect(() => { fetch(url).then(r => r.json()).then(setData) }, [url])
  return <>{children(data)}</>
}

// <DataFetcher url="/u">{u => <span>{u.naem}</span>}</DataFetcher>
// u: any, опечатка naem не ловится`,
    bugs: [
      {
        title: 'render-prop получает any',
        detail:
          'children: (data: any) => ReactNode означает, что внутри функции-рендера data не типизирован — опечатки и неверный доступ не ловятся.',
      },
      {
        title: 'Generic связывает данные и render-prop',
        detail:
          'Параметризуй компонент <T>: state хранит T | null, а children — (data: T) => ReactNode. T задаётся при использовании (явно или через проп).',
      },
    ],
    fixedCode: `function DataFetcher<T>({ url, children }: {
  url: string
  children: (data: T | null) => React.ReactNode
}) {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch(url).then(r => r.json()).then(d => !cancelled && setData(d))
    return () => { cancelled = true }
  }, [url])
  return <>{children(data)}</>
}

// T задаём явно:
// <DataFetcher<User> url="/u">
//   {u => <span>{u?.name}</span>}  // u: User | null ✅
// </DataFetcher>`,
    takeaway:
      'Компоненты с render-prop / children-as-function делай дженериками <T>, чтобы тип данных доходил до колбэка: children: (data: T) => ReactNode. T указывается явно (<DataFetcher<User>>) или выводится из других пропсов. any в render-prop убивает типобезопасность потребителя.',
  },

  // 35 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-conditional-required',
    title: 'Conditional types: один проп делает другой обязательным',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'У <Image> проп alt должен быть обязателен, кроме случая decorative. Сейчас alt либо всегда опционален, либо всегда обязателен. Свяжи через union.',
    brokenCode: `interface ImageProps {
  src: string
  decorative?: boolean
  alt?: string // всегда опционален — можно забыть alt у смыслового изображения
}

function Image({ src, alt, decorative }: ImageProps) {
  return <img src={src} alt={decorative ? '' : alt} />
}

// <Image src="/x" /> — нет alt, но это смысловое изображение (a11y-баг)`,
    bugs: [
      {
        title: 'alt всегда опционален',
        detail:
          'Для доступности смысловое изображение обязано иметь alt, а декоративное — пустой alt. Единый опциональный alt позволяет забыть его там, где он нужен.',
      },
      {
        title: 'Discriminated union связывает пропсы',
        detail:
          'Раздели на вариант decorative: true (alt запрещён/пустой) и вариант с обязательным alt. TS заставит указать alt для не-декоративных изображений.',
      },
    ],
    fixedCode: `type ImageProps =
  | { src: string; decorative: true; alt?: never }
  | { src: string; decorative?: false; alt: string }

function Image(props: ImageProps) {
  return (
    <img
      src={props.src}
      alt={props.decorative ? '' : props.alt}
    />
  )
}

// <Image src="/x" /> — ошибка: нужен alt ✅
// <Image src="/x" alt="Кот" /> — ✅
// <Image src="/x" decorative /> — ✅ (alt не требуется)`,
    takeaway:
      'Когда обязательность одного пропа зависит от другого (alt vs decorative, value vs defaultValue), моделируй это discriminated union пропсов с alt?: never в одной ветке. Компилятор обеспечит корректные комбинации — особенно ценно для a11y-инвариантов.',
  },

  // 36 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-strict-event-map',
    title: 'Типобезопасный эмиттер событий вместо строковых имён',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Кастомная шина событий принимает имя как string и payload как any. Опечатка в имени и неверный payload не ловятся. Типизируй через map событий.',
    brokenCode: `class EventBus {
  on(event: string, cb: (payload: any) => void) { /* ... */ }
  emit(event: string, payload: any) { /* ... */ }
}

const bus = new EventBus()
bus.on('user:login', (u) => console.log(u.id))     // u: any
bus.emit('user:logn', { id: 1 })                   // опечатка не ловится
bus.emit('user:login', 'неверный payload')         // тип не проверен`,
    bugs: [
      {
        title: 'event: string + payload: any',
        detail:
          'Имена событий — произвольные строки, payload — any. Опечатка в имени ("logn"), неверная форма payload, неправильный обработчик — ничего не ловится. Типичный источник багов в pub/sub.',
      },
      {
        title: 'Map событий + generic-методы',
        detail:
          'Опиши интерфейс EventMap (имя → тип payload). Сделай on/emit дженериками по K extends keyof EventMap, чтобы payload выводился из имени события.',
      },
    ],
    fixedCode: `// карта: имя события → тип payload
interface EventMap {
  'user:login': { id: number; name: string }
  'user:logout': { id: number }
  'cart:add': { productId: string; qty: number }
}

class EventBus {
  on<K extends keyof EventMap>(
    event: K,
    cb: (payload: EventMap[K]) => void,
  ) { /* ... */ }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) { /* ... */ }
}

const bus = new EventBus()
bus.on('user:login', u => console.log(u.id, u.name)) // payload типизирован ✅
bus.emit('user:logn', { id: 1 })   // ошибка: нет такого события ✅
bus.emit('user:login', { id: 1 })  // ошибка: нет name ✅`,
    takeaway:
      'Типобезопасный pub/sub строится на map событий (EventMap) + generic-методах <K extends keyof EventMap>: имя события ограничено ключами, а payload выводится как EventMap[K]. Так опечатки в именах и неверные payload ловятся компилятором. Тот же приём — для WebSocket-сообщений и postMessage.',
  },

  // 37 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-deep-partial',
    title: 'Partial не делает вложенные объекты опциональными',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Функция обновления настроек принимает Partial<Settings>, но вложенные объекты всё ещё требуют все поля. Нужен рекурсивный DeepPartial.',
    brokenCode: `interface Settings {
  theme: { mode: 'light' | 'dark'; accent: string }
  layout: { sidebar: boolean; density: number }
}

// Partial делает опциональным только ВЕРХНИЙ уровень
function updateSettings(patch: Partial<Settings>) { /* ... */ }

// хотим поменять только theme.mode — но обязаны указать и accent
updateSettings({ theme: { mode: 'dark' } }) // ошибка: нет accent`,
    bugs: [
      {
        title: 'Partial поверхностный',
        detail:
          'Partial<Settings> делает опциональными только theme и layout целиком. Внутри theme поля mode и accent остаются обязательными — нельзя обновить одно вложенное поле.',
      },
      {
        title: 'Нужен рекурсивный mapped type',
        detail:
          'DeepPartial<T> рекурсивно проходит по объектам, делая опциональными поля на всех уровнях. Реализуется через mapped type с условием на объект.',
      },
    ],
    fixedCode: `// рекурсивно опциональные поля на всех уровнях
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T

interface Settings {
  theme: { mode: 'light' | 'dark'; accent: string }
  layout: { sidebar: boolean; density: number }
}

function updateSettings(patch: DeepPartial<Settings>) { /* ... */ }

updateSettings({ theme: { mode: 'dark' } }) // ✅ только нужное поле
updateSettings({ layout: { sidebar: false } }) // ✅`,
    takeaway:
      'Partial делает опциональным только верхний уровень. Для патчей вложенных структур пиши рекурсивный DeepPartial<T> через mapped type с условием T extends object. Это база для merge-настроек, частичных обновлений конфигов и deep-merge утилит.',
  },

  // 38 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-extract-action',
    title: 'Извлечение конкретного варианта union через Extract',
    level: 'senior',
    categories: ['typescript', 'state'],
    brief:
      'Хелпер обрабатывает один конкретный тип экшена, но принимает весь union и кастует внутри. Сузь тип параметра через Extract.',
    brokenCode: `type Action =
  | { type: 'add'; item: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' }

// принимает любой Action, потом кастует — небезопасно
function handleAdd(action: Action) {
  const a = action as { type: 'add'; item: string }
  return a.item.toUpperCase()
}
handleAdd({ type: 'clear' }) // компилируется, упадёт в рантайме`,
    bugs: [
      {
        title: 'Параметр шире, чем нужно + каст',
        detail:
          'handleAdd работает только с add-экшеном, но принимает весь Action и кастует через as. Можно передать clear — каст это не остановит, action.item будет undefined.',
      },
      {
        title: 'Extract выбирает нужный вариант',
        detail:
          'Extract<Action, { type: "add" }> достаёт из union именно add-вариант. Параметр становится точным, каст не нужен, неверный экшен — ошибка компиляции.',
      },
    ],
    fixedCode: `type Action =
  | { type: 'add'; item: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' }

// точный тип параметра — только add-вариант
type AddAction = Extract<Action, { type: 'add' }>

function handleAdd(action: AddAction) {
  return action.item.toUpperCase() // item гарантированно есть ✅
}

handleAdd({ type: 'add', item: 'x' }) // ✅
handleAdd({ type: 'clear' })          // ошибка ✅

// Exclude — обратная операция: убрать вариант
type NonClear = Exclude<Action, { type: 'clear' }>`,
    takeaway:
      'Extract<Union, Shape> вытаскивает из union подходящие варианты, Exclude<Union, Shape> — убирает. Используй их, чтобы сузить параметры функций до конкретных вариантов discriminated union вместо приёма всего union с последующим as.',
  },

  // 39 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-typed-object-keys',
    title: 'Object.keys/entries возвращают string[], а не keyof',
    level: 'middle',
    categories: ['typescript'],
    brief:
      'Перебор объекта через Object.keys даёт string, поэтому индексировать объект этим ключом нельзя без ошибки. Разберись и обойди безопасно.',
    brokenCode: `const scores = { math: 90, physics: 85, chemistry: 78 }

// Object.keys возвращает string[], а не ('math' | 'physics' | ...)
Object.keys(scores).forEach(key => {
  console.log(scores[key]) // ошибка: string нельзя индексировать по scores
})`,
    bugs: [
      {
        title: 'Object.keys типизирован как string[]',
        detail:
          'По дизайну TS Object.keys(obj) возвращает string[], а не union ключей — потому что в рантайме у объекта могут быть лишние ключи. Поэтому scores[key] — ошибка индексации.',
      },
      {
        title: 'Безопасные варианты',
        detail:
          'Либо типизированный хелпер objectKeys с возвратом (keyof T)[], либо Object.entries (даёт [string, V]), либо приведение key as keyof typeof scores — осознанно, понимая риск лишних ключей.',
      },
    ],
    fixedCode: `const scores = { math: 90, physics: 85, chemistry: 78 }

// типизированный helper (используй, понимая, что лишних ключей нет)
function objectKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[]
}

objectKeys(scores).forEach(key => {
  console.log(scores[key]) // key: 'math' | 'physics' | 'chemistry' ✅
})

// или Object.entries, где значение уже типизировано:
Object.entries(scores).forEach(([key, value]) => {
  console.log(key, value) // value: number ✅
})`,
    takeaway:
      'Object.keys/entries намеренно возвращают string-ключи (из-за возможных лишних свойств в рантайме). Для перебора с keyof используй типизированный helper objectKeys (с осознанным as (keyof T)[]) или Object.entries, где значение типизировано. Не разбрасывай as внутри цикла.',
  },

  // 40 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-default-props-generic',
    title: 'Дженерик-компонент с дефолтным значением T теряет вывод',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Generic-таблица с дефолтным типом строки заставляет указывать T вручную, либо T схлопывается. Дай корректный вывод из data.',
    brokenCode: `// T нигде не привязан к аргументам — его невозможно вывести
function Table<T>({ columns }: { columns: string[] }) {
  return <table>{/* ... */}</table>
}

// приходится указывать T вручную и он ни на что не влияет
<Table<User> columns={['name', 'email']} />`,
    bugs: [
      {
        title: 'T не используется в пропсах — не выводится',
        detail:
          'Generic-параметр T должен фигурировать в типах пропсов, иначе TS не может его вывести из аргументов и он остаётся unknown/требует ручного указания, ни на что не влияя.',
      },
      {
        title: 'Привяжи T к data',
        detail:
          'Добавь проп data: T[] и типизируй колонки/рендер через keyof T. Тогда T выводится из переданного массива данных автоматически.',
      },
    ],
    fixedCode: `function Table<T extends object>({
  data,
  columns,
  renderCell,
}: {
  data: T[]
  columns: (keyof T)[]
  renderCell?: (row: T, key: keyof T) => React.ReactNode
}) {
  return (
    <table>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map(col => (
              <td key={String(col)}>
                {renderCell ? renderCell(row, col) : String(row[col])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// T выводится из data, columns ограничены ключами T:
// <Table data={users} columns={['name', 'email']} />
// columns={['nam']} — ошибка ✅`,
    takeaway:
      'Чтобы generic-параметр T выводился, он должен участвовать в типах пропсов (обычно data: T[]). Тогда columns: (keyof T)[] и renderCell: (row: T) => ... типизируются автоматически и не требуют ручного <Table<User>>. Generic, не связанный с аргументами, бесполезен.',
  },

  // 41 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-narrow-after-await',
    title: 'Сужение типа теряется после await/колбэка',
    level: 'senior',
    categories: ['typescript', 'async'],
    brief:
      'После проверки на null и await TS «забывает» сужение, потому что между ними значение могло измениться. Разберись и зафиксируй.',
    brokenCode: `function Comp({ user }: { user: User | null }) {
  async function save() {
    if (!user) return
    await api.prepare()
    // TS снова считает user возможно null:
    // между проверкой и использованием был await
    await api.save(user.id) // у мутируемого источника здесь была бы ошибка
  }
  return <button onClick={save}>Save</button>
}`,
    bugs: [
      {
        title: 'Сужение «протухает» через await',
        detail:
          'Для замыкания над изменяемой переменной (let/проп через re-render) TS сбрасывает сужение после await/колбэка, т.к. значение могло измениться. Поэтому user снова User | null.',
      },
      {
        title: 'Зафиксируй значение в const до await',
        detail:
          'Скопируй сужённое значение в локальную const ДО асинхронной границы. const не переприсваивается, поэтому сужение сохраняется через await.',
      },
    ],
    fixedCode: `function Comp({ user }: { user: User | null }) {
  async function save() {
    if (!user) return
    // фиксируем сужённое значение в const до await
    const current = user
    await api.prepare()
    await api.save(current.id) // current: User сохраняется ✅
  }
  return <button onClick={save}>Save</button>
}`,
    takeaway:
      'TS сбрасывает сужение типа после await/колбэка для изменяемых значений (let, пропсы, замыкания) — оно могло измениться. Скопируй сужённое значение в локальную const до асинхронной границы: const не переприсваивается, поэтому сужение через await сохраняется.',
  },

  // 42 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-prettify-intersection',
    title: 'Пересечения типов показываются как нечитаемая каша',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Тип пропсов собран из множества & — в подсказках IDE он отображается как A & B & C, а не как плоский объект. Сделай его читаемым через утилиту Prettify.',
    brokenCode: `type Base = { id: string }
type Styling = { className?: string; style?: React.CSSProperties }
type Behavior = { onClick?: () => void }

// при наведении IDE показывает "Base & Styling & Behavior" — нечитаемо
type CardProps = Base & Styling & Behavior

function Card(props: CardProps) {
  return <div {...props} />
}`,
    bugs: [
      {
        title: 'Пересечение не «схлопывается» в один объект',
        detail:
          'A & B & C технически корректно, но в подсказках IDE и ошибках отображается как цепочка пересечений, а не плоский { id; className; ... }. Это затрудняет чтение типов и отладку.',
      },
      {
        title: 'Утилита Prettify разворачивает тип',
        detail:
          'Mapped type { [K in keyof T]: T[K] } & {} заставляет TS вычислить и «уплощить» пересечение в один объектный тип — без изменения семантики, только для читаемости.',
      },
    ],
    fixedCode: `// утилита: разворачивает пересечения в плоский объектный тип
type Prettify<T> = { [K in keyof T]: T[K] } & {}

type Base = { id: string }
type Styling = { className?: string; style?: React.CSSProperties }
type Behavior = { onClick?: () => void }

type CardProps = Prettify<Base & Styling & Behavior>
// IDE покажет: { id: string; className?: ...; style?: ...; onClick?: ... }

function Card(props: CardProps) {
  return <div {...props} />
}`,
    takeaway:
      'Длинные пересечения A & B & C отображаются в IDE нечитаемо. Оберни их в утилиту Prettify<T> = { [K in keyof T]: T[K] } & {} — она вычисляет и уплощает тип в один объект (семантика не меняется, только подсказки/ошибки становятся читаемыми).',
  },

  // 43 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-as-const-context',
    title: 'Значение контекста теряет литеральные типы в кортеже',
    level: 'senior',
    categories: ['typescript', 'hooks', 'patterns'],
    brief:
      'Кастомный хук возвращает [value, setValue], но тип выводится как (T | Function)[], а не кортеж. Деструктуризация теряет типы. Зафиксируй кортеж.',
    brokenCode: `function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  const toggle = () => setOn(o => !o)
  // выводится как (boolean | (() => void))[] — массив, не кортеж
  return [on, toggle]
}

const [isOpen, toggleOpen] = useToggle()
// isOpen: boolean | (() => void) — неверно!
// toggleOpen: boolean | (() => void) — неверно!`,
    bugs: [
      {
        title: 'Возврат выводится как union-массив, а не кортеж',
        detail:
          'return [on, toggle] без аннотации даёт тип (boolean | (() => void))[]. При деструктуризации оба элемента получают этот union — теряется конкретный тип каждой позиции.',
      },
      {
        title: 'Зафиксируй кортеж через as const или аннотацию',
        detail:
          'as const делает возврат readonly-кортежем [boolean, () => void]. Альтернатива — явная аннотация типа возврата как кортежа.',
      },
    ],
    fixedCode: `function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  const toggle = useCallback(() => setOn(o => !o), [])
  // as const фиксирует позиционные типы кортежа
  return [on, toggle] as const
}

const [isOpen, toggleOpen] = useToggle()
// isOpen: boolean ✅
// toggleOpen: () => void ✅

// Альтернатива — явная аннотация:
// function useToggle(initial = false): [boolean, () => void] { ... }`,
    takeaway:
      'Хук, возвращающий кортеж [value, setter], типизируй через as const (или явную аннотацию [A, B]) — иначе TS выведет массив с union-элементами, и деструктуризация потеряет позиционные типы. Именно so возвращают кортежи useState-подобные хуки.',
  },

  // 44 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-unknown-vs-any',
    title: 'catch (e) даёт any — ошибка обрабатывается небезопасно',
    level: 'middle',
    categories: ['typescript', 'async'],
    brief:
      'В catch ошибка имеет тип any (или unknown при strict), и к ней обращаются как к Error без проверки. Сделай обработку безопасной.',
    brokenCode: `async function load() {
  try {
    await api.fetch()
  } catch (e) {
    // e: any — обращаемся к .message без проверки
    // но бросить могли что угодно: строку, объект, null
    console.error(e.message.toUpperCase()) // упадёт, если e не Error
  }
}`,
    bugs: [
      {
        title: 'Ошибка в catch — не обязательно Error',
        detail:
          'throw может бросить что угодно: строку, число, объект, null. Обращение e.message.toUpperCase() упадёт, если брошено не-Error. С useUnknownInCatchVariables e будет unknown и потребует сужения.',
      },
      {
        title: 'Сужай через instanceof / проверки',
        detail:
          'Типизируй e как unknown (флаг useUnknownInCatchVariables) и сужай: instanceof Error для стандартных ошибок, иначе приводи к строке. Так обработка не падает на нестандартных throw.',
      },
    ],
    fixedCode: `async function load() {
  try {
    await api.fetch()
  } catch (e: unknown) {
    // сужаем перед использованием
    if (e instanceof Error) {
      console.error(e.message.toUpperCase())
    } else {
      console.error('Неизвестная ошибка:', String(e))
    }
  }
}

// helper для извлечения сообщения из любого throw:
function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}`,
    takeaway:
      'В catch ошибка может быть чем угодно, не только Error. Типизируй её как unknown (флаг useUnknownInCatchVariables в strict) и сужай через instanceof Error перед доступом к .message. Заведи helper getErrorMessage(e: unknown), чтобы безопасно извлекать текст из любого throw.',
  },

  // 45 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-no-empty-object',
    title: 'Тип {} и object не значат «пустой объект»',
    level: 'senior',
    categories: ['typescript'],
    brief:
      'Компонент без пропсов типизирован как {}. Это разрешает почти любое значение, а не «пустой объект». Используй корректный тип.',
    brokenCode: `// {} НЕ означает "пустой объект" — это "любое не-null/undefined значение"
function NoProps(props: {}) {
  return <div />
}

// всё это компилируется, хотя пропсов быть не должно:
<NoProps />
const x: {} = 42      // ок: число — валидное {}
const y: {} = 'str'   // ок
const z: {} = []      // ок`,
    bugs: [
      {
        title: '{} означает «любое не-nullish значение»',
        detail:
          'Тип {} в TS — это «всё, кроме null и undefined»: число, строка, массив — всё ему соответствует. Он НЕ описывает «объект без свойств». Для пропсов это слишком широко.',
      },
      {
        title: 'object тоже не идеален',
        detail:
          'object означает «любое не-примитивное значение» (массивы, функции тоже подходят). Для «компонент без пропсов» правильнее Record<string, never> или просто не указывать пропсы.',
      },
    ],
    fixedCode: `// Вариант 1 — нет пропсов вообще:
function NoProps() {
  return <div />
}

// Вариант 2 — если нужно явно "пустой объект пропсов":
type EmptyProps = Record<string, never>
function NoProps2(_props: EmptyProps) {
  return <div />
}

// Для "любого объекта-словаря" используй Record<string, unknown>,
// а не {} и не object:
function logData(data: Record<string, unknown>) { /* ... */ }`,
    takeaway:
      'Тип {} значит «любое не-null/undefined значение», а object — «любой не-примитив»; ни один не описывает пустой объект. Для компонента без пропсов просто не указывай их; для «объекта-словаря» используй Record<string, unknown>. Линтер (@typescript-eslint/no-empty-object-type) ловит ошибочные {}.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TypeScript в React — практика (#46–60)
  // ═══════════════════════════════════════════════════════════════════════

  // 46 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-query-status-union',
    title: 'Результат useQuery типизирован плоско — data может быть undefined',
    level: 'senior',
    categories: ['typescript', 'async', 'patterns'],
    brief:
      'Хук-обёртка над запросом возвращает { data, isLoading, error } так, что data всегда T, хотя при загрузке его нет. Типизируй через discriminated union по status.',
    brokenCode: `function useQuery<T>(key: string) {
  // data: T — но во время загрузки оно undefined!
  const [data, setData] = useState<T>()
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<Error>()
  // ...
  return { data, isLoading, error }
}

const { data, isLoading } = useQuery<User>('user')
return <span>{data.name}</span> // data может быть undefined — краш`,
    bugs: [
      {
        title: 'Плоский объект разрешает невозможные комбинации',
        detail:
          '{ data?: T; isLoading; error? } позволяет data быть undefined при isLoading=false без ошибки и заставляет везде писать data?.. Тип не отражает, что data есть только в success-состоянии.',
      },
      {
        title: 'Discriminated union по status',
        detail:
          'Раздели результат на варианты loading/error/success. В success data гарантированно T, в loading его нет вовсе. Проверка status сужает тип и убирает лишние ?..',
      },
    ],
    fixedCode: `type QueryResult<T> =
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'error'; data: undefined; error: Error }
  | { status: 'success'; data: T; error: undefined }

function useQuery<T>(key: string): QueryResult<T> {
  // ... реализация выставляет один из вариантов
  return { status: 'loading', data: undefined, error: undefined }
}

const result = useQuery<User>('user')
if (result.status === 'success') {
  return <span>{result.data.name}</span> // data: User, без ? ✅
}`,
    takeaway:
      'Результат асинхронного хука типизируй discriminated union по status (loading/error/success), а не плоским объектом с опциональными полями. Тогда data доступен только в success-ветке — без бесконечных data?. и риска обращения к undefined. Так устроены типы TanStack Query.',
  },

  // 47 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-context-selector',
    title: 'Селектор контекста типизирован как (s: any) => any',
    level: 'senior',
    categories: ['typescript', 'hooks', 'patterns'],
    brief:
      'Хук useStore(selector) для выборки части стора не выводит тип результата. Свяжи тип селектора со стором через generic.',
    brokenCode: `interface Store {
  user: { name: string }
  cart: { items: string[] }
}

function useStore(selector: (s: any) => any) {
  const store = useContext(StoreContext)
  return selector(store)
}

// тип результата — any
const name = useStore(s => s.user.name) // any, опечатка s.usr не ловится`,
    bugs: [
      {
        title: 'selector: (s: any) => any теряет типы',
        detail:
          'Селектор принимает any и возвращает any: ни поля стора не проверяются, ни тип результата не выводится. s.usr.name пройдёт компиляцию.',
      },
      {
        title: 'Generic по типу результата',
        detail:
          'Параметризуй <R>: selector: (s: Store) => R, возврат R. Тип R выводится из тела селектора, а аргумент s типизирован как Store.',
      },
    ],
    fixedCode: `interface Store {
  user: { name: string }
  cart: { items: string[] }
}

function useStore<R>(selector: (s: Store) => R): R {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore вне провайдера')
  return selector(store)
}

const name = useStore(s => s.user.name)  // string ✅
const count = useStore(s => s.cart.items.length) // number ✅
const typo = useStore(s => s.usr.name)   // ошибка ✅`,
    takeaway:
      'Хук-селектор типизируй generic-ом по результату: useStore<R>(selector: (s: Store) => R): R. Аргумент селектора фиксирован типом стора, а R выводится из тела. Это паттерн Zustand/Redux useSelector — типобезопасная выборка части состояния.',
  },

  // 48 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-lazy-import',
    title: 'React.lazy теряет типы пропсов при дефолтном экспорте',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Ленивая загрузка компонента ломает типы пропсов или требует any, если экспорт именованный. Типизируй lazy корректно.',
    brokenCode: `// Chart экспортируется именованно, а не default — lazy ругается
const Chart = lazy(() => import('./Chart')) // ошибка: нет default export

// «решают» через any-обёртку, теряя типы пропсов
const Chart2: any = lazy(() =>
  import('./Chart').then(m => ({ default: m.Chart })),
)`,
    bugs: [
      {
        title: 'lazy ждёт модуль с default export',
        detail:
          'React.lazy требует, чтобы фабрика возвращала { default: Component }. При именованном экспорте нужно вручную смапить именованный экспорт в default — но делать это через any теряет типы пропсов.',
      },
      {
        title: 'Маппинг сохраняет типы',
        detail:
          'Достаточно .then(m => ({ default: m.Chart })) без any — TS выведет тип пропсов из m.Chart, и <Chart> останется типизированным.',
      },
    ],
    fixedCode: `// именованный экспорт → маппим в default, типы сохраняются
const Chart = lazy(() =>
  import('./Chart').then(m => ({ default: m.Chart })),
)

// <Chart data={...} /> — пропсы Chart типизированы ✅

// для default export всё проще:
const Page = lazy(() => import('./Page')) // ✅ типы выводятся сами

// использование с границей загрузки:
// <Suspense fallback={<Spinner />}><Chart data={d} /></Suspense>`,
    takeaway:
      'React.lazy ждёт { default: Component }. Для именованного экспорта маппь через .then(m => ({ default: m.Named })) — БЕЗ any, тогда типы пропсов сохранятся. any-обёртка вокруг lazy убивает проверку пропсов ленивого компонента.',
  },

  // 49 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-imperative-handle',
    title: 'useImperativeHandle без типа — родитель не знает API ref',
    level: 'senior',
    categories: ['typescript', 'patterns', 'hooks'],
    brief:
      'Компонент отдаёт через ref императивный API, но тип хэндла не описан — родитель вызывает методы вслепую. Типизируй handle.',
    brokenCode: `const VideoPlayer = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    play: () => {},
    pause: () => {},
  }))
  return <video />
})

function Parent() {
  const ref = useRef<any>(null) // any — API не типизирован
  ref.current?.plya() // опечатка не ловится
}`,
    bugs: [
      {
        title: 'Тип хэндла не объявлен',
        detail:
          'forwardRef без типов и useRef<any> означают, что родитель не знает, какие методы есть у ref.current. ref.current.plya() (опечатка) не вызовет ошибку.',
      },
      {
        title: 'Объяви интерфейс handle',
        detail:
          'Опиши интерфейс VideoHandle и параметризуй forwardRef<VideoHandle, Props>. Родитель использует useRef<VideoHandle>, получая типизированный API.',
      },
    ],
    fixedCode: `interface VideoHandle {
  play: () => void
  pause: () => void
}

const VideoPlayer = forwardRef<VideoHandle, { src: string }>(
  function VideoPlayer({ src }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
    }), [])
    return <video ref={videoRef} src={src} />
  },
)

function Parent() {
  const ref = useRef<VideoHandle>(null)
  ref.current?.play()  // ✅
  ref.current?.plya()  // ошибка ✅
}`,
    takeaway:
      'Императивный API через useImperativeHandle типизируй явным интерфейсом (VideoHandle) и параметризуй forwardRef<Handle, Props>. Родитель объявляет useRef<Handle>, получая автокомплит и проверку методов. В React 19 — то же, но ref можно принимать как обычный проп.',
  },

  // 50 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-generic-constraint',
    title: 'Generic без ограничения позволяет передать что угодно',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Компонент <List> требует у элементов id для key, но T ничем не ограничен — можно передать элементы без id. Добавь constraint.',
    brokenCode: `function List<T>({ items }: { items: T[] }) {
  return (
    <ul>
      {items.map(item => (
        // item.id — ошибка: T не гарантирует наличие id
        <li key={(item as any).id}>{String(item)}</li>
      ))}
    </ul>
  )
}

// <List items={[1, 2, 3]} /> — числа без id, но через as any проходит`,
    bugs: [
      {
        title: 'T не гарантирует нужные поля',
        detail:
          'List опирается на item.id для key, но T ничем не ограничен. Приходится кастовать (item as any).id, теряя безопасность, и можно передать элементы вообще без id.',
      },
      {
        title: 'Ограничь T через extends',
        detail:
          'T extends { id: string | number } требует, чтобы у элементов был id. Тогда item.id типизирован, каст не нужен, а передача данных без id — ошибка компиляции.',
      },
    ],
    fixedCode: `// constraint: у элементов обязан быть id
function List<T extends { id: string | number }>({
  items,
  renderItem,
}: {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{renderItem(item)}</li> // item.id типизирован ✅
      ))}
    </ul>
  )
}

// <List items={users} renderItem={u => u.name} /> — ✅
// <List items={[1, 2, 3]} ... /> — ошибка: у number нет id ✅`,
    takeaway:
      'Если generic-компонент опирается на определённые поля (id, name), ограничь параметр через <T extends { id: ... }>. Constraint даёт доступ к этим полям без каста и запрещает передавать неподходящие данные. Generic без ограничений + as any — антипаттерн.',
  },

  // 51 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-setstate-callback-type',
    title: 'Тип сеттера состояния в пропсах указан неполно',
    level: 'middle',
    categories: ['typescript', 'state', 'hooks'],
    brief:
      'Компонент пробрасывает setState вниз с типом (v: T) => void, поэтому функциональный апдейт setX(prev => ...) ломается. Используй Dispatch<SetStateAction<T>>.',
    brokenCode: `function Child({ setCount }: { setCount: (v: number) => void }) {
  // функциональный апдейт не типизируется
  return <button onClick={() => setCount(prev => prev + 1)}>+</button>
  // ошибка: (prev => prev + 1) не number
}

function Parent() {
  const [count, setCount] = useState(0)
  return <Child setCount={setCount} />
}`,
    bugs: [
      {
        title: '(v: T) => void не покрывает функциональный апдейт',
        detail:
          'Настоящий setState принимает либо значение T, либо функцию (prev: T) => T. Тип (v: number) => void отбрасывает функциональную форму, и setCount(prev => ...) не компилируется.',
      },
      {
        title: 'Используй встроенный тип',
        detail:
          'React.Dispatch<React.SetStateAction<T>> — точный тип сеттера из useState. Он принимает и значение, и функцию-апдейтер.',
      },
    ],
    fixedCode: `function Child({
  setCount,
}: {
  setCount: React.Dispatch<React.SetStateAction<number>>
}) {
  return (
    <button onClick={() => setCount(prev => prev + 1)}>+</button> // ✅
  )
}

function Parent() {
  const [count, setCount] = useState(0)
  return <Child setCount={setCount} /> // типы совпадают ✅
}`,
    takeaway:
      'Пробрасывая setState в пропсах, типизируй его как React.Dispatch<React.SetStateAction<T>>, а не (v: T) => void — иначе функциональная форма setX(prev => ...) сломается. Это точный тип, который возвращает useState.',
  },

  // 52 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-variant-style-map',
    title: 'Объект стилей по варианту не проверяет полноту вариантов',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Map «вариант → класс» типизирован как Record<string, string>, поэтому при добавлении варианта легко забыть стиль. Свяжи ключи с union вариантов.',
    brokenCode: `type Variant = 'primary' | 'secondary' | 'danger'

// Record<string, ...> не требует покрыть все варианты
const styles: Record<string, string> = {
  primary: 'bg-blue',
  secondary: 'bg-gray',
  // danger забыли — ошибки нет
}

function Button({ variant }: { variant: Variant }) {
  return <button className={styles[variant]} /> // undefined для danger
}`,
    bugs: [
      {
        title: 'Record<string, ...> не проверяет полноту',
        detail:
          'Ключ string допускает любой набор ключей, поэтому пропущенный вариant danger не вызывает ошибку. styles[variant] вернёт undefined в рантайме.',
      },
      {
        title: 'Record<Variant, ...> требует все ключи',
        detail:
          'Типизируй map как Record<Variant, string> — TS заставит указать класс для КАЖДОГО варианта. Добавишь новый вариант — компилятор укажет, где дописать стиль.',
      },
    ],
    fixedCode: `type Variant = 'primary' | 'secondary' | 'danger'

// Record<Variant, ...> требует покрыть ВСЕ варианты
const styles: Record<Variant, string> = {
  primary: 'bg-blue',
  secondary: 'bg-gray',
  danger: 'bg-red', // забыть нельзя — будет ошибка ✅
}

function Button({ variant }: { variant: Variant }) {
  return <button className={styles[variant]} /> // всегда определён ✅
}`,
    takeaway:
      'Map «вариант → значение» типизируй Record<Union, V>, а не Record<string, V>. Тогда компилятор требует покрыть все варианты union — при добавлении нового варианта он сразу укажет недостающие записи. Незаменимо для variant→className/иконка/лейбл.',
  },

  // 53 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-promise-all-tuple',
    title: 'Promise.all теряет типы элементов — результат any[]',
    level: 'senior',
    categories: ['typescript', 'async'],
    brief:
      'Параллельная загрузка через Promise.all с массивом any возвращает any[], и деструктуризация теряет типы. Сохрани кортеж типов.',
    brokenCode: `async function loadAll(userId: string) {
  // массив промисов разных типов → результат any[]
  const promises: Promise<any>[] = [
    fetchUser(userId),
    fetchPosts(userId),
    fetchStats(userId),
  ]
  const [user, posts, stats] = await Promise.all(promises)
  // user, posts, stats — все any
  return { user, posts, stats }
}`,
    bugs: [
      {
        title: 'Promise<any>[] стирает типы',
        detail:
          'Аннотация Promise<any>[] превращает результат Promise.all в any[]. Деструктуризованные user/posts/stats теряют свои типы (User, Post[], Stats).',
      },
      {
        title: 'Передавай кортеж, не массив',
        detail:
          'Promise.all корректно выводит типы из кортежа промисов. Не аннотируй промежуточный массив как Promise<any>[] — передавай промисы напрямую (или as const), и TS сохранит позиционные типы.',
      },
    ],
    fixedCode: `async function loadAll(userId: string) {
  // передаём промисы напрямую — Promise.all выводит кортеж типов
  const [user, posts, stats] = await Promise.all([
    fetchUser(userId),   // Promise<User>
    fetchPosts(userId),  // Promise<Post[]>
    fetchStats(userId),  // Promise<Stats>
  ])
  // user: User, posts: Post[], stats: Stats ✅
  return { user, posts, stats }
}`,
    takeaway:
      'Promise.all сохраняет позиционные типы, если передать кортеж промисов напрямую. Не приводи промежуточный массив к Promise<any>[] — это стирает типы в any[]. Передавай промисы инлайн, и деструктуризация результата будет типобезопасной.',
  },

  // 54 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-nonnullable-filter',
    title: 'filter(Boolean) не убирает null из типа массива',
    level: 'middle',
    categories: ['typescript'],
    brief:
      'После filter(Boolean) массив всё ещё типизирован как (T | null)[], хотя null отфильтрован. Используй type-guard-предикат.',
    brokenCode: `const raw: (User | null)[] = [user1, null, user2]

// filter(Boolean) убирает null в рантайме, но тип остаётся (User | null)[]
const users = raw.filter(Boolean)

users.forEach(u => console.log(u.name)) // ошибка: u может быть null`,
    bugs: [
      {
        title: 'filter(Boolean) не сужает тип',
        detail:
          'Стандартная сигнатура filter не понимает, что Boolean убирает null. Результат остаётся (User | null)[], и доступ к u.name — ошибка, хотя в рантайме null уже нет.',
      },
      {
        title: 'Предикат-гард сужает элемент',
        detail:
          'filter с предикатом (u): u is User убирает null и из типа. Можно вынести в переиспользуемый helper isNotNull.',
      },
    ],
    fixedCode: `const raw: (User | null)[] = [user1, null, user2]

// переиспользуемый type guard
function isNotNull<T>(value: T | null | undefined): value is T {
  return value != null
}

const users = raw.filter(isNotNull) // User[] ✅
users.forEach(u => console.log(u.name)) // u: User ✅

// inline-вариант:
const users2 = raw.filter((u): u is User => u !== null)`,
    takeaway:
      'filter(Boolean) убирает null в рантайме, но НЕ из типа — результат остаётся (T | null)[]. Используй filter с type-guard-предикатом ((x): x is T => x != null) или helper isNotNull, чтобы и тип сузился до T[]. Частая ловушка при чистке массивов.',
  },

  // 55 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-css-properties-vars',
    title: 'CSS-кастомные свойства (--var) не проходят в style без типа',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Передача CSS-переменной в inline style вызывает ошибку типа: React.CSSProperties не знает про --custom. Типизируй корректно.',
    brokenCode: `function Bar({ percent }: { percent: number }) {
  // ошибка: '--progress' не существует в типе CSSProperties
  return <div style={{ '--progress': percent + '%' }} className="bar" />
}`,
    bugs: [
      {
        title: 'CSSProperties не допускает произвольные --vars',
        detail:
          'Тип React.CSSProperties описывает известные CSS-свойства. Кастомное свойство --progress в него не входит, поэтому инлайн-объект стиля не присваивается без помощи.',
      },
      {
        title: 'Расширь тип через пересечение',
        detail:
          'Приведи объект стиля к React.CSSProperties & Record<`--${string}`, string | number> (или каст as) — тогда кастомные свойства допускаются, а известные остаются типизированными.',
      },
    ],
    fixedCode: `// тип, допускающий и стандартные свойства, и CSS-переменные
type CSSWithVars = React.CSSProperties & {
  [key: \`--\${string}\`]: string | number
}

function Bar({ percent }: { percent: number }) {
  const style: CSSWithVars = { '--progress': \`\${percent}%\` }
  return <div style={style} className="bar" />
}

// CSS использует переменную:
// .bar::before { width: var(--progress); }`,
    takeaway:
      'React.CSSProperties не знает про кастомные --переменные. Расширь тип через пересечение с индексной сигнатурой `[key: \`--${string}\`]: string | number`, чтобы передавать CSS-переменные в inline style типобезопасно (вместо as any).',
  },

  // 56 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-discriminated-fetch-hook',
    title: 'Параметры хука зависят друг от друга, но типы это не отражают',
    level: 'senior',
    categories: ['typescript', 'hooks', 'patterns'],
    brief:
      'Хук useResource принимает type и id, но при type="list" id не нужен, а при type="item" — обязателен. Свяжи параметры через перегрузки/union.',
    brokenCode: `function useResource(type: 'list' | 'item', id?: string) {
  // при type='item' id обязателен, но тип этого не требует
  // при type='list' id игнорируется, но его можно передать
  if (type === 'item') return fetchItem(id!) // id! — небезопасно
  return fetchList()
}

useResource('item')          // забыли id — рантайм-ошибка, не компиляции
useResource('list', 'x')     // лишний id — не предупреждает`,
    bugs: [
      {
        title: 'Зависимость параметров не выражена в типе',
        detail:
          'type и id связаны: item требует id, list — нет. Но сигнатура (type, id?) этого не отражает: можно вызвать useResource("item") без id (id! упадёт) или передать лишний id в list.',
      },
      {
        title: 'Перегрузки или union-аргумент',
        detail:
          'Опиши через перегрузки (item → id обязателен, list → без id) или единый union-аргумент. Тогда некорректный вызов — ошибка компиляции.',
      },
    ],
    fixedCode: `// перегрузки выражают зависимость параметров
function useResource(type: 'list'): Promise<Item[]>
function useResource(type: 'item', id: string): Promise<Item>
function useResource(type: 'list' | 'item', id?: string) {
  if (type === 'item') return fetchItem(id!)
  return fetchList()
}

useResource('item', 'x') // ✅
useResource('item')      // ошибка: нужен id ✅
useResource('list')      // ✅
useResource('list', 'x') // ошибка: лишний аргумент ✅

// Альтернатива — union-аргумент:
// type Args = { type: 'list' } | { type: 'item'; id: string }`,
    takeaway:
      'Когда параметры функции/хука зависят друг от друга (id нужен только для определённого type), выражай это перегрузками или union-аргументом, а не опциональным параметром + id!. Компилятор тогда требует корректную комбинацию, исключая рантайм-падения на id!.',
  },

  // 57 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-as-props-narrowing',
    title: 'in-проверка и discriminant для сужения пропсов в рендере',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Компонент принимает union пропсов, но в JSX обращается к полям без сужения — TS ругается. Сузь по дискриминанту правильно.',
    brokenCode: `type Props =
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: number; precision: number }

function Display(props: Props) {
  // обращение к precision без проверки kind — ошибка
  return <span>{props.value.toFixed(props.precision)}</span>
  // toFixed нет у string, precision нет у text-варианта
}`,
    bugs: [
      {
        title: 'Доступ к полю варианта без сужения',
        detail:
          'props.precision и props.value.toFixed существуют только в number-варианте. Без проверки props.kind TS видит union и запрещает доступ — нужно сузить.',
      },
      {
        title: 'Сужай по дискриминанту',
        detail:
          'Проверка props.kind === "number" сужает props до number-варианта, открывая precision и числовой value. Это базовый, но часто забываемый приём при рендере union-пропсов.',
      },
    ],
    fixedCode: `type Props =
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: number; precision: number }

function Display(props: Props) {
  if (props.kind === 'number') {
    // props сужен до number-варианта
    return <span>{props.value.toFixed(props.precision)}</span> // ✅
  }
  // здесь props — text-вариант
  return <span>{props.value}</span> // value: string ✅
}`,
    takeaway:
      'Перед доступом к полям конкретного варианта union-пропсов сужай тип по дискриминанту (if (props.kind === "number")). После проверки TS открывает поля именно этого варианта. Не кастуй и не используй ! — discriminant narrowing безопаснее.',
  },

  // 58 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-generic-default-param',
    title: 'Хук-обёртка над событием теряет тип элемента',
    level: 'senior',
    categories: ['typescript', 'hooks', 'patterns'],
    brief:
      'useEventListener типизирован так, что event и target — any. Свяжи имя события с его типом через WindowEventMap.',
    brokenCode: `function useEventListener(
  event: string,
  handler: (e: any) => void, // e: any
) {
  useEffect(() => {
    window.addEventListener(event, handler)
    return () => window.removeEventListener(event, handler)
  }, [event, handler])
}

useEventListener('click', e => {
  console.log(e.clientX) // e: any — clientX не проверен, опечатки молчат
})`,
    bugs: [
      {
        title: 'event: string + handler: (e: any)',
        detail:
          'Имя события — произвольная строка, обработчик получает any. Тип события (MouseEvent для click, KeyboardEvent для keydown) теряется, clientX/key не проверяются.',
      },
      {
        title: 'Свяжи через WindowEventMap',
        detail:
          'Параметризуй <K extends keyof WindowEventMap>: имя ограничено известными событиями, а handler получает WindowEventMap[K] — точный тип события.',
      },
    ],
    fixedCode: `function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
) {
  useEffect(() => {
    window.addEventListener(event, handler)
    return () => window.removeEventListener(event, handler)
  }, [event, handler])
}

useEventListener('click', e => {
  console.log(e.clientX) // e: MouseEvent ✅
})
useEventListener('keydown', e => {
  console.log(e.key) // e: KeyboardEvent ✅
})
useEventListener('clik', () => {}) // ошибка: нет такого события ✅`,
    takeaway:
      'Хук-обёртку над addEventListener типизируй через <K extends keyof WindowEventMap>: имя события ограничено валидными ключами, а обработчик получает WindowEventMap[K] — точный тип события. Тот же приём с HTMLElementEventMap/DocumentEventMap для элементов и документа.',
  },

  // 59 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-required-pick',
    title: 'Комбинация утилит: сделать часть опциональных полей обязательными',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'У модели часть полей опциональна, но в одном контексте (после сохранения) id и createdAt обязаны быть. Собери тип через комбинацию утилит.',
    brokenCode: `interface Draft {
  id?: string
  title: string
  createdAt?: Date
}

// после сохранения id и createdAt точно есть, но тип всё ещё опционален
function onSaved(draft: Draft) {
  console.log(draft.id.length) // ошибка: id может быть undefined
}`,
    bugs: [
      {
        title: 'Нет типа «сохранённого» драфта',
        detail:
          'Draft с опциональными id/createdAt уместен до сохранения. После сохранения они гарантированно есть, но переиспользуется тот же тип — приходится писать id?. или !.',
      },
      {
        title: 'Скомбинируй Omit + Required<Pick<...>>',
        detail:
          'Собери Saved = Draft без id/createdAt, пересечённый с Required<Pick<Draft, "id" | "createdAt">>. Получишь тип, где именно эти поля обязательны, остальное как было.',
      },
    ],
    fixedCode: `interface Draft {
  id?: string
  title: string
  createdAt?: Date
}

// делаем id и createdAt обязательными, остальное без изменений
type Saved = Omit<Draft, 'id' | 'createdAt'> &
  Required<Pick<Draft, 'id' | 'createdAt'>>

function onSaved(draft: Saved) {
  console.log(draft.id.length)       // id: string ✅
  console.log(draft.createdAt.getTime()) // createdAt: Date ✅
}

// Переиспользуемая утилита:
type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
type Saved2 = RequireKeys<Draft, 'id' | 'createdAt'>`,
    takeaway:
      'Чтобы сделать часть опциональных полей обязательными, комбинируй утилиты: Omit<T, K> & Required<Pick<T, K>>. Вынеси в RequireKeys<T, K>. Это типобезопасно моделирует переходы вроде Draft → Saved без дублирования интерфейса и без id!.',
  },

  // 60 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-callback-ref-type',
    title: 'Callback ref типизирован неверно — не принимает null',
    level: 'middle',
    categories: ['typescript', 'hooks', 'patterns'],
    brief:
      'Callback-ref для измерения элемента типизирован как (el: HTMLDivElement) => void, без null. React передаёт null при откреплении — тип неверен. Поправь.',
    brokenCode: `function Measured() {
  // тип не допускает null, который React передаёт при unmount
  const measureRef = (el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect() // el может быть null → краш
    console.log(rect.width)
  }
  return <div ref={measureRef} />
}`,
    bugs: [
      {
        title: 'Callback ref получает T | null',
        detail:
          'React вызывает callback-ref с элементом при монтировании и с null при размонтировании. Тип (el: HTMLDivElement) => void не учитывает null, и el.getBoundingClientRect() упадёт при откреплении.',
      },
      {
        title: 'Тип должен включать null + проверка',
        detail:
          'Типизируй параметр как HTMLDivElement | null и проверяй на null перед использованием. (React.RefCallback<T> — готовый тип такого колбэка.)',
      },
    ],
    fixedCode: `function Measured() {
  // корректный тип callback ref: получает элемент или null
  const measureRef: React.RefCallback<HTMLDivElement> = el => {
    if (!el) return // null при размонтировании
    const rect = el.getBoundingClientRect()
    console.log(rect.width)
  }
  return <div ref={measureRef} />
}`,
    takeaway:
      'Callback ref вызывается с элементом при монтировании и с null при размонтировании, поэтому его параметр — T | null. Используй готовый тип React.RefCallback<T> и проверяй на null перед обращением к элементу. (В React 19 из callback-ref можно ещё и вернуть cleanup.)',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TypeScript в React — практика (#61–75)
  // ═══════════════════════════════════════════════════════════════════════

  // 61 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-zod-infer',
    title: 'Тип и схема валидации дублируются вместо z.infer',
    level: 'senior',
    categories: ['typescript', 'async'],
    brief:
      'Есть zod-схема и отдельный interface с теми же полями. Они расходятся. Выведи тип прямо из схемы через z.infer.',
    brokenCode: `import { z } from 'zod'

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
})

// дублируем поля руками — рассинхрон со схемой
interface User {
  id: string
  name: string
  age: number
}

function parse(data: unknown): User {
  return UserSchema.parse(data)
}`,
    bugs: [
      {
        title: 'Схема и тип описаны дважды',
        detail:
          'UserSchema и interface User повторяют одни поля. Добавишь поле в схему — забудешь в интерфейсе, и тип разойдётся с реальной валидацией. Источник правды должен быть один.',
      },
      {
        title: 'z.infer выводит тип из схемы',
        detail:
          'z.infer<typeof UserSchema> порождает тип прямо из схемы. Меняешь схему — тип обновляется автоматически. Схема становится единственным источником и для рантайм-валидации, и для типов.',
      },
    ],
    fixedCode: `import { z } from 'zod'

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
})

// тип выводится из схемы — один источник правды
type User = z.infer<typeof UserSchema>
// { id: string; name: string; age: number }

function parse(data: unknown): User {
  return UserSchema.parse(data) // и валидация, и тип из одной схемы
}`,
    takeaway:
      'При использовании zod/valibot/io-ts не дублируй тип отдельным interface — выводи его из схемы через z.infer<typeof Schema>. Схема становится единственным источником: одна правка обновляет и рантайм-валидацию, и статические типы.',
  },

  // 62 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-component-ref',
    title: 'Тип ref на кастомный компонент захардкожен и устаревает',
    level: 'senior',
    categories: ['typescript', 'patterns', 'hooks'],
    brief:
      'Родитель объявляет useRef с типом DOM-элемента, на который указывает кастомный компонент. Если внутренняя реализация поменяется — тип соврёт. Выведи ref-тип из компонента.',
    brokenCode: `// внутри MyInput ref ведёт на <input>, но это деталь реализации
const inputRef = useRef<HTMLInputElement>(null)

// если MyInput переедет на <textarea> или сменит handle — тип устареет,
// а здесь останется HTMLInputElement
return <MyInput ref={inputRef} />`,
    bugs: [
      {
        title: 'Тип ref захардкожен под текущую реализацию',
        detail:
          'useRef<HTMLInputElement> завязан на то, что MyInput сейчас рендерит input. Сменится внутренняя реализация (textarea, кастомный handle) — тип ref у потребителя останется неверным.',
      },
      {
        title: 'React.ComponentRef<typeof Component>',
        detail:
          'ComponentRef<typeof MyInput> (или ElementRef в старых версиях) выводит тип ref-инстанса прямо из компонента. Меняется реализация — тип ref у потребителей подстраивается сам.',
      },
    ],
    fixedCode: `// тип ref выводится из самого компонента
const inputRef = useRef<React.ComponentRef<typeof MyInput>>(null)

return <MyInput ref={inputRef} />

// React.ComponentRef учитывает forwardRef/useImperativeHandle:
// если MyInput отдаёт кастомный handle { focus() }, ComponentRef даст его,
// а не DOM-элемент. (В React <18.2 — React.ElementRef.)`,
    takeaway:
      'Тип ref на кастомный компонент выводи через React.ComponentRef<typeof Component> (ранее ElementRef), а не хардкодь DOM-тип. Он учитывает forwardRef и useImperativeHandle, поэтому остаётся верным при смене внутренней реализации компонента.',
  },

  // 63 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-no-infer',
    title: 'TS выводит generic из неправильного аргумента — нужен NoInfer',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'У компонента Select значение по умолчанию расширяет тип T до union со «случайным» значением. Заблокируй вывод T из defaultValue через NoInfer.',
    brokenCode: `function Select<T extends string>({
  options,
  defaultValue,
}: {
  options: T[]
  defaultValue: T // T выводится И из options, И из defaultValue
}) {
  return <select defaultValue={defaultValue}>{/* ... */}</select>
}

// T расширяется до 'a' | 'b' | 'c', т.к. defaultValue участвует в выводе
<Select options={['a', 'b']} defaultValue={'c'} />
// 'c' не входит в options, но ошибки нет — T стал 'a'|'b'|'c'`,
    bugs: [
      {
        title: 'defaultValue участвует в выводе T',
        detail:
          'T выводится из обоих аргументов. Передав defaultValue="c", не входящий в options, мы расширяем T до "a" | "b" | "c" — и ошибки нет, хотя "c" невалиден. Вывод должен идти только из options.',
      },
      {
        title: 'NoInfer блокирует вывод из аргумента',
        detail:
          'Оберни тип defaultValue в NoInfer<T> (TS 5.4+). Тогда T выводится только из options, а defaultValue лишь проверяется на соответствие — "c" станет ошибкой.',
      },
    ],
    fixedCode: `function Select<T extends string>({
  options,
  defaultValue,
}: {
  options: T[]
  defaultValue: NoInfer<T> // T выводится ТОЛЬКО из options
}) {
  return <select defaultValue={defaultValue}>{/* ... */}</select>
}

<Select options={['a', 'b']} defaultValue={'a'} /> // ✅
<Select options={['a', 'b']} defaultValue={'c'} /> // ошибка ✅
// (до TS 5.4 — самодельный NoInfer через [T][T extends any ? 0 : never])`,
    takeaway:
      'Когда generic не должен выводиться из конкретного аргумента (defaultValue, fallback), оборачивай его тип в NoInfer<T> (TS 5.4+). Вывод пойдёт только из «ведущих» аргументов (options), а остальные будут проверяться против выведенного T, а не расширять его.',
  },

  // 64 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-const-type-param',
    title: 'Аргумент-массив расширяется до string[] — нужен const-параметр',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Хук useTabs(tabs) принимает массив, но имена табов выводятся как string[], а не литералы. Активный таб не типизирован. Используй const type parameter.',
    brokenCode: `function useTabs<T extends string>(tabs: T[]) {
  const [active, setActive] = useState<T>(tabs[0])
  return { active, setActive }
}

// без as const массив выводится как string[], T = string
const { active } = useTabs(['home', 'profile', 'settings'])
// active: string — нельзя сравнить с конкретными именами надёжно`,
    bugs: [
      {
        title: 'Литералы массива расширяются до string',
        detail:
          'Передавая ["home", "profile"], TS выводит T как string (widening), а не "home" | "profile". active теряет точные значения — пропадает автокомплит и проверка имён табов.',
      },
      {
        title: 'const type parameter сохраняет литералы',
        detail:
          'Объяви <const T extends ...> (TS 5.0+). Это как будто потребитель написал as const на аргументе — литералы сохраняются без явного as const на месте вызова.',
      },
    ],
    fixedCode: `// const type parameter: литералы сохраняются автоматически
function useTabs<const T extends string>(tabs: readonly T[]) {
  const [active, setActive] = useState<T>(tabs[0])
  return { active, setActive }
}

const { active, setActive } = useTabs(['home', 'profile', 'settings'])
// active: 'home' | 'profile' | 'settings' ✅
setActive('profile') // ✅
setActive('prof')    // ошибка ✅`,
    takeaway:
      'Чтобы аргумент-массив/объект сохранял литеральные типы без as const на месте вызова, используй const type parameter: <const T extends ...> (TS 5.0+). Удобно для хуков по списку (табы, шаги, роуты), где нужны точные значения, а не расширенный string[].',
  },

  // 65 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-i18n-keys',
    title: 't("ключ") принимает любую строку — опечатки в ключах не ловятся',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Функция перевода t(key: string) допускает любой ключ. Опечатка возвращает пустую строку в рантайме. Свяжи ключи с объектом переводов.',
    brokenCode: `const translations = {
  'home.title': 'Главная',
  'home.subtitle': 'Добро пожаловать',
  'profile.title': 'Профиль',
}

function t(key: string): string {
  return translations[key as keyof typeof translations] ?? key
}

t('home.titel') // опечатка — вернёт сам ключ, ошибки компиляции нет`,
    bugs: [
      {
        title: 'key: string не ограничен реальными ключами',
        detail:
          't принимает любую строку, поэтому опечатка home.titel не ловится — в рантайме вернётся fallback. Ключи известны на этапе компиляции, их можно типизировать.',
      },
      {
        title: 'keyof typeof в сигнатуре',
        detail:
          'Типизируй параметр как keyof typeof translations. Тогда допустимы только реальные ключи, а опечатки — ошибка компиляции с автокомплитом по доступным ключам.',
      },
    ],
    fixedCode: `const translations = {
  'home.title': 'Главная',
  'home.subtitle': 'Добро пожаловать',
  'profile.title': 'Профиль',
} as const

type TranslationKey = keyof typeof translations

function t(key: TranslationKey): string {
  return translations[key]
}

t('home.title') // ✅ автокомплит по ключам
t('home.titel') // ошибка ✅`,
    takeaway:
      'Ключи переводов/конфигов/роутов типизируй как keyof typeof object — функция t примет только существующие ключи, а опечатки станут ошибкой компиляции с автокомплитом. Так строятся типобезопасные i18n-обёртки поверх статического словаря.',
  },

  // 66 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-form-data-typed',
    title: 'FormData.get возвращает FormDataEntryValue — не string',
    level: 'middle',
    categories: ['typescript', 'patterns', 'async'],
    brief:
      'Обработчик формы читает поля через formData.get, но тип — string | File | null. Прямое использование как строки ломается. Типизируй извлечение.',
    brokenCode: `function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)

  // get() возвращает FormDataEntryValue | null (string | File | null)
  const email = formData.get('email')
  sendEmail(email.toLowerCase()) // ошибка: email может быть File/null
}`,
    bugs: [
      {
        title: 'formData.get возвращает string | File | null',
        detail:
          'FormData может хранить и файлы, поэтому get() типизирован как FormDataEntryValue | null. Прямой email.toLowerCase() — ошибка: значение может быть File или null.',
      },
      {
        title: 'Извлекай через helper или Object.fromEntries',
        detail:
          'Для текстовых полей сделай типизированный helper (проверка typeof === "string") или собери объект через Object.fromEntries и провалидируй (zod). Не кастуй вслепую as string.',
      },
    ],
    fixedCode: `function getString(fd: FormData, key: string): string {
  const value = fd.get(key)
  if (typeof value !== 'string') {
    throw new Error(\`Поле \${key} не строка\`)
  }
  return value
}

function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)

  const email = getString(formData, 'email') // string ✅
  sendEmail(email.toLowerCase())

  // или собрать всё и провалидировать схемой:
  // const data = LoginSchema.parse(Object.fromEntries(formData))
}`,
    takeaway:
      'FormData.get возвращает string | File | null (FormData умеет хранить файлы). Не кастуй as string — извлекай текстовые поля через helper с проверкой typeof, либо собирай Object.fromEntries(formData) и валидируй схемой (zod). Особенно актуально для React 19 Actions с FormData.',
  },

  // 67 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-provider-value-type',
    title: 'Тип значения контекста выводится из createContext неверно',
    level: 'middle',
    categories: ['typescript', 'hooks', 'patterns'],
    brief:
      'createContext с начальным объектом-заглушкой выводит слишком узкий/широкий тип, и реальные функции в него не влезают. Типизируй контекст явно.',
    brokenCode: `// тип выводится из заглушки: setUser выведется как () => void
const AuthContext = createContext({
  user: null,
  setUser: () => {}, // реальный setUser принимает User — несовместимо
})

function Provider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // ошибка: (u: User) => void не присваивается () => void
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
}`,
    bugs: [
      {
        title: 'Тип выведен из объекта-заглушки',
        detail:
          'createContext({ user: null, setUser: () => {} }) выводит user: null и setUser: () => void. Реальные значения (User | null и Dispatch<...>) в этот узкий тип не помещаются.',
      },
      {
        title: 'Задавай тип контекста явно',
        detail:
          'Опиши интерфейс значения и параметризуй createContext<AuthValue | null>(null). Заглушка не должна диктовать тип — его задаёт дженерик.',
      },
    ],
    fixedCode: `interface AuthValue {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}

// тип задан явно, а не выведен из заглушки
const AuthContext = createContext<AuthValue | null>(null)

function Provider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}`,
    takeaway:
      'Не позволяй объекту-заглушке в createContext диктовать тип значения — он выйдет слишком узким (() => void, null). Объяви интерфейс значения и задай его явно: createContext<AuthValue | null>(null). Тип контекста должен описывать реальные данные, а не дефолт.',
  },

  // 68 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-generic-memo',
    title: 'React.memo оборачивает дженерик-компонент и стирает T',
    level: 'senior',
    categories: ['typescript', 'performance', 'patterns'],
    brief:
      'Дженерик-список оборачивают в React.memo — и параметр типа T схлопывается в unknown, как с forwardRef. Сохрани дженерик.',
    brokenCode: `function ListInner<T>({ items, render }: {
  items: T[]
  render: (item: T) => React.ReactNode
}) {
  return <>{items.map(render)}</>
}

// memo стирает дженерик: T становится unknown
const List = memo(ListInner)

// <List items={users} render={u => u.name} /> — u: unknown`,
    bugs: [
      {
        title: 'memo() возвращает не-дженерик компонент',
        detail:
          'Как и forwardRef, React.memo фиксирует тип в момент оборачивания. Дженерик-параметр T схлопывается в unknown, render теряет тип элемента.',
      },
      {
        title: 'Приведи обёртку к дженерик-сигнатуре',
        detail:
          'Приведи результат memo(ListInner) к исходной дженерик-сигнатуре через as typeof ListInner. Поведение memo сохраняется, а дженерик восстанавливается.',
      },
    ],
    fixedCode: `function ListInner<T>({ items, render }: {
  items: T[]
  render: (item: T) => React.ReactNode
}) {
  return <>{items.map(render)}</>
}

// memo сохраняет поведение, каст восстанавливает дженерик-сигнатуру
const List = memo(ListInner) as typeof ListInner

// <List items={users} render={u => u.name} /> — u: User ✅

// Альтернатива — обёртка-функция вокруг memo с явной сигнатурой.`,
    takeaway:
      'React.memo (как и forwardRef) стирает дженерик-параметры. Чтобы сохранить T у мемоизированного дженерик-компонента, приведи результат memo(Inner) к исходной сигнатуре через as typeof Inner. Поведение memo не меняется, а инференс T восстанавливается.',
  },

  // 69 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-as-const-routes',
    title: 'Параметры роута извлечены как string вместо точных имён',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Хелпер строит путь из шаблона "/users/:id/posts/:postId", но имена параметров — просто string. Извлеки их типы из строки шаблона.',
    brokenCode: `// params типизированы как Record<string, string> — любые ключи
function buildPath(template: string, params: Record<string, string>) {
  return template.replace(/:(\\w+)/g, (_, key) => params[key])
}

buildPath('/users/:id/posts/:postId', { id: '1' })
// забыли postId — ошибки нет, в пути останется ':postId'`,
    bugs: [
      {
        title: 'Имена параметров не выводятся из шаблона',
        detail:
          'params: Record<string, string> допускает любые ключи и не требует те, что есть в шаблоне (:id, :postId). Пропущенный параметр — рантайм-баг (в пути остаётся ":postId").',
      },
      {
        title: 'Template literal type + infer извлекают параметры',
        detail:
          'Рекурсивный conditional type с infer вытаскивает имена :param из строки шаблона и строит объект обязательных ключей. Пропуск параметра становится ошибкой компиляции.',
      },
    ],
    fixedCode: `// извлекаем имена параметров из строки шаблона
type PathParams<T extends string> =
  T extends \`\${string}:\${infer Param}/\${infer Rest}\`
    ? { [K in Param | keyof PathParams<\`/\${Rest}\`>]: string }
    : T extends \`\${string}:\${infer Param}\`
      ? { [K in Param]: string }
      : {}

function buildPath<T extends string>(template: T, params: PathParams<T>) {
  return template.replace(/:(\\w+)/g, (_, key) => (params as any)[key])
}

buildPath('/users/:id/posts/:postId', { id: '1', postId: '2' }) // ✅
buildPath('/users/:id/posts/:postId', { id: '1' }) // ошибка: нет postId ✅`,
    takeaway:
      'Имена динамических сегментов пути можно извлечь из строки-шаблона через template literal types + infer (рекурсивный conditional type). Так buildPath/navigate требуют ровно те параметры, что есть в шаблоне. На этом построена типобезопасность роутеров (TanStack Router).',
  },

  // 70 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-children-function-vs-node',
    title: 'children то узел, то функция — тип не различает',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Компонент поддерживает и обычные children, и render-prop через children. Тип ReactNode не покрывает функцию. Опиши оба варианта.',
    brokenCode: `function Toggle({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(false)

  // если children — функция, ReactNode её не допускает корректно
  if (typeof children === 'function') {
    return <>{children(on, () => setOn(!on))}</>  // ошибка типа
  }
  return <>{children}</>
}`,
    bugs: [
      {
        title: 'ReactNode не включает функцию-рендер',
        detail:
          'children: ReactNode не охватывает (state, toggle) => ReactNode. Вызов children(...) — ошибка типа, хотя в рантайме мы поддерживаем render-prop форму.',
      },
      {
        title: 'Опиши union: ReactNode | render-функция',
        detail:
          'Типизируй children как ReactNode | ((on, toggle) => ReactNode). После typeof children === "function" TS сузит до функции и разрешит вызов.',
      },
    ],
    fixedCode: `type ToggleChildren =
  | React.ReactNode
  | ((on: boolean, toggle: () => void) => React.ReactNode)

function Toggle({ children }: { children: ToggleChildren }) {
  const [on, setOn] = useState(false)
  const toggle = () => setOn(o => !o)

  if (typeof children === 'function') {
    return <>{children(on, toggle)}</> // сужено до функции ✅
  }
  return <>{children}</>
}

// <Toggle>{(on, toggle) => <button onClick={toggle}>{String(on)}</button>}</Toggle>
// <Toggle><span>обычный узел</span></Toggle>`,
    takeaway:
      'Если компонент поддерживает и обычные children, и children-as-function, типизируй children как union ReactNode | ((args) => ReactNode). Проверка typeof children === "function" сузит тип и разрешит вызов. ReactNode сам по себе функцию-рендер не покрывает.',
  },

  // 71 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-partial-record-status',
    title: 'Словарь по enum-ключам не гарантирует обработку всех значений',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Маппинг статус → конфиг отображения типизирован частично, поэтому новый статус молча не покрыт. Сделай маппинг исчерпывающим.',
    brokenCode: `type Status = 'pending' | 'shipped' | 'delivered' | 'cancelled'

// объект с подмножеством ключей — TS не требует покрыть все
const labels: Partial<Record<Status, string>> = {
  pending: 'В обработке',
  shipped: 'Отправлен',
  // delivered и cancelled забыли
}

function StatusBadge({ status }: { status: Status }) {
  return <span>{labels[status]}</span> // undefined для delivered
}`,
    bugs: [
      {
        title: 'Partial<Record<...>> разрешает пропуски',
        detail:
          'Partial делает все ключи опциональными, поэтому delivered/cancelled можно не указать — TS не предупредит, а в рантайме labels[status] вернёт undefined.',
      },
      {
        title: 'Полный Record требует все статусы',
        detail:
          'Убери Partial: Record<Status, string> заставит покрыть КАЖДЫЙ статус. Добавишь новый статус в union — компилятор укажет недостающие записи в каждом таком маппинге.',
      },
    ],
    fixedCode: `type Status = 'pending' | 'shipped' | 'delivered' | 'cancelled'

// полный Record — все статусы обязаны быть покрыты
const labels: Record<Status, string> = {
  pending: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён', // пропустить нельзя — ошибка ✅
}

function StatusBadge({ status }: { status: Status }) {
  return <span>{labels[status]}</span> // всегда определён ✅
}`,
    takeaway:
      'Для маппинга «значение union → отображение» используй полный Record<Union, V>, а не Partial<Record<...>>: первый требует покрыть все варианты, и добавление нового значения в union сразу подсветит недостающие записи. Partial оставляй там, где пропуски действительно допустимы.',
  },

  // 72 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-overload-hook-return',
    title: 'Хук возвращает разный тип в зависимости от опции — но тип один',
    level: 'senior',
    categories: ['typescript', 'hooks'],
    brief:
      'useUser({ suspense: true }) гарантированно возвращает User, без suspense — User | undefined. Сейчас всегда User | undefined. Раздели перегрузками.',
    brokenCode: `function useUser(opts: { suspense?: boolean }): User | undefined {
  // при suspense=true данные точно есть (Suspense ждёт),
  // но тип всё равно User | undefined — лишние проверки
  return data
}

const user = useUser({ suspense: true })
return <span>{user.name}</span> // ошибка: user может быть undefined`,
    bugs: [
      {
        title: 'Возврат не зависит от опции',
        detail:
          'При suspense: true компонент рендерится только когда данные готовы — user точно User. Но единый тип User | undefined заставляет писать user?. даже там, где undefined невозможен.',
      },
      {
        title: 'Перегрузки по значению опции',
        detail:
          'Опиши перегрузки: { suspense: true } → User, иначе → User | undefined. Тип результата подстроится под переданную опцию.',
      },
    ],
    fixedCode: `function useUser(opts: { suspense: true }): User
function useUser(opts?: { suspense?: false }): User | undefined
function useUser(opts?: { suspense?: boolean }): User | undefined {
  return data
}

const a = useUser({ suspense: true })
return <span>{a.name}</span> // a: User, без ? ✅

const b = useUser()
return <span>{b?.name}</span> // b: User | undefined ✅`,
    takeaway:
      'Когда тип возврата хука зависит от опции (suspense, enabled), описывай перегрузки: { suspense: true } → T, иначе → T | undefined. Потребитель получает точный тип под свою опцию без лишних ?.. Так типизированы хуки TanStack Query с suspense.',
  },

  // 73 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-spread-union-props',
    title: 'Спред union-пропсов в дочерний компонент ломает типы',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Родитель принимает union-пропсы и спредит их в дочерний, но TS не может проверить спред union напрямую. Разберись, как пробросить корректно.',
    brokenCode: `type FieldProps =
  | { type: 'text'; value: string }
  | { type: 'number'; value: number; step: number }

function Field(props: FieldProps) {
  // спред union в Input ломается: TS не доказывает совместимость
  return <Input {...props} />
}

// Input ожидает конкретные комбинации, спред union TS не верифицирует`,
    bugs: [
      {
        title: 'Спред union не верифицируется поэлементно',
        detail:
          'TS не может гарантировать, что объект union целиком подходит под пропсы Input — он «теряет» связь дискриминанта при спреде. Часто это даёт ошибку или требует каста.',
      },
      {
        title: 'Сузь, затем спредь конкретный вариант',
        detail:
          'Сначала сузь props по дискриминанту (if (props.type === "number")), и спредь уже сужённый объект. Внутри ветки тип конкретен, и спред проверяется.',
      },
    ],
    fixedCode: `type FieldProps =
  | { type: 'text'; value: string }
  | { type: 'number'; value: number; step: number }

function Field(props: FieldProps) {
  // сужаем по дискриминанту, затем спредим конкретный вариант
  if (props.type === 'number') {
    return <Input {...props} /> // props: number-вариант ✅
  }
  return <Input {...props} /> // props: text-вариант ✅
}

// каждая ветка спредит уже конкретный, проверяемый тип`,
    takeaway:
      'TS плохо верифицирует спред union-объекта целиком — связь дискриминанта теряется. Сначала сузь по полю-дискриминанту (if (props.type === ...)), затем спредь уже конкретный вариант в каждой ветке. Тогда спред типобезопасен без каста.',
  },

  // 74 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-typeof-import',
    title: 'Тип значения из модуля дублируется вместо typeof import',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Тип конфигурации/иконок копируется вручную, хотя сам объект уже есть в модуле. Выведи тип через typeof.',
    brokenCode: `// icons.ts экспортирует объект иконок
import { icons } from './icons'

// вручную перечисляем имена иконок — устаревает при изменении icons.ts
type IconName = 'home' | 'user' | 'settings' | 'search'

function Icon({ name }: { name: IconName }) {
  return icons[name]
}`,
    bugs: [
      {
        title: 'Имена иконок продублированы',
        detail:
          'IconName руками повторяет ключи объекта icons. Добавят иконку в icons.ts — тип отстанет, и новую иконку нельзя будет передать (или, наоборот, удалённую — можно).',
      },
      {
        title: 'keyof typeof выводит ключи из объекта',
        detail:
          'type IconName = keyof typeof icons берёт имена прямо из объекта. Модуль становится источником правды и для данных, и для типа имён.',
      },
    ],
    fixedCode: `import { icons } from './icons'

// тип имён выводится из самого объекта иконок
type IconName = keyof typeof icons

function Icon({ name }: { name: IconName }) {
  return icons[name]
}

// добавили иконку в icons.ts → IconName обновился автоматически ✅

// для типа значения целиком: type Icons = typeof icons`,
    takeaway:
      'Тип, описывающий ключи/форму существующего объекта (иконки, конфиг, тема), выводи через keyof typeof obj / typeof obj, а не дублируй вручную. Объект-источник остаётся единственной правдой, а типы обновляются вместе с ним.',
  },

  // 75 ────────────────────────────────────────────────────────────────────
  {
    id: 'ts-assert-function',
    title: 'Проверка инварианта не сужает тип — нужна assertion-функция',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Функция-проверка бросает при null, но после её вызова TS всё ещё считает значение возможно null. Сделай assertion-функцию.',
    brokenCode: `function assertDefined<T>(value: T | null | undefined) {
  if (value == null) throw new Error('Значение отсутствует')
}

function render(user: User | null) {
  assertDefined(user)
  // TS всё ещё считает user возможно null — проверка не сузила тип
  return <span>{user.name}</span> // ошибка: user может быть null
}`,
    bugs: [
      {
        title: 'Обычная функция не сужает тип после вызова',
        detail:
          'assertDefined бросает при null, но её возврат void. TS не знает, что после вызова value гарантированно не null — user остаётся User | null.',
      },
      {
        title: 'asserts value is T в сигнатуре',
        detail:
          'Аннотируй возврат как asserts value is NonNullable<T>. Тогда после вызова assertDefined(user) TS сужает user до User — без ! и лишних проверок.',
      },
    ],
    fixedCode: `// assertion-функция: сужает тип аргумента после вызова
function assertDefined<T>(
  value: T | null | undefined,
): asserts value is T {
  if (value == null) throw new Error('Значение отсутствует')
}

function render(user: User | null) {
  assertDefined(user)
  // после ассерта user сужен до User ✅
  return <span>{user.name}</span>
}`,
    takeaway:
      'Функция, бросающая при нарушении инварианта, должна иметь тип-предикат asserts value is T — тогда TS сужает тип аргумента после её вызова. Это убирает ! и ручные проверки. Используй для invariant()/assertDefined() в начале функций и обработчиков.',
  },
]

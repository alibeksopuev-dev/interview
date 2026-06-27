import { RefactorTask } from './types'

/**
 * Тренажёр по рефакторингу React + TypeScript.
 *
 * Формат каждой задачи:
 *  - brokenCode  — компонент с реальными ошибками (изучи и найди их сам);
 *  - bugs        — разбор проблем (скрыт под спойлером);
 *  - fixedCode   — эталонный рефакторинг;
 *  - takeaway    — главный вывод.
 *
 * Уровни: middle / senior. Категории помогают тренировать конкретный навык.
 */
export const REFACTOR_TASKS: RefactorTask[] = [
  // ───────────────────────────────────────────────────────────────────────
  // 1. useEffect + устаревшее замыкание в setInterval
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'stale-interval',
    title: 'Счётчик в setInterval застревает на 1',
    level: 'middle',
    categories: ['hooks', 'state'],
    brief:
      'Простой счётчик, который должен увеличиваться каждую секунду. Но он доходит до 1 и замирает. Почему?',
    brokenCode: `function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return <div>Прошло секунд: {count}</div>
}`,
    bugs: [
      {
        title: 'Stale closure (устаревшее замыкание)',
        detail:
          'Эффект с пустым массивом зависимостей создаёт интервал один раз. Внутри колбэк навсегда «запоминает» count === 0, поэтому setCount(count + 1) — это всегда setCount(0 + 1). Счётчик застревает на 1.',
      },
      {
        title: 'Ложный выбор: добавить count в зависимости — плохое решение',
        detail:
          'Если просто добавить [count], интервал будет пересоздаваться каждую секунду (clearInterval + setInterval). Работать будет, но это лишние перезапуски таймера и потенциально рваная анимация. Правильнее — функциональное обновление.',
      },
    ],
    fixedCode: `function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      // функциональный апдейт читает актуальное значение,
      // замыкание больше не нужно
      setCount(prev => prev + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return <div>Прошло секунд: {count}</div>
}`,
    takeaway:
      'Когда новое состояние зависит от предыдущего внутри асинхронного колбэка (setInterval, setTimeout, подписки), используй функциональную форму setState(prev => ...), а не значение из замыкания.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 2. Race condition в загрузке данных
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'fetch-race',
    title: 'Поиск показывает результаты не от того запроса',
    level: 'senior',
    categories: ['async', 'hooks'],
    brief:
      'Компонент грузит данные пользователя по userId. При быстром переключении id иногда показывается старый пользователь. Найди гонку.',
    brokenCode: `function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(null)
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data))
  }, [userId])

  if (!user) return <Spinner />
  return <h2>{user.name}</h2>
}`,
    bugs: [
      {
        title: 'Race condition между запросами',
        detail:
          'Если userId меняется быстро (A → B), запрос за A может вернуться ПОЗЖЕ запроса за B. Тогда setUser(A) перезапишет setUser(B), и на экране окажется неверный пользователь. Эффект ничего не отменяет.',
      },
      {
        title: 'Нет обработки ошибок',
        detail:
          'Если fetch упадёт (404, сеть), промис отклонится без catch — спиннер останется навсегда, а в консоли будет unhandled rejection.',
      },
      {
        title: 'Нет отмены при размонтировании',
        detail:
          'Если компонент размонтируется до ответа, setUser вызовется на размонтированном компоненте (в реальных подписках это утечка/предупреждение).',
      },
    ],
    fixedCode: `function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    setUser(null)
    setError(null)

    fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
        return res.json()
      })
      .then(data => {
        if (!cancelled) setUser(data)
      })
      .catch(err => {
        if (err.name !== 'AbortError' && !cancelled) setError(String(err))
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [userId])

  if (error) return <p role="alert">Ошибка: {error}</p>
  if (!user) return <Spinner />
  return <h2>{user.name}</h2>
}`,
    takeaway:
      'Любой fetch в useEffect должен уметь отменяться: флаг cancelled в cleanup отбрасывает устаревшие ответы, AbortController прерывает сам запрос. Это закрывает и гонки, и утечки.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 3. key={index} в списке с изменяемым порядком
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'list-key-index',
    title: 'Чекбоксы «прыгают» при удалении элемента списка',
    level: 'middle',
    categories: ['state', 'patterns'],
    brief:
      'Список задач с чекбоксами. При удалении элемента отметки сбиваются на соседние. Виноват рендер списка.',
    brokenCode: `function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>
          <input type="checkbox" defaultChecked={todo.done} />
          {todo.text}
        </li>
      ))}
    </ul>
  )
}`,
    bugs: [
      {
        title: 'key={index} при изменяемом порядке',
        detail:
          'Индекс не идентифицирует элемент. При удалении/вставке/сортировке React переиспользует DOM-узлы по позиции, а не по сущности. Внутреннее состояние (отмеченный чекбокс, фокус, позиция курсора) «перетекает» на соседний элемент.',
      },
      {
        title: 'defaultChecked делает компонент неуправляемым',
        detail:
          'defaultChecked задаёт значение только при монтировании. Изменения todo.done извне не отразятся в UI. Для синхронизации с состоянием нужен управляемый checked + onChange.',
      },
    ],
    fixedCode: `function TodoList({
  todos,
  onToggle,
}: {
  todos: Todo[]
  onToggle: (id: string) => void
}) {
  return (
    <ul>
      {todos.map(todo => (
        // стабильный уникальный ключ — id сущности
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => onToggle(todo.id)}
          />
          {todo.text}
        </li>
      ))}
    </ul>
  )
}`,
    takeaway:
      'key должен быть стабильным идентификатором сущности (id), а не индексом, если список может переупорядочиваться. Индекс допустим только для статичных списков, которые никогда не меняют порядок.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 4. Прямая мутация state
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'state-mutation',
    title: 'Кнопка «добавить» не перерисовывает список',
    level: 'middle',
    categories: ['state', 'patterns'],
    brief:
      'Добавление элемента в массив в state не приводит к ререндеру. Найди мутацию.',
    brokenCode: `function TagEditor() {
  const [tags, setTags] = useState<string[]>(['react'])

  const addTag = (tag: string) => {
    tags.push(tag)        // мутируем массив
    setTags(tags)         // передаём ту же ссылку
  }

  const updateUser = () => {
    user.profile.name = 'new' // мутация вложенного объекта
    setUser(user)
  }

  return <button onClick={() => addTag('ts')}>Добавить</button>
}`,
    bugs: [
      {
        title: 'Мутация массива + та же ссылка',
        detail:
          'tags.push мутирует существующий массив, а setTags получает ту же ссылку. React сравнивает по Object.is — ссылка не изменилась, ререндера нет. UI «зависает» на старых данных.',
      },
      {
        title: 'Глубокая мутация вложенного объекта',
        detail:
          'user.profile.name = ... меняет объект на месте. Даже если обернуть в новый верхний объект, дочерние компоненты с React.memo, сравнивающие user.profile по ссылке, не обновятся.',
      },
    ],
    fixedCode: `function TagEditor() {
  const [tags, setTags] = useState<string[]>(['react'])

  const addTag = (tag: string) => {
    // новый массив — новая ссылка
    setTags(prev => [...prev, tag])
  }

  const updateUser = () => {
    // иммутабельное обновление всех уровней
    setUser(prev => ({
      ...prev,
      profile: { ...prev.profile, name: 'new' },
    }))
  }

  return <button onClick={() => addTag('ts')}>Добавить</button>
}`,
    takeaway:
      'State в React иммутабелен. Всегда создавай новые ссылки: [...arr], {...obj}. Для сложных вложенных структур используй immer или useReducer, чтобы не плодить ручной спред.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 5. useMemo / useCallback, который не работает
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'broken-memo',
    title: 'React.memo не спасает: дочерний компонент всё равно ререндерится',
    level: 'senior',
    categories: ['performance', 'hooks'],
    brief:
      'Дочерний компонент обёрнут в React.memo, но рендерится на каждый клик родителя. Почему мемоизация не сработала?',
    brokenCode: `const ExpensiveList = React.memo(function ExpensiveList({
  items,
  onSelect,
}: {
  items: Item[]
  onSelect: (id: string) => void
}) {
  return <>{/* тяжёлый рендер */}</>
})

function Parent({ items }: { items: Item[] }) {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <ExpensiveList
        items={items}
        // новая функция на каждый рендер
        onSelect={(id) => console.log(id)}
        // новый объект на каждый рендер
        style={{ padding: 8 }}
      />
    </>
  )
}`,
    bugs: [
      {
        title: 'Новый колбэк на каждый рендер',
        detail:
          'onSelect={(id) => ...} создаёт новую функцию при каждом рендере Parent. React.memo сравнивает props по ссылке — onSelect всегда «новый», мемоизация бесполезна.',
      },
      {
        title: 'Инлайновый объект style',
        detail:
          'style={{ padding: 8 }} — тоже новая ссылка каждый раз. Та же проблема, что и с колбэком.',
      },
      {
        title: 'Важно: мемоизировать нужно ВСЕ нестабильные пропсы',
        detail:
          'React.memo делает поверхностное сравнение. Достаточно одного «нового» пропса, чтобы memo не сработало. Частая ошибка — обернуть колбэк в useCallback, но забыть про объект/массив рядом.',
      },
    ],
    fixedCode: `const ExpensiveList = React.memo(function ExpensiveList({
  items,
  onSelect,
  style,
}: {
  items: Item[]
  onSelect: (id: string) => void
  style: React.CSSProperties
}) {
  return <>{/* тяжёлый рендер */}</>
})

function Parent({ items }: { items: Item[] }) {
  const [count, setCount] = useState(0)

  // стабильная ссылка на функцию
  const handleSelect = useCallback((id: string) => {
    console.log(id)
  }, [])

  // стабильная ссылка на объект (или вынести в модуль-константу)
  const listStyle = useMemo<React.CSSProperties>(() => ({ padding: 8 }), [])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveList items={items} onSelect={handleSelect} style={listStyle} />
    </>
  )
}`,
    takeaway:
      'React.memo сравнивает пропсы по ссылке. Передавать в мемоизированный компонент нужно стабильные ссылки: useCallback для функций, useMemo (или модульные константы) для объектов/массивов. Один забытый инлайн-проп обнуляет весь смысл memo.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 6. useEffect без зависимостей / лишние зависимости
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'effect-deps',
    title: 'Бесконечный цикл рендеров из-за объекта в зависимостях',
    level: 'senior',
    categories: ['hooks', 'performance'],
    brief:
      'Этот компонент уходит в бесконечный цикл запросов. Дело в зависимостях эффекта.',
    brokenCode: `function Results({ query }: { query: string }) {
  const [data, setData] = useState<Item[]>([])

  // новый объект options на каждый рендер
  const options = { query, limit: 20 }

  useEffect(() => {
    fetchResults(options).then(setData)
    // options меняется каждый рендер → эффект перезапускается
    // → setData → ререндер → новый options → ...
  }, [options])

  return <List data={data} />
}`,
    bugs: [
      {
        title: 'Объект в зависимостях пересоздаётся каждый рендер',
        detail:
          'options — новый объект при каждом рендере. useEffect сравнивает зависимости по ссылке, видит «новый» options и перезапускается. Эффект делает setData → ререндер → снова новый options → бесконечный цикл.',
      },
      {
        title: 'Антипаттерн: мемоизировать объект только ради deps',
        detail:
          'Можно обернуть options в useMemo, но чаще чище — зависеть от примитивов (query, limit), а объект собирать внутри эффекта. Меньше скрытых ссылок — меньше багов.',
      },
    ],
    fixedCode: `function Results({ query }: { query: string }) {
  const [data, setData] = useState<Item[]>([])
  const limit = 20

  useEffect(() => {
    let cancelled = false
    // объект собираем ВНУТРИ эффекта — он не участвует в сравнении deps
    fetchResults({ query, limit }).then(res => {
      if (!cancelled) setData(res)
    })
    return () => {
      cancelled = true
    }
    // зависим от примитивов — стабильное сравнение
  }, [query, limit])

  return <List data={data} />
}`,
    takeaway:
      'Зависимости эффекта сравниваются по ссылке. Не клади в deps объекты/массивы/функции, созданные в теле компонента. Завись от примитивов, а нестабильные значения либо мемоизируй, либо собирай внутри эффекта.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 7. Производный state вместо вычисления при рендере
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'derived-state',
    title: 'Дублирующий state, который рассинхронизируется',
    level: 'middle',
    categories: ['state', 'patterns'],
    brief:
      'Компонент хранит и список, и его отфильтрованную версию в state. Фильтр иногда показывает устаревшие данные.',
    brokenCode: `function ProductList({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('')
  // производный state — копия данных
  const [filtered, setFiltered] = useState(products)

  useEffect(() => {
    setFiltered(products.filter(p => p.name.includes(filter)))
  }, [filter])
  // забыли products в deps → при обновлении products фильтр устаревает

  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <ul>{filtered.map(p => <li key={p.id}>{p.name}</li>)}</ul>
    </>
  )
}`,
    bugs: [
      {
        title: 'Производное значение хранится в state',
        detail:
          'filtered — это просто products + filter. Хранить его отдельно значит держать два источника правды, которые надо вручную синхронизировать через useEffect. Это источник рассинхронов.',
      },
      {
        title: 'Неполный массив зависимостей',
        detail:
          'В deps только [filter], но не products. Когда products обновятся (новый запрос), filtered не пересчитается и покажет старое. Линтер react-hooks/exhaustive-deps это ловит.',
      },
      {
        title: 'Лишний ререндер',
        detail:
          'Эффект запускается ПОСЛЕ рендера и вызывает setFiltered → второй рендер. Вычисление при рендере убирает этот лишний проход.',
      },
    ],
    fixedCode: `function ProductList({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('')

  // вычисляем при рендере — один источник правды, всегда актуально
  const filtered = useMemo(
    () => products.filter(p => p.name.includes(filter)),
    [products, filter],
  )

  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <ul>{filtered.map(p => <li key={p.id}>{p.name}</li>)}</ul>
    </>
  )
}`,
    takeaway:
      'Если значение можно вычислить из пропсов/состояния — вычисляй его при рендере, не дублируй в state. useMemo нужен только при реально дорогом вычислении. Меньше state → меньше рассинхронов.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 8. any и слабая типизация (TypeScript)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'weak-typing',
    title: 'any повсюду: компилируется, но падает в рантайме',
    level: 'senior',
    categories: ['typescript'],
    brief:
      'Хук получает данные и теряет всю типизацию. Перепиши на строгие типы и дискриминируемое объединение.',
    brokenCode: `function useFetch(url: string): any {
  const [state, setState] = useState<any>({})

  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then(data => setState({ data, loading: false }))
  }, [url])

  return state
}

// использование — никакой автокомплит, никаких проверок
const { data, loading, error } = useFetch('/api')
data.whatever.deep.access // компилируется, упадёт в рантайме`,
    bugs: [
      {
        title: 'any отключает проверки типов',
        detail:
          'Возвращаемый any и useState<any> означают, что TS не проверит ничего: ни поля, ни опечатки, ни доступ к undefined. data.whatever.deep.access пройдёт компиляцию и упадёт в браузере.',
      },
      {
        title: 'Невозможные состояния представимы',
        detail:
          'Объект { data, loading, error } позволяет одновременно loading: true и data: ... и error: .... Логически невозможные комбинации становятся валидными — источник багов в UI.',
      },
      {
        title: 'Нет дженерика — нельзя переиспользовать',
        detail:
          'Хук не параметризован типом ответа. Каждый вызов теряет конкретику. Решение — generic <T> и discriminated union по полю status.',
      },
    ],
    fixedCode: `type FetchState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(\`HTTP \${r.status}\`)
        return r.json() as Promise<T>
      })
      .then(data => !cancelled && setState({ status: 'success', data }))
      .catch(error => !cancelled && setState({ status: 'error', error }))

    return () => { cancelled = true }
  }, [url])

  return state
}

// использование — TS сужает тип по status
const state = useFetch<User>('/api/user')
if (state.status === 'success') {
  state.data.name // ✅ тип User, автокомплит работает
}`,
    takeaway:
      'any — это «выключить TypeScript». Используй дженерики для переиспользуемых хуков и discriminated unions, чтобы невозможные состояния (loading + data одновременно) нельзя было выразить. Тип сам подскажет, какие поля доступны.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 9. Утечка памяти: подписка без отписки
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'listener-leak',
    title: 'Слушатели событий накапливаются при ремонтировании',
    level: 'middle',
    categories: ['memory-leak', 'hooks'],
    brief:
      'Хук отслеживает размер окна, но при каждом ремаунте добавляет новый listener и не убирает старый.',
    brokenCode: `function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    window.addEventListener('resize', () => {
      setWidth(window.innerWidth)
    })
    // нет cleanup → слушатель остаётся навсегда
  }, [])

  return width
}`,
    bugs: [
      {
        title: 'Нет функции очистки',
        detail:
          'addEventListener без return-cleanup означает, что слушатель не снимается при размонтировании. После нескольких ремаунтов на resize вызывается множество обработчиков на «мёртвых» компонентах — утечка памяти и лишние вызовы setState.',
      },
      {
        title: 'Анонимная функция нельзя снять',
        detail:
          'Даже если добавить removeEventListener, нужна та же ссылка на функцию. Инлайн-стрелка в addEventListener анонимна — снять её нельзя. Нужна именованная переменная-обработчик.',
      },
      {
        title: 'SSR-небезопасно',
        detail:
          'window.innerWidth в инициализаторе useState упадёт при серверном рендере (window не определён). Для SSR нужна защита или ленивая инициализация в эффекте.',
      },
    ],
    fixedCode: `function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 0 : window.innerWidth,
  )

  useEffect(() => {
    // именованный обработчик — его можно снять
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    handleResize() // синхронизируемся после монтирования

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width
}`,
    takeaway:
      'Любая подписка (addEventListener, setInterval, observer, WebSocket) обязана сниматься в cleanup эффекта той же ссылкой. Без этого — утечки и дубли обработчиков на каждый ремаунт.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 10. Условный вызов хука (нарушение правил хуков)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'conditional-hook',
    title: 'Хук вызывается внутри условия — «Rendered fewer hooks»',
    level: 'middle',
    categories: ['hooks'],
    brief:
      'React падает с ошибкой про порядок хуков. Найди условный/ранний вызов.',
    brokenCode: `function Profile({ userId }: { userId?: string }) {
  // ранний return ДО хуков
  if (!userId) return <p>Нет пользователя</p>

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])

  if (user) {
    // хук внутри условия
    const formatted = useMemo(() => formatName(user), [user])
    return <h2>{formatted}</h2>
  }

  return <Spinner />
}`,
    bugs: [
      {
        title: 'Ранний return до хуков меняет их количество',
        detail:
          'Когда userId пуст, компонент возвращается ДО useState/useEffect — хуки не вызываются. На следующем рендере с userId они вызовутся. React сверяет хуки по порядку вызова между рендерами → ошибка "Rendered fewer hooks than expected".',
      },
      {
        title: 'useMemo внутри if (user)',
        detail:
          'Хук вызывается только когда user не null. Это нарушает Правила хуков: хуки должны вызываться на верхнем уровне, безусловно, в одном и том же порядке при каждом рендере.',
      },
    ],
    fixedCode: `function Profile({ userId }: { userId?: string }) {
  const [user, setUser] = useState<User | null>(null)

  // эффект безусловен; условие — внутри него
  useEffect(() => {
    if (!userId) return
    fetchUser(userId).then(setUser)
  }, [userId])

  // useMemo безусловен; работаем с user через ?.
  const formatted = useMemo(
    () => (user ? formatName(user) : ''),
    [user],
  )

  // ранние return — ПОСЛЕ всех хуков
  if (!userId) return <p>Нет пользователя</p>
  if (!user) return <Spinner />

  return <h2>{formatted}</h2>
}`,
    takeaway:
      'Хуки вызываются только на верхнем уровне компонента, безусловно и в неизменном порядке. Все ранние return — после хуков, а условия переноси внутрь тела хука.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 11. Дебаунс без useRef / пересоздание таймера
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'broken-debounce',
    title: 'Дебаунс поиска не работает — запрос на каждую букву',
    level: 'senior',
    categories: ['hooks', 'performance'],
    brief:
      'Поиск должен ждать 300мс после последнего ввода, но шлёт запрос на каждый символ. Найди, почему таймер не дебаунсит.',
    brokenCode: `function Search() {
  const [query, setQuery] = useState('')

  const handleChange = (value: string) => {
    setQuery(value)
    // новый таймер каждый раз, но старый не очищается
    let timer = setTimeout(() => {
      search(value)
    }, 300)
  }

  return <input onChange={e => handleChange(e.target.value)} />
}`,
    bugs: [
      {
        title: 'Таймер хранится в локальной переменной',
        detail:
          'let timer объявлен внутри handleChange — он живёт только до конца вызова. На следующий ввод создаётся новый таймер, а предыдущий некем очистить. В итоге срабатывают ВСЕ таймеры — запрос на каждую букву.',
      },
      {
        title: 'Нужен useRef для хранения id между рендерами',
        detail:
          'Чтобы очистить предыдущий таймер, его id должен переживать рендеры и вызовы. Это классический кейс для useRef (не useState — менять id не должно вызывать ререндер).',
      },
      {
        title: 'Таймер не очищается при размонтировании',
        detail:
          'Если компонент уйдёт с экрана с «висящим» таймером, search() выстрелит на размонтированном компоненте. Нужен cleanup.',
      },
    ],
    fixedCode: `function Search() {
  const [query, setQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleChange = (value: string) => {
    setQuery(value)
    // очищаем предыдущий таймер перед новым
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(value), 300)
  }

  // очистка при размонтировании
  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <input value={query} onChange={e => handleChange(e.target.value)} />
  )
}

// Ещё чище — вынести в переиспользуемый useDebouncedValue:
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}`,
    takeaway:
      'Для дебаунса id таймера должен переживать рендеры — это useRef, а не локальная переменная. Перед установкой нового таймера очищай предыдущий и не забудь cleanup. Ещё лучше — переиспользуемый хук useDebouncedValue.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 12. Prop drilling + контекст, вызывающий лишние ререндеры
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'context-rerender',
    title: 'Context перерисовывает всё дерево при каждом изменении',
    level: 'senior',
    categories: ['performance', 'patterns', 'state'],
    brief:
      'Единый контекст с данными и сеттерами заставляет ререндериться всех потребителей, даже тех, кому нужны только сеттеры. Оптимизируй.',
    brokenCode: `const AppContext = createContext<any>(null)

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState('light')

  // новый объект value на каждый рендер → все потребители ререндерятся
  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  )
}

// этому компоненту нужен только setUser, но он ререндерится при смене theme
function LoginButton() {
  const { setUser } = useContext(AppContext)
  return <button onClick={() => setUser(fakeUser)}>Войти</button>
}`,
    bugs: [
      {
        title: 'value — новый объект каждый рендер',
        detail:
          'Объект { user, setUser, theme, setTheme } пересоздаётся при каждом рендере провайдера. Все useContext-потребители ререндерятся, даже если используемое ими поле не менялось.',
      },
      {
        title: 'Смешаны меняющиеся данные и стабильные сеттеры',
        detail:
          'user/theme меняются часто, setUser/setTheme стабильны. Держа их в одном контексте, ты заставляешь компоненты, которым нужны только сеттеры (LoginButton), ререндериться на любое изменение данных.',
      },
      {
        title: 'context<any> — потеря типов',
        detail:
          'createContext<any> убивает автокомплит и проверки. Нужен строгий тип значения и проверка на null при использовании.',
      },
    ],
    fixedCode: `// Разделяем: часто меняющееся состояние и стабильные действия — в разные контексты
interface State { user: User | null; theme: string }
interface Actions {
  setUser: (u: User | null) => void
  setTheme: (t: string) => void
}

const StateContext = createContext<State | null>(null)
const ActionsContext = createContext<Actions | null>(null)

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState('light')

  // actions стабильны навсегда — потребители сеттеров не ререндерятся
  const actions = useMemo<Actions>(() => ({ setUser, setTheme }), [])
  // state мемоизируем, чтобы ссылка менялась только при реальном изменении
  const state = useMemo<State>(() => ({ user, theme }), [user, theme])

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  )
}

function useActions() {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useActions вне AppProvider')
  return ctx
}

// теперь LoginButton не ререндерится при смене theme
function LoginButton() {
  const { setUser } = useActions()
  return <button onClick={() => setUser(fakeUser)}>Войти</button>
}`,
    takeaway:
      'Разделяй контексты на «состояние» и «действия»: сеттеры стабильны и не должны тащить за собой ререндеры при смене данных. Всегда мемоизируй value провайдера и типизируй контекст строго (с проверкой на null в хуке-обёртке).',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 13. Несколько связанных useState вместо useReducer
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'usestate-soup',
    title: 'Каскад useState, которые надо обновлять вместе',
    level: 'senior',
    categories: ['state', 'patterns'],
    brief:
      'Форма логина держит 5 связанных useState. Обновления разъезжаются, появляются невозможные состояния (loading + error одновременно). Перепиши.',
    brokenCode: `function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const submit = async () => {
    setIsLoading(true)
    setIsError(false)          // легко забыть сбросить
    setIsSuccess(false)
    try {
      const u = await login()
      setUser(u)
      setIsSuccess(true)
      setIsLoading(false)
    } catch (e) {
      setIsError(true)
      setErrorMsg(String(e))
      setIsLoading(false)      // дублирование в каждой ветке
    }
  }
  // ...
}`,
    bugs: [
      {
        title: 'Связанные переменные обновляются вручную и рассинхронятся',
        detail:
          'Пять useState описывают ОДНО состояние машины. При каждом переходе нужно вручную выставлять/сбрасывать все флаги. Забыл сбросить isError перед новым запросом — и UI показывает ошибку поверх загрузки.',
      },
      {
        title: 'Представимы невозможные состояния',
        detail:
          'isLoading && isError && isSuccess могут оказаться true одновременно. Логически это бессмыслица, но типы её разрешают. Это классический источник «мигающего» UI.',
      },
      {
        title: 'Дублирование setIsLoading(false) в каждой ветке',
        detail:
          'Логику завершения приходится повторять в try и catch. useReducer централизует переходы в одном месте.',
      },
    ],
    fixedCode: `type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; user: User }
  | { status: 'error'; message: string }

type Action =
  | { type: 'submit' }
  | { type: 'success'; user: User }
  | { type: 'error'; message: string }

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case 'submit': return { status: 'loading' }
    case 'success': return { status: 'success', user: action.user }
    case 'error': return { status: 'error', message: action.message }
  }
}

function LoginForm() {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' })

  const submit = async () => {
    dispatch({ type: 'submit' })
    try {
      const user = await login()
      dispatch({ type: 'success', user })
    } catch (e) {
      dispatch({ type: 'error', message: String(e) })
    }
  }

  // state.status — единственный источник правды, невозможные комбинации исключены
}`,
    takeaway:
      'Когда несколько useState всегда меняются вместе и описывают конечный автомат — это useReducer с discriminated union по status. Переходы централизованы, невозможные состояния невыразимы, ветки не дублируют сброс флагов.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 14. forwardRef + useImperativeHandle
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'forward-ref',
    title: 'ref на кастомный компонент не работает',
    level: 'senior',
    categories: ['patterns', 'typescript'],
    brief:
      'Родитель хочет вызвать .focus() у кастомного Input через ref, но ref всегда null. И типы кричат.',
    brokenCode: `function FancyInput(props: { placeholder: string; ref: any }) {
  return <input ref={props.ref} placeholder={props.placeholder} />
}

function Form() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus() // current === null, фокуса нет
  }, [])

  return <FancyInput ref={inputRef} placeholder="Имя" />
}`,
    bugs: [
      {
        title: 'ref нельзя передать как обычный проп',
        detail:
          'ref — особый проп, React не кладёт его в props. props.ref в функциональном компоненте undefined (а в dev будет предупреждение). Чтобы пробросить ref, нужен forwardRef.',
      },
      {
        title: 'Тип ref: any',
        detail:
          'ref: any убивает проверки. Правильная типизация — forwardRef<HTMLInputElement, Props>, чтобы родитель получил корректный тип элемента.',
      },
      {
        title: 'Если нужен не сам DOM-узел, а API — useImperativeHandle',
        detail:
          'Когда хочется отдать наружу не raw-input, а кастомные методы (focus, clear), оборачивай через useImperativeHandle — иначе родитель получит доступ ко всему DOM-узлу.',
      },
    ],
    fixedCode: `// Вариант 1 — простой проброс ref на DOM-узел:
const FancyInput = forwardRef<HTMLInputElement, { placeholder: string }>(
  function FancyInput({ placeholder }, ref) {
    return <input ref={ref} placeholder={placeholder} />
  },
)

// Вариант 2 — отдать наружу кастомный императивный API:
interface InputHandle {
  focus: () => void
  clear: () => void
}

const FancyInput2 = forwardRef<InputHandle, { placeholder: string }>(
  function FancyInput2({ placeholder }, ref) {
    const innerRef = useRef<HTMLInputElement>(null)
    useImperativeHandle(ref, () => ({
      focus: () => innerRef.current?.focus(),
      clear: () => { if (innerRef.current) innerRef.current.value = '' },
    }), [])
    return <input ref={innerRef} placeholder={placeholder} />
  },
)`,
    takeaway:
      'ref не приходит в props — для проброса используй forwardRef<ElementType, Props>. Если наружу нужен не DOM-узел, а ограниченный API, добавь useImperativeHandle. (В React 19 ref уже можно принимать как обычный проп — но forwardRef всё ещё стандарт в большинстве кодовых баз.)',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 15. Error Boundary / необработанные ошибки рендера
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'error-boundary',
    title: 'Одна ошибка в карточке рушит всё приложение',
    level: 'middle',
    categories: ['patterns'],
    brief:
      'try/catch в обработчике «ловит» ошибки рендера, но приложение всё равно падает в белый экран. Почему try/catch не помогает и что делать?',
    brokenCode: `function Dashboard({ widgets }: { widgets: Widget[] }) {
  // попытка поймать ошибку рендера через try/catch — НЕ работает
  try {
    return (
      <div>
        {widgets.map(w => (
          <WidgetCard key={w.id} widget={w} /> // тут .toFixed() на undefined → краш
        ))}
      </div>
    )
  } catch (e) {
    return <p>Что-то сломалось</p>
  }
}`,
    bugs: [
      {
        title: 'try/catch не ловит ошибки рендера дочерних компонентов',
        detail:
          'Ошибка возникает во время рендера WidgetCard, а не в момент выполнения тела Dashboard. К моменту краша try-блок уже вернул JSX. React ловит ошибки рендера только через Error Boundary (componentDidCatch / getDerivedStateFromError).',
      },
      {
        title: 'Нет изоляции сбоя',
        detail:
          'Один битый виджет роняет весь Dashboard (а без бандарии — всё дерево до корня, белый экран). Нужна гранулярная граница вокруг каждого виджета, чтобы упал только он.',
      },
      {
        title: 'Error boundary — только классовый компонент (или библиотека)',
        detail:
          'Хуков-аналога getDerivedStateFromError нет. Пишут классовый ErrorBoundary один раз либо берут react-error-boundary.',
      },
    ],
    fixedCode: `class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logToService(error, info) // отправляем в Sentry и т.п.
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function Dashboard({ widgets }: { widgets: Widget[] }) {
  return (
    <div>
      {widgets.map(w => (
        // изолируем каждый виджет: падает только он, остальные живут
        <ErrorBoundary key={w.id} fallback={<p>Виджет недоступен</p>}>
          <WidgetCard widget={w} />
        </ErrorBoundary>
      ))}
    </div>
  )
}`,
    takeaway:
      'try/catch не перехватывает ошибки рендера React — для этого есть Error Boundary (классовый компонент или react-error-boundary). Ставь гранулярные границы вокруг независимых частей UI, чтобы сбой одного блока не ронял весь экран.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 16. Оптимистичные обновления без отката
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'optimistic-update',
    title: 'Лайк «залипает» при ошибке сети',
    level: 'senior',
    categories: ['async', 'state'],
    brief:
      'Кнопка лайка обновляет UI оптимистично, но при провале запроса состояние не откатывается — счётчик врёт.',
    brokenCode: `function LikeButton({ postId, initial }: { postId: string; initial: number }) {
  const [likes, setLikes] = useState(initial)
  const [liked, setLiked] = useState(false)

  const handleLike = async () => {
    setLiked(true)
    setLikes(likes + 1)       // оптимистично
    await api.like(postId)    // если упадёт — отката нет
    // двойной клик отправит два запроса и +2 к счётчику
  }

  return <button onClick={handleLike}>♥ {likes}</button>
}`,
    bugs: [
      {
        title: 'Нет отката при ошибке',
        detail:
          'api.like может упасть (offline, 500). UI уже показал +1 лайк, но сервер его не сохранил. Без try/catch с откатом счётчик навсегда расходится с бэкендом.',
      },
      {
        title: 'Нет защиты от повторного клика',
        detail:
          'Пока запрос летит, кнопка активна. Двойной клик → два запроса, +2 локально. Нужно блокировать кнопку на время запроса (pending-флаг).',
      },
      {
        title: 'setLikes(likes + 1) использует значение из замыкания',
        detail:
          'При быстрых кликах likes устаревает. Безопаснее функциональный апдейт setLikes(n => n + 1).',
      },
    ],
    fixedCode: `function LikeButton({ postId, initial }: { postId: string; initial: number }) {
  const [likes, setLikes] = useState(initial)
  const [liked, setLiked] = useState(false)
  const [pending, setPending] = useState(false)

  const handleLike = async () => {
    if (pending || liked) return // защита от двойного клика

    // запоминаем снапшот для отката
    const prevLikes = likes
    const prevLiked = liked

    setPending(true)
    setLiked(true)
    setLikes(n => n + 1) // функциональный апдейт

    try {
      await api.like(postId)
    } catch {
      // откат к снапшоту
      setLikes(prevLikes)
      setLiked(prevLiked)
    } finally {
      setPending(false)
    }
  }

  return (
    <button onClick={handleLike} disabled={pending}>
      ♥ {likes}
    </button>
  )
}

// В React 19 для этого есть встроенный useOptimistic.`,
    takeaway:
      'Оптимистичное обновление обязано иметь откат: сохрани снапшот до мутации, верни его в catch. Блокируй повторные действия pending-флагом и обновляй счётчики функционально. В React 19 — useOptimistic.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 17. Чтение внешнего store без useSyncExternalStore (tearing)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'external-store',
    title: 'Подписка на внешний стор через useEffect — рассинхрон и tearing',
    level: 'senior',
    categories: ['hooks', 'state', 'patterns'],
    brief:
      'Компонент подписывается на внешний store вручную через useState+useEffect. В Concurrent-режиме данные «рвутся». Современный способ?',
    brokenCode: `// внешний стор вне React
const store = createStore()

function useStoreValue() {
  const [value, setValue] = useState(store.getState())

  useEffect(() => {
    // подписка происходит ПОСЛЕ первого рендера —
    // обновления между рендером и эффектом теряются
    const unsub = store.subscribe(() => setValue(store.getState()))
    return unsub
  }, [])

  return value
}`,
    bugs: [
      {
        title: 'Окно между рендером и подпиской',
        detail:
          'getState() читается при инициализации useState, а subscribe вешается только в useEffect (после коммита). Если store изменится в этом промежутке, обновление потеряется — UI покажет устаревшее значение.',
      },
      {
        title: 'Tearing в Concurrent-режиме',
        detail:
          'При конкурентном рендеринге React может прерывать и возобновлять рендер. Разные компоненты, читающие store в разные моменты, увидят разные значения одного источника — «разрыв» (tearing) UI.',
      },
      {
        title: 'Велосипед вместо штатного API',
        detail:
          'React 18 даёт useSyncExternalStore именно для безопасной подписки на внешние сторы (так под капотом работают Redux, Zustand). Ручная связка useState+useEffect воспроизводит баги, которые он решает.',
      },
    ],
    fixedCode: `const store = createStore()

function useStoreValue<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,          // подписка (стабильная ссылка)
    () => selector(store.getState()), // снимок для клиента
    () => selector(store.getInitialState()), // снимок для SSR (опционально)
  )
}

// использование
function Counter() {
  const count = useStoreValue(s => s.count)
  return <span>{count}</span>
}`,
    takeaway:
      'Для подписки на внешний (вне-React) стор используй useSyncExternalStore, а не useState+useEffect. Он закрывает окно потери обновлений и tearing в конкурентном режиме, плюс поддерживает SSR-снимок. Это то, на чём построены Redux/Zustand.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 18. Полиморфный компонент / дженерики в пропсах
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'generic-component',
    title: 'Переиспользуемый <List> теряет типы элементов',
    level: 'senior',
    categories: ['typescript', 'patterns'],
    brief:
      'Generic-список напечатан через any[], поэтому renderItem не знает тип элемента. Сделай его по-настоящему дженериком.',
    brokenCode: `interface ListProps {
  items: any[]                          // тип элемента потерян
  renderItem: (item: any) => ReactNode  // item: any внутри
}

function List({ items, renderItem }: ListProps) {
  return <ul>{items.map(renderItem)}</ul>
}

// использование — никакой проверки типов
<List
  items={users}
  renderItem={(u) => <li>{u.naem}</li>} // опечатка naem не отловится
/>`,
    bugs: [
      {
        title: 'any[] стирает тип элемента',
        detail:
          'items: any[] и item: any означают, что внутри renderItem нет ни автокомплита, ни проверки полей. Опечатка u.naem вместо u.name пройдёт компиляцию и упадёт в рантайме.',
      },
      {
        title: 'Нет связи между items и renderItem',
        detail:
          'TS не знает, что элемент items и аргумент renderItem — один и тот же тип. Нужен generic-параметр <T>, связывающий их.',
      },
      {
        title: 'Нет key',
        detail:
          'items.map(renderItem) рендерит без key — предупреждение и потенциальные баги переиспользования. Лучше задать keyExtractor.',
      },
    ],
    fixedCode: `interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => ReactNode
  keyExtractor: (item: T) => string | number
}

// generic-функция: T выводится из переданных items
function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

// использование — T = User, поля проверяются
<List
  items={users}
  keyExtractor={u => u.id}
  renderItem={u => <span>{u.name}</span>} // u.naem → ошибка компиляции ✅
/>`,
    takeaway:
      'Переиспользуемые компоненты-контейнеры (List, Table, Select) делай дженериками: <T> связывает входные данные и колбэки, TS выводит T автоматически и проверяет поля. any[] в таких местах — потеря главного преимущества TypeScript.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 19. useTransition / тяжёлый ввод блокирует UI
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'use-transition',
    title: 'Ввод в поиске «лагает» из-за тяжёлого списка',
    level: 'senior',
    categories: ['performance', 'hooks'],
    brief:
      'При вводе в инпут фильтруется список на 10k элементов синхронно — печатать невозможно. Как разгрузить ввод?',
    brokenCode: `function SearchableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('')

  // дорогая фильтрация блокирует ввод на каждый символ
  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <HugeList items={filtered} />
    </>
  )
}`,
    bugs: [
      {
        title: 'Тяжёлый рендер на каждый keystroke блокирует поток',
        detail:
          'Фильтрация 10k элементов и рендер HugeList выполняются синхронно прямо в рендере. Браузер не успевает отрисовать набранный символ, пока не закончит — инпут «залипает».',
      },
      {
        title: 'Обновление инпута и обновление списка имеют разный приоритет',
        detail:
          'Ввод — срочное обновление (пользователь ждёт мгновенного отклика). Перефильтрация списка — несрочное. React 18 умеет их разделять через useTransition/useDeferredValue.',
      },
      {
        title: 'Нет мемоизации тяжёлого вычисления',
        detail:
          'filtered пересчитывается при любом рендере, даже если query не менялся. Минимум — useMemo по [items, query].',
      },
    ],
    fixedCode: `function SearchableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('')

  // deferredQuery «отстаёт» от query — список фильтруется в фоне,
  // инпут остаётся отзывчивым
  const deferredQuery = useDeferredValue(query)

  const filtered = useMemo(
    () =>
      items.filter(i =>
        i.name.toLowerCase().includes(deferredQuery.toLowerCase()),
      ),
    [items, deferredQuery],
  )

  const isStale = query !== deferredQuery

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <HugeList items={filtered} />
      </div>
    </>
  )
}`,
    takeaway:
      'Разделяй срочные обновления (ввод) и несрочные (тяжёлая перерисовка) через useDeferredValue / useTransition. Инпут обновляется мгновенно, список догоняет в фоне. Дорогое вычисление дополнительно оборачивай в useMemo.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 20. useLayoutEffect vs useEffect (мерцание)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'layout-effect',
    title: 'Тултип мигает в углу перед тем, как встать на место',
    level: 'senior',
    categories: ['hooks', 'performance'],
    brief:
      'Позиция тултипа вычисляется по размеру DOM в useEffect — пользователь успевает увидеть «прыжок». Что выбрать?',
    brokenCode: `function Tooltip({ targetRef }: { targetRef: RefObject<HTMLElement> }) {
  const tipRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // useEffect выполняется ПОСЛЕ отрисовки кадра:
  // браузер успевает показать тултип в (0,0), затем он прыгает
  useEffect(() => {
    const rect = targetRef.current!.getBoundingClientRect()
    setPos({ top: rect.bottom, left: rect.left })
  }, [])

  return <div ref={tipRef} style={{ position: 'fixed', ...pos }}>...</div>
}`,
    bugs: [
      {
        title: 'useEffect срабатывает после пейнта → визуальный «прыжок»',
        detail:
          'useEffect выполняется асинхронно после того, как браузер уже нарисовал кадр. Тултип сперва отображается в (0,0), затем эффект пересчитывает позицию и вызывает setPos → второй кадр со скачком. Пользователь видит мерцание.',
      },
      {
        title: 'Здесь нужен useLayoutEffect',
        detail:
          'Когда измеряешь DOM и сразу применяешь стиль ДО показа кадра — это useLayoutEffect. Он выполняется синхронно после мутаций DOM, но до пейнта, поэтому скачка нет.',
      },
      {
        title: 'Важно: не злоупотреблять useLayoutEffect',
        detail:
          'Он блокирует пейнт и может тормозить. Используй его только для измерений/синхронной правки layout. Для всего остального (запросы, подписки, логирование) — обычный useEffect.',
      },
    ],
    fixedCode: `function Tooltip({ targetRef }: { targetRef: RefObject<HTMLElement> }) {
  const tipRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // useLayoutEffect: измеряем и позиционируем ДО пейнта — без мерцания
  useLayoutEffect(() => {
    const target = targetRef.current
    if (!target) return
    const rect = target.getBoundingClientRect()
    setPos({ top: rect.bottom, left: rect.left })
  }, [targetRef])

  return (
    <div ref={tipRef} style={{ position: 'fixed', ...pos }}>
      ...
    </div>
  )
}`,
    takeaway:
      'Если эффект измеряет DOM и сразу меняет видимый layout — бери useLayoutEffect, он отрабатывает до пейнта и убирает мерцание. Для несрочных побочных эффектов (fetch, подписки) оставляй useEffect, чтобы не блокировать отрисовку.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 21. Пропсы по умолчанию через "||" затирают валидные значения
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'falsy-default',
    title: 'Значение по умолчанию через || ломает 0 и пустую строку',
    level: 'middle',
    categories: ['typescript', 'patterns'],
    brief:
      'Компонент подставляет дефолты через ||. Из-за этого count={0} и title="" внезапно заменяются на дефолтные. Найди ловушку.',
    brokenCode: `interface Props {
  count?: number
  title?: string
  showBadge?: boolean
}

function Badge({ count, title, showBadge }: Props) {
  const safeCount = count || 10        // count={0} → станет 10!
  const safeTitle = title || 'Без имени' // title="" → 'Без имени'
  const visible = showBadge || true     // всегда true, проп бесполезен

  return visible ? <span title={safeTitle}>{safeCount}</span> : null
}`,
    bugs: [
      {
        title: '|| срабатывает на всех falsy, не только на undefined',
        detail:
          '0, "", false, NaN — валидные значения, но falsy. count || 10 превратит легитимный 0 в 10, title || "..." затрёт намеренно пустую строку. Это частый и коварный баг.',
      },
      {
        title: 'showBadge || true всегда true',
        detail:
          'X || true === true при любом X. Проп showBadge не влияет ни на что — логика сломана. Нужен ?? с осмысленным дефолтом или явное сравнение.',
      },
      {
        title: 'Дефолты лучше задавать в деструктуризации',
        detail:
          'Параметры по умолчанию { count = 10 } применяются только когда значение строго undefined — ровно то поведение, которое обычно нужно.',
      },
    ],
    fixedCode: `interface Props {
  count?: number
  title?: string
  showBadge?: boolean
}

// дефолты в деструктуризации: срабатывают только на undefined
function Badge({ count = 10, title = 'Без имени', showBadge = true }: Props) {
  // count={0} остаётся 0, title="" остаётся ""
  return showBadge ? <span title={title}>{count}</span> : null
}

// если значение приходит не из пропсов, а вычисляется — используй ??:
const limit = configValue ?? 10 // заменит только null/undefined`,
    takeaway:
      'Не используй || для значений по умолчанию у чисел/строк/булевых — оно затирает валидные 0, "", false. Дефолты задавай в деструктуризации параметров (= …) или через ?? (nullish coalescing), которые реагируют только на null/undefined.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 22. Объявление компонента внутри компонента
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'nested-component',
    title: 'Вложенный компонент сбрасывает state и теряет фокус',
    level: 'middle',
    categories: ['performance', 'patterns', 'state'],
    brief:
      'Дочерний компонент объявлен внутри родителя. При каждом вводе инпут теряет фокус, а его состояние обнуляется.',
    brokenCode: `function Parent() {
  const [value, setValue] = useState('')

  // НОВЫЙ тип компонента создаётся на каждый рендер Parent
  function Child() {
    return (
      <input value={value} onChange={e => setValue(e.target.value)} />
    )
  }

  return (
    <div>
      <Child />
    </div>
  )
}`,
    bugs: [
      {
        title: 'Новый компонент на каждом рендере = размонтирование',
        detail:
          'Каждый рендер Parent создаёт новую функцию Child (новая ссылка → новый тип элемента для React). React считает это другим компонентом, размонтирует старый и монтирует новый. Внутреннее состояние и фокус теряются на каждый keystroke.',
      },
      {
        title: 'Потеря производительности и багов реконсиляции',
        detail:
          'Постоянный mount/unmount ломает анимации, фокус, позицию скролла, состояние неуправляемых инпутов. Это один из самых частых «необъяснимых» багов.',
      },
      {
        title: 'Решение: выносить компонент наружу',
        detail:
          'Объявляй Child на уровне модуля и передавай зависимости пропсами. Если нужен доступ к замыканию — пробрасывай через props, а не определяй компонент внутри.',
      },
    ],
    fixedCode: `// Child объявлен ОДИН раз на уровне модуля — стабильный тип
function Child({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return <input value={value} onChange={e => onChange(e.target.value)} />
}

function Parent() {
  const [value, setValue] = useState('')

  return (
    <div>
      <Child value={value} onChange={setValue} />
    </div>
  )
}`,
    takeaway:
      'Никогда не объявляй компонент внутри другого компонента — на каждом рендере рождается новый тип, React всё размонтирует, теряя state и фокус. Выноси компонент на уровень модуля и передавай данные через пропсы.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 23. Опасный dangerouslySetInnerHTML / XSS
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'xss-html',
    title: 'Рендер пользовательского HTML открывает XSS',
    level: 'senior',
    categories: ['patterns', 'a11y'],
    brief:
      'Комментарии рендерятся через dangerouslySetInnerHTML без санитизации — классическая XSS-дыра. Как безопасно?',
    brokenCode: `function Comment({ html }: { html: string }) {
  // пользовательский ввод вставляется как сырой HTML:
  // <img src=x onerror="fetch('/steal?c='+document.cookie)">
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}`,
    bugs: [
      {
        title: 'XSS: исполнение чужого скрипта',
        detail:
          'dangerouslySetInnerHTML вставляет строку без экранирования. Если html пришёл от пользователя, злоумышленник внедрит <img onerror>, <script> или onclick — и выполнит код в контексте жертвы (кража cookie/токенов).',
      },
      {
        title: 'Нет санитизации',
        detail:
          'Сырой HTML нужно прогонять через санитайзер (DOMPurify) с белым списком тегов/атрибутов, удаляющий обработчики событий и javascript:-ссылки.',
      },
      {
        title: 'Часто HTML вообще не нужен',
        detail:
          'Если контент — обычный текст, JSX сам экранирует {text}, и dangerouslySetInnerHTML не требуется. Самый безопасный вариант — вообще не вставлять HTML.',
      },
    ],
    fixedCode: `import DOMPurify from 'dompurify'

// Вариант 1 — если нужен только текст, JSX экранирует сам:
function CommentText({ text }: { text: string }) {
  return <div>{text}</div> // безопасно по умолчанию
}

// Вариант 2 — если действительно нужен HTML (разметка), санитизируем:
function CommentHtml({ html }: { html: string }) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href'],
      }),
    [html],
  )
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}`,
    takeaway:
      'dangerouslySetInnerHTML с пользовательским вводом = XSS. Если нужен только текст — рендерь через {text}, JSX экранирует. Если нужна разметка — обязательно санитизируй (DOMPurify) с белым списком тегов и атрибутов.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 24. Controlled / uncontrolled переключение инпута
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'controlled-input',
    title: 'Инпут прыгает между controlled и uncontrolled',
    level: 'middle',
    categories: ['state', 'patterns'],
    brief:
      'Консоль ругается: "A component is changing an uncontrolled input to controlled". Найди, почему value то undefined, то строка.',
    brokenCode: `function ProfileForm({ user }: { user?: User }) {
  // если user не пришёл сразу, user?.name === undefined →
  // инпут стартует uncontrolled, а после загрузки становится controlled
  const [name, setName] = useState(user?.name)

  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
    />
  )
}`,
    bugs: [
      {
        title: 'value начинается с undefined',
        detail:
          'useState(user?.name) при отсутствующем user даёт undefined. React трактует value={undefined} как uncontrolled. Когда данные подгрузятся и name станет строкой, инпут переключается на controlled — отсюда предупреждение и возможная потеря ввода.',
      },
      {
        title: 'Контролируемость пропа должна быть стабильной',
        detail:
          'Инпут обязан быть либо всё время controlled (value всегда определён), либо всё время uncontrolled (только defaultValue). Смешивать нельзя.',
      },
      {
        title: 'Внешний user не синхронизируется',
        detail:
          'useState читает user?.name только при инициализации. Если user приходит позже, поле не обновится. Нужен либо ключ-ремаунт, либо контролируемая синхронизация.',
      },
    ],
    fixedCode: `function ProfileForm({ user }: { user?: User }) {
  // всегда строка → инпут всегда controlled
  const [name, setName] = useState(user?.name ?? '')

  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
    />
  )
}

// Если форма должна перезагружаться под нового user — ремаунт по key:
// <ProfileForm key={user?.id} user={user} />`,
    takeaway:
      'Контролируемый инпут должен иметь определённый value на всех рендерах — инициализируй стейт через ?? "" (или 0), а не оставляй undefined. Чтобы подхватить внешние данные, ремаунти форму через key, а не мутируй стейт скрытно.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 25. Suspense + data fetching / водопад запросов
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'fetch-waterfall',
    title: 'Последовательные запросы создают водопад загрузки',
    level: 'senior',
    categories: ['async', 'performance', 'patterns'],
    brief:
      'Страница грузит пользователя, потом его посты, потом комментарии — каждый ждёт предыдущий. Загрузка втрое дольше нужного.',
    brokenCode: `function Page({ userId }: { userId: string }) {
  const [user, setUser] = useState<User>()
  const [posts, setPosts] = useState<Post[]>()
  const [stats, setStats] = useState<Stats>()

  useEffect(() => {
    // три НЕЗАВИСИМЫХ запроса выполняются последовательно (водопад)
    fetchUser(userId).then(u => {
      setUser(u)
      fetchPosts(userId).then(p => {
        setPosts(p)
        fetchStats(userId).then(setStats)
      })
    })
  }, [userId])

  if (!user || !posts || !stats) return <Spinner />
  return <Profile user={user} posts={posts} stats={stats} />
}`,
    bugs: [
      {
        title: 'Независимые запросы выполняются последовательно',
        detail:
          'fetchUser, fetchPosts, fetchStats не зависят друг от друга — все принимают только userId. Но вложенные .then превращают их в водопад: общий ttfb = сумма трёх задержек вместо максимума.',
      },
      {
        title: 'Колбэк-ад и риск гонок',
        detail:
          'Вложенные промисы трудно читать и невозможно нормально отменить при смене userId. Каждый уровень — потенциальная утечка/гонка.',
      },
      {
        title: 'Всё-или-ничего загрузка',
        detail:
          'Один спиннер до готовности всех трёх. Можно показывать части по мере готовности (Suspense или отдельные состояния).',
      },
    ],
    fixedCode: `function Page({ userId }: { userId: string }) {
  const [data, setData] = useState<{
    user: User; posts: Post[]; stats: Stats
  }>()

  useEffect(() => {
    let cancelled = false
    // параллельно: общее время = max(t1, t2, t3)
    Promise.all([
      fetchUser(userId),
      fetchPosts(userId),
      fetchStats(userId),
    ]).then(([user, posts, stats]) => {
      if (!cancelled) setData({ user, posts, stats })
    })
    return () => { cancelled = true }
  }, [userId])

  if (!data) return <Spinner />
  return <Profile {...data} />
}

// С React Query/Suspense — те же запросы запускаются параллельно
// на уровне компонента, а <Suspense> показывает фолбэк декларативно.`,
    takeaway:
      'Независимые запросы запускай параллельно через Promise.all — общее время равно самому долгому, а не их сумме. Вложенные .then оправданы только когда следующий запрос реально зависит от результата предыдущего.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 26. IntersectionObserver / бесконечный скролл на scroll-событии
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'infinite-scroll',
    title: 'Бесконечный скролл на onScroll тормозит и грузит дубли',
    level: 'senior',
    categories: ['performance', 'hooks', 'memory-leak'],
    brief:
      'Подгрузка следующей страницы повешена на onScroll с расчётом offset. Скролл лагает, а страницы иногда грузятся дважды.',
    brokenCode: `function Feed() {
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const onScroll = () => {
      // тяжёлый расчёт на КАЖДЫЙ кадр скролла
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setPage(p => p + 1) // может выстрелить много раз подряд
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    loadPage(page).then(newItems =>
      setItems(prev => [...prev, ...newItems]),
    )
  }, [page])

  return <List items={items} />
}`,
    bugs: [
      {
        title: 'onScroll стреляет десятки раз в секунду',
        detail:
          'Обработчик scroll вызывается на каждый кадр прокрутки и делает синхронные чтения layout (offsetHeight, scrollY) — это reflow. Скролл начинает лагать.',
      },
      {
        title: 'Дублирующая подгрузка',
        detail:
          'Пока loadPage летит, условие остаётся истинным несколько кадров подряд → setPage срабатывает многократно, страницы 2,3,4 грузятся залпом. Нужен флаг «загрузка идёт» / защита.',
      },
      {
        title: 'Современный способ — IntersectionObserver',
        detail:
          'Вместо ручного расчёта offset вешают наблюдатель на «сентинел»-элемент в конце списка. Браузер сам сообщает о пересечении — без scroll-спама и reflow.',
      },
    ],
    fixedCode: `function Feed() {
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    loadPage(page)
      .then(newItems => setItems(prev => [...prev, ...newItems]))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        // подгружаем только если виден И не идёт загрузка
        if (entry.isIntersecting && !loading) setPage(p => p + 1)
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

  return (
    <>
      <List items={items} />
      <div ref={sentinelRef} />
    </>
  )
}`,
    takeaway:
      'Для бесконечного скролла используй IntersectionObserver на элементе-сентинеле, а не onScroll с ручным reflow. Защищай подгрузку флагом loading, чтобы исключить дубли. Observer всегда отключай в cleanup.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 27. useId / дублирующиеся id для label
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'use-id',
    title: 'Хардкод id ломает <label> при нескольких инстансах',
    level: 'middle',
    categories: ['a11y', 'patterns'],
    brief:
      'Поле формы использует фиксированный id="email". При двух таких полях на странице клик по label фокусирует не то поле. Плюс ломается SSR-гидрация.',
    brokenCode: `function Field({ label }: { label: string }) {
  // хардкод id — конфликтует при нескольких инстансах на странице
  return (
    <div>
      <label htmlFor="field">{label}</label>
      <input id="field" />
    </div>
  )
}

// <Field label="Email" /> <Field label="Имя" />
// оба input получают id="field" — невалидный HTML, label сломан`,
    bugs: [
      {
        title: 'Дублирующиеся id на странице',
        detail:
          'id обязан быть уникальным. Два <Field /> создают два input с id="field". Клик по любому label фокусирует первый input, скринридеры путаются — нарушение доступности и валидности HTML.',
      },
      {
        title: 'Math.random() для id ломает SSR',
        detail:
          'Соблазн сделать id={Math.random()} приводит к рассинхрону: сервер и клиент сгенерируют разные id → ошибка гидрации. id должен быть стабильным между сервером и клиентом.',
      },
      {
        title: 'Для этого есть useId',
        detail:
          'React 18 useId генерирует стабильный уникальный id, согласованный между SSR и клиентом. Именно его и нужно использовать для связывания label/input, aria-атрибутов.',
      },
    ],
    fixedCode: `function Field({ label }: { label: string }) {
  const id = useId() // уникален и стабилен (SSR-safe)

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </div>
  )
}

// Один useId можно делить на несколько связанных полей через суффиксы:
function Group() {
  const id = useId()
  return (
    <>
      <input id={\`\${id}-first\`} aria-describedby={\`\${id}-hint\`} />
      <p id={\`\${id}-hint\`}>Подсказка</p>
    </>
  )
}`,
    takeaway:
      'Для связывания label/input и aria-атрибутов используй useId — он даёт уникальный, SSR-совместимый id. Никогда не хардкодь id и не генерируй его через Math.random/Date.now: это ломает доступность и гидрацию.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 28. Портал + focus trap для модалки
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'modal-portal',
    title: 'Модалка обрезается overflow и не ловит Escape/фокус',
    level: 'senior',
    categories: ['a11y', 'patterns', 'memory-leak'],
    brief:
      'Модальное окно рендерится внутри карточки с overflow:hidden — обрезается. Плюс нет закрытия по Escape и фокус уходит за модалку. Доведи до ума.',
    brokenCode: `function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null

  // рендерится в текущем DOM-дереве: z-index и overflow родителя ломают его
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog">{children}</div>
    </div>
  )
  // нет: Escape, focus trap, блокировки скролла, aria-ролей
}`,
    bugs: [
      {
        title: 'Рендер в дереве родителя → обрезание и z-index войны',
        detail:
          'Модалка наследует overflow:hidden, transform и z-index контекст родителя. Её обрезает/перекрывает. Решение — createPortal в document.body, вне иерархии стилей.',
      },
      {
        title: 'Нет закрытия по Escape и блокировки фоновой прокрутки',
        detail:
          'Пользователь ждёт Escape для закрытия и не ждёт, что фон скроллится под модалкой. Это эффект на keydown + блокировка body overflow, снимаемые в cleanup.',
      },
      {
        title: 'Нет focus trap и aria-ролей',
        detail:
          'Фокус должен переходить в модалку при открытии и не «убегать» наружу по Tab; нужны role="dialog" и aria-modal. Без этого диалог недоступен для клавиатуры и скринридеров.',
      },
    ],
    fixedCode: `function Modal({ open, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    // блокируем прокрутку фона
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // переносим фокус в диалог
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  // рендерим в body — вне overflow/z-index родителя
  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={e => e.stopPropagation()} // клик внутри не закрывает
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}`,
    takeaway:
      'Модалки рендери через createPortal в body, чтобы уйти от overflow/z-index родителя. Добавь закрытие по Escape, блокировку скролла фона, перенос фокуса и role="dialog"/aria-modal. Все слушатели снимай в cleanup. Для продакшена — Radix/HeadlessUI с полноценным focus-trap.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 29. Зависимость от функции из пропсов в эффекте
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'effect-callback-dep',
    title: 'Эффект перезапускается из-за нестабильного колбэка из пропсов',
    level: 'senior',
    categories: ['hooks', 'performance'],
    brief:
      'Эффект подписки переподписывается на каждый рендер родителя, потому что onMessage приходит новой функцией. Как зависеть от свежего колбэка, не пересоздавая подписку?',
    brokenCode: `function Chat({ roomId, onMessage }: {
  roomId: string
  onMessage: (m: Message) => void
}) {
  useEffect(() => {
    const socket = connect(roomId)
    socket.on('message', onMessage)
    return () => socket.disconnect()
    // onMessage меняется каждый рендер родителя →
    // сокет переподключается постоянно
  }, [roomId, onMessage])

  return <div>Комната {roomId}</div>
}`,
    bugs: [
      {
        title: 'Нестабильный onMessage пересоздаёт подписку',
        detail:
          'Родитель почти наверняка передаёт инлайн-функцию. onMessage в deps означает: каждый рендер родителя → новый onMessage → cleanup+reconnect сокета. Дорого и рвёт соединение.',
      },
      {
        title: 'Убрать onMessage из deps — получить stale closure',
        detail:
          'Соблазн просто выкинуть onMessage из массива. Тогда сокет будет звать первую (устаревшую) версию колбэка — баг с устаревшими данными. Линтер тоже будет ругаться.',
      },
      {
        title: 'Нужен паттерн «latest ref» (предвестник useEffectEvent)',
        detail:
          'Свежий колбэк держим в ref, обновляем в эффекте, а в подписке зовём ref.current. Подписка зависит только от roomId. В новых React это решается useEffectEvent.',
      },
    ],
    fixedCode: `function Chat({ roomId, onMessage }: {
  roomId: string
  onMessage: (m: Message) => void
}) {
  // всегда держим свежий колбэк, не завися от него в подписке
  const onMessageRef = useRef(onMessage)
  useEffect(() => {
    onMessageRef.current = onMessage
  })

  useEffect(() => {
    const socket = connect(roomId)
    // зовём актуальную версию через ref
    socket.on('message', m => onMessageRef.current(m))
    return () => socket.disconnect()
    // подписка пересоздаётся ТОЛЬКО при смене комнаты
  }, [roomId])

  return <div>Комната {roomId}</div>
}

// В React с useEffectEvent (экспериментальный/новый API):
// const onMsg = useEffectEvent(onMessage)
// useEffect(() => { socket.on('message', onMsg); ... }, [roomId])`,
    takeaway:
      'Чтобы эффект использовал свежий колбэк, но не пересоздавался из-за него, держи колбэк в ref (обновляемом в отдельном эффекте) и зови ref.current внутри подписки. Подписка зависит только от «настоящих» зависимостей (roomId). Это паттерн, который штатно решает useEffectEvent.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 30. Batching и промежуточный рендер
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'state-batching',
    title: 'Цепочка setState читает устаревшее значение',
    level: 'middle',
    categories: ['state', 'hooks'],
    brief:
      'Несколько setState подряд опираются друг на друга через текущее значение — итог неверный. Разбери, как работает батчинг.',
    brokenCode: `function Counter() {
  const [count, setCount] = useState(0)

  const addThree = () => {
    // все три читают одно и то же count из замыкания (=0)
    setCount(count + 1) // 1
    setCount(count + 1) // снова 1
    setCount(count + 1) // снова 1
    // итог: 1, а не 3
  }

  return <button onClick={addThree}>{count}</button>
}`,
    bugs: [
      {
        title: 'Все апдейты читают одно значение из замыкания',
        detail:
          'count в момент клика равен 0 для всех трёх вызовов. setCount(count + 1) три раза — это setCount(1) три раза. React батчит их, итоговое состояние = 1, а не 3.',
      },
      {
        title: 'Непонимание батчинга',
        detail:
          'React группирует множественные setState в один ререндер (в React 18 — и в промисах/таймаутах тоже). Между ними состояние НЕ обновляется синхронно — нельзя полагаться на «прочитать только что записанное».',
      },
      {
        title: 'Решение — функциональная форма',
        detail:
          'setCount(c => c + 1) получает актуальное промежуточное значение из очереди апдейтов, поэтому три вызова дают +3.',
      },
    ],
    fixedCode: `function Counter() {
  const [count, setCount] = useState(0)

  const addThree = () => {
    // каждый апдейт получает результат предыдущего из очереди
    setCount(c => c + 1)
    setCount(c => c + 1)
    setCount(c => c + 1)
    // итог: 3 ✅
  }

  return <button onClick={addThree}>{count}</button>
}`,
    takeaway:
      'React батчит несколько setState в один ререндер и не обновляет состояние синхронно между ними. Когда апдейты зависят от предыдущего значения, всегда используй функциональную форму setState(prev => ...), а не значение из замыкания.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 31. localStorage / синхронизация и SSR
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'localstorage-hook',
    title: 'usePersistedState теряет данные и падает на SSR',
    level: 'middle',
    categories: ['hooks', 'state'],
    brief:
      'Хук «запоминает» значение в localStorage, но читает его при каждом рендере, не пишет при изменении и валится при серверном рендере.',
    brokenCode: `function usePersistedState(key: string, initial: string) {
  // localStorage.getItem вызывается на КАЖДЫЙ рендер (синхронное I/O)
  // и упадёт на сервере, где localStorage нет
  const stored = localStorage.getItem(key)
  const [value, setValue] = useState(stored || initial)

  // значение никогда не пишется обратно в localStorage
  return [value, setValue] as const
}`,
    bugs: [
      {
        title: 'getItem на каждом рендере',
        detail:
          'localStorage.getItem(key) в теле хука выполняется при каждом рендере — лишнее синхронное I/O. Чтение нужно один раз, при инициализации, через ленивый инициализатор useState.',
      },
      {
        title: 'Нет записи обратно',
        detail:
          'setValue меняет только React-стейт. В localStorage ничего не пишется — после перезагрузки значение теряется. Нужен эффект, синхронизирующий value → localStorage.',
      },
      {
        title: 'SSR-краш',
        detail:
          'На сервере localStorage не существует — обращение к нему в теле компонента бросит исключение при серверном рендере. Нужна проверка typeof window.',
      },
    ],
    fixedCode: `function usePersistedState(key: string, initial: string) {
  // ленивый инициализатор: чтение один раз + SSR-safe
  const [value, setValue] = useState<string>(() => {
    if (typeof window === 'undefined') return initial
    try {
      return localStorage.getItem(key) ?? initial
    } catch {
      return initial
    }
  })

  // пишем обратно при изменении
  useEffect(() => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* квота/приватный режим — игнорируем */
    }
  }, [key, value])

  return [value, setValue] as const
}`,
    takeaway:
      'localStorage читай один раз через ленивый инициализатор useState(() => ...), а не в теле хука. Синхронизируй обратно через useEffect и оборачивай доступ в typeof window + try/catch, чтобы пережить SSR и заблокированное хранилище.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 32. Спред пропсов и затирание/утечка системных атрибутов
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'props-spread',
    title: '{...props} перетирает className и протекает в DOM',
    level: 'middle',
    categories: ['patterns', 'typescript'],
    brief:
      'Кнопка-обёртка спредит пропсы так, что её собственный className затирается, обработчик теряется, а кастомные пропсы валятся в DOM как невалидные атрибуты.',
    brokenCode: `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'ghost'
  loading?: boolean
}

function Button({ variant, loading, ...props }: ButtonProps) {
  return (
    <button
      {...props}                    // className из props идёт первым
      className={\`btn btn-\${variant}\`} // ... но дальше его перезатирают?
      onClick={props.onClick}       // дублируем то, что уже в props
    >
      {loading ? '...' : props.children}
    </button>
  )
}`,
    bugs: [
      {
        title: 'Конфликт className из {...props} и собственного',
        detail:
          'Если в props пришёл className, он попадёт в спред, а затем собственный className его перезапишет — внешний класс потеряется. Нужно объединять классы, а не перетирать.',
      },
      {
        title: 'Дублирование onClick',
        detail:
          'onClick уже внутри {...props}; повторное onClick={props.onClick} избыточно. А если бы хотели добавить свою логику — её надо комбинировать, а не дублировать.',
      },
      {
        title: 'Кастомные пропсы протекают в DOM (если расширять не HTML-тип)',
        detail:
          'Здесь variant/loading извлечены — это правильно. Но частая ошибка — спредить объект с кастомными полями (variant, isActive) прямо на DOM-узел: React выдаёт предупреждение о неизвестных атрибутах. Всегда вынимай небраузерные пропсы до спреда.',
      },
    ],
    fixedCode: `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'ghost'
  loading?: boolean
}

function Button({
  variant,
  loading,
  className,        // вынимаем, чтобы объединить, а не перетереть
  children,
  disabled,
  ...rest           // только валидные DOM-атрибуты
}: ButtonProps) {
  return (
    <button
      {...rest}
      // собственные классы + внешний className
      className={['btn', \`btn-\${variant}\`, className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
    >
      {loading ? '...' : children}
    </button>
  )
}`,
    takeaway:
      'При проксировании пропсов вынимай кастомные (variant, loading) и className/children из ...rest, чтобы в DOM шли только валидные атрибуты, а классы объединялись, а не перетирались. Спредить ...rest нужно ДО собственных пропсов, которые должны иметь приоритет.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 33. useEffect для синхронизации стейта вместо обработчика события
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'effect-as-handler',
    title: 'useEffect вызывает onChange — лишние срабатывания и циклы',
    level: 'senior',
    categories: ['hooks', 'patterns', 'state'],
    brief:
      'Эффект «реагирует» на изменение состояния и зовёт колбэк родителя. Получаются лишние вызовы и риск цикла. Это должно быть в обработчике события.',
    brokenCode: `function Select({ options, onChange }: {
  options: Option[]
  onChange: (v: string) => void
}) {
  const [selected, setSelected] = useState(options[0].id)

  // эффект уведомляет родителя при каждом изменении selected —
  // но также сработает на маунт и на любую внешнюю смену options
  useEffect(() => {
    onChange(selected)
  }, [selected])

  return (
    <select
      value={selected}
      onChange={e => setSelected(e.target.value)}
    >
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  )
}`,
    bugs: [
      {
        title: 'Эффект используется как реакция на событие пользователя',
        detail:
          'Выбор опции — это конкретное событие (onChange селекта). Уведомлять родителя нужно прямо в обработчике. Эффект же сработает ещё и на маунт (лишний onChange), и при любой причине ререндера, меняющей selected косвенно.',
      },
      {
        title: 'Срабатывание на монтировании',
        detail:
          'useEffect с [selected] вызовет onChange сразу при первом рендере, хотя пользователь ничего не выбирал. Это частый источник «фантомных» событий и нежелательных запросов.',
      },
      {
        title: 'Риск цикла и лишних рендеров',
        detail:
          'Если onChange родителя приводит к смене пропсов, которые меняют selected, можно получить каскад «эффект → onChange → ререндер → эффект». Обработчик события этой петли не создаёт.',
      },
    ],
    fixedCode: `function Select({ options, onChange }: {
  options: Option[]
  onChange: (v: string) => void
}) {
  const [selected, setSelected] = useState(options[0].id)

  // уведомляем родителя ПРЯМО в обработчике события — никаких лишних эффектов
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelected(value)
    onChange(value)
  }

  return (
    <select value={selected} onChange={handleChange}>
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  )
}`,
    takeaway:
      'Если действие вызвано конкретным событием пользователя (клик, выбор, ввод), обрабатывай его в обработчике события, а не в useEffect. Эффекты нужны для синхронизации с внешними системами, а не для реакции на пользовательские действия — это прямо из доктрины "You Might Not Need an Effect".',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // React 19 — новые API и паттерны (#34–45)
  // ═══════════════════════════════════════════════════════════════════════

  // ───────────────────────────────────────────────────────────────────────
  // 34. forwardRef больше не нужен (ref как обычный проп)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-ref-as-prop',
    title: 'React 19: forwardRef-обёртка теперь лишний бойлерплейт',
    level: 'middle',
    categories: ['react-19', 'patterns', 'typescript'],
    brief:
      'Компонент написан на forwardRef, как было принято в React 18. В React 19 это устаревший бойлерплейт — ref можно принимать как обычный проп.',
    brokenCode: `// Стиль React 18: forwardRef ради проброса ref
const TextInput = forwardRef<HTMLInputElement, { label: string }>(
  function TextInput({ label }, ref) {
    return (
      <label>
        {label}
        <input ref={ref} />
      </label>
    )
  },
)

// дополнительный шум: displayName, generic-параметры в обёртке`,
    bugs: [
      {
        title: 'forwardRef в React 19 — устаревший паттерн',
        detail:
          'Начиная с React 19 ref передаётся в функциональный компонент как обычный проп. forwardRef всё ещё работает, но помечен как deprecated и будет удалён в будущих версиях. Обёртка добавляет лишний слой и усложняет типизацию.',
      },
      {
        title: 'Лишняя сложность типов',
        detail:
          'forwardRef<Ref, Props> ставит дженерики в непривычном порядке (сначала ref, потом props) и плохо дружит с дженерик-компонентами. Ref как проп типизируется естественно.',
      },
    ],
    fixedCode: `// React 19: ref — это просто проп
function TextInput({
  label,
  ref,
}: {
  label: string
  ref?: React.Ref<HTMLInputElement>
}) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  )
}

// Использование не меняется:
// <TextInput ref={inputRef} label="Имя" />
//
// Дженерик-компоненты теперь тоже легко принимают ref как проп,
// без «обёрточной» гимнастики forwardRef.`,
    takeaway:
      'В React 19 ref передаётся как обычный проп — forwardRef больше не нужен и помечен deprecated. Для нового кода объявляй ref в пропсах напрямую; это особенно упрощает дженерик-компоненты. (codemod react-codemod заменяет forwardRef автоматически.)',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 35. use() для чтения промиса вместо useEffect+useState
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-use-promise',
    title: 'React 19: ручной useEffect+useState вместо use() + Suspense',
    level: 'senior',
    categories: ['react-19', 'async', 'hooks', 'patterns'],
    brief:
      'Загрузка данных написана классической связкой useEffect/useState с тремя флагами. В React 19 промис можно читать через use() и отдать загрузку/ошибку Suspense и Error Boundary.',
    brokenCode: `function Profile({ userPromise }: { userPromise: Promise<User> }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    userPromise
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [userPromise])

  if (loading) return <Spinner />
  if (error) return <p>Ошибка</p>
  return <h2>{user!.name}</h2>
}`,
    bugs: [
      {
        title: 'Ручное управление loading/error для промиса',
        detail:
          'Три состояния + useEffect воспроизводят то, что в React 19 делает хук use(): он «разворачивает» промис, приостанавливая компонент до резолва. Не нужно ни флага loading, ни ветки ошибки внутри компонента.',
      },
      {
        title: 'Загрузка и ошибка должны быть декларативными',
        detail:
          'Состояние загрузки естественно выражается через <Suspense fallback>, а ошибка — через Error Boundary. Локальные if (loading)/if (error) дублируют то, что уже умеет дерево.',
      },
      {
        title: 'use() можно вызывать условно (в отличие от других хуков)',
        detail:
          'use() — особый хук: его допустимо вызывать внутри условий и циклов. Это его ключевое отличие от useState/useEffect.',
      },
    ],
    fixedCode: `// userPromise создаётся выше (или кэшируется), чтобы не пересоздаваться
function Profile({ userPromise }: { userPromise: Promise<User> }) {
  // use() разворачивает промис: компонент «приостановится» до резолва
  const user = use(userPromise)
  return <h2>{user.name}</h2>
}

// Загрузка и ошибки — декларативно в дереве:
function Page({ userPromise }: { userPromise: Promise<User> }) {
  return (
    <ErrorBoundary fallback={<p>Ошибка</p>}>
      <Suspense fallback={<Spinner />}>
        <Profile userPromise={userPromise} />
      </Suspense>
    </ErrorBoundary>
  )
}`,
    takeaway:
      'В React 19 use(promise) разворачивает промис, отдавая загрузку Suspense, а ошибку — Error Boundary. Это убирает тройку useState+useEffect. Важно: промис нельзя создавать прямо в рендере (он будет новым каждый раз) — кэшируй его или создавай выше. use() также читает контекст и может вызываться условно.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 36. use(Context) вместо useContext
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-use-context',
    title: 'React 19: useContext в условии нельзя, а use(Context) — можно',
    level: 'middle',
    categories: ['react-19', 'hooks', 'patterns'],
    brief:
      'Компонент должен читать тему только при определённом условии, но useContext нельзя вызвать условно — приходится городить лишнее. В React 19 use() решает это.',
    brokenCode: `function Item({ highlighted }: { highlighted: boolean }) {
  // нельзя вызвать useContext внутри if — нарушение правил хуков
  // поэтому читаем всегда, даже когда не нужно
  const theme = useContext(ThemeContext)

  if (highlighted) {
    return <div style={{ color: theme.accent }}>...</div>
  }
  return <div>...</div>
}`,
    bugs: [
      {
        title: 'useContext нельзя вызывать условно',
        detail:
          'Как и другие хуки, useContext обязан вызываться безусловно на верхнем уровне. Поэтому контекст читается всегда, даже в ветке, где он не нужен.',
      },
      {
        title: 'use(Context) снимает это ограничение',
        detail:
          'В React 19 use(ThemeContext) можно вызывать внутри условий и циклов — ровно там, где значение реально требуется. Это часть унификации use() для промисов и контекста.',
      },
    ],
    fixedCode: `function Item({ highlighted }: { highlighted: boolean }) {
  if (highlighted) {
    // use() допустимо вызывать условно
    const theme = use(ThemeContext)
    return <div style={{ color: theme.accent }}>...</div>
  }
  return <div>...</div>
}`,
    takeaway:
      'use(Context) читает контекст так же, как useContext, но его можно вызывать условно — внутри if/циклов. Удобно, когда значение нужно лишь в части веток. (Для безусловного чтения оба варианта эквивалентны.)',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 37. <Context> как провайдер вместо <Context.Provider>
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-context-provider',
    title: 'React 19: <Context.Provider> можно заменить на <Context>',
    level: 'middle',
    categories: ['react-19', 'patterns'],
    brief:
      'Мелкое, но приятное упрощение React 19: сам объект контекста теперь можно рендерить как провайдер.',
    brokenCode: `const ThemeContext = createContext<Theme>(defaultTheme)

function App() {
  return (
    // React 18: обязательно .Provider
    <ThemeContext.Provider value={theme}>
      <Layout />
    </ThemeContext.Provider>
  )
}`,
    bugs: [
      {
        title: '.Provider — лишний шаг в React 19',
        detail:
          'В React 19 <Context value={...}> работает как провайдер напрямую. <Context.Provider> по-прежнему поддерживается, но будет постепенно выводиться из обихода. Меньше синтаксического шума.',
      },
    ],
    fixedCode: `const ThemeContext = createContext<Theme>(defaultTheme)

function App() {
  return (
    // React 19: сам контекст — провайдер
    <ThemeContext value={theme}>
      <Layout />
    </ThemeContext>
  )
}`,
    takeaway:
      'В React 19 <Context value={...}> заменяет <Context.Provider value={...}>. Семантика та же — просто короче. Существующий .Provider продолжает работать, миграция не срочная (есть codemod).',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 38. Actions + useActionState вместо ручного submit-стейта
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-action-state',
    title: 'React 19: ручной стейт формы вместо <form action> + useActionState',
    level: 'senior',
    categories: ['react-19', 'async', 'state', 'patterns'],
    brief:
      'Сабмит формы написан вручную: preventDefault, флаги pending/error, try/catch. React 19 даёт Actions — асинхронную функцию прямо в action формы — и useActionState.',
    brokenCode: `function NameForm() {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await updateName(name)
    } catch (err) {
      setError(String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button disabled={pending}>Сохранить</button>
      {error && <p>{error}</p>}
    </form>
  )
}`,
    bugs: [
      {
        title: 'Ручное управление pending/error для сабмита',
        detail:
          'preventDefault + флаги pending/error + try/catch — это шаблон, который в React 19 берёт на себя useActionState. Он сам отслеживает состояние ожидания и результат экшена.',
      },
      {
        title: 'Не используется нативный <form action>',
        detail:
          'В React 19 в action формы можно передать асинхронную функцию (Action). React сам вызовет её с FormData, обработает pending и сбросит форму. onSubmit + preventDefault больше не обязателен.',
      },
      {
        title: 'pending лучше брать из useFormStatus в дочерней кнопке',
        detail:
          'Состояние отправки кнопке не нужно прокидывать пропсом — useFormStatus читает его из ближайшей формы.',
      },
    ],
    fixedCode: `function NameForm() {
  // useActionState: [состояние, обёрнутый action, isPending]
  const [error, submitAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await updateName(formData.get('name') as string)
        return null // нет ошибки
      } catch (err) {
        return String(err) // станет новым состоянием
      }
    },
    null,
  )

  return (
    <form action={submitAction}>
      <input name="name" />
      <SubmitButton />
      {error && <p>{error}</p>}
    </form>
  )
}

// pending берём из контекста формы, без пропсов:
function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>Сохранить</button>
}`,
    takeaway:
      'React 19 Actions: передавай async-функцию в <form action>, а состояние ошибки/ожидания получай из useActionState (возвращает [state, action, isPending]). Дочерним кнопкам pending доступен через useFormStatus — без прокидывания пропсов. Это убирает ручные preventDefault/pending/try-catch.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 39. useOptimistic вместо ручного снапшота/отката
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-use-optimistic',
    title: 'React 19: ручной оптимистичный апдейт вместо useOptimistic',
    level: 'senior',
    categories: ['react-19', 'async', 'state'],
    brief:
      'Отправка сообщения вручную добавляет оптимистичный элемент и откатывает его при ошибке. React 19 даёт useOptimistic, который сам откатывается после завершения экшена.',
    brokenCode: `function Thread({ messages, send }: {
  messages: Message[]
  send: (text: string) => Promise<void>
}) {
  const [optimistic, setOptimistic] = useState<Message[]>([])

  const onSend = async (text: string) => {
    const temp = { id: 'temp', text, pending: true }
    setOptimistic(prev => [...prev, temp]) // показываем сразу
    try {
      await send(text)
    } finally {
      // вручную чистим временный элемент после ответа —
      // легко рассинхронить с реальным списком messages
      setOptimistic(prev => prev.filter(m => m.id !== 'temp'))
    }
  }

  return <List items={[...messages, ...optimistic]} />
}`,
    bugs: [
      {
        title: 'Ручная склейка реального и временного списков',
        detail:
          'Слияние [...messages, ...optimistic] и ручная чистка временных элементов хрупки: при гонках/повторах легко получить дубли или зависшие «pending» сообщения.',
      },
      {
        title: 'useOptimistic делает это автоматически',
        detail:
          'useOptimistic показывает оптимистичное значение во время action и САМ возвращается к реальному состоянию, когда action завершился (успех или ошибка) — без ручного отката.',
      },
    ],
    fixedCode: `function Thread({ messages, send }: {
  messages: Message[]
  send: (text: string) => Promise<void>
}) {
  // optimisticMessages = реальные + оптимистично добавленные на время action
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newText: string) => [
      ...state,
      { id: 'temp', text: newText, pending: true },
    ],
  )

  const onSend = async (text: string) => {
    addOptimistic(text)     // мгновенно в UI
    await send(text)        // после завершения React сам синхронизирует
  }

  return <List items={optimisticMessages} />
}`,
    takeaway:
      'useOptimistic(state, updateFn) показывает оптимистичное значение во время асинхронного действия и автоматически возвращается к реальному state по его завершении — без ручного снапшота и отката. Идеально для лайков, сообщений, тоглов внутри Actions.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 40. useFormStatus вместо прокидывания pending пропсом
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-form-status',
    title: 'React 19: prop-drilling pending вместо useFormStatus',
    level: 'middle',
    categories: ['react-19', 'patterns', 'state'],
    brief:
      'Состояние отправки формы прокидывается через несколько уровней пропсов до кнопки. React 19 даёт useFormStatus, читающий статус ближайшей формы.',
    brokenCode: `function Form() {
  const [pending, setPending] = useState(false)
  // pending прокидывается вниз через Toolbar → Actions → SubmitButton
  return (
    <form onSubmit={/* ... setPending ... */}>
      <Toolbar pending={pending} />
    </form>
  )
}

function Toolbar({ pending }: { pending: boolean }) {
  return <Actions pending={pending} />
}
function Actions({ pending }: { pending: boolean }) {
  return <button disabled={pending}>OK</button>
}`,
    bugs: [
      {
        title: 'Prop drilling состояния формы',
        detail:
          'pending тащится через Toolbar и Actions, которым он не нужен сам по себе. Каждый промежуточный компонент обязан принимать и пробрасывать проп — шум и связанность.',
      },
      {
        title: 'useFormStatus читает статус ближайшей <form>',
        detail:
          'Любой потомок формы (на любой глубине) может вызвать useFormStatus и узнать pending/data/method без единого пропса. Главное условие — компонент должен быть рендерным потомком <form>.',
      },
    ],
    fixedCode: `function Form() {
  return (
    <form action={submitAction}>
      <Toolbar />
    </form>
  )
}

// промежуточные компоненты больше не знают про pending
function Toolbar() {
  return <Actions />
}
function Actions() {
  return <SubmitButton />
}

// статус читается прямо у формы-предка:
function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>OK</button>
}`,
    takeaway:
      'useFormStatus() даёт потомкам <form> доступ к pending/data/method без prop-drilling. Кнопка сабмита сама знает, идёт ли отправка. Условие — компонент рендерится внутри той самой формы (вызов в самом <form> не сработает, нужен потомок).',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 41. ref callback cleanup
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-ref-cleanup',
    title: 'React 19: ref-callback теперь умеет cleanup',
    level: 'senior',
    categories: ['react-19', 'hooks', 'memory-leak', 'patterns'],
    brief:
      'ref-колбэк навешивает наблюдатель на узел, но снять его раньше было неоткуда — приходилось хранить в ref и чистить в useEffect. React 19 разрешает вернуть cleanup прямо из ref-колбэка.',
    brokenCode: `function Measured() {
  const observerRef = useRef<ResizeObserver | null>(null)

  // ref-колбэк раньше НЕ мог вернуть функцию очистки;
  // при откреплении узла React вызывал колбэк с null,
  // и приходилось вручную ловить этот null
  const setRef = (node: HTMLDivElement | null) => {
    if (node) {
      observerRef.current = new ResizeObserver(() => {})
      observerRef.current.observe(node)
    } else {
      // отписка по null — легко забыть/перепутать
      observerRef.current?.disconnect()
    }
  }

  return <div ref={setRef} />
}`,
    bugs: [
      {
        title: 'Логика подписки и отписки размазана по null-ветке',
        detail:
          'До React 19 ref-колбэк не возвращал cleanup. Отписку приходилось делать в ветке node === null и хранить наблюдатель во внешнем ref — легко рассинхронить и забыть отписаться.',
      },
      {
        title: 'React 19: верни функцию из ref-колбэка',
        detail:
          'Теперь ref-колбэк может вернуть функцию очистки, которую React вызовет при откреплении узла — как cleanup у useEffect. Подписка и отписка лежат рядом, внешний ref не нужен.',
      },
      {
        title: 'Важное изменение поведения',
        detail:
          'Если возвращаешь cleanup из ref-колбэка, React 19 БОЛЬШЕ не вызовет его с null при размонтировании — вместо этого выполнит твой cleanup. Старый стиль (без возврата) по-прежнему получает null.',
      },
    ],
    fixedCode: `function Measured() {
  return (
    <div
      ref={node => {
        const observer = new ResizeObserver(() => {})
        observer.observe(node)
        // cleanup возвращается прямо из ref-колбэка
        return () => observer.disconnect()
      }}
    />
  )
}`,
    takeaway:
      'В React 19 ref-колбэк может вернуть функцию очистки — она вызовется при откреплении узла, как cleanup в useEffect. Это локализует подписку/отписку в одном месте и убирает внешний ref. Учти: при возврате cleanup React уже не зовёт колбэк с null.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 42. Метаданные документа (title/meta) в компоненте
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-document-metadata',
    title: 'React 19: ручная правка document.title через useEffect',
    level: 'middle',
    categories: ['react-19', 'hooks', 'patterns'],
    brief:
      'Заголовок и мета-теги страницы выставляются императивно через useEffect и document.title. React 19 позволяет рендерить <title>/<meta> прямо в компоненте — он сам поднимет их в <head>.',
    brokenCode: `function ArticlePage({ article }: { article: Article }) {
  // императивная правка head через эффект
  useEffect(() => {
    document.title = article.title
    const meta = document.querySelector('meta[name="description"]')
    meta?.setAttribute('content', article.summary)
  }, [article])

  return <article>{article.body}</article>
}`,
    bugs: [
      {
        title: 'Императивная работа с <head>',
        detail:
          'Ручная правка document.title и querySelector мета-тегов — побочный эффект вне модели React, который к тому же не работает при SSR (тег уже отрендерен на сервере по-другому).',
      },
      {
        title: 'React 19 поднимает теги head автоматически',
        detail:
          'Теперь <title>, <meta>, <link> можно рендерить где угодно в дереве — React сам переместит их в <head>. Это работает и на сервере (важно для SEO/превью).',
      },
    ],
    fixedCode: `function ArticlePage({ article }: { article: Article }) {
  return (
    <article>
      {/* React 19 автоматически поднимет эти теги в <head> */}
      <title>{article.title}</title>
      <meta name="description" content={article.summary} />
      <link rel="canonical" href={article.url} />

      {article.body}
    </article>
  )
}`,
    takeaway:
      'React 19 нативно поддерживает метаданные документа: рендери <title>/<meta>/<link> прямо в компоненте — React поднимет их в <head>, в том числе при SSR. Это убирает useEffect+document.title и решает SEO без сторонних библиотек вроде react-helmet.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 43. Кэширование промиса для use() (создание промиса в рендере)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-promise-cache',
    title: 'React 19: промис создаётся в рендере — бесконечный Suspense',
    level: 'senior',
    categories: ['react-19', 'async', 'performance', 'patterns'],
    brief:
      'Компонент с use() создаёт новый промис прямо в теле рендера. После резолва компонент рендерится снова, создаёт ЕЩЁ один промис — и зависает в загрузке навсегда.',
    brokenCode: `function User({ id }: { id: string }) {
  // НОВЫЙ промис на каждый рендер:
  // use() резолвит → ререндер → новый fetch → снова suspense → ...
  const user = use(fetchUser(id))
  return <h2>{user.name}</h2>
}`,
    bugs: [
      {
        title: 'Промис пересоздаётся каждый рендер',
        detail:
          'fetchUser(id) в теле компонента возвращает новый промис при каждом рендере. use() приостанавливает компонент; после резолва он ререндерится, создаёт новый промис → снова suspense. Бесконечный цикл загрузки и шквал запросов.',
      },
      {
        title: 'Промис должен быть стабильным',
        detail:
          'use() требует, чтобы для одних и тех же входных данных возвращался тот же промис. Его надо кэшировать (по id) вне рендера, поднимать выше или брать из data-слоя (React Query/RSC), а не создавать инлайн.',
      },
    ],
    fixedCode: `// Кэш промисов по ключу — один промис на id
const userCache = new Map<string, Promise<User>>()

function getUser(id: string): Promise<User> {
  let promise = userCache.get(id)
  if (!promise) {
    promise = fetchUser(id)
    userCache.set(id, promise)
  }
  return promise
}

function User({ id }: { id: string }) {
  // стабильный промис для одного и того же id
  const user = use(getUser(id))
  return <h2>{user.name}</h2>
}

// На практике промис чаще приходит сверху как проп
// или из дата-слоя (React Query, RSC), который уже кэширует.`,
    takeaway:
      'use() требует стабильный промис: не создавай его в теле рендера (там он новый каждый раз → бесконечный Suspense). Кэшируй по ключу, поднимай создание выше по дереву или бери из дата-слоя/RSC, который кэширует за тебя.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 44. useEffectEvent для «не-реактивной» логики в эффекте
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-effect-event',
    title: 'React 19: latest-ref костыль вместо useEffectEvent',
    level: 'senior',
    categories: ['react-19', 'hooks', 'performance'],
    brief:
      'Эффект подключается к комнате и логирует событие с актуальной темой. Чтобы тема не пересоздавала подключение, её прячут в ref. useEffectEvent делает это штатно.',
    brokenCode: `function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  // latest-ref костыль, чтобы theme не попадала в deps
  const themeRef = useRef(theme)
  useEffect(() => { themeRef.current = theme })

  useEffect(() => {
    const conn = connect(roomId)
    conn.on('connected', () => {
      // хотим АКТУАЛЬНУЮ тему, но без переподключения при её смене
      showToast('Подключено', themeRef.current)
    })
    return () => conn.disconnect()
  }, [roomId])

  return <div>Комната {roomId}</div>
}`,
    bugs: [
      {
        title: 'Ручной latest-ref — это обходной приём',
        detail:
          'themeRef + эффект-синхронизатор имитируют «не-реактивное» чтение свежего значения. Работает, но это бойлерплейт и легко забыть обновлять ref.',
      },
      {
        title: 'useEffectEvent выделяет не-реактивную часть',
        detail:
          'useEffectEvent оборачивает логику, которая должна видеть последние props/state, но НЕ должна быть зависимостью эффекта. Линтер не требует добавлять event в deps.',
      },
      {
        title: 'Нельзя вызывать Effect Event вне своего эффекта',
        detail:
          'Функцию из useEffectEvent можно звать только внутри эффекта, к которому она относится, и нельзя передавать наружу. Это сознательное ограничение.',
      },
    ],
    fixedCode: `function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  // useEffectEvent видит свежие theme/roomId, но не реактивен
  const onConnected = useEffectEvent(() => {
    showToast('Подключено', theme)
  })

  useEffect(() => {
    const conn = connect(roomId)
    conn.on('connected', () => onConnected())
    return () => conn.disconnect()
    // theme НЕ в зависимостях — переподключения при смене темы нет
  }, [roomId])

  return <div>Комната {roomId}</div>
}`,
    takeaway:
      'useEffectEvent оборачивает «не-реактивную» логику эффекта: она читает последние props/state, но не становится зависимостью, поэтому эффект не перезапускается из-за неё. Это штатная замена latest-ref паттерна. Ограничение: вызывать только внутри своего эффекта, наружу не передавать.',
  },

  // ───────────────────────────────────────────────────────────────────────
  // 45. preload / ресурсные подсказки вместо ручных <link>
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'r19-resource-preload',
    title: 'React 19: ручное создание <link rel=preload> в эффекте',
    level: 'senior',
    categories: ['react-19', 'performance', 'patterns'],
    brief:
      'Перед навигацией приложение вручную вставляет <link rel="preload"> в head через DOM API. React 19 даёт декларативные preload/preinit/prefetchDNS из react-dom.',
    brokenCode: `function ProductLink({ id }: { id: string }) {
  const prefetch = () => {
    // ручное создание тега предзагрузки и вставка в head
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'fetch'
    link.href = \`/api/products/\${id}\`
    document.head.appendChild(link)
    // дубли при повторном наведении, нет дедупликации
  }

  return <a href={\`/p/\${id}\`} onMouseEnter={prefetch}>Товар</a>
}`,
    bugs: [
      {
        title: 'Императивная вставка ресурсных подсказок',
        detail:
          'createElement(link) + appendChild — ручная работа с head без дедупликации: при каждом наведении создаётся новый тег. Это вне модели React и плохо переносится на SSR.',
      },
      {
        title: 'React 19 даёт preload/preinit из react-dom',
        detail:
          'Функции preload, preinit, prefetchDNS, preconnect дедуплицируются React и корректно работают и на клиенте, и при серверном рендере. Их можно звать из обработчиков и из рендера.',
      },
    ],
    fixedCode: `import { preload, prefetchDNS } from 'react-dom'

function ProductLink({ id }: { id: string }) {
  const prefetch = () => {
    // декларативные подсказки: React дедуплицирует и поднимет в <head>
    preload(\`/api/products/\${id}\`, { as: 'fetch' })
  }

  return <a href={\`/p/\${id}\`} onMouseEnter={prefetch}>Товар</a>
}

// Также доступны:
// preinit(src, { as: 'script' })  — загрузить и выполнить
// preconnect(origin)              — заранее открыть соединение
// prefetchDNS(origin)             — резолвить DNS заранее`,
    takeaway:
      'React 19 даёт API ресурсных подсказок из react-dom — preload, preinit, preconnect, prefetchDNS. Они дедуплицируются и работают на SSR/клиенте, заменяя ручное создание <link> через DOM. Удобно для предзагрузки данных/шрифтов/скриптов перед навигацией.',
  },
]

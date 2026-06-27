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
]

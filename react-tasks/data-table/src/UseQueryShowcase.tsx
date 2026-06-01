import { useState, useEffect, FC } from 'react'
import useQuery from './useQuery'

// =================================================================
// Типы Rick & Morty API
// =================================================================
interface RMCharacter {
  id: number
  name: string
  status: 'Alive' | 'Dead' | 'unknown'
  species: string
  gender: string
  image: string
  location: { name: string }
  origin: { name: string }
}

interface RMCharactersResponse {
  info: { count: number; pages: number; next: string | null; prev: string | null }
  results: RMCharacter[]
}

// =================================================================
// 1. Демо: одиночный персонаж по ID (показывает загрузку / ошибку)
// =================================================================
function CharacterById({ id }: { id: number }) {
  const request = useQuery<RMCharacter>(
    () => fetch(`https://rickandmortyapi.com/api/character/${id}`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: Not Found`)
      return r.json()
    }),
    [id],
  )

  if (request.status === 'loading') {
    return (
      <div className='uq-card-body'>
        <div className='uq-skeleton-avatar' />
        <div className='uq-skeleton-lines'>
          <div className='uq-skeleton-line' style={{ width: '60%' }} />
          <div className='uq-skeleton-line' style={{ width: '40%' }} />
          <div className='uq-skeleton-line' style={{ width: '50%' }} />
        </div>
      </div>
    )
  }

  if (request.status === 'error') {
    return (
      <div className='uq-error-box'>
        <span className='uq-error-icon'>⚠</span>
        <span>{request.error.message}</span>
      </div>
    )
  }

  const char = request.data
  const statusColor =
    char.status === 'Alive' ? 'uq-status-alive'
    : char.status === 'Dead' ? 'uq-status-dead'
    : 'uq-status-unknown'

  return (
    <div className='uq-card-body'>
      <img
        src={char.image}
        alt={char.name}
        className='uq-avatar'
      />
      <div className='uq-char-info'>
        <div className='uq-char-name'>{char.name}</div>
        <div className='uq-char-meta'>
          <span className={`uq-status-dot ${statusColor}`} />
          {char.status} — {char.species}
        </div>
        <div className='uq-char-detail'>
          <span className='uq-detail-label'>Локация:</span> {char.location.name}
        </div>
        <div className='uq-char-detail'>
          <span className='uq-detail-label'>Происхождение:</span> {char.origin.name}
        </div>
      </div>
    </div>
  )
}

// =================================================================
// 2. Демо: список персонажей с пагинацией (показывает Race Condition защиту)
// =================================================================
function CharactersList() {
  const [page, setPage] = useState(1)

  const request = useQuery<RMCharactersResponse>(
    () => fetch(`https://rickandmortyapi.com/api/character?page=${page}`).then(r => r.json()),
    [page],
  )

  return (
    <div>
      <div className='uq-pagination'>
        <button
          className='uq-btn'
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || request.status === 'loading'}
        >
          ← Назад
        </button>
        <span className='uq-page-label'>
          Страница <strong>{page}</strong>
          {request.status === 'success' && ` / ${request.data.info.pages}`}
        </span>
        <button
          className='uq-btn'
          onClick={() => setPage(p => p + 1)}
          disabled={
            request.status === 'loading' ||
            (request.status === 'success' && !request.data.info.next)
          }
        >
          Вперёд →
        </button>
      </div>

      {request.status === 'loading' && (
        <div className='uq-grid'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='uq-grid-card uq-skeleton-card'>
              <div className='uq-skeleton-avatar-sm' />
              <div className='uq-skeleton-line' style={{ width: '70%', marginTop: 8 }} />
              <div className='uq-skeleton-line' style={{ width: '50%' }} />
            </div>
          ))}
        </div>
      )}

      {request.status === 'error' && (
        <div className='uq-error-box'>
          <span className='uq-error-icon'>⚠</span>
          {request.error.message}
        </div>
      )}

      {request.status === 'success' && (
        <div className='uq-grid'>
          {request.data.results.map(char => {
            const statusColor =
              char.status === 'Alive' ? 'uq-status-alive'
              : char.status === 'Dead' ? 'uq-status-dead'
              : 'uq-status-unknown'
            return (
              <div key={char.id} className='uq-grid-card'>
                <img src={char.image} alt={char.name} className='uq-grid-avatar' />
                <div className='uq-grid-name'>{char.name}</div>
                <div className='uq-char-meta'>
                  <span className={`uq-status-dot ${statusColor}`} />
                  {char.status}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// =================================================================
// 3. Демо: намеренная ошибка (несуществующий ID)
// =================================================================
function ErrorDemo() {
  const [trigger, setTrigger] = useState(false)

  const request = useQuery<RMCharacter>(
    () => fetch('https://rickandmortyapi.com/api/character/99999').then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} — персонаж #99999 не существует`)
      return r.json()
    }),
    [trigger],
  )

  return (
    <div>
      <p className='uq-desc'>
        Нажми кнопку — хук сделает запрос к несуществующему персонажу и покажет состояние{' '}
        <code>error</code>.
      </p>
      <button className='uq-btn uq-btn-red' onClick={() => setTrigger(t => !t)}>
        Вызвать ошибку (ID #99999)
      </button>
      <div style={{ marginTop: 12 }}>
        {request.status === 'loading' && <div className='uq-badge uq-badge-blue'>Загружаем...</div>}
        {request.status === 'error' && (
          <div className='uq-error-box'>
            <span className='uq-error-icon'>⚠</span>
            {request.error.message}
          </div>
        )}
        {request.status === 'success' && (
          <div className='uq-success-box'>Неожиданно, но OK: {request.data.name}</div>
        )}
      </div>
    </div>
  )
}

// =================================================================
// 4. Демо: поиск по имени — Race Condition в действии
// =================================================================
function SearchDemo() {
  const [input, setInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [requestCount, setRequestCount] = useState(0)

  // Debounce вручную через useEffect — намеренно без библиотеки,
  // чтобы показать тот же паттерн cleanup что и в useQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(input.trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [input])

  const request = useQuery<RMCharactersResponse>(
    () => {
      setRequestCount(c => c + 1)
      const url = debouncedQuery
        ? `https://rickandmortyapi.com/api/character?name=${encodeURIComponent(debouncedQuery)}`
        : 'https://rickandmortyapi.com/api/character'
      return fetch(url).then(r => {
        if (!r.ok) throw new Error(`Персонаж «${debouncedQuery}» не найден`)
        return r.json()
      })
    },
    [debouncedQuery],
  )

  return (
    <div>
      <p className='uq-desc'>
        Каждое изменение поля запускает debounce (400мс), затем новый запрос. Флаг{' '}
        <code>ignore</code> гарантирует: если пришёл ответ на устаревший запрос — он молча
        игнорируется. Счётчик показывает реальное число HTTP-запросов.
      </p>

      <div className='uq-search-row'>
        <input
          className='uq-search-input'
          type='text'
          placeholder='Введите имя персонажа...'
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <span className='uq-search-meta'>
          {input !== debouncedQuery
            ? <span className='uq-badge uq-badge-blue'>печатает...</span>
            : request.status === 'loading'
            ? <span className='uq-badge uq-badge-blue'>загружаем...</span>
            : request.status === 'success'
            ? <span className='uq-badge uq-badge-green'>{request.data.info.count} результатов</span>
            : null}
          <span className='uq-requests-counter'>запросов: <strong>{requestCount}</strong></span>
        </span>
      </div>

      {request.status === 'error' && (
        <div className='uq-error-box' style={{ marginTop: 12 }}>
          <span className='uq-error-icon'>⚠</span>
          {request.error.message}
        </div>
      )}

      {request.status === 'success' && (
        <div className='uq-grid' style={{ marginTop: 12 }}>
          {request.data.results.slice(0, 12).map(char => {
            const statusColor =
              char.status === 'Alive' ? 'uq-status-alive'
              : char.status === 'Dead' ? 'uq-status-dead'
              : 'uq-status-unknown'
            return (
              <div key={char.id} className='uq-grid-card'>
                <img src={char.image} alt={char.name} className='uq-grid-avatar' />
                <div className='uq-grid-name'>{char.name}</div>
                <div className='uq-char-meta'>
                  <span className={`uq-status-dot ${statusColor}`} />
                  {char.status}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {request.status === 'loading' && (
        <div className='uq-grid' style={{ marginTop: 12 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='uq-grid-card uq-skeleton-card'>
              <div className='uq-skeleton-avatar-sm' />
              <div className='uq-skeleton-line' style={{ width: '70%', marginTop: 8 }} />
              <div className='uq-skeleton-line' style={{ width: '50%' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =================================================================
// Главный экспортируемый компонент
// =================================================================
export const UseQueryShowcase: FC = () => {
  const [characterId, setCharacterId] = useState(1)

  return (
    <div className='uq-showcase'>
      <div className='card-header'>
        <h2 style={{ margin: 0, fontSize: 20 }}>useQuery Hook</h2>
        <span className='badge badge-purple'>Rick & Morty API</span>
      </div>
      <p className='card-desc'>
        Демонстрация хука <code>useQuery</code> — управление промисом через{' '}
        <code>useEffect</code> с защитой от Race Condition через флаг <code>ignore</code>.
      </p>

      {/* Секция 1: одиночный персонаж */}
      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>1. Одиночный запрос — смена ID</h3>
          <span className='badge badge-blue'>Race Condition защита</span>
        </div>
        <p className='uq-desc'>
          Каждый клик меняет <code>id</code> в зависимостях — предыдущий запрос отменяется через
          флаг <code>ignore</code>. Нажимай быстро, чтобы увидеть скелетон-загрузку.
        </p>
        <div className='uq-id-controls'>
          {[1, 2, 3, 4, 5, 826].map(id => (
            <button
              key={id}
              className={`uq-btn ${characterId === id ? 'uq-btn-active' : ''}`}
              onClick={() => setCharacterId(id)}
            >
              #{id}
            </button>
          ))}
        </div>
        <div className='uq-card'>
          <CharacterById id={characterId} />
        </div>
      </div>

      {/* Секция 2: пагинированный список */}
      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>2. Список с пагинацией</h3>
          <span className='badge badge-amber'>826 персонажей / 42 страницы</span>
        </div>
        <p className='uq-desc'>
          Переключение страниц меняет <code>page</code> в deps. Если быстро кликать — хук всегда
          покажет данные только последней запрошенной страницы.
        </p>
        <CharactersList />
      </div>

      {/* Секция 3: ошибка */}
      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>3. Обработка ошибки</h3>
          <span className='badge badge-red'>status: error</span>
        </div>
        <ErrorDemo />
      </div>

      {/* Секция 4: поиск — Race Condition в действии */}
      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>4. Поиск по имени — Race Condition в действии</h3>
          <span className='badge badge-blue'>debounce 400мс</span>
        </div>
        <SearchDemo />
      </div>
    </div>
  )
}

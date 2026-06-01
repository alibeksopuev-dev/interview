import { useState, useEffect, FC } from 'react'
import useQuery from './useQuery'
import {
  useQueryCached,
  clearCache,
  useQueryDeduped,
  useQueryRetry,
  useQueryManualRevalidate,
} from './useQueryAdvanced'

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
    () =>
      fetch(`https://rickandmortyapi.com/api/character/${id}`).then(r => {
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
          <div
            className='uq-skeleton-line'
            style={{ width: '60%' }}
          />
          <div
            className='uq-skeleton-line'
            style={{ width: '40%' }}
          />
          <div
            className='uq-skeleton-line'
            style={{ width: '50%' }}
          />
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
    char.status === 'Alive'
      ? 'uq-status-alive'
      : char.status === 'Dead'
        ? 'uq-status-dead'
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
            <div
              key={i}
              className='uq-grid-card uq-skeleton-card'
            >
              <div className='uq-skeleton-avatar-sm' />
              <div
                className='uq-skeleton-line'
                style={{ width: '70%', marginTop: 8 }}
              />
              <div
                className='uq-skeleton-line'
                style={{ width: '50%' }}
              />
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
              char.status === 'Alive'
                ? 'uq-status-alive'
                : char.status === 'Dead'
                  ? 'uq-status-dead'
                  : 'uq-status-unknown'
            return (
              <div
                key={char.id}
                className='uq-grid-card'
              >
                <img
                  src={char.image}
                  alt={char.name}
                  className='uq-grid-avatar'
                />
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
    () =>
      fetch('https://rickandmortyapi.com/api/character/99999').then(r => {
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
      <button
        className='uq-btn uq-btn-red'
        onClick={() => setTrigger(t => !t)}
      >
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
    }, 4000)
    return () => clearTimeout(timer)
  }, [input])

  const request = useQuery<RMCharactersResponse>(() => {
    setRequestCount(c => c + 1)
    const url = debouncedQuery
      ? `https://rickandmortyapi.com/api/character?name=${encodeURIComponent(debouncedQuery)}`
      : 'https://rickandmortyapi.com/api/character'
    return fetch(url).then(r => {
      if (!r.ok) throw new Error(`Персонаж «${debouncedQuery}» не найден`)
      return r.json()
    })
  }, [debouncedQuery])

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
          {input !== debouncedQuery ? (
            <span className='uq-badge uq-badge-blue'>печатает...</span>
          ) : request.status === 'loading' ? (
            <span className='uq-badge uq-badge-blue'>загружаем...</span>
          ) : request.status === 'success' ? (
            <span className='uq-badge uq-badge-green'>{request.data.info.count} результатов</span>
          ) : null}
          <span className='uq-requests-counter'>
            запросов: <strong>{requestCount}</strong>
          </span>
        </span>
      </div>

      {request.status === 'error' && (
        <div
          className='uq-error-box'
          style={{ marginTop: 12 }}
        >
          <span className='uq-error-icon'>⚠</span>
          {request.error.message}
        </div>
      )}

      {request.status === 'success' && (
        <div
          className='uq-grid'
          style={{ marginTop: 12 }}
        >
          {request.data.results.slice(0, 12).map(char => {
            const statusColor =
              char.status === 'Alive'
                ? 'uq-status-alive'
                : char.status === 'Dead'
                  ? 'uq-status-dead'
                  : 'uq-status-unknown'
            return (
              <div
                key={char.id}
                className='uq-grid-card'
              >
                <img
                  src={char.image}
                  alt={char.name}
                  className='uq-grid-avatar'
                />
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
        <div
          className='uq-grid'
          style={{ marginTop: 12 }}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className='uq-grid-card uq-skeleton-card'
            >
              <div className='uq-skeleton-avatar-sm' />
              <div
                className='uq-skeleton-line'
                style={{ width: '70%', marginTop: 8 }}
              />
              <div
                className='uq-skeleton-line'
                style={{ width: '50%' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =================================================================
// 5. Демо: Кэширование
// =================================================================
function CacheDemo() {
  const [charId, setCharId] = useState(1)
  const [cacheVersion, setCacheVersion] = useState(0)

  const request = useQueryCached<RMCharacter>(
    `character-${charId}`,
    () => fetch(`https://rickandmortyapi.com/api/character/${charId}`).then(r => r.json()),
    [charId, cacheVersion],
  )

  return (
    <div>
      <p className='uq-desc'>
        Первый запрос идёт в сеть. Повторный — отдаётся мгновенно из{' '}
        <code>Map&lt;string, T&gt;</code> без HTTP. Бейдж{' '}
        <span className='uq-cache-hit-badge'>cache hit</span> загорается когда данные из кэша.
      </p>
      <div className='uq-id-controls'>
        {[1, 2, 3, 4, 5].map(id => (
          <button
            key={id}
            className={`uq-btn ${charId === id ? 'uq-btn-active' : ''}`}
            onClick={() => setCharId(id)}
          >
            #{id}
          </button>
        ))}
        <button
          className='uq-btn uq-btn-red'
          onClick={() => {
            clearCache()
            setCacheVersion(v => v + 1)
          }}
        >
          Очистить кэш
        </button>
      </div>

      {'fromCache' in request && request.fromCache && (
        <div className='uq-cache-hit'>
          <span className='uq-cache-hit-badge'>cache hit</span>— данные взяты из кэша, HTTP-запрос
          не выполнялся
        </div>
      )}

      <div
        className='uq-card'
        style={{ marginTop: 10 }}
      >
        {request.status === 'loading' && (
          <div className='uq-card-body'>
            <div className='uq-skeleton-avatar' />
            <div className='uq-skeleton-lines'>
              <div
                className='uq-skeleton-line'
                style={{ width: '60%' }}
              />
              <div
                className='uq-skeleton-line'
                style={{ width: '40%' }}
              />
            </div>
          </div>
        )}
        {request.status === 'success' && (
          <div className='uq-card-body'>
            <img
              src={request.data.image}
              alt={request.data.name}
              className='uq-avatar'
            />
            <div className='uq-char-info'>
              <div className='uq-char-name'>{request.data.name}</div>
              <div className='uq-char-meta'>
                {request.data.status} — {request.data.species}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =================================================================
// 6. Демо: Дедупликация запросов
// =================================================================
function DedupeDemo() {
  const [tick, setTick] = useState(0)
  // Монтируем два независимых компонента одновременно — они делят один промис

  return (
    <div>
      <p className='uq-desc'>
        Оба блока запрашивают одни данные одновременно. Реально уходит <strong>один</strong>{' '}
        HTTP-запрос — второй подписывается на тот же промис через{' '}
        <code>Map&lt;key, Promise&gt;</code>. Бейдж{' '}
        <span className='uq-deduped-badge'>deduped</span> показывает какой блок не делал запрос.
      </p>
      <button
        className='uq-btn'
        onClick={() => setTick(t => t + 1)}
      >
        Перезапросить оба
      </button>
      <div className='uq-dedupe-grid'>
        <DedupedBlock
          label='Блок A'
          tick={tick}
        />
        <DedupedBlock
          label='Блок B'
          tick={tick}
        />
      </div>
    </div>
  )
}

function DedupedBlock({ label, tick }: { label: string; tick: number }) {
  const request = useQueryDeduped<RMCharactersResponse>(
    'dedupe-page-1',
    () => fetch('https://rickandmortyapi.com/api/character?page=1').then(r => r.json()),
    [tick],
  )

  return (
    <div className='uq-dedupe-block'>
      <div className='uq-dedupe-header'>
        <strong>{label}</strong>
        {'deduped' in request && request.deduped && (
          <span className='uq-deduped-badge'>deduped</span>
        )}
      </div>
      {request.status === 'loading' && (
        <div className='uq-dedupe-loading'>
          <div
            className='uq-skeleton-line'
            style={{ width: '80%' }}
          />
          <div
            className='uq-skeleton-line'
            style={{ width: '60%' }}
          />
        </div>
      )}
      {request.status === 'success' && (
        <div className='uq-dedupe-result'>
          Загружено <strong>{request.data.results.length}</strong> персонажей
          <div
            className='uq-char-meta'
            style={{ marginTop: 4 }}
          >
            Всего в API: {request.data.info.count}
          </div>
        </div>
      )}
    </div>
  )
}

// =================================================================
// 7. Демо: Повтор при ошибке (Retry)
// =================================================================
function RetryDemo() {
  const [trigger, setTrigger] = useState(0)
  // Имитируем нестабильный endpoint через случайный провал
  const [failUntil] = useState(() => Date.now() + 8000)

  const request = useQueryRetry<RMCharacter>(
    () => {
      // Первые ~8 секунд всегда падаем — чтобы показать retry
      if (Date.now() < failUntil) {
        return Promise.reject(new Error('Сервер временно недоступен (симуляция)'))
      }
      return fetch('https://rickandmortyapi.com/api/character/1').then(r => r.json())
    },
    [trigger],
    3,
  )

  return (
    <div>
      <p className='uq-desc'>
        При ошибке хук автоматически повторяет запрос до 3 раз с экспоненциальной задержкой:{' '}
        <strong>1с → 2с → 4с</strong>. Счётчик попыток обновляется в реальном времени. Первые 8
        секунд после нажатия симулируется ошибка сервера.
      </p>
      <button
        className='uq-btn'
        onClick={() => setTrigger(t => t + 1)}
      >
        Запустить (с ошибками)
      </button>

      <div style={{ marginTop: 12 }}>
        {request.status === 'loading' && (
          <div className='uq-retry-status'>
            <span className='uq-badge uq-badge-blue'>Попытка {request.attempt + 1} / 4…</span>
            {request.attempt > 0 && (
              <span className='uq-retry-hint'>
                повтор через {(1000 * 2 ** (request.attempt - 1)) / 1000}с
              </span>
            )}
          </div>
        )}
        {request.status === 'error' && (
          <div className='uq-error-box'>
            <span className='uq-error-icon'>⚠</span>
            Все {3} попытки исчерпаны: {request.error.message}
          </div>
        )}
        {request.status === 'success' && (
          <div
            className='uq-card'
            style={{ marginTop: 8 }}
          >
            <div className='uq-card-body'>
              <img
                src={request.data.image}
                alt={request.data.name}
                className='uq-avatar'
              />
              <div className='uq-char-info'>
                <div className='uq-char-name'>{request.data.name}</div>
                <div className='uq-char-meta'>
                  {request.data.status} — {request.data.species}
                </div>
                <div
                  className='uq-success-box'
                  style={{ marginTop: 8, padding: '4px 10px' }}
                >
                  Успех после {request.attempt} повтор(ов)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =================================================================
// 8. Демо: Фоновая ревалидация (SWR — stale-while-revalidate)
// =================================================================
function RevalidateDemo() {
  const request = useQueryManualRevalidate<{ time: string; character: RMCharacter }>(
    () =>
      fetch('https://rickandmortyapi.com/api/character/1')
        .then(r => r.json())
        .then(character => ({
          character,
          time: new Date().toLocaleTimeString('ru-RU'),
        })),
    [],
  )

  return (
    <div>
      <p className='uq-desc'>
        Паттерн <strong>stale-while-revalidate</strong>: пока идёт фоновое обновление — старые
        данные остаются на экране (нет мигания). Бейдж{' '}
        <span
          className='uq-badge uq-badge-blue'
          style={{ fontSize: 11 }}
        >
          обновляется…
        </span>{' '}
        появляется поверх данных, не заменяя их. Нажми кнопку чтобы запустить ревалидацию вручную.
      </p>

      {'revalidate' in request && (
        <button
          className='uq-btn'
          onClick={request.revalidate}
          disabled={request.status === 'loading'}
        >
          {request.revalidating ? 'Обновляется…' : 'Обновить данные'}
        </button>
      )}

      <div style={{ marginTop: 12 }}>
        {request.status === 'loading' && (
          <div className='uq-card'>
            <div className='uq-card-body'>
              <div className='uq-skeleton-avatar' />
              <div className='uq-skeleton-lines'>
                <div
                  className='uq-skeleton-line'
                  style={{ width: '60%' }}
                />
                <div
                  className='uq-skeleton-line'
                  style={{ width: '40%' }}
                />
              </div>
            </div>
          </div>
        )}
        {request.status === 'success' && (
          <div className='uq-card uq-revalidate-card'>
            {'revalidating' in request && request.revalidating && (
              <div className='uq-revalidating-overlay'>
                <span className='uq-badge uq-badge-blue'>обновляется…</span>
              </div>
            )}
            <div className='uq-card-body'>
              <img
                src={request.data.character.image}
                alt={request.data.character.name}
                className='uq-avatar'
              />
              <div className='uq-char-info'>
                <div className='uq-char-name'>{request.data.character.name}</div>
                <div className='uq-char-meta'>
                  {request.data.character.status} — {request.data.character.species}
                </div>
                <div className='uq-char-detail'>
                  <span className='uq-detail-label'>Последнее обновление:</span> {request.data.time}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
        Демонстрация хука <code>useQuery</code> — управление промисом через <code>useEffect</code> с
        защитой от Race Condition через флаг <code>ignore</code>.
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

      {/* Секция 5: кэширование */}
      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>5. Кэширование</h3>
          <span className='badge badge-green'>useQueryCached</span>
        </div>
        <CacheDemo />
      </div>

      {/* Секция 6: дедупликация */}
      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>6. Дедупликация запросов</h3>
          <span className='badge badge-purple'>useQueryDeduped</span>
        </div>
        <DedupeDemo />
      </div>

      {/* Секция 7: retry */}
      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>7. Повтор при ошибке</h3>
          <span className='badge badge-amber'>useQueryRetry · exp backoff</span>
        </div>
        <RetryDemo />
      </div>

      {/* Секция 8: ревалидация */}
      <div className='uq-section'>
        <div className='uq-section-header'>
          <h3>8. Фоновая ревалидация</h3>
          <span className='badge badge-blue'>stale-while-revalidate</span>
        </div>
        <RevalidateDemo />
      </div>
    </div>
  )
}

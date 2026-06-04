import { useState, useEffect } from 'react'
import useQuery from '../../../hooks/useQuery'

interface RMCharacter {
  id: number
  name: string
  status: 'Alive' | 'Dead' | 'unknown'
  image: string
}

interface RMCharactersResponse {
  info: { count: number }
  results: RMCharacter[]
}

export function SearchDemo() {
  const [input, setInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [requestCount, setRequestCount] = useState(0)

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
        <div className='uq-error-box' style={{ marginTop: 12 }}>
          <span className='uq-error-icon'>⚠</span>
          {request.error.message}
        </div>
      )}

      {request.status === 'success' && (
        <div className='uq-grid' style={{ marginTop: 12 }}>
          {request.data.results.slice(0, 12).map(char => {
            const statusColor =
              char.status === 'Alive'
                ? 'uq-status-alive'
                : char.status === 'Dead'
                  ? 'uq-status-dead'
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

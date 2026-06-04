import { useState } from 'react'
import useQuery from '../../../hooks/useQuery'

interface RMCharacter {
  id: number
  name: string
  status: 'Alive' | 'Dead' | 'unknown'
  image: string
}

interface RMCharactersResponse {
  info: { count: number; pages: number; next: string | null; prev: string | null }
  results: RMCharacter[]
}

export function CharactersList() {
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
    </div>
  )
}

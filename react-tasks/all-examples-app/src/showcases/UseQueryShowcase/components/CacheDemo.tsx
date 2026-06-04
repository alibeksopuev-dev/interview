import { useState } from 'react'
import { useQueryCached, clearCache } from '../../../hooks/useQueryAdvanced'

interface RMCharacter {
  id: number
  name: string
  status: 'Alive' | 'Dead' | 'unknown'
  species: string
  image: string
}

export function CacheDemo() {
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

      <div className='uq-card' style={{ marginTop: 10 }}>
        {request.status === 'loading' && (
          <div className='uq-card-body'>
            <div className='uq-skeleton-avatar' />
            <div className='uq-skeleton-lines'>
              <div className='uq-skeleton-line' style={{ width: '60%' }} />
              <div className='uq-skeleton-line' style={{ width: '40%' }} />
            </div>
          </div>
        )}
        {request.status === 'success' && (
          <div className='uq-card-body'>
            <img src={request.data.image} alt={request.data.name} className='uq-avatar' />
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

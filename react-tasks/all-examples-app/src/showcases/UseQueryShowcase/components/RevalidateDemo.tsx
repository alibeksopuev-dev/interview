import { useQueryManualRevalidate } from '../../../hooks/useQueryAdvanced'

interface RMCharacter {
  id: number
  name: string
  status: 'Alive' | 'Dead' | 'unknown'
  species: string
  image: string
}

export function RevalidateDemo() {
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
        <span className='uq-badge uq-badge-blue' style={{ fontSize: 11 }}>
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
                <div className='uq-skeleton-line' style={{ width: '60%' }} />
                <div className='uq-skeleton-line' style={{ width: '40%' }} />
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
                  <span className='uq-detail-label'>Последнее обновление:</span>{' '}
                  {request.data.time}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

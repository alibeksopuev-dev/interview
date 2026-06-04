import useQuery from '../../../hooks/useQuery'

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

export function CharacterById({ id }: { id: number }) {
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
    char.status === 'Alive'
      ? 'uq-status-alive'
      : char.status === 'Dead'
        ? 'uq-status-dead'
        : 'uq-status-unknown'

  return (
    <div className='uq-card-body'>
      <img src={char.image} alt={char.name} className='uq-avatar' />
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

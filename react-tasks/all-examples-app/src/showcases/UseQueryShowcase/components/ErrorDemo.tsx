import { useState } from 'react'
import useQuery from '../../../hooks/useQuery'

interface RMCharacter {
  id: number
  name: string
}

export function ErrorDemo() {
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
      <button className='uq-btn uq-btn-red' onClick={() => setTrigger(t => !t)}>
        Вызвать ошибку (ID #99999)
      </button>
      <div style={{ marginTop: 12 }}>
        {request.status === 'loading' && (
          <div className='uq-badge uq-badge-blue'>Загружаем...</div>
        )}
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

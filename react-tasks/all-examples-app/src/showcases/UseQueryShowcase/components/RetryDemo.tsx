import { useState } from 'react'
import { useQueryRetry } from '../../../hooks/useQueryAdvanced'

interface RMCharacter {
  id: number
  name: string
  status: 'Alive' | 'Dead' | 'unknown'
  species: string
  image: string
}

export function RetryDemo() {
  const [trigger, setTrigger] = useState(0)
  const [failUntil] = useState(() => Date.now() + 8000)

  const request = useQueryRetry<RMCharacter>(
    () => {
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
      <button className='uq-btn' onClick={() => setTrigger(t => t + 1)}>
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
          <div className='uq-card' style={{ marginTop: 8 }}>
            <div className='uq-card-body'>
              <img src={request.data.image} alt={request.data.name} className='uq-avatar' />
              <div className='uq-char-info'>
                <div className='uq-char-name'>{request.data.name}</div>
                <div className='uq-char-meta'>
                  {request.data.status} — {request.data.species}
                </div>
                <div className='uq-success-box' style={{ marginTop: 8, padding: '4px 10px' }}>
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

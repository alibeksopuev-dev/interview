import { useState } from 'react'
import { useQueryDeduped } from '../../../hooks/useQueryAdvanced'

interface RMCharactersResponse {
  info: { count: number }
  results: { id: number; name: string }[]
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
          <div className='uq-skeleton-line' style={{ width: '80%' }} />
          <div className='uq-skeleton-line' style={{ width: '60%' }} />
        </div>
      )}
      {request.status === 'success' && (
        <div className='uq-dedupe-result'>
          Загружено <strong>{request.data.results.length}</strong> персонажей
          <div className='uq-char-meta' style={{ marginTop: 4 }}>
            Всего в API: {request.data.info.count}
          </div>
        </div>
      )}
    </div>
  )
}

export function DedupeDemo() {
  const [tick, setTick] = useState(0)

  return (
    <div>
      <p className='uq-desc'>
        Оба блока запрашивают одни данные одновременно. Реально уходит <strong>один</strong>{' '}
        HTTP-запрос — второй подписывается на тот же промис через{' '}
        <code>Map&lt;key, Promise&gt;</code>. Бейдж{' '}
        <span className='uq-deduped-badge'>deduped</span> показывает какой блок не делал запрос.
      </p>
      <button className='uq-btn' onClick={() => setTick(t => t + 1)}>
        Перезапросить оба
      </button>
      <div className='uq-dedupe-grid'>
        <DedupedBlock label='Блок A' tick={tick} />
        <DedupedBlock label='Блок B' tick={tick} />
      </div>
    </div>
  )
}

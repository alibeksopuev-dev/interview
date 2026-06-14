import { useEffect, useRef, useState } from 'react'
import type { MethodCase, PromiseItem, PromiseState } from '../data/cases'

interface PromiseStatus {
  id: string
  state: PromiseState
  value?: string
  error?: string
  startedAt?: number
  settledAt?: number
}

interface VisualizerResult {
  type: 'success' | 'error' | 'partial'
  label: string
  values?: string[]
  error?: string
  statuses?: Array<{ status: 'fulfilled' | 'rejected'; value?: string; reason?: string }>
}

function getInitialStatuses(promises: PromiseItem[]): PromiseStatus[] {
  return promises.map(p => ({ id: p.id, state: 'idle' as PromiseState }))
}

function PromiseBubble({
  item,
  status,
  isWinner,
}: {
  item: PromiseItem
  status: PromiseStatus
  isWinner: boolean
}) {
  const stateColor: Record<PromiseState, string> = {
    idle: '#e2e8f0',
    pending: '#fef3c7',
    fulfilled: '#d1fae5',
    rejected: '#fee2e2',
  }
  const stateText: Record<PromiseState, string> = {
    idle: 'idle',
    pending: 'pending...',
    fulfilled: 'fulfilled ✓',
    rejected: 'rejected ✗',
  }
  const borderColor: Record<PromiseState, string> = {
    idle: '#cbd5e1',
    pending: '#fcd34d',
    fulfilled: '#34d399',
    rejected: '#f87171',
  }
  const textColor: Record<PromiseState, string> = {
    idle: '#64748b',
    pending: '#92400e',
    fulfilled: '#065f46',
    rejected: '#991b1b',
  }

  return (
    <div
      style={{
        background: stateColor[status.state],
        border: `2px solid ${borderColor[status.state]}`,
        borderRadius: 12,
        padding: '12px 16px',
        transition: 'all 0.4s ease',
        position: 'relative',
        boxShadow: isWinner ? '0 0 0 3px #4f46e5, 0 4px 12px rgba(79,70,229,0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
        flex: 1,
        minWidth: 140,
      }}
    >
      {isWinner && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: 8,
            background: '#4f46e5',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 9999,
          }}
        >
          ПОБЕДИТЕЛЬ
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6, fontFamily: 'monospace' }}>
        {item.label}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: textColor[status.state],
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}
      >
        {status.state === 'pending' && (
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: '2px solid #f59e0b',
              borderTopColor: 'transparent',
              animation: 'promiseSpin 0.8s linear infinite',
              marginRight: 6,
              verticalAlign: 'middle',
            }}
          />
        )}
        {stateText[status.state]}
      </div>
      {status.state === 'fulfilled' && status.value && (
        <div style={{ fontSize: 11, color: '#065f46', fontFamily: 'monospace', background: '#ecfdf5', padding: '3px 6px', borderRadius: 4 }}>
          → {status.value}
        </div>
      )}
      {status.state === 'rejected' && status.error && (
        <div style={{ fontSize: 11, color: '#991b1b', fontFamily: 'monospace', background: '#fef2f2', padding: '3px 6px', borderRadius: 4 }}>
          ✗ {status.error}
        </div>
      )}
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
        {item.delayMs}мс
      </div>
    </div>
  )
}

export function PromiseVisualizer({ methodCase }: { methodCase: MethodCase }) {
  const [statuses, setStatuses] = useState<PromiseStatus[]>(getInitialStatuses(methodCase.promises))
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<VisualizerResult | null>(null)
  const [winnerId, setWinnerId] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const startTimeRef = useRef<number>(0)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      if (elapsedRef.current) clearInterval(elapsedRef.current)
    }
  }, [])

  useEffect(() => {
    reset()
  }, [methodCase.id])

  function reset() {
    timersRef.current.forEach(clearTimeout)
    if (elapsedRef.current) clearInterval(elapsedRef.current)
    setStatuses(getInitialStatuses(methodCase.promises))
    setIsRunning(false)
    setResult(null)
    setWinnerId(null)
    setElapsed(0)
  }

  function run() {
    reset()
    setIsRunning(true)
    setResult(null)
    setWinnerId(null)
    startTimeRef.current = Date.now()

    elapsedRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 50)

    setStatuses(methodCase.promises.map(p => ({ id: p.id, state: 'pending' as PromiseState, startedAt: Date.now() })))

    const { behavior, promises } = methodCase
    let settled = false

    const settle = (id: string, state: 'fulfilled' | 'rejected', value?: string, error?: string) => {
      setStatuses(prev => prev.map(s => s.id === id ? { ...s, state, value, error, settledAt: Date.now() } : s))
    }

    if (behavior === 'all-success' || behavior === 'chaining' || behavior === 'constructor') {
      const timers = promises.map(p =>
        setTimeout(() => {
          settle(p.id, p.rejects ? 'rejected' : 'fulfilled', p.value, p.error)
        }, p.delayMs)
      )
      timers.push(
        setTimeout(() => {
          setIsRunning(false)
          if (elapsedRef.current) clearInterval(elapsedRef.current)
          setResult({ type: 'success', label: 'Результат:', values: promises.map(p => p.value ?? '') })
        }, Math.max(...promises.map(p => p.delayMs)) + 200)
      )
      timersRef.current = timers

    } else if (behavior === 'all-fail') {
      const failingPromise = promises.find(p => p.rejects)
      const timers = promises.map(p =>
        setTimeout(() => {
          if (settled && !p.rejects) return
          settle(p.id, p.rejects ? 'rejected' : 'fulfilled', p.value, p.error)
          if (p.rejects && !settled) {
            settled = true
            setTimeout(() => {
              setIsRunning(false)
              if (elapsedRef.current) clearInterval(elapsedRef.current)
              setResult({ type: 'error', label: 'Promise.all отклонён:', error: failingPromise?.error })
            }, 100)
          }
        }, p.delayMs)
      )
      timersRef.current = timers

    } else if (behavior === 'allSettled') {
      const results: Array<{ status: 'fulfilled' | 'rejected'; value?: string; reason?: string }> = []
      let count = 0
      const timers = promises.map((p, i) =>
        setTimeout(() => {
          const st = p.rejects ? 'rejected' : 'fulfilled'
          settle(p.id, st, p.value, p.error)
          results[i] = p.rejects ? { status: 'rejected', reason: p.error } : { status: 'fulfilled', value: p.value }
          count++
          if (count === promises.length) {
            setTimeout(() => {
              setIsRunning(false)
              if (elapsedRef.current) clearInterval(elapsedRef.current)
              setResult({ type: 'partial', label: 'allSettled результаты:', statuses: results })
            }, 100)
          }
        }, p.delayMs)
      )
      timersRef.current = timers

    } else if (behavior === 'race') {
      let won = false
      const timers = promises.map(p =>
        setTimeout(() => {
          const st = p.rejects ? 'rejected' : 'fulfilled'
          settle(p.id, st, p.value, p.error)
          if (!won) {
            won = true
            setWinnerId(p.id)
            setIsRunning(false)
            if (elapsedRef.current) clearInterval(elapsedRef.current)
            setResult(
              p.rejects
                ? { type: 'error', label: 'race отклонён первым:', error: p.error }
                : { type: 'success', label: 'race выиграл:', values: [p.value ?? ''] }
            )
          }
        }, p.delayMs)
      )
      timersRef.current = timers

    } else if (behavior === 'any') {
      let won = false
      let rejCount = 0
      const timers = promises.map(p =>
        setTimeout(() => {
          const st = p.rejects ? 'rejected' : 'fulfilled'
          settle(p.id, st, p.value, p.error)
          if (!p.rejects && !won) {
            won = true
            setWinnerId(p.id)
            setIsRunning(false)
            if (elapsedRef.current) clearInterval(elapsedRef.current)
            setResult({ type: 'success', label: 'any — первый успех:', values: [p.value ?? ''] })
          } else if (p.rejects) {
            rejCount++
            if (rejCount === promises.length && !won) {
              setIsRunning(false)
              if (elapsedRef.current) clearInterval(elapsedRef.current)
              setResult({ type: 'error', label: 'AggregateError — все упали:', error: 'Все промисы отклонены' })
            }
          }
        }, p.delayMs)
      )
      timersRef.current = timers

    } else if (behavior === 'resolve-reject') {
      const timers = promises.map(p =>
        setTimeout(() => {
          settle(p.id, p.rejects ? 'rejected' : 'fulfilled', p.value, p.error)
        }, p.delayMs)
      )
      timers.push(
        setTimeout(() => {
          setIsRunning(false)
          if (elapsedRef.current) clearInterval(elapsedRef.current)
          setResult({ type: 'partial', label: 'Выполнено мгновенно', values: ['resolve → 42', 'reject → Error: fail'] })
        }, Math.max(...promises.map(p => p.delayMs)) + 200)
      )
      timersRef.current = timers
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Промисы */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {methodCase.promises.map((p, i) => (
          <PromiseBubble
            key={p.id}
            item={p}
            status={statuses[i]}
            isWinner={winnerId === p.id}
          />
        ))}
      </div>

      {/* Таймер */}
      {isRunning && (
        <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
          ⏱ {elapsed}мс прошло...
        </div>
      )}

      {/* Результат */}
      {result && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: result.type === 'error' ? '#fef2f2' : result.type === 'partial' ? '#f0f9ff' : '#f0fdf4',
            border: `1px solid ${result.type === 'error' ? '#fca5a5' : result.type === 'partial' ? '#7dd3fc' : '#86efac'}`,
            animation: 'promiseFadeIn 0.3s ease',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: result.type === 'error' ? '#991b1b' : result.type === 'partial' ? '#0369a1' : '#166534', marginBottom: 6 }}>
            {result.label}
          </div>
          {result.type === 'partial' && result.statuses ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {result.statuses.map((s, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, color: s.status === 'fulfilled' ? '#065f46' : '#991b1b' }}>
                  [{i}] {s.status === 'fulfilled' ? `✓ value: ${s.value}` : `✗ reason: ${s.reason}`}
                </div>
              ))}
            </div>
          ) : result.values ? (
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#1e293b' }}>
              [{result.values.map((v, i) => <span key={i}>{i > 0 ? ', ' : ''}{v}</span>)}]
            </div>
          ) : (
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#991b1b' }}>
              Error: {result.error}
            </div>
          )}
        </div>
      )}

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={run}
          disabled={isRunning}
          style={{
            padding: '10px 24px',
            background: isRunning ? '#94a3b8' : '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {isRunning ? '⏳ Выполняется...' : '▶ Запустить'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '10px 16px',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🔄 Сброс
        </button>
      </div>
    </div>
  )
}

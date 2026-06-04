import { useState, useRef, useEffect, FC } from 'react'
import { throttle } from '../../../../../../throttle/throttle.ts'

export const RafTracker: FC = () => {
  const [rafPos, setRafPos] = useState({ x: 0, y: 0 })
  const [throttledPos, setThrottledPos] = useState({ x: 0, y: 0 })
  const [rafCount, setRafCount] = useState(0)
  const [rawCount, setRawCount] = useState(0)

  const rafIdRef = useRef<number | null>(null)
  const pendingPosRef = useRef({ x: 0, y: 0 })

  const throttledSetPos = useRef(
    throttle((pos: { x: number; y: number }) => {
      setThrottledPos(pos)
    }, 100),
  ).current

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    }

    setRawCount(c => c + 1)
    pendingPosRef.current = pos
    throttledSetPos(pos)

    // rAF: откладываем обновление до следующего кадра
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      setRafPos(pendingPosRef.current)
      setRafCount(c => c + 1)
      rafIdRef.current = null
    })
  }

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  return (
    <div className='throttle-card'>
      <div className='card-header'>
        <h3>4. rAF Tracker (курсор мыши)</h3>
        <span className='badge badge-green'>~16ms (60fps)</span>
      </div>
      <p className='card-desc'>
        Двигайте курсор по области ниже. <strong>rAF</strong> синхронизируется с перерисовкой
        браузера (~16 мс), <strong>throttle</strong> работает по фиксированному таймеру (100 мс).
        Счётчики показывают реальную частоту обновлений.
      </p>

      <div
        className='raf-demo-area'
        onMouseMove={handleMouseMove}
      >
        <div
          className='raf-cursor-dot'
          style={{ left: rafPos.x, top: rafPos.y }}
        />
        <span className='raf-hint'>Двигай мышь здесь</span>
      </div>

      <div className='metrics-grid'>
        <div className='metric-box'>
          <span className='metric-label'>Сырые события</span>
          <span className='metric-value'>{rawCount}</span>
          <span className='metric-sub'>mousemove всего</span>
        </div>
        <div className='metric-box throttled'>
          <span className='metric-label'>Throttle (100мс)</span>
          <span className='metric-value highlight'>
            {throttledPos.x}, {throttledPos.y}
          </span>
          <span className='metric-sub'>каждые 100мс</span>
        </div>
        <div className='metric-box raf'>
          <span className='metric-label'>rAF (~16мс)</span>
          <span className='metric-value highlight'>
            {rafPos.x}, {rafPos.y}
          </span>
          <span className='metric-sub'>кадров: {rafCount}</span>
        </div>
      </div>
    </div>
  )
}

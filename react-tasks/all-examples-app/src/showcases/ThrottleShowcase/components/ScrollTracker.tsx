import { useState, useRef, FC, UIEvent } from 'react'
import { throttle } from '../../../../../../throttle/throttle.ts'

export const ScrollTracker: FC = () => {
  const [scrollY, setScrollY] = useState(0)
  const [realScrollY, setRealScrollY] = useState(0)
  const [throttleCount, setThrottleCount] = useState(0)
  const [realCount, setRealCount] = useState(0)

  // Обработчик скролла локального контейнера с использованием throttle
  const handleScrollThrottled = useRef(
    throttle((y: number) => {
      setScrollY(y)
      setThrottleCount(c => c + 1)
    }, 200),
  ).current

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const currentScrollY = event.currentTarget.scrollTop
    setRealScrollY(currentScrollY)
    setRealCount(c => c + 1)
    handleScrollThrottled(currentScrollY)
  }

  return (
    <div className='throttle-card'>
      <div className='card-header'>
        <h3>1. Scroll Tracker (Скролл)</h3>
        <span className='badge badge-blue'>Interval: 200ms</span>
      </div>
      <p className='card-desc'>
        Покрутите список ниже. Вы увидите разницу между количеством реальных событий скролла
        браузера и фактически обработанными через <code>throttle</code>.
      </p>

      <div className='scroll-demo-container'>
        <div
          className='scroll-box'
          onScroll={handleScroll}
        >
          <div className='scroll-content'>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className='scroll-item'
              >
                Элемент списка #{i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className='metrics-grid'>
          <div className='metric-box'>
            <span className='metric-label'>Реальный ScrollY</span>
            <span className='metric-value'>{Math.round(realScrollY)}px</span>
            <span className='metric-sub'>Событий: {realCount}</span>
          </div>
          <div className='metric-box throttled'>
            <span className='metric-label'>Throttled ScrollY</span>
            <span className='metric-value highlight'>{Math.round(scrollY)}px</span>
            <span className='metric-sub'>Вызовов: {throttleCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

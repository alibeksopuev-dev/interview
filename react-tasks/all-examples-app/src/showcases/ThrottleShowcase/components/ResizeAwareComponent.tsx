import { useState, useEffect, useRef, FC } from 'react'
import { useThrottledValue } from '../hooks/useThrottledValue'

export const ResizeAwareComponent: FC = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [localWidth, setLocalWidth] = useState(300)
  const resizeBoxRef = useRef<HTMLDivElement>(null)

  // Отслеживание размера окна
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // windowWidth меняется при каждом пикселе ресайза — throttledWidth не чаще раза в 300мс
  const throttledWindowWidth = useThrottledValue(windowWidth, 300)

  // Отслеживание размера локального resizable элемента
  useEffect(() => {
    if (!resizeBoxRef.current) return

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setLocalWidth(entry.contentRect.width)
      }
    })

    observer.observe(resizeBoxRef.current)
    return () => observer.disconnect()
  }, [])

  const throttledLocalWidth = useThrottledValue(localWidth, 300)

  return (
    <div className='throttle-card'>
      <div className='card-header'>
        <h3>3. Resize Tracker (Ресайз)</h3>
        <span className='badge badge-purple'>Interval: 300ms</span>
      </div>
      <p className='card-desc'>
        Измените ширину окна браузера или потяните за правый нижний угол тестового блока ниже.
      </p>

      <div className='resize-demo-container'>
        {/* Тестовый ресайз-бокс */}
        <div className='resize-interactive-area'>
          <div
            ref={resizeBoxRef}
            className='resizable-box'
          >
            <span className='resizable-text'>Потяни меня! ↔️</span>
          </div>

          <div className='resize-metrics'>
            <div className='metric-row'>
              <span>Реальная ширина блока:</span>
              <span className='value'>{Math.round(localWidth)}px</span>
            </div>
            <div className='metric-row throttled'>
              <span>Throttled ширина (300мс):</span>
              <span className='value highlight'>{Math.round(throttledLocalWidth)}px</span>
            </div>
          </div>
        </div>

        {/* Ширина окна */}
        <div className='window-resize-box'>
          <div className='window-metrics'>
            <div className='metric-box'>
              <span className='metric-label'>Ширина окна (реальная)</span>
              <span className='metric-value'>{windowWidth}px</span>
            </div>
            <div className='metric-box throttled'>
              <span className='metric-label'>Ширина окна (throttled)</span>
              <span className='metric-value highlight'>{throttledWindowWidth}px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

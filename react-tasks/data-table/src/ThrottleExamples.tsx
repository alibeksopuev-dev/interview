import { useEffect, useRef, useState, FC, UIEvent } from 'react'
import { throttle } from '../../../throttle/throttle'

// =================================================================
// 1. Вспомогательный хук: useThrottledValue
// =================================================================
export function useThrottledValue<T>(value: T, wait: number): T {
  const [throttledValue, setThrottledValue] = useState(value)
  
  // useRef хранит стабильный throttled-сеттер между рендерами
  const setter = useRef(
    throttle((v: T) => {
      console.log(`%c[useThrottledValue] ⏳ Throttled setter CALLED with value:`, 'color: #7c3aed; font-weight: bold;', v)
      setThrottledValue(v)
    }, wait)
  ).current

  useEffect(() => {
    console.log(`[useThrottledValue] ⚡️ Raw value changed:`, value)
    setter(value)
  }, [value, setter])

  return throttledValue
}

// =================================================================
// 2. Компонент: ScrollTracker (Контроль скролла)
// =================================================================
export const ScrollTracker: FC = () => {
  const [scrollY, setScrollY] = useState(0)
  const [realScrollY, setRealScrollY] = useState(0)
  const [throttleCount, setThrottleCount] = useState(0)
  const [realCount, setRealCount] = useState(0)

  // Обработчик скролла локального контейнера с использованием throttle
  const handleScrollThrottled = useRef(
    throttle((y: number) => {
      console.log(`%c[ScrollTracker] ⏳ Throttled scroll position UPDATE:`, 'color: #2563eb; font-weight: bold;', y)
      setScrollY(y)
      setThrottleCount(c => c + 1)
    }, 200)
  ).current

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const currentScrollY = event.currentTarget.scrollTop
    console.log(`[ScrollTracker] ⚡️ Raw scroll event:`, currentScrollY)
    setRealScrollY(currentScrollY)
    setRealCount(c => c + 1)
    handleScrollThrottled(currentScrollY)
  }

  return (
    <div className="throttle-card">
      <div className="card-header">
        <h3>1. Scroll Tracker (Скролл)</h3>
        <span className="badge badge-blue">Interval: 200ms</span>
      </div>
      <p className="card-desc">
        Покрутите список ниже. Вы увидите разницу между количеством реальных событий скролла браузера и фактически обработанными через <code>throttle</code>.
      </p>
      
      <div className="scroll-demo-container">
        <div className="scroll-box" onScroll={handleScroll}>
          <div className="scroll-content">
            {[...Array(50)].map((_, i) => (
              <div key={i} className="scroll-item">
                Элемент списка #{i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Реальный ScrollY</span>
            <span className="metric-value">{Math.round(realScrollY)}px</span>
            <span className="metric-sub">Событий: {realCount}</span>
          </div>
          <div className="metric-box throttled">
            <span className="metric-label">Throttled ScrollY</span>
            <span className="metric-value highlight">{Math.round(scrollY)}px</span>
            <span className="metric-sub">Вызовов: {throttleCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// =================================================================
// 3. Компонент: SubmitButton (Защита от спам-кликов)
// =================================================================
interface LogEntry {
  id: string
  time: string
  status: 'allowed' | 'ignored'
}

export const SubmitButton: FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [clickCount, setClickCount] = useState(0)

  // Throttled функция отправки
  const throttledSubmit = useRef(
    throttle(() => {
      console.log(`%c[SubmitButton] ⏳ Throttled submit EXECUTED (API Call Simulation)`, 'color: #d97706; font-weight: bold;')
      const now = new Date()
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0')
      setLogs(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          time: timeStr,
          status: 'allowed',
        },
        ...prev.slice(0, 7), // Храним последние 8 записей
      ])
    }, 2000) // не чаще раза в 2 секунды
  ).current

  const handleClick = () => {
    console.log(`[SubmitButton] ⚡️ Button Clicked`)
    setClickCount(c => c + 1)
    
    // Регистрируем попытку клика
    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0')
    
    // Вызываем throttledSubmit
    const prevLogsLength = logs.length
    throttledSubmit()
    
    // Проверим, был ли клик проигнорирован (shouldThrottle в throttle.ts равен true)
    // Так как throttle выполняется синхронно в первый раз, мы можем просто добавить "ignored" запись,
    // если allowed запись не добавилась первой в очереди в этот же тик.
    // Для более точной визуализации мы добавим запись в лог
    setLogs(prev => {
      // Если последний элемент в логе не обновился на "allowed" в текущее время,
      // или если мы хотим показать попытку
      const hasJustAllowed = prev.length > prevLogsLength && prev[0].status === 'allowed' && prev[0].time === timeStr
      if (!hasJustAllowed) {
        console.log(`%c[SubmitButton] ❌ Click throttled (ignored)`, 'color: #ef4444;')
        return [
          {
            id: Math.random().toString(36).substr(2, 9),
            time: timeStr,
            status: 'ignored',
          },
          ...prev.slice(0, 7),
        ]
      }
      return prev
    })
  }

  const clearLogs = () => {
    setLogs([])
    setClickCount(0)
  }

  return (
    <div className="throttle-card">
      <div className="card-header">
        <h3>2. Submit Button (Спам-клики)</h3>
        <span className="badge badge-amber">Interval: 2000ms</span>
      </div>
      <p className="card-desc">
        Нажмите кнопку несколько раз подряд. Вызовы блокируются на 2 секунды после первого клика.
      </p>

      <div className="submit-demo-container">
        <div className="action-row">
          <button className="btn btn-submit" onClick={handleClick}>
            Отправить форму
          </button>
          <button className="btn btn-clear" onClick={clearLogs}>
            Очистить
          </button>
          <span className="click-counter">Всего кликов: {clickCount}</span>
        </div>

        <div className="log-panel">
          <div className="log-header">Лог событий (клик по кнопке)</div>
          <div className="log-list">
            {logs.length === 0 ? (
              <div className="log-empty">Нажмите кнопку, чтобы начать логирование...</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`log-item ${log.status}`}>
                  <span className="log-time">[{log.time}]</span>
                  <span className="log-text">
                    {log.status === 'allowed' 
                      ? '✅ Запрос отправлен на сервер' 
                      : '❌ Проигнорировано (throttle)'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =================================================================
// 4. Компонент: ResizeAwareComponent (Изменение размеров)
// =================================================================
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
        console.log(`[ResizeAwareComponent] ⚡️ Raw local box resize event:`, entry.contentRect.width)
        setLocalWidth(entry.contentRect.width)
      }
    })

    observer.observe(resizeBoxRef.current)
    return () => observer.disconnect()
  }, [])

  const throttledLocalWidth = useThrottledValue(localWidth, 300)

  return (
    <div className="throttle-card">
      <div className="card-header">
        <h3>3. Resize Tracker (Ресайз)</h3>
        <span className="badge badge-purple">Interval: 300ms</span>
      </div>
      <p className="card-desc">
        Измените ширину окна браузера или потяните за правый нижний угол тестового блока ниже.
      </p>

      <div className="resize-demo-container">
        {/* Тестовый ресайз-бокс */}
        <div className="resize-interactive-area">
          <div ref={resizeBoxRef} className="resizable-box">
            <span className="resizable-text">Потяни меня! ↔️</span>
          </div>
          
          <div className="resize-metrics">
            <div className="metric-row">
              <span>Реальная ширина блока:</span>
              <span className="value">{Math.round(localWidth)}px</span>
            </div>
            <div className="metric-row throttled">
              <span>Throttled ширина (300мс):</span>
              <span className="value highlight">{Math.round(throttledLocalWidth)}px</span>
            </div>
          </div>
        </div>

        {/* Ширина окна */}
        <div className="window-resize-box">
          <div className="window-metrics">
            <div className="metric-box">
              <span className="metric-label">Ширина окна (реальная)</span>
              <span className="metric-value">{windowWidth}px</span>
            </div>
            <div className="metric-box throttled">
              <span className="metric-label">Ширина окна (throttled)</span>
              <span className="metric-value highlight">{throttledWindowWidth}px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =================================================================
// 5. Компонент: RafTracker (requestAnimationFrame vs throttle)
// =================================================================
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
    }, 100)
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
    <div className="throttle-card">
      <div className="card-header">
        <h3>4. rAF Tracker (курсор мыши)</h3>
        <span className="badge badge-green">~16ms (60fps)</span>
      </div>
      <p className="card-desc">
        Двигайте курсор по области ниже. <strong>rAF</strong> синхронизируется с перерисовкой браузера (~16 мс), <strong>throttle</strong> работает по фиксированному таймеру (100 мс). Счётчики показывают реальную частоту обновлений.
      </p>

      <div
        className="raf-demo-area"
        onMouseMove={handleMouseMove}
      >
        <div
          className="raf-cursor-dot"
          style={{ left: rafPos.x, top: rafPos.y }}
        />
        <span className="raf-hint">Двигай мышь здесь</span>
      </div>

      <div className="metrics-grid">
        <div className="metric-box">
          <span className="metric-label">Сырые события</span>
          <span className="metric-value">{rawCount}</span>
          <span className="metric-sub">mousemove всего</span>
        </div>
        <div className="metric-box throttled">
          <span className="metric-label">Throttle (100мс)</span>
          <span className="metric-value highlight">{throttledPos.x}, {throttledPos.y}</span>
          <span className="metric-sub">каждые 100мс</span>
        </div>
        <div className="metric-box raf">
          <span className="metric-label">rAF (~16мс)</span>
          <span className="metric-value highlight">{rafPos.x}, {rafPos.y}</span>
          <span className="metric-sub">кадров: {rafCount}</span>
        </div>
      </div>
    </div>
  )
}

// =================================================================
// 6. Главный контейнер: ThrottleShowcase
// =================================================================
export const ThrottleShowcase: FC = () => {
  return (
    <div className="throttle-showcase-container">
      <h2 className="showcase-title">Демонстрация работы Throttle (Ограничение частоты)</h2>
      <p className="showcase-subtitle">
        Throttle вызывает функцию немедленно при первом событии, а затем временно блокирует последующие вызовы на заданный интервал.
      </p>

      <div className="throttle-grid">
        <ScrollTracker />
        <SubmitButton />
        <ResizeAwareComponent />
        <RafTracker />
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'

interface MouseCoords {
  clientX: number
  clientY: number
  pageX: number
  pageY: number
  offsetX: number
  offsetY: number
  screenX: number
  screenY: number
}

const ZERO: MouseCoords = {
  clientX: 0,
  clientY: 0,
  pageX: 0,
  pageY: 0,
  offsetX: 0,
  offsetY: 0,
  screenX: 0,
  screenY: 0,
}

function CoordCell({
  label,
  value,
  desc,
  color,
}: {
  label: string
  value: string
  desc: string
  color: string
}) {
  return (
    <div className='bm-coord-cell' style={{ borderTopColor: color }}>
      <div className='bm-coord-label'>{label}</div>
      <div className='bm-coord-value' style={{ color }}>
        {value}
      </div>
      <div className='bm-coord-desc'>{desc}</div>
    </div>
  )
}

export function MouseCoordsDemo() {
  const [coords, setCoords] = useState<MouseCoords>(ZERO)
  const [windowScrollY, setWindowScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setWindowScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setCoords({
      clientX: e.clientX,
      clientY: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY,
      screenX: e.screenX,
      screenY: e.screenY,
    })
  }

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>1. Координаты мышиного события</h3>
        <span className='bm-badge'>MouseEvent</span>
      </div>
      <p className='bm-desc'>
        Подвигай мышь над зоной ниже. Каждая координатная система отвечает на свой вопрос. Прокрути
        окно — увидишь как меняется <code>pageY</code>, но не <code>clientY</code>.
      </p>

      <div
        className='bm-mouse-target'
        onMouseMove={handleMove}
        onMouseLeave={() => setCoords(ZERO)}
      >
        <span>Двигай мышь здесь</span>
        <div className='bm-mouse-dot' style={{ left: coords.offsetX, top: coords.offsetY }} />
      </div>

      <div className='bm-coords-grid'>
        <CoordCell
          label='clientX / clientY'
          value={`${coords.clientX} / ${coords.clientY}`}
          desc='Относительно viewport (не меняется при scroll окна)'
          color='#0ea5e9'
        />
        <CoordCell
          label='pageX / pageY'
          value={`${coords.pageX} / ${coords.pageY}`}
          desc='Относительно документа (clientY + scrollY)'
          color='#22c55e'
        />
        <CoordCell
          label='offsetX / offsetY'
          value={`${coords.offsetX} / ${coords.offsetY}`}
          desc='Относительно элемента-цели события (target)'
          color='#f59e0b'
        />
        <CoordCell
          label='screenX / screenY'
          value={`${coords.screenX} / ${coords.screenY}`}
          desc='Относительно физического экрана (включая dock/панели)'
          color='#a855f7'
        />
      </div>

      <div className='bm-scroll-info'>
        <strong>window.scrollY:</strong> {windowScrollY}px ·{' '}
        <span style={{ color: '#64748b' }}>
          (pageY − clientY = {coords.pageY - coords.clientY}, должно равняться scrollY)
        </span>
      </div>

      <details className='bm-code-block'>
        <summary>Шпаргалка</summary>
        <pre>{`// clientX/Y — viewport. Используй для модалок, tooltip'ов, dropdown'ов.
// pageX/Y  — документ. Используй когда важна абсолютная позиция (drag&drop).
// offsetX/Y — относительно target. ⚠️ Меняется если мышь над дочерним элементом!
// screenX/Y — физический экран. Используется редко (multi-monitor).

// Конвертация:
pageX = clientX + window.scrollX;
pageY = clientY + window.scrollY;

// Получить позицию элемента в pageY-системе:
const rect = el.getBoundingClientRect();
const pageTop = rect.top + window.scrollY;`}</pre>
      </details>
    </div>
  )
}

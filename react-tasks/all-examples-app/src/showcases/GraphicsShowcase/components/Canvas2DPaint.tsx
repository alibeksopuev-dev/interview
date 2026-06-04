import { useRef, useState } from 'react'

export function Canvas2DPaint() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [color, setColor] = useState('#0ea5e9')
  const [size, setSize] = useState(6)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true
    lastPointRef.current = getPos(e)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const pos = getPos(e)
    const last = lastPointRef.current
    if (!last) return

    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    lastPointRef.current = pos
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false
    lastPointRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>3. Canvas 2D — рисовалка (drawing app)</h3>
        <span className='bm-badge'>Уровень 1 · Интерактив</span>
      </div>
      <p className='bm-desc'>
        Объединяем всё: события <code>pointerdown/move/up</code>, координаты через{' '}
        <code>getBoundingClientRect()</code>, рисование линий между последовательными точками.
        Главная тонкость — рисовать <strong>линию от предыдущей точки</strong>, иначе при быстром
        движении мыши получится пунктир.
      </p>

      <div className='bm-rect-controls'>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
          Цвет:
          <input type='color' value={color} onChange={e => setColor(e.target.value)} />
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
          Толщина: {size}
          <input
            type='range'
            min={1}
            max={30}
            value={size}
            onChange={e => setSize(Number(e.target.value))}
          />
        </label>
        <button className='bm-btn-primary' onClick={clear}>
          🗑 Очистить
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={460}
        height={260}
        className='gfx-canvas gfx-canvas-paint'
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <details className='bm-code-block'>
        <summary>Ключевые моменты</summary>
        <pre>{`// 1. Координаты мыши внутри canvas:
const rect = canvas.getBoundingClientRect()
const x = e.clientX - rect.left
const y = e.clientY - rect.top

// 2. Рисуем ЛИНИЮ, а не точки:
ctx.beginPath()
ctx.moveTo(last.x, last.y)
ctx.lineTo(pos.x, pos.y)
ctx.lineCap = 'round'
ctx.lineJoin = 'round'
ctx.stroke()
last = pos

// 3. Pointer Events > Mouse Events:
// — работают и для мыши, и для touch, и для пера
// — setPointerCapture гарантирует, что events приходят даже когда курсор
//   ушёл за пределы canvas`}</pre>
      </details>
    </div>
  )
}

import { useEffect, useRef } from 'react'

export function Canvas2DBasics() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#0ea5e9'
    ctx.fillRect(20, 20, 120, 80)

    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 4
    ctx.strokeRect(160, 20, 120, 80)

    ctx.beginPath()
    ctx.arc(360, 60, 40, 0, Math.PI * 2)
    ctx.fillStyle = '#22c55e'
    ctx.fill()
    ctx.strokeStyle = '#15803d'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(20, 140)
    ctx.lineTo(420, 140)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(80, 240)
    ctx.lineTo(140, 160)
    ctx.lineTo(200, 240)
    ctx.closePath()
    ctx.fillStyle = '#f59e0b'
    ctx.fill()

    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 18px Inter, sans-serif'
    ctx.fillText('Canvas 2D!', 240, 200)

    const gradient = ctx.createLinearGradient(240, 220, 420, 260)
    gradient.addColorStop(0, '#a855f7')
    gradient.addColorStop(1, '#ec4899')
    ctx.fillStyle = gradient
    ctx.fillRect(240, 220, 180, 30)
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>1. Canvas 2D — рисуем как в Paint</h3>
        <span className='bm-badge'>Уровень 1 · Основы</span>
      </div>
      <p className='bm-desc'>
        <code>&lt;canvas&gt;</code> — это битмап. Получаем <code>getContext('2d')</code> и вызываем
        методы: <code>fillRect</code>, <code>arc</code>, <code>lineTo</code>. Точка отсчёта —{' '}
        <strong>левый верх</strong>, Y идёт вниз. Это самый простой 2D API в браузере.
      </p>

      <canvas ref={canvasRef} width={460} height={280} className='gfx-canvas' />

      <details className='bm-code-block'>
        <summary>Код примера</summary>
        <pre>{`const canvas = ref.current
const ctx = canvas.getContext('2d')

// Заливка
ctx.fillStyle = '#0ea5e9'
ctx.fillRect(20, 20, 120, 80)   // x, y, width, height

// Круг — только через path
ctx.beginPath()
ctx.arc(360, 60, 40, 0, Math.PI * 2)
ctx.fill()

// Произвольная форма
ctx.beginPath()
ctx.moveTo(80, 240)
ctx.lineTo(140, 160)
ctx.lineTo(200, 240)
ctx.closePath()
ctx.fill()

// ⚠️ ВАЖНО: ctx.beginPath() начинает НОВЫЙ путь.
// Без него линии "соединяются" с предыдущими — частый баг новичков.`}</pre>
      </details>
    </div>
  )
}

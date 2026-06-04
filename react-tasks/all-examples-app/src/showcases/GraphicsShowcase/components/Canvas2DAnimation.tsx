import { useEffect, useRef, useState } from 'react'

export function Canvas2DAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(true)
  const runningRef = useRef(running)
  runningRef.current = running

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const balls = Array.from({ length: 12 }, (_, i) => ({
      x: 30 + i * 35,
      y: 50 + Math.random() * 100,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      r: 8 + Math.random() * 8,
      color: `hsl(${(i * 30) % 360}, 70%, 55%)`,
    }))

    let rafId = 0

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const b of balls) {
        if (runningRef.current) {
          b.x += b.vx
          b.y += b.vy
          if (b.x - b.r < 0 || b.x + b.r > canvas.width) b.vx *= -1
          if (b.y - b.r < 0 || b.y + b.r > canvas.height) b.vy *= -1
        }

        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = b.color
        ctx.fill()
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>2. Canvas 2D — анимация (requestAnimationFrame)</h3>
        <span className='bm-badge'>Уровень 1 · Цикл рендера</span>
      </div>
      <p className='bm-desc'>
        Анимация = много кадров подряд. На каждом кадре{' '}
        <strong>clearRect → update state → draw</strong>. Цикл строим через{' '}
        <code>requestAnimationFrame</code>: браузер сам вызывает наш callback в нужный момент (≈60
        кадров/сек). <code>setInterval</code> для анимации — плохо.
      </p>

      <canvas ref={canvasRef} width={460} height={220} className='gfx-canvas' />

      <div className='bm-rect-controls'>
        <button className='bm-btn-primary' onClick={() => setRunning(r => !r)}>
          {running ? '⏸ Пауза' : '▶ Запустить'}
        </button>
        <span style={{ fontSize: 12, color: '#475569' }}>
          12 шариков, физика отскока от стенок, ~60 fps
        </span>
      </div>

      <details className='bm-code-block'>
        <summary>Шаблон любой Canvas-анимации</summary>
        <pre>{`useEffect(() => {
  let rafId = 0
  const state = { x: 0, vx: 2 }  // состояние ВНЕ React

  const tick = () => {
    ctx.clearRect(0, 0, w, h)    // 1. очистить
    state.x += state.vx          // 2. обновить
    if (state.x > w) state.vx *= -1
    ctx.fillRect(state.x, 50, 20, 20) // 3. нарисовать
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  return () => cancelAnimationFrame(rafId)  // ⚠️ ОБЯЗАТЕЛЬНО
}, [])`}</pre>
      </details>
    </div>
  )
}

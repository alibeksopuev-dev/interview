import { useEffect, useRef, useState } from 'react'
import { Application, Container, Graphics } from 'pixi.js'

function hslToHex(h: number, s: number, l: number): number {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))))
  return (f(0) << 16) | (f(8) << 8) | f(4)
}

export function PixiJSParticles() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [count, setCount] = useState(2000)
  const [fps, setFps] = useState(0)
  const countRef = useRef(count)
  countRef.current = count

  useEffect(() => {
    const host = containerRef.current
    if (!host) return

    const width = 460
    const height = 320

    let app: Application | null = null
    let cancelled = false

    const start = async () => {
      const localApp = new Application()
      try {
        await localApp.init({
          width,
          height,
          backgroundColor: 0x0f172a,
          antialias: false,
          resolution: window.devicePixelRatio,
          autoDensity: true,
        })
      } catch {
        return
      }
      if (cancelled) {
        localApp.destroy(true, { children: true })
        return
      }
      app = localApp
      host.appendChild(app.canvas)

      const container = new Container()
      app.stage.addChild(container)

      interface Particle {
        gfx: Graphics
        vx: number
        vy: number
      }
      const particles: Particle[] = []

      const createParticle = (): Particle => {
        const g = new Graphics()
        const hue = Math.floor(Math.random() * 360)
        const color = hslToHex(hue, 70, 60)
        g.circle(0, 0, 2 + Math.random() * 2).fill(color)
        g.x = Math.random() * width
        g.y = Math.random() * height
        container.addChild(g)
        return {
          gfx: g,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
        }
      }

      for (let i = 0; i < countRef.current; i++) particles.push(createParticle())

      let lastFpsUpdate = performance.now()
      let frames = 0

      app.ticker.add(() => {
        const target = countRef.current
        while (particles.length < target) particles.push(createParticle())
        while (particles.length > target) {
          const p = particles.pop()!
          container.removeChild(p.gfx)
          p.gfx.destroy()
        }

        for (const p of particles) {
          p.gfx.x += p.vx
          p.gfx.y += p.vy
          if (p.gfx.x < 0 || p.gfx.x > width) p.vx *= -1
          if (p.gfx.y < 0 || p.gfx.y > height) p.vy *= -1
        }

        frames++
        const now = performance.now()
        if (now - lastFpsUpdate >= 500) {
          setFps(Math.round((frames * 1000) / (now - lastFpsUpdate)))
          frames = 0
          lastFpsUpdate = now
        }
      })
    }

    start()

    return () => {
      cancelled = true
      if (app) {
        app.destroy(true, { children: true })
        app = null
      }
    }
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>5. PixiJS — 5000 частиц в 60 fps</h3>
        <span className='bm-badge'>Уровень 2 · Performance</span>
      </div>
      <p className='bm-desc'>
        Зачем вообще нужен Pixi, если есть Canvas 2D? Вот зачем: <strong>тысячи объектов</strong>.
        Подвигай слайдер — увидишь, что даже 5000 частиц рендерятся в 60 fps.
        На Canvas 2D с <code>arc()</code> ты упрёшься в потолок уже на ~1500.
        Секрет — Pixi батчит примитивы в один <strong>drawing call</strong> к GPU.
      </p>

      <div className='bm-rect-controls'>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
          Частиц: <strong>{count}</strong>
          <input
            type='range'
            min={100}
            max={10000}
            step={100}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            style={{ width: 200 }}
          />
        </label>
        <span style={{ fontSize: 12, color: fps >= 55 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444' }}>
          FPS: <strong>{fps}</strong>
        </span>
      </div>

      <div ref={containerRef} className='gfx-pixi-container' />

      <details className='bm-code-block'>
        <summary>Почему Pixi быстрый</summary>
        <pre>{`// На Canvas 2D КАЖДЫЙ ctx.arc(...).fill() — это отдельная команда CPU → GPU.
// 5000 кружков = 5000 round-trip'ов. CPU не успевает.

// Pixi устроен иначе:
//   1. Графика хранится в виде "GPU-буферов" (массивов вершин).
//   2. Pixi БАТЧИТ объекты в один drawing call.
//   3. GPU рисует их параллельно.`}</pre>
      </details>
    </div>
  )
}

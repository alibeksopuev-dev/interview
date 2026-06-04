import { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Text } from 'pixi.js'

export function PixiJSBasics() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = containerRef.current
    if (!host) return

    const width = 460
    const height = 280

    let app: Application | null = null
    let cancelled = false

    const start = async () => {
      const localApp = new Application()
      try {
        await localApp.init({
          width,
          height,
          backgroundColor: 0xf0f9ff,
          antialias: true,
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

      const rect = new Graphics()
      rect.rect(0, 0, 100, 70).fill(0x0ea5e9)
      rect.x = 30
      rect.y = 30
      app.stage.addChild(rect)

      const circle = new Graphics()
      circle.circle(0, 0, 35).fill(0x22c55e).stroke({ color: 0x15803d, width: 3 })
      circle.x = 200
      circle.y = 65
      app.stage.addChild(circle)

      const star = new Graphics()
      const points: number[] = []
      const spikes = 5
      const outer = 40
      const inner = 18
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner
        const a = (i * Math.PI) / spikes - Math.PI / 2
        points.push(Math.cos(a) * r, Math.sin(a) * r)
      }
      star.poly(points).fill(0xf59e0b)
      star.x = 330
      star.y = 70
      app.stage.addChild(star)

      const text = new Text({
        text: 'Привет, Pixi!',
        style: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 22,
          fontWeight: 'bold',
          fill: 0x1e293b,
        },
      })
      text.x = 30
      text.y = 160
      app.stage.addChild(text)

      const bouncy = new Graphics()
      bouncy.rect(-30, -30, 60, 60).fill(0x6366f1)
      bouncy.x = 350
      bouncy.y = 200
      bouncy.eventMode = 'static'
      bouncy.cursor = 'pointer'
      let scaleTarget = 1
      bouncy.on('pointerover', () => { scaleTarget = 1.3 })
      bouncy.on('pointerout', () => { scaleTarget = 1 })
      bouncy.on('pointerdown', () => { bouncy.tint = Math.random() * 0xffffff })
      app.stage.addChild(bouncy)

      const hint = new Text({
        text: '← наведи / кликни',
        style: { fontSize: 12, fill: 0x475569 },
      })
      hint.x = 220
      hint.y = 195
      app.stage.addChild(hint)

      const ticker = app.ticker
      ticker.add(() => {
        bouncy.scale.x += (scaleTarget - bouncy.scale.x) * 0.15
        bouncy.scale.y = bouncy.scale.x
        star.rotation += 0.02
        rect.alpha = 0.5 + 0.5 * Math.sin(performance.now() / 300)
      })

      // Suppress unused variable warning
      void Container
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
        <h3>4. PixiJS — 2D-движок поверх WebGL</h3>
        <span className='bm-badge'>Уровень 2 · 2D Engine</span>
      </div>
      <p className='bm-desc'>
        PixiJS — это "Canvas 2D на стероидах". API похож (рисуй прямоугольники, круги, текст), но
        под капотом WebGL → можно тащить <strong>десятки тысяч</strong> объектов в 60 fps.
        Сцена — это дерево (как DOM): <code>Application</code> → <code>Container</code> →{' '}
        <code>Graphics/Sprite/Text</code>. У каждого есть <code>x, y, rotation, scale</code>.
        Наведи / кликни на синий квадрат справа.
      </p>

      <div ref={containerRef} className='gfx-pixi-container' />

      <details className='bm-code-block'>
        <summary>Анатомия Pixi-приложения</summary>
        <pre>{`import { Application, Graphics, Text } from 'pixi.js'

const app = new Application()
await app.init({ width: 460, height: 280, backgroundColor: 0xf0f9ff })
host.appendChild(app.canvas)

const rect = new Graphics()
rect.rect(0, 0, 100, 70).fill(0x0ea5e9)
rect.x = 30; rect.y = 30
app.stage.addChild(rect)

rect.eventMode = 'static'
rect.cursor = 'pointer'
rect.on('pointerover', () => { rect.tint = 0xff0000 })

app.ticker.add((time) => { rect.rotation += 0.01 })

app.destroy(true, { children: true })   // ⚠️ при unmount`}</pre>
      </details>
    </div>
  )
}

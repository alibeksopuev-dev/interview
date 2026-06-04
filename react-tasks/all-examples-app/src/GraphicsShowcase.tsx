import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Application, Container, Graphics, Text } from 'pixi.js'

// ─── 1. Canvas 2D: основы — рисуем простые фигуры ───────────────────────────
// Что важно понять:
//   • <canvas> — это просто прямоугольный битмап в DOM.
//   • Сам по себе он пустой. Через JS получаем "контекст" (2d или webgl)
//     и через него рисуем пиксели.
//   • Координата (0,0) — ЛЕВЫЙ ВЕРХНИЙ угол. Y растёт вниз (как в DOM).
//   • Ширина в HTML-атрибуте (width="...") — это разрешение битмапа.
//     CSS-ширина — это размер на экране. Часто их путают (см. карточку 7).

function Canvas2DBasics() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Очищаем (на случай, если эффект перерисовывает)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 1. Прямоугольник заливкой
    ctx.fillStyle = '#0ea5e9'
    ctx.fillRect(20, 20, 120, 80)

    // 2. Прямоугольник обводкой
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 4
    ctx.strokeRect(160, 20, 120, 80)

    // 3. Круг через path (Canvas не знает про круги напрямую — только пути)
    ctx.beginPath()
    ctx.arc(360, 60, 40, 0, Math.PI * 2) // x, y, radius, startAngle, endAngle
    ctx.fillStyle = '#22c55e'
    ctx.fill()
    ctx.strokeStyle = '#15803d'
    ctx.lineWidth = 3
    ctx.stroke()

    // 4. Линия
    ctx.beginPath()
    ctx.moveTo(20, 140)
    ctx.lineTo(420, 140)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.stroke()

    // 5. Произвольный путь — треугольник
    ctx.beginPath()
    ctx.moveTo(80, 240)
    ctx.lineTo(140, 160)
    ctx.lineTo(200, 240)
    ctx.closePath()
    ctx.fillStyle = '#f59e0b'
    ctx.fill()

    // 6. Текст
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 18px Inter, sans-serif'
    ctx.fillText('Canvas 2D!', 240, 200)

    // 7. Градиент
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

      <canvas
        ref={canvasRef}
        width={460}
        height={280}
        className='gfx-canvas'
      />

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

// ─── 2. Canvas 2D: анимация через requestAnimationFrame ─────────────────────
// Главное правило анимации:
//   • НЕ используем setInterval — он не синхронизирован с экраном.
//   • Используем requestAnimationFrame — браузер вызовет callback ПЕРЕД
//     следующей перерисовкой (обычно 60 раз в секунду).
//   • На каждом кадре: 1) очистить canvas, 2) обновить состояние, 3) нарисовать.

function Canvas2DAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(true)
  const runningRef = useRef(running)
  runningRef.current = running

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Состояние "шариков" живёт здесь, а не в React state —
    // потому что React-рендер для 60fps анимации избыточен.
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
      // 1. Очистить кадр
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 2. Обновить физику + 3. нарисовать
      for (const b of balls) {
        if (runningRef.current) {
          b.x += b.vx
          b.y += b.vy
          // Отскок от стенок
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

    // Cleanup — обязателен! Иначе RAF будет крутиться вечно
    // и утечёт при размонтировании компонента.
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

      <canvas
        ref={canvasRef}
        width={460}
        height={220}
        className='gfx-canvas'
      />

      <div className='bm-rect-controls'>
        <button
          className='bm-btn-primary'
          onClick={() => setRunning(r => !r)}
        >
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
}, [])

// ⚠️ Почему state НЕ в useState?
// — useState вызовет ре-рендер компонента на каждом кадре (60 раз/сек).
// — Canvas-рисование происходит без React'а — ему ре-рендер не нужен.
// — Используем useRef или обычный let внутри useEffect.

// ⚠️ Почему НЕ setInterval(tick, 16)?
// — Не синхронизирован с vsync экрана (будут "разрывы").
// — Продолжает работать в фоновой вкладке (батарея садится).
// — rAF останавливается, когда вкладка не активна — экономит ресурсы.`}</pre>
      </details>
    </div>
  )
}

// ─── 3. Canvas 2D: интерактив — рисовалка мышью ────────────────────────────
// Учимся: работа с координатами мыши на canvas и обработка событий рисования.

function Canvas2DPaint() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [color, setColor] = useState('#0ea5e9')
  const [size, setSize] = useState(6)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  // Главный трюк: e.clientX даёт координату относительно viewport.
  // Нам нужны координаты ВНУТРИ canvas — вычитаем rect.left/top.
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

    // Рисуем ЛИНИЮ от прошлой точки к новой —
    // если ставить просто точки, при быстром движении будут "пунктиры".
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = size
    ctx.lineCap = 'round' // скруглить концы — иначе будут "квадратики"
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
          <input
            type='color'
            value={color}
            onChange={e => setColor(e.target.value)}
          />
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
        <button
          className='bm-btn-primary'
          onClick={clear}
        >
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
// ⚠️ если canvas масштабируется CSS'ом (см. карточку 7),
// сюда нужно ещё умножить на canvas.width / rect.width.

// 2. Рисуем ЛИНИЮ, а не точки:
ctx.beginPath()
ctx.moveTo(last.x, last.y)
ctx.lineTo(pos.x, pos.y)
ctx.lineCap = 'round'   // скруглить концы
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

// ─── 4. PixiJS: основы — сцена со спрайтами и интерактивом ─────────────────
// PixiJS — это 2D-движок ПОВЕРХ WebGL. Идея:
//   • Удобство API почти как у Canvas 2D (рисуй прямоугольники, круги).
//   • Но рендер идёт через GPU → можно тащить ДЕСЯТКИ ТЫСЯЧ объектов в 60fps.
//   • Главные сущности: Application (главный объект), Container (узел сцены),
//     Graphics (примитивы), Sprite (текстура), Text (текст).
//   • Сцена — это ДЕРЕВО (как DOM). У каждого объекта есть x, y, rotation, scale.
//
// Когда брать Pixi:
//   — 2D игры (вместо Canvas 2D, который тупит на сотнях частиц).
//   — Богатые интерактивные баннеры/анимации.
//   — Whiteboard'ы с большим количеством объектов.
// Когда НЕ брать:
//   — Если 3D — нужен Three.js.
//   — Если нужен максимум 10 фигур — хватит Canvas 2D.

function PixiJSBasics() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = containerRef.current
    if (!host) return

    const width = 460
    const height = 280

    let app: Application | null = null
    let cancelled = false

    // Pixi 8.x использует асинхронную инициализацию (для совместимости с WebGPU).
    // ⚠️ React StrictMode вызывает useEffect дважды (mount → unmount → mount).
    // Если cleanup сработает ДО завершения init() — нельзя дёргать destroy(),
    // потому что внутренние методы (типа _cancelResize) ещё не привязаны.
    const start = async () => {
      const localApp = new Application()
      try {
        await localApp.init({
          width,
          height,
          backgroundColor: 0xf0f9ff,
          antialias: true,
          resolution: window.devicePixelRatio, // чёткость на retina
          autoDensity: true,
        })
      } catch {
        return
      }
      if (cancelled) {
        // init успел, но компонент уже размонтировался — теперь destroy безопасен.
        localApp.destroy(true, { children: true })
        return
      }
      app = localApp
      host.appendChild(app.canvas)

      // 1. Простой прямоугольник через Graphics
      const rect = new Graphics()
      rect.rect(0, 0, 100, 70).fill(0x0ea5e9)
      rect.x = 30
      rect.y = 30
      app.stage.addChild(rect)

      // 2. Круг — Graphics + fill + stroke
      const circle = new Graphics()
      circle.circle(0, 0, 35).fill(0x22c55e).stroke({ color: 0x15803d, width: 3 })
      circle.x = 200
      circle.y = 65
      app.stage.addChild(circle)

      // 3. Произвольная форма — звезда через path
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

      // 4. Текст — настоящий шрифтовой текст, не bitmap.
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

      // 5. Интерактивный объект — клик/наведение
      const bouncy = new Graphics()
      bouncy.rect(-30, -30, 60, 60).fill(0x6366f1)
      bouncy.x = 350
      bouncy.y = 200
      bouncy.eventMode = 'static' // включаем обработку событий
      bouncy.cursor = 'pointer'
      let scaleTarget = 1
      bouncy.on('pointerover', () => {
        scaleTarget = 1.3
      })
      bouncy.on('pointerout', () => {
        scaleTarget = 1
      })
      bouncy.on('pointerdown', () => {
        bouncy.tint = Math.random() * 0xffffff
      })
      app.stage.addChild(bouncy)

      // Подпись
      const hint = new Text({
        text: '← наведи / кликни',
        style: { fontSize: 12, fill: 0x475569 },
      })
      hint.x = 220
      hint.y = 195
      app.stage.addChild(hint)

      // 6. Анимация — у Pixi есть свой "ticker", но можно и обычный rAF.
      // Pixi ticker удобен: автоматически останавливается при unmount Application'а.
      const ticker = app.ticker
      ticker.add(() => {
        // Lerp scale к целевому (см. карточку Three.js — это та же техника)
        bouncy.scale.x += (scaleTarget - bouncy.scale.x) * 0.15
        bouncy.scale.y = bouncy.scale.x
        // Звезда крутится
        star.rotation += 0.02
        // Прямоугольник пульсирует
        rect.alpha = 0.5 + 0.5 * Math.sin(performance.now() / 300)
      })
    }

    start()

    return () => {
      cancelled = true
      // ⚠️ destroy ТОЛЬКО если init завершился. Иначе Pixi падает на
      // this._cancelResize (приватный метод появляется после init()).
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

      <div
        ref={containerRef}
        className='gfx-pixi-container'
      />

      <details className='bm-code-block'>
        <summary>Анатомия Pixi-приложения</summary>
        <pre>{`import { Application, Graphics, Text } from 'pixi.js'

// 1. Создаём приложение (в v8 — асинхронно!)
const app = new Application()
await app.init({
  width: 460, height: 280,
  backgroundColor: 0xf0f9ff,
  antialias: true,
  resolution: window.devicePixelRatio,  // чёткость на retina
  autoDensity: true,
})
host.appendChild(app.canvas)            // canvas вставляем в DOM

// 2. Создаём объект (Graphics — для примитивов)
const rect = new Graphics()
rect.rect(0, 0, 100, 70).fill(0x0ea5e9)
rect.x = 30; rect.y = 30                 // позиция
app.stage.addChild(rect)                 // добавили в сцену

// 3. Интерактив
rect.eventMode = 'static'                // включить события
rect.cursor = 'pointer'
rect.on('pointerover', () => { rect.tint = 0xff0000 })
rect.on('pointerdown', () => { ... })

// 4. Анимация через ticker
app.ticker.add((time) => {
  rect.rotation += 0.01
})

// 5. Cleanup
app.destroy(true, { children: true })   // ⚠️ ОБЯЗАТЕЛЬНО при unmount

// ⚠️ Главное отличие от Canvas 2D:
//   В Canvas 2D ты НЕ хранишь объекты — нарисовал и забыл (immediate mode).
//   В Pixi у каждого фигуры свой объект в сцене (retained mode).
//   Поэтому в Pixi можно ".x = 10" — и оно само перерисуется в следующем кадре.

// ⚠️ Координаты Pixi: как в Canvas 2D — (0,0) сверху, Y вниз.
//    Это ОТЛИЧАЕТСЯ от WebGL/Three.js — там Y вверх.`}</pre>
      </details>
    </div>
  )
}

// ─── 5. PixiJS: 5000 частиц — демонстрация мощи GPU ─────────────────────────
// Главная фишка Pixi — производительность. Покажем 5000 анимированных кружков:
// на Canvas 2D это будет тормозить, на Pixi — летит в 60fps.

function PixiJSParticles() {
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
          antialias: false, // частицам не нужен AA — экономим
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

      // Контейнер для всех частиц — оптимизация:
      // Pixi может батчить дочерние объекты одного контейнера в один drawing call.
      const container = new Container()
      app.stage.addChild(container)

      interface Particle {
        gfx: Graphics
        vx: number
        vy: number
      }
      const particles: Particle[] = []

      // Создаём один "template" graphics, который потом клонируем —
      // но в Pixi 8 каждый Graphics уникален, так что просто создаём по одному.
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

      // Стартовая пачка
      for (let i = 0; i < countRef.current; i++) particles.push(createParticle())

      // FPS-счётчик
      let lastFpsUpdate = performance.now()
      let frames = 0

      app.ticker.add(() => {
        // Подстраиваем количество частиц под слайдер
        const target = countRef.current
        while (particles.length < target) particles.push(createParticle())
        while (particles.length > target) {
          const p = particles.pop()!
          container.removeChild(p.gfx)
          p.gfx.destroy()
        }

        // Двигаем частицы и отскакиваем от стенок
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

      <div
        ref={containerRef}
        className='gfx-pixi-container'
      />

      <details className='bm-code-block'>
        <summary>Почему Pixi быстрый</summary>
        <pre>{`// На Canvas 2D КАЖДЫЙ ctx.arc(...).fill() — это отдельная команда CPU → GPU.
// 5000 кружков = 5000 round-trip'ов. CPU не успевает.

// Pixi устроен иначе:
//   1. Графика хранится в виде "GPU-буферов" (массивов вершин).
//   2. Pixi БАТЧИТ объекты в один drawing call:
//      все 5000 кружков уезжают на GPU одной командой.
//   3. GPU рисует их параллельно.

// Поэтому "потолок" Pixi — десятки тысяч объектов в 60fps,
// а Canvas 2D — пара тысяч.

// ⚠️ ОПТИМИЗАЦИИ В PIXI:
//   • Используй один Container для однотипных объектов → автобатчинг.
//   • Для ОЧЕНЬ большого кол-ва частиц — ParticleContainer (специальный,
//     с ограничениями: один материал, нельзя rotate каждой отдельно).
//   • Sprite (текстура) дешевле, чем Graphics. Если рисуешь миллион
//     одинаковых иконок — сделай одну текстуру и расставь Sprite'ы.

import { ParticleContainer, Sprite, Texture } from 'pixi.js'
const pc = new ParticleContainer({ dynamicProperties: { position: true } })
// → потолок взлетает до сотен тысяч частиц.`}</pre>
      </details>
    </div>
  )
}

// HSL → hex helper (число для Pixi color)
function hslToHex(h: number, s: number, l: number): number {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))))
  return (f(0) << 16) | (f(8) << 8) | f(4)
}

// ─── 6. WebGL: минимальный пример "Hello triangle" ─────────────────────────
// WebGL — это НЕ "лучший 2D API". Это совершенно другой подход:
//   • Ты НЕ говоришь "нарисуй прямоугольник тут".
//   • Ты загружаешь массив вершин в видеокарту (GPU).
//   • Пишешь две маленькие программы — ШЕЙДЕРЫ — которые крутятся на GPU:
//       - vertex shader  → решает, ГДЕ оказывается каждая вершина
//       - fragment shader → решает, КАКОГО цвета каждый пиксель внутри фигуры
//   • Шейдеры пишутся на GLSL (C-подобный язык).
// Это сложнее, но В СОТНИ РАЗ БЫСТРЕЕ для сложной графики (миллионы вершин).
// Coordinate system WebGL'а: -1..+1 по обеим осям, (0,0) — ЦЕНТР, Y вверх.

function WebGLTriangle() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      setError('WebGL не поддерживается в этом браузере')
      return
    }

    // ─── 1. Шейдеры ────────────────────────────────────────────────────────
    // Vertex shader: для каждой вершины (точки треугольника) решает её позицию.
    // a_position — это "атрибут" вершины (читаем из массива).
    // gl_Position — обязательная output-переменная.
    const vertexSrc = `
      attribute vec2 a_position;
      attribute vec3 a_color;
      varying vec3 v_color;
      void main() {
        v_color = a_color;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `
    // Fragment shader: для каждого пикселя внутри треугольника решает цвет.
    // v_color приходит из vertex shader, интерполированный между вершинами!
    // Именно поэтому треугольник будет с градиентом, хотя цвета заданы только в углах.
    const fragmentSrc = `
      precision mediump float;
      varying vec3 v_color;
      void main() {
        gl_FragColor = vec4(v_color, 1.0);
      }
    `

    // ─── 2. Компилируем шейдеры ────────────────────────────────────────────
    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader)
        gl.deleteShader(shader)
        throw new Error(`Shader compile error: ${log}`)
      }
      return shader
    }

    let program: WebGLProgram
    try {
      const vs = compile(gl.VERTEX_SHADER, vertexSrc)
      const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc)
      // ─── 3. Линкуем в программу ──────────────────────────────────────────
      program = gl.createProgram()!
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Link error: ${gl.getProgramInfoLog(program)}`)
      }
    } catch (e) {
      setError((e as Error).message)
      return
    }

    gl.useProgram(program)

    // ─── 4. Готовим данные вершин ──────────────────────────────────────────
    // Три вершины треугольника + цвет каждой.
    // x, y,  r, g, b   (по 5 чисел на вершину)
    // Координаты: -1..+1, центр (0,0), Y вверх — это NDC (Normalized Device Coords).
    // prettier-ignore
    const vertices = new Float32Array([
      // x      y      r    g    b
       0.0,   0.8,   1.0, 0.2, 0.3,   // верхняя — красная
      -0.8,  -0.6,   0.2, 0.8, 0.4,   // левая нижняя — зелёная
       0.8,  -0.6,   0.2, 0.5, 1.0,   // правая нижняя — синяя
    ])

    // Создаём буфер на GPU и загружаем туда данные.
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    // ─── 5. Говорим WebGL'у, как читать буфер ──────────────────────────────
    const FSIZE = vertices.BYTES_PER_ELEMENT // 4 байта = размер float

    const aPosition = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPosition)
    // 2 float'а (x, y) с шагом 5 float'ов (offset 0)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, FSIZE * 5, 0)

    const aColor = gl.getAttribLocation(program, 'a_color')
    gl.enableVertexAttribArray(aColor)
    // 3 float'а (r, g, b) с шагом 5 float'ов (offset 2 float'а)
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2)

    // ─── 6. Рисуем ─────────────────────────────────────────────────────────
    gl.clearColor(0.95, 0.97, 1.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3) // нарисовать треугольник по 3 вершинам
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>6. WebGL — "Hello, Triangle!"</h3>
        <span className='bm-badge'>Уровень 2 · GPU</span>
      </div>
      <p className='bm-desc'>
        WebGL — это <strong>совсем другой</strong> мир. Здесь ты не "рисуешь" фигуры, а
        загружаешь <strong>массив вершин</strong> в видеокарту и пишешь две мини-программы —{' '}
        <strong>шейдеры</strong> — которые крутятся прямо на GPU. Это сложно, но в сотни раз
        быстрее для сложной графики. Треугольник ниже — самый простой пример (≈40 строк JS +
        2 шейдера).
      </p>

      <canvas
        ref={canvasRef}
        width={460}
        height={300}
        className='gfx-canvas'
      />
      {error && <div className='gfx-error'>⚠️ {error}</div>}

      <details className='bm-code-block'>
        <summary>Что произошло — шаг за шагом</summary>
        <pre>{`// ШАГ 1: vertex shader решает позицию каждой вершины
const vertexSrc = \`
  attribute vec2 a_position;       // вход: координата вершины
  attribute vec3 a_color;          // вход: цвет вершины
  varying vec3 v_color;            // выход: цвет (передаём дальше)
  void main() {
    v_color = a_color;
    gl_Position = vec4(a_position, 0.0, 1.0);  // обязательный output
  }
\`

// ШАГ 2: fragment shader решает цвет каждого пикселя
const fragmentSrc = \`
  precision mediump float;
  varying vec3 v_color;            // приходит из vertex shader,
                                   // ИНТЕРПОЛИРУЕТСЯ между вершинами!
  void main() {
    gl_FragColor = vec4(v_color, 1.0);
  }
\`

// ШАГ 3: компиляция → линковка → программа
const vs = compileShader(gl.VERTEX_SHADER, vertexSrc)
const fs = compileShader(gl.FRAGMENT_SHADER, fragmentSrc)
const program = gl.createProgram()
gl.attachShader(program, vs); gl.attachShader(program, fs)
gl.linkProgram(program); gl.useProgram(program)

// ШАГ 4: загружаем вершины в GPU-буфер
const data = new Float32Array([
   0.0,  0.8,  1,0,0,
  -0.8, -0.6,  0,1,0,
   0.8, -0.6,  0,0,1,
])
const buf = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, buf)
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

// ШАГ 5: говорим WebGL'у, как читать буфер
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 20, 0)   // x,y
gl.vertexAttribPointer(aColor,    3, gl.FLOAT, false, 20, 8)   // r,g,b

// ШАГ 6: рисуем!
gl.drawArrays(gl.TRIANGLES, 0, 3)

// ⚠️ КООРДИНАТЫ WebGL: -1..+1, центр (0,0), Y ВВЕРХ
// (в Canvas 2D было: 0..width, (0,0) сверху, Y вниз)`}</pre>
      </details>
    </div>
  )
}

// ─── 7. WebGL: анимированный шейдер ─────────────────────────────────────────
// Покажем uniform — переменную, которую можно менять снаружи (из JS) для каждого кадра.
// Фрагментный шейдер будет рисовать "плазму" на основе времени.

function WebGLAnimatedShader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) {
      setError('WebGL не поддерживается')
      return
    }

    // Vertex shader: просто два треугольника, покрывающих весь экран ("fullscreen quad").
    // Это стандартный приём — даём GPU 4 угла, фрагментный шейдер делает всю работу.
    const vsSrc = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `
    // Fragment shader: для каждого пикселя считает цвет на основе:
    // — u_time   (анимируется снаружи)
    // — u_resolution (размер canvas, чтобы считать координаты)
    // gl_FragCoord — встроенная переменная: позиция текущего пикселя.
    const fsSrc = `
      precision mediump float;
      uniform float u_time;
      uniform vec2  u_resolution;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;  // 0..1
        vec2 c  = uv * 2.0 - 1.0;                     // -1..+1
        // Плазма — сумма нескольких синусов от расстояния и угла:
        float d = length(c);
        float a = atan(c.y, c.x);
        float v = sin(d * 8.0 - u_time * 2.0)
                + sin(a * 5.0 + u_time)
                + sin((c.x + c.y) * 4.0 + u_time * 1.5);
        v /= 3.0;
        vec3 col = 0.5 + 0.5 * vec3(
          sin(v * 3.14 + 0.0),
          sin(v * 3.14 + 2.1),
          sin(v * 3.14 + 4.2)
        );
        gl_FragColor = vec4(col, 1.0);
      }
    `

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) || 'compile error')
      }
      return s
    }

    let program: WebGLProgram
    try {
      const vs = compile(gl.VERTEX_SHADER, vsSrc)
      const fs = compile(gl.FRAGMENT_SHADER, fsSrc)
      program = gl.createProgram()!
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'link error')
      }
    } catch (e) {
      setError((e as Error).message)
      return
    }
    gl.useProgram(program)

    // Fullscreen quad: два треугольника, покрывающих [-1..1] × [-1..1].
    // prettier-ignore
    const quad = new Float32Array([
      -1, -1,   1, -1,   -1, 1,
      -1,  1,   1, -1,    1, 1,
    ])
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    // Uniforms — переменные, которые меняем из JS каждый кадр.
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uRes = gl.getUniformLocation(program, 'u_resolution')
    gl.uniform2f(uRes, canvas.width, canvas.height)

    const start = performance.now()
    let rafId = 0
    const tick = () => {
      const t = (performance.now() - start) / 1000
      gl.uniform1f(uTime, t) // обновили время
      gl.drawArrays(gl.TRIANGLES, 0, 6) // 6 вершин = 2 треугольника = квад
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>7. WebGL — анимированный фрагментный шейдер</h3>
        <span className='bm-badge'>Уровень 2 · Шейдеры</span>
      </div>
      <p className='bm-desc'>
        Тот же WebGL, но теперь рисуем <strong>"fullscreen quad"</strong> (два треугольника на весь
        экран) и вся магия — в <strong>фрагментном шейдере</strong>. Передаём{' '}
        <code>u_time</code> через <code>uniform</code>, и каждый пиксель сам считает свой цвет.
        Так делают <a href='https://www.shadertoy.com' target='_blank' rel='noreferrer'>Shadertoy</a> и большинство визуальных эффектов в играх.
      </p>

      <canvas
        ref={canvasRef}
        width={460}
        height={300}
        className='gfx-canvas'
      />
      {error && <div className='gfx-error'>⚠️ {error}</div>}

      <details className='bm-code-block'>
        <summary>Идея: вычислительная мощь на стороне GPU</summary>
        <pre>{`// На каждом кадре fragment shader вызывается ОДИН РАЗ на КАЖДЫЙ ПИКСЕЛЬ.
// При 460x300 это 138 000 вызовов за кадр, при 60 fps — 8.3 миллиона/сек.
// На CPU это было бы немыслимо. На GPU — это нативный режим работы.

// Uniform — переменная, общая для всех пикселей этого кадра:
uniform float u_time;        // время с запуска
uniform vec2  u_resolution;  // размер canvas

// gl_FragCoord — встроенный input: позиция текущего пикселя в пикселях
// (x: 0..width, y: 0..height, Y ВВЕРХ — в отличие от Canvas 2D!).

// Из JS меняем uniform:
gl.uniform1f(gl.getUniformLocation(program, 'u_time'), elapsedSec)

// Всё. Drawing call один — gl.drawArrays(...) — а GPU делает 138k вычислений.

// ⚠️ Это та же техника, на которой работает Shadertoy.
// Скопируй любой шейдер оттуда — он почти 1-в-1 подходит сюда.`}</pre>
      </details>
    </div>
  )
}

// ─── 8. Three.js: куб, сцена, камера, свет ─────────────────────────────────
// Three.js — это БИБЛИОТЕКА поверх WebGL. Она прячет всю боль с шейдерами и буферами
// за удобными объектами: Scene, Camera, Mesh, Light, Material.
// Все игры/3D-демки в вебе обычно пишут на Three.js (или на её обёртке react-three-fiber).
//
// Минимум для 3D-сцены:
//   1. Scene  — контейнер для всех 3D-объектов
//   2. Camera — точка зрения (где мы смотрим и под каким углом)
//   3. Renderer — то, что рисует сцену в canvas
//   4. Mesh = Geometry (форма) + Material (как красить)
//   5. Light — свет (без него Material типа "Lambert/Standard" будет чёрным)

function ThreeJSCube() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = 320

    // ─── 1. Сцена ───────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f9ff)

    // ─── 2. Камера ──────────────────────────────────────────────────────────
    // PerspectiveCamera(fov, aspect, near, far)
    //   fov     — угол обзора в градусах (45 — стандарт, как у "обычного" глаза)
    //   aspect  — соотношение сторон (иначе картинка растянется)
    //   near    — что ближе ЭТОГО, не рисуем (0.1 — норма)
    //   far     — что дальше ЭТОГО, не рисуем (1000 — норма)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 1.5, 4) // x=0 y=1.5 z=4 — стоим чуть выше и поодаль
    camera.lookAt(0, 0, 0) // смотрим в центр сцены

    // ─── 3. Рендерер ────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio) // чёткость на retina
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    // ─── 4. Объекты в сцене ─────────────────────────────────────────────────
    // Куб = геометрия (1x1x1) + материал (реагирующий на свет)
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.4, metalness: 0.2 })
    )
    scene.add(cube)

    // Тор (бублик) рядом
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.15, 16, 100),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.4 })
    )
    torus.position.set(1.8, 0, 0)
    scene.add(torus)

    // Сфера с другой стороны
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.2, metalness: 0.6 })
    )
    sphere.position.set(-1.8, 0, 0)
    scene.add(sphere)

    // Пол (плоскость) — чтобы было ощущение пространства
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
    )
    floor.rotation.x = -Math.PI / 2 // плашмя
    floor.position.y = -0.8
    scene.add(floor)

    // ─── 5. Свет ────────────────────────────────────────────────────────────
    // Без света MeshStandardMaterial рисуется ЧЁРНЫМ — частый ступор у новичков.
    // Ambient — равномерный фоновый свет, как небо в тени.
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    // Directional — солнце: лучи параллельные, идут из точки в нулевую.
    const sun = new THREE.DirectionalLight(0xffffff, 1.5)
    sun.position.set(5, 8, 5)
    scene.add(sun)

    // ─── 6. Анимация ────────────────────────────────────────────────────────
    let rafId = 0
    const animate = () => {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.012
      torus.rotation.x += 0.02
      torus.rotation.y += 0.01
      sphere.rotation.y += 0.015
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    // ─── 7. Резайз ──────────────────────────────────────────────────────────
    const onResize = () => {
      const w = container.clientWidth
      camera.aspect = w / height
      camera.updateProjectionMatrix() // обязательно после смены aspect!
      renderer.setSize(w, height)
    }
    window.addEventListener('resize', onResize)

    // ─── 8. Cleanup ────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      renderer.dispose() // освободить GPU-ресурсы
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>8. Three.js — первая 3D-сцена</h3>
        <span className='bm-badge'>Уровень 3 · 3D</span>
      </div>
      <p className='bm-desc'>
        Three.js — это <strong>обёртка над WebGL</strong>. Никаких шейдеров писать не нужно:
        даём готовые объекты <code>BoxGeometry</code>, <code>MeshStandardMaterial</code>,{' '}
        <code>DirectionalLight</code> — и библиотека сама генерирует шейдеры. 90% 3D-вебсайтов
        написаны на Three.js или её React-обёртке <code>@react-three/fiber</code>.
      </p>

      <div
        ref={containerRef}
        className='gfx-three-container'
      />

      <details className='bm-code-block'>
        <summary>Анатомия любой Three.js сцены — 5 шагов</summary>
        <pre>{`// 1. SCENE — контейнер для объектов
const scene = new THREE.Scene()

// 2. CAMERA — точка зрения
const camera = new THREE.PerspectiveCamera(
  45,                // FOV — угол обзора (45° — норма)
  width / height,    // aspect ratio
  0.1, 1000          // near/far clipping planes
)
camera.position.set(0, 1.5, 4)
camera.lookAt(0, 0, 0)

// 3. RENDERER — то, что рисует
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(width, height)
container.appendChild(renderer.domElement)

// 4. MESH = Geometry + Material
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x4f46e5 })
)
scene.add(cube)

// 5. LIGHT — обязательно, иначе чёрный экран!
scene.add(new THREE.AmbientLight(0xffffff, 0.5))
const sun = new THREE.DirectionalLight(0xffffff, 1.5)
sun.position.set(5, 8, 5)
scene.add(sun)

// АНИМАЦИЯ — стандартный rAF-цикл:
function animate() {
  cube.rotation.y += 0.01
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()

// ⚠️ ТИПИЧНЫЕ БАГИ НОВИЧКОВ:
// 1. Куб чёрный → забыл добавить свет
// 2. Куб не видно → камера ВНУТРИ куба (поставь position.z подальше)
// 3. Картинка растянута → не обновил camera.aspect после resize
// 4. Утечка памяти → не вызвал renderer.dispose() при unmount

// КООРДИНАТЫ Three.js:
//   X — вправо
//   Y — ВВЕРХ
//   Z — НА ТЕБЯ (к камере)
// Это правая система координат, как в OpenGL.`}</pre>
      </details>
    </div>
  )
}

// ─── 9. Three.js + интерактив: вращение мышью ──────────────────────────────
// Покажем, как обрабатывать мышь в 3D: тащим мышь — крутим объект.
// Это самый частый способ показать пользователю 3D-объект.

function ThreeJSInteractive() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = 340

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.set(0, 0, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    // Группа — это "контейнер" для нескольких mesh'ей. Крутим её — крутится всё внутри.
    const group = new THREE.Group()
    scene.add(group)

    // Сделаем интересную фигуру: икосаэдр + проволочный каркас сверху
    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 0),
      new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        roughness: 0.3,
        metalness: 0.6,
        flatShading: true, // плоские грани → видно полигоны
      })
    )
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.52, 0)),
      new THREE.LineBasicMaterial({ color: 0xfbbf24 })
    )
    group.add(ico)
    group.add(wire)

    // Свет
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const pl = new THREE.PointLight(0xff00ff, 50, 100)
    pl.position.set(3, 3, 3)
    scene.add(pl)
    const pl2 = new THREE.PointLight(0x00ffff, 50, 100)
    pl2.position.set(-3, -3, 3)
    scene.add(pl2)

    // ─── Интерактив: тащим мышью → крутим группу ──────────────────────────
    // Сохраняем "целевые" углы и плавно к ним приближаемся каждый кадр.
    // Это даёт "пружинный" эффект — куб не дёргается резко.
    const state = {
      dragging: false,
      lastX: 0,
      lastY: 0,
      targetRotY: 0,
      targetRotX: 0,
    }

    const onDown = (e: PointerEvent) => {
      state.dragging = true
      state.lastX = e.clientX
      state.lastY = e.clientY
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!state.dragging) return
      const dx = e.clientX - state.lastX
      const dy = e.clientY - state.lastY
      // Двигаем мышь вправо → крутим объект вокруг Y. Чувствительность 0.01.
      state.targetRotY += dx * 0.01
      state.targetRotX += dy * 0.01
      state.lastX = e.clientX
      state.lastY = e.clientY
    }
    const onUp = () => {
      state.dragging = false
    }

    const el = renderer.domElement
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.style.cursor = 'grab'

    let rafId = 0
    const animate = () => {
      // Линейная интерполяция (lerp) к целевым углам — даёт инерцию.
      group.rotation.y += (state.targetRotY - group.rotation.y) * 0.1
      group.rotation.x += (state.targetRotX - group.rotation.x) * 0.1
      // Лёгкое автовращение, если не таскают
      if (!state.dragging) {
        state.targetRotY += 0.003
      }
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    const onResize = () => {
      const w = container.clientWidth
      camera.aspect = w / height
      camera.updateProjectionMatrix()
      renderer.setSize(w, height)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      renderer.dispose()
      container.removeChild(el)
    }
  }, [])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>9. Three.js — интерактив (drag-to-rotate)</h3>
        <span className='bm-badge'>Уровень 3 · UX</span>
      </div>
      <p className='bm-desc'>
        Захвати объект мышью и потяни — он будет вращаться. Это базовый паттерн любого 3D-вьюера.
        Хитрость в <strong>линейной интерполяции (lerp)</strong>: вместо того, чтобы менять угол
        напрямую, мы плавно приближаемся к целевому — получается приятная инерция.
      </p>

      <div
        ref={containerRef}
        className='gfx-three-container gfx-three-dark'
      />

      <details className='bm-code-block'>
        <summary>Lerp — секрет плавных анимаций</summary>
        <pre>{`// Плохо: резкое присваивание
group.rotation.y = targetRotY
// объект "телепортируется" в новый угол.

// Хорошо: lerp каждый кадр
group.rotation.y += (targetRotY - group.rotation.y) * 0.1
// коэффициент 0.1 = "за 10 кадров пройдём 99% пути".
// Меньше → плавнее. Больше → резче.

// Эта формула — основа любых "пружинных" анимаций в UI.
// Она же лежит в основе CSS transition (с другим временем).

// ⚠️ Для серьёзных вьюверов используют OrbitControls:
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const controls = new OrbitControls(camera, renderer.domElement)
// → бесплатно: pan, zoom, инерция, ограничения углов.`}</pre>
      </details>
    </div>
  )
}

// ─── 8. Сравнительная таблица: когда что использовать ───────────────────────

function GraphicsComparison() {
  return (
    <div className='bm-table-card'>
      <h3>Что выбрать под задачу</h3>
      <table className='bm-table'>
        <thead>
          <tr>
            <th>Технология</th>
            <th>Сильна в</th>
            <th>Слаба в</th>
            <th>Типичный кейс</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>SVG</strong>
            </td>
            <td>Иконки, диаграммы, до ~1000 элементов. DOM-события на каждом элементе.</td>
            <td>Тысячи элементов — тормозит (DOM).</td>
            <td>Иконки, графики с подсказками, схемы.</td>
          </tr>
          <tr>
            <td>
              <strong>Canvas 2D</strong>
            </td>
            <td>Многие сотни/тысячи объектов. Простой API. Анимации, игры 2D.</td>
            <td>События на конкретный пиксель/фигуру нужно делать руками. Не масштабируется (битмап).</td>
            <td>Whiteboard, графики реального времени, 2D игры, рисовалки.</td>
          </tr>
          <tr>
            <td>
              <strong>PixiJS</strong>
            </td>
            <td>Десятки тысяч объектов в 60 fps (GPU-батчинг). API почти как Canvas 2D. Готовые события на каждый объект.</td>
            <td>+400KB к бандлу. Для простых 5-10 фигур избыточен.</td>
            <td>2D-игры, интерактивные баннеры, тяжёлые whiteboard'ы, частицы.</td>
          </tr>
          <tr>
            <td>
              <strong>WebGL</strong>
            </td>
            <td>Миллионы вершин, шейдеры, кастомные эффекты. GPU-параллелизм.</td>
            <td>Сложный API. Каждая мелочь — десятки строк boilerplate.</td>
            <td>Кастомные эффекты, частицы, шейдер-арт (Shadertoy).</td>
          </tr>
          <tr>
            <td>
              <strong>Three.js</strong>
            </td>
            <td>3D-сцены за 30 строк. Готовые геометрии, материалы, свет, загрузчики GLTF.</td>
            <td>+700KB к бандлу. Шаг влево от стандартных вещей — снова шейдеры.</td>
            <td>3D-вьюверы товара, 3D-конфигураторы, маркетинговые сайты, простые игры.</td>
          </tr>
          <tr>
            <td>
              <strong>react-three-fiber</strong>
            </td>
            <td>Three.js в JSX-стиле. Декларативно. Идеально для React-приложений.</td>
            <td>Слой абстракции — иногда мешает в перформанс-критичных местах.</td>
            <td>Three.js внутри React-приложения. По умолчанию для нового проекта.</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────

export function GraphicsShowcase() {
  return (
    <div className='bm-showcase'>
      <header className='bm-header'>
        <h1 className='bm-title'>Графика в браузере: Canvas → WebGL → Three.js</h1>
        <p className='bm-subtitle'>
          Три уровня сложности от простого к продвинутому. Прочитай <code>GraphicsShowcase.md</code>{' '}
          параллельно — там подробный план изучения и теория за каждым примером.
        </p>
      </header>

      <Canvas2DBasics />
      <Canvas2DAnimation />
      <Canvas2DPaint />
      <PixiJSBasics />
      <PixiJSParticles />
      <WebGLTriangle />
      <WebGLAnimatedShader />
      <ThreeJSCube />
      <ThreeJSInteractive />
      <GraphicsComparison />

      <div className='bm-footer-note'>
        💡 <strong>Топ-вопросы на интервью:</strong> разница Canvas vs SVG vs WebGL; что такое
        vertex/fragment shader; зачем <code>requestAnimationFrame</code> вместо{' '}
        <code>setInterval</code>; почему Three.js материал может быть чёрным (свет!); что такое
        device pixel ratio и почему canvas размытый на retina.
      </div>
    </div>
  )
}

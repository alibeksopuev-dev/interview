import { useEffect, useRef, useState } from 'react'

// ─── 1. Mouse coordinates playground ───────────────────────────────────────

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

function MouseCoordsDemo() {
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

// ─── 2. Element metrics: offsetWidth / clientWidth / scrollWidth ───────────

function ElementMetricsDemo() {
  const targetRef = useRef<HTMLDivElement | null>(null)
  const [metrics, setMetrics] = useState({
    offsetWidth: 0,
    offsetHeight: 0,
    clientWidth: 0,
    clientHeight: 0,
    scrollWidth: 0,
    scrollHeight: 0,
    scrollTop: 0,
  })
  const [hasBorder, setHasBorder] = useState(true)
  const [hasScroll, setHasScroll] = useState(true)

  const measure = () => {
    const el = targetRef.current
    if (!el) return
    setMetrics({
      offsetWidth: el.offsetWidth,
      offsetHeight: el.offsetHeight,
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
      scrollWidth: el.scrollWidth,
      scrollHeight: el.scrollHeight,
      scrollTop: Math.round(el.scrollTop),
    })
  }

  useEffect(() => {
    measure()
    const el = targetRef.current
    if (!el) return

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const onScroll = () => measure()
    el.addEventListener('scroll', onScroll)
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', onScroll)
    }
  }, [hasBorder, hasScroll])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>2. Метрики элемента DOM</h3>
        <span className='bm-badge'>offsetW / clientW / scrollW</span>
      </div>
      <p className='bm-desc'>
        Переключи чекбоксы ниже — смотри как меняются метрики.{' '}
        <strong>offsetWidth</strong> включает border. <strong>clientWidth</strong> — только padding
        и контент. <strong>scrollWidth</strong> — полное содержимое включая невидимую часть.
      </p>

      <div className='bm-toggles'>
        <label className='bm-toggle'>
          <input
            type='checkbox'
            checked={hasBorder}
            onChange={e => setHasBorder(e.target.checked)}
          />
          <span>border 8px</span>
        </label>
        <label className='bm-toggle'>
          <input
            type='checkbox'
            checked={hasScroll}
            onChange={e => setHasScroll(e.target.checked)}
          />
          <span>переполнение (overflow)</span>
        </label>
      </div>

      <div
        ref={targetRef}
        className='bm-metric-target'
        style={{
          border: hasBorder ? '8px solid #4f46e5' : '8px solid transparent',
        }}
      >
        <div className='bm-metric-inner' style={{ width: hasScroll ? 800 : '100%' }}>
          {hasScroll
            ? 'Очень длинный контент, который не помещается в видимую область и создаёт горизонтальный скролл. Прокрути это вправо — обнови scrollLeft.'
            : 'Короткий контент.'}
        </div>
      </div>

      <div className='bm-metrics-grid'>
        <MetricCell label='offsetWidth' value={metrics.offsetWidth} hint='+border, +padding, +scrollbar' />
        <MetricCell label='offsetHeight' value={metrics.offsetHeight} hint='+border, +padding, +scrollbar' />
        <MetricCell label='clientWidth' value={metrics.clientWidth} hint='+padding (−scrollbar, −border)' />
        <MetricCell label='clientHeight' value={metrics.clientHeight} hint='+padding (−scrollbar, −border)' />
        <MetricCell label='scrollWidth' value={metrics.scrollWidth} hint='Полная ширина контента' />
        <MetricCell label='scrollHeight' value={metrics.scrollHeight} hint='Полная высота контента' />
      </div>

      <details className='bm-code-block'>
        <summary>Шпаргалка</summary>
        <pre>{`// offsetWidth/Height = border + padding + content + scrollbar (видимая часть)
// clientWidth/Height = padding + content (без border и scrollbar)
// scrollWidth/Height = полный размер контента (видимое + скрытое за overflow)

// "Есть ли скролл?":
const hasVerticalScroll = el.scrollHeight > el.clientHeight;

// "Скроллим вниз до конца":
el.scrollTop = el.scrollHeight - el.clientHeight;

// "Пользователь долистал до низа?":
const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;`}</pre>
      </details>
    </div>
  )
}

function MetricCell({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className='bm-metric-cell'>
      <div className='bm-metric-label'>{label}</div>
      <div className='bm-metric-value'>{value}px</div>
      <div className='bm-metric-hint'>{hint}</div>
    </div>
  )
}

// ─── 3. getBoundingClientRect demo ──────────────────────────────────────────

function GetBoundingRectDemo() {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const [scrollY, setScrollY] = useState(0)

  const measure = () => {
    const el = boxRef.current
    if (!el) return
    setRect(el.getBoundingClientRect())
    setScrollY(window.scrollY)
  }

  useEffect(() => {
    measure()
    window.addEventListener('scroll', measure)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    measure()
  }, [rotation, scale])

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>3. getBoundingClientRect()</h3>
        <span className='bm-badge'>Главный инструмент геометрии</span>
      </div>
      <p className='bm-desc'>
        Возвращает положение и размер с учётом transform (rotate, scale). Координаты — относительно
        viewport (как clientX). Прокрути окно — увидишь как меняется <code>top</code>.
      </p>

      <div className='bm-rect-controls'>
        <label>
          rotate: {rotation}°
          <input
            type='range'
            min={0}
            max={360}
            value={rotation}
            onChange={e => setRotation(Number(e.target.value))}
          />
        </label>
        <label>
          scale: {scale.toFixed(2)}
          <input
            type='range'
            min={50}
            max={200}
            value={scale * 100}
            onChange={e => setScale(Number(e.target.value) / 100)}
          />
        </label>
        <button className='bm-btn-primary' onClick={measure}>
          🔄 Перемерять
        </button>
      </div>

      <div className='bm-rect-stage'>
        <div
          ref={boxRef}
          className='bm-rect-target'
          style={{
            transform: `rotate(${rotation}deg) scale(${scale})`,
          }}
        >
          target
        </div>
      </div>

      {rect && (
        <div className='bm-rect-readout'>
          <div className='bm-rect-grid'>
            <div>
              <strong>x / left:</strong> {rect.left.toFixed(1)}px
            </div>
            <div>
              <strong>y / top:</strong> {rect.top.toFixed(1)}px
            </div>
            <div>
              <strong>right:</strong> {rect.right.toFixed(1)}px
            </div>
            <div>
              <strong>bottom:</strong> {rect.bottom.toFixed(1)}px
            </div>
            <div>
              <strong>width:</strong> {rect.width.toFixed(1)}px
            </div>
            <div>
              <strong>height:</strong> {rect.height.toFixed(1)}px
            </div>
          </div>
          <div className='bm-rect-derived'>
            В системе документа: <code>pageTop = top + scrollY</code> ={' '}
            <strong>{(rect.top + scrollY).toFixed(1)}px</strong>
          </div>
        </div>
      )}

      <details className='bm-code-block'>
        <summary>Шпаргалка</summary>
        <pre>{`const rect = el.getBoundingClientRect();

// rect.width / rect.height учитывают transform (rotate, scale)!
// offsetWidth / clientWidth — НЕ учитывают.

// Виден ли элемент во viewport?
const inView = (
  rect.top >= 0 &&
  rect.left >= 0 &&
  rect.bottom <= window.innerHeight &&
  rect.right <= window.innerWidth
);

// ⚠️ getBoundingClientRect() форсирует LAYOUT (reflow).
// Не вызывай его в цикле — батчи измерения через rAF.
// Не чередуй чтение (getBoundingClientRect) и запись (style.X) — layout thrashing.`}</pre>
      </details>

      <div className='bm-warning'>
        ⚠️ <strong>Layout thrashing:</strong> чередование чтения (
        <code>getBoundingClientRect</code>, <code>offsetTop</code>) и записи в стили в одном цикле
        заставляет браузер пересчитывать layout снова и снова. <strong>Решение:</strong> сначала
        прочитай всё что нужно, потом сделай все записи.
      </div>
    </div>
  )
}

// ─── 4. Vanilla Drag & Drop (no library) ───────────────────────────────────

interface DragItem {
  id: number
  x: number
  y: number
  color: string
}

const INITIAL_ITEMS: DragItem[] = [
  { id: 1, x: 20, y: 20, color: '#0ea5e9' },
  { id: 2, x: 160, y: 60, color: '#22c55e' },
  { id: 3, x: 300, y: 30, color: '#f59e0b' },
]

function DragDropDemo() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [items, setItems] = useState<DragItem[]>(INITIAL_ITEMS)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  // Сохраняем смещение точки клика относительно угла элемента,
  // чтобы при перетаскивании курсор не "прыгал" в левый верх.
  const dragOffsetRef = useRef({ dx: 0, dy: 0 })

  const [pointerCoords, setPointerCoords] = useState<{ clientX: number; clientY: number } | null>(null)
  const [stageRectCoords, setStageRectCoords] = useState<{ left: number; top: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, item: DragItem) => {
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    // dx, dy — где внутри элемента нажал пользователь
    dragOffsetRef.current = {
      dx: Math.round(e.clientX - rect.left),
      dy: Math.round(e.clientY - rect.top),
    }
    target.setPointerCapture(e.pointerId) // ловим pointer — больше не отпустим до pointerup
    setDraggingId(item.id)
    setPointerCoords({ clientX: Math.round(e.clientX), clientY: Math.round(e.clientY) })
    if (stageRef.current) {
      const sRect = stageRef.current.getBoundingClientRect()
      setStageRectCoords({ left: Math.round(sRect.left), top: Math.round(sRect.top) })
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingId == null) return
    const stage = stageRef.current
    if (!stage) return

    const stageRect = stage.getBoundingClientRect()
    // Переводим координаты курсора (viewport) в систему координат stage:
    //   клиентский X − левый край stage − смещение клика внутри элемента
    let x = e.clientX - stageRect.left - dragOffsetRef.current.dx
    let y = e.clientY - stageRect.top - dragOffsetRef.current.dy

    // Clamp в границы stage (размер элемента — 60×60)
    x = Math.max(0, Math.min(stageRect.width - 60, x))
    y = Math.max(0, Math.min(stageRect.height - 60, y))

    setItems(prev => prev.map(it => (it.id === draggingId ? { ...it, x, y } : it)))
    setPointerCoords({ clientX: Math.round(e.clientX), clientY: Math.round(e.clientY) })
    setStageRectCoords({ left: Math.round(stageRect.left), top: Math.round(stageRect.top) })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setDraggingId(null)
    setPointerCoords(null)
    setStageRectCoords(null)
  }

  const reset = () => setItems(INITIAL_ITEMS)

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>4. Drag &amp; Drop вручную (без библиотек)</h3>
        <span className='bm-badge'>Pointer Events</span>
      </div>
      <p className='bm-desc'>
        Классическая задача с интервью: реализовать drag&drop без сторонних библиотек. Главный
        приём — на <code>pointerdown</code> запомнить <strong>смещение клика</strong> внутри
        элемента (через <code>getBoundingClientRect</code>), и на <code>pointermove</code>
        пересчитывать позицию: <code>clientX − stage.left − offset</code>. Pointer Capture гарантирует,
        что все события доедут до элемента даже если курсор уйдёт за его границы.
      </p>

      <div className='bm-rect-controls'>
        <button className='bm-btn-primary' onClick={reset}>
          🔄 Сбросить позиции
        </button>
        <span style={{ fontSize: 12, color: '#475569' }}>
          Перетаскивай цветные блоки. {draggingId && <strong>Тянем #{draggingId}</strong>}
        </span>
      </div>

      <div className='bm-drag-container'>
        <div
          ref={stageRef}
          className='bm-drag-stage'
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {items.map(item => (
            <div
              key={item.id}
              className='bm-drag-item'
              onPointerDown={e => handlePointerDown(e, item)}
              onPointerUp={handlePointerUp}
              style={{
                left: item.x,
                top: item.y,
                background: item.color,
                cursor: draggingId === item.id ? 'grabbing' : 'grab',
                zIndex: draggingId === item.id ? 2 : 1,
                boxShadow:
                  draggingId === item.id
                    ? '0 12px 28px rgba(0,0,0,0.25)'
                    : '0 4px 10px rgba(0,0,0,0.12)',
              }}
            >
              #{item.id}
              <small>
                {Math.round(item.x)}, {Math.round(item.y)}
              </small>
            </div>
          ))}
        </div>

        <div className='bm-drag-info-panel'>
          <h4>📍 Панель состояния и координат</h4>
          <div className='bm-drag-info-list'>
            {items.map(item => {
              const isDragging = draggingId === item.id
              return (
                <div
                  key={item.id}
                  className={`bm-drag-info-card ${isDragging ? 'active' : ''}`}
                  style={{ borderLeftColor: item.color }}
                >
                  <div className='bm-drag-info-header'>
                    <span className='bm-drag-info-badge' style={{ backgroundColor: item.color }}>
                      Блок #{item.id}
                    </span>
                    <span className={`bm-status-pill ${isDragging ? 'dragging' : 'idle'}`}>
                      {isDragging ? 'Перетаскивание' : 'В покое'}
                    </span>
                  </div>

                  <div className='bm-drag-info-grid'>
                    <div className='bm-drag-info-metric'>
                      <div className='bm-dim-label'>Стиль (left, top)</div>
                      <div className='bm-dim-value'>
                        {Math.round(item.x)}px, {Math.round(item.y)}px
                      </div>
                    </div>

                    {isDragging && pointerCoords && stageRectCoords ? (
                      <>
                        <div className='bm-drag-info-metric'>
                          <div className='bm-dim-label'>Курсор (clientX, clientY)</div>
                          <div className='bm-dim-value'>
                            {pointerCoords.clientX}, {pointerCoords.clientY}
                          </div>
                        </div>
                        <div className='bm-drag-info-metric'>
                          <div className='bm-dim-label'>Клик смещение (dx, dy)</div>
                          <div className='bm-dim-value'>
                            {dragOffsetRef.current.dx}, {dragOffsetRef.current.dy}
                          </div>
                        </div>
                        <div className='bm-drag-info-metric'>
                          <div className='bm-dim-label'>Stage (left, top)</div>
                          <div className='bm-dim-value'>
                            {stageRectCoords.left}, {stageRectCoords.top}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className='bm-drag-info-placeholder'>
                        Потяни этот блок, чтобы увидеть расчет формулы
                      </div>
                    )}
                  </div>

                  {isDragging && pointerCoords && stageRectCoords && (
                    <div className='bm-formula-explanation'>
                      <code>
                        x = {pointerCoords.clientX} (clientX) − {stageRectCoords.left} (stage.left) − {dragOffsetRef.current.dx} (dx) = <strong>{Math.round(item.x)}px</strong>
                      </code>
                      <br />
                      <code>
                        y = {pointerCoords.clientY} (clientY) − {stageRectCoords.top} (stage.top) − {dragOffsetRef.current.dy} (dy) = <strong>{Math.round(item.y)}px</strong>
                      </code>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <details className='bm-code-block'>
        <summary>Алгоритм drag&drop без библиотек</summary>
        <pre>{`// 1. pointerdown на элементе:
const rect = el.getBoundingClientRect();
const dx = e.clientX - rect.left; // смещение клика внутри элемента
const dy = e.clientY - rect.top;
el.setPointerCapture(e.pointerId); // фиксируем pointer

// 2. pointermove (на stage или window):
const stageRect = stage.getBoundingClientRect();
const x = e.clientX - stageRect.left - dx;
const y = e.clientY - stageRect.top - dy;
// clamp в границы и применить через style / setState

// 3. pointerup:
el.releasePointerCapture(e.pointerId);

// ⚠️ Почему НЕ mousemove + mouseup?
// — Pointer Events работают и для touch, и для пера. mouse — только мышь.
// — Pointer Capture сохраняет события на элементе, даже если курсор ушёл.
//   Без capture: drag "теряется" если двигаешь быстро.

// ⚠️ Почему запоминаем смещение клика?
// Без него блок "телепортируется" левым верхом к курсору.

// ⚠️ Почему через getBoundingClientRect, а не offsetLeft?
// Потому что rect учитывает scroll, transform, fixed-родителей. offsetLeft — нет.`}</pre>
      </details>
    </div>
  )
}

// ─── 5. Smart tooltip auto-flip (viewport-aware positioning) ───────────────

type TooltipPlacement =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'right'

function SmartTooltipDemo() {
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    placement: TooltipPlacement
    text: string
  }>({ visible: false, x: 0, y: 0, placement: 'top', text: '' })

  const showTooltip = (
    e: React.MouseEvent<HTMLButtonElement>,
    text: string,
    wantedPlacement: TooltipPlacement = 'top'
  ) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const TT_W = 220
    const TT_H = 60
    const GAP = 8

    const getCoords = (p: TooltipPlacement) => {
      let tx = rect.left + rect.width / 2 - TT_W / 2
      let ty = rect.top - TT_H - GAP

      if (p === 'top-left') {
        tx = rect.left
        ty = rect.top - TT_H - GAP
      } else if (p === 'top-right') {
        tx = rect.right - TT_W
        ty = rect.top - TT_H - GAP
      } else if (p === 'bottom') {
        tx = rect.left + rect.width / 2 - TT_W / 2
        ty = rect.bottom + GAP
      } else if (p === 'bottom-left') {
        tx = rect.left
        ty = rect.bottom + GAP
      } else if (p === 'bottom-right') {
        tx = rect.right - TT_W
        ty = rect.bottom + GAP
      } else if (p === 'left') {
        tx = rect.left - TT_W - GAP
        ty = rect.top + rect.height / 2 - TT_H / 2
      } else if (p === 'right') {
        tx = rect.right + GAP
        ty = rect.top + rect.height / 2 - TT_H / 2
      }
      return { x: tx, y: ty }
    }

    const fits = (tx: number, ty: number) => {
      return (
        tx >= GAP &&
        ty >= GAP &&
        tx + TT_W + GAP <= window.innerWidth &&
        ty + TT_H + GAP <= window.innerHeight
      )
    }

    const order: Record<TooltipPlacement, TooltipPlacement[]> = {
      top: ['top', 'bottom', 'right', 'left'],
      'top-left': ['top-left', 'bottom-left', 'right', 'left'],
      'top-right': ['top-right', 'bottom-right', 'left', 'right'],
      bottom: ['bottom', 'top', 'right', 'left'],
      'bottom-left': ['bottom-left', 'top-left', 'right', 'left'],
      'bottom-right': ['bottom-right', 'top-right', 'left', 'right'],
      left: ['left', 'right', 'top', 'bottom'],
      right: ['right', 'left', 'top', 'bottom'],
    }

    const placementsToTry = order[wantedPlacement]
    let placement = wantedPlacement
    let { x, y } = getCoords(placement)

    for (const p of placementsToTry) {
      const coords = getCoords(p)
      if (fits(coords.x, coords.y)) {
        placement = p
        x = coords.x
        y = coords.y
        break
      }
    }

    // Clamp по горизонтали, чтобы не вылезти за края viewport.
    x = Math.max(GAP, Math.min(window.innerWidth - TT_W - GAP, x))
    y = Math.max(GAP, Math.min(window.innerHeight - TT_H - GAP, y))

    setTooltip({ visible: true, x, y, placement, text })
  }

  const hideTooltip = () => setTooltip(t => ({ ...t, visible: false }))

  return (
    <div className='bm-card'>
      <div className='bm-card-header'>
        <h3>5. Умный tooltip с auto-flip</h3>
        <span className='bm-badge'>getBoundingClientRect + viewport</span>
      </div>
      <p className='bm-desc'>
        Классическая задача: tooltip должен показываться сверху, но если для него не хватает
        места — автоматически переключаться вниз / влево / вправо. Логика — чистая геометрия:
        измеряем <code>getBoundingClientRect()</code> кнопки, сравниваем с{' '}
        <code>window.innerWidth/Height</code>, выбираем placement. Прокрути страницу и наведи на
        крайние кнопки — увидишь, как tooltip "перепрыгивает".
      </p>

      <div className='bm-tooltip-grid'>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я слева сверху', 'top-left')} onMouseLeave={hideTooltip}>
          ↖ top-left
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я сверху по центру', 'top')} onMouseLeave={hideTooltip}>
          ↑ top-center
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я справа сверху', 'top-right')} onMouseLeave={hideTooltip}>
          ↗ top-right
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я слева снизу', 'bottom-left')} onMouseLeave={hideTooltip}>
          ↙ bottom-left
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я внизу по центру', 'bottom')} onMouseLeave={hideTooltip}>
          ↓ bottom-center
        </button>
        <button className='bm-tt-btn' onMouseEnter={e => showTooltip(e, 'Я справа снизу', 'bottom-right')} onMouseLeave={hideTooltip}>
          ↘ bottom-right
        </button>
        <button
          className='bm-tt-btn'
          onMouseEnter={e => showTooltip(e, 'Я слева посередине', 'left')}
          onMouseLeave={hideTooltip}
        >
          ← left
        </button>
        <button
          className='bm-tt-btn'
          onMouseEnter={e => showTooltip(e, 'Я справа посередине', 'right')}
          onMouseLeave={hideTooltip}
        >
          → right
        </button>
      </div>

      {tooltip.visible && (
        <div
          className='bm-smart-tooltip'
          style={{ left: tooltip.x, top: tooltip.y, position: 'fixed' }}
        >
          <div className='bm-tt-text'>{tooltip.text}</div>
          <div className='bm-tt-meta'>placement: {tooltip.placement}</div>
        </div>
      )}

      <details className='bm-code-block'>
        <summary>Алгоритм auto-flip</summary>
        <pre>{`// 1. Измеряем триггер:
const rect = trigger.getBoundingClientRect();

// 2. Пробуем placement по умолчанию (сверху):
let y = rect.top - tooltipHeight - gap;
let placement = 'top';

// 3. Не влезаем сверху? — переключаемся вниз:
if (y < 0) {
  y = rect.bottom + gap;
  placement = 'bottom';
}

// 4. И снизу не влезаем? — пробуем сбоку.
if (y + tooltipHeight > window.innerHeight) {
  placement = rect.right + tooltipWidth + gap < window.innerWidth ? 'right' : 'left';
}

// 5. Финальный clamp, чтобы не вылезти по горизонтали:
x = Math.max(gap, Math.min(window.innerWidth - tooltipWidth - gap, x));

// ⚠️ Используем position: fixed + clientX/clientY (viewport), не pageY.
// fixed позиционируется ОТ viewport, точно как rect.top.

// ⚠️ Floating UI / Popper решают эту задачу для prod, но на интервью
// просят написать руками — алгоритм укладывается в 30 строк.`}</pre>
      </details>
    </div>
  )
}

// ─── 6. Coordinate systems comparison ──────────────────────────────────────

function CoordinateSystemsTable() {
  return (
    <div className='bm-table-card'>
      <h3>Четыре системы координат — когда какую использовать</h3>
      <table className='bm-table'>
        <thead>
          <tr>
            <th>Система</th>
            <th>Точка отсчёта</th>
            <th>Меняется при scroll окна?</th>
            <th>Где использовать</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Document</strong>
              <br />
              <code>pageX/Y</code>
            </td>
            <td>Левый верх документа (включая прокрутку)</td>
            <td>Нет (абсолютная позиция)</td>
            <td>Drag &amp; Drop, "залипшие" tooltip'ы относительно контента</td>
          </tr>
          <tr>
            <td>
              <strong>Viewport</strong>
              <br />
              <code>clientX/Y</code>
            </td>
            <td>Левый верх viewport браузера</td>
            <td>Да (постоянно меняется при scroll)</td>
            <td>Модалки, dropdown'ы, popover'ы, position: fixed</td>
          </tr>
          <tr>
            <td>
              <strong>Element-local</strong>
              <br />
              <code>offsetX/Y</code>
            </td>
            <td>Левый верх target-элемента события</td>
            <td>Нет (локально внутри элемента)</td>
            <td>Canvas (точка клика на холсте), drag handles, координаты внутри карты
            </td>
          </tr>
          <tr>
            <td>
              <strong>Screen</strong>
              <br />
              <code>screenX/Y</code>
            </td>
            <td>Левый верх физического экрана</td>
            <td>Нет</td>
            <td>Multi-window координация, window.open позиционирование</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Main showcase ─────────────────────────────────────────────────────────

export function BrowserMetricsShowcase() {
  return (
    <div className='bm-showcase'>
      <header className='bm-header'>
        <h1 className='bm-title'>Координаты и метрики в браузере</h1>
        <p className='bm-subtitle'>
          Четыре системы координат, метрики DOM-элементов и <code>getBoundingClientRect</code> —
          интерактивно, с живыми примерами. Каждое свойство показано в действии.
        </p>
      </header>

      <MouseCoordsDemo />
      <ElementMetricsDemo />
      <GetBoundingRectDemo />
      <DragDropDemo />
      <SmartTooltipDemo />
      <CoordinateSystemsTable />

      <div className='bm-footer-note'>
        💡 <strong>Топ-вопросы на интервью:</strong> разница между <code>clientX</code> и{' '}
        <code>pageX</code>; почему <code>offsetX</code> может быть отрицательным; что такое layout
        thrashing; чем <code>getBoundingClientRect().width</code> отличается от{' '}
        <code>offsetWidth</code> при <code>transform: scale</code>.
      </div>
    </div>
  )
}

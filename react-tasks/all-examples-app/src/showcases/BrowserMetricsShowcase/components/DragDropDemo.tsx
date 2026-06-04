import { useRef, useState } from 'react'

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

export function DragDropDemo() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [items, setItems] = useState<DragItem[]>(INITIAL_ITEMS)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const dragOffsetRef = useRef({ dx: 0, dy: 0 })

  const [pointerCoords, setPointerCoords] = useState<{ clientX: number; clientY: number } | null>(null)
  const [stageRectCoords, setStageRectCoords] = useState<{ left: number; top: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, item: DragItem) => {
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    dragOffsetRef.current = {
      dx: Math.round(e.clientX - rect.left),
      dy: Math.round(e.clientY - rect.top),
    }
    target.setPointerCapture(e.pointerId)
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
    let x = e.clientX - stageRect.left - dragOffsetRef.current.dx
    let y = e.clientY - stageRect.top - dragOffsetRef.current.dy

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

import { useEffect, useRef, useState } from 'react'

export function GetBoundingRectDemo() {
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

import { useEffect, useRef, useState } from 'react'

export function ResizeObserverDemo() {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [callCount, setCallCount] = useState(0)
  const [width, setWidth] = useState(300)

  useEffect(() => {
    const target = boxRef.current
    if (!target) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setSize({ width: Math.round(width), height: Math.round(height) })
        setCallCount(c => c + 1)
      }
    })

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <div className='obs-demo-card'>
      <div className='obs-demo-header'>
        <h3>1. ResizeObserver</h3>
        <span className='obs-badge'>Размер элемента</span>
      </div>

      <p className='obs-demo-desc'>
        Реагирует на изменение размера элемента. Запускается в специальной фазе рендеринга —{' '}
        <strong>после layout, до paint</strong> — а не как микрозадача.
      </p>

      <div className='obs-controls'>
        <label>
          Ширина: {width}px
          <input
            type='range'
            min={150}
            max={600}
            value={width}
            onChange={e => setWidth(Number(e.target.value))}
          />
        </label>
        <div className='obs-stats'>
          <span>
            Текущий размер: <strong>{size.width} × {size.height}px</strong>
          </span>
          <span>
            Колбэк вызван: <strong>{callCount}</strong> раз
          </span>
        </div>
      </div>

      <div ref={boxRef} className='obs-resize-target' style={{ width: `${width}px` }}>
        <span>Меняй ширину слайдером — ResizeObserver обновит надпись</span>
        <span className='obs-resize-readout'>{size.width} × {size.height}</span>
      </div>

      <details className='obs-code-block'>
        <summary>Показать код</summary>
        <pre>{`const observer = new ResizeObserver(entries => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    setSize({ width, height });
  }
});

observer.observe(targetEl);

// ⚠️ Внутри callback не меняй размер observed-элемента —
// будет бесконечный цикл "ResizeObserver loop completed with undelivered notifications".
// Браузер обычно сам ломает цикл через rAF, но это утечка производительности.`}</pre>
      </details>

      <div className='obs-warning'>
        ⚠️ <strong>Главное правило:</strong> внутри колбэка ResizeObserver НЕ меняй размер
        observed-элемента — получишь loop. Если нужно — отложи изменение через{' '}
        <code>requestAnimationFrame</code>.
      </div>
    </div>
  )
}

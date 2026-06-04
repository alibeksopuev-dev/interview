import { useEffect, useRef, useState } from 'react'

function MetricCell({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className='bm-metric-cell'>
      <div className='bm-metric-label'>{label}</div>
      <div className='bm-metric-value'>{value}px</div>
      <div className='bm-metric-hint'>{hint}</div>
    </div>
  )
}

export function ElementMetricsDemo() {
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

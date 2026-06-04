import { useEffect, useRef, useState } from 'react'

export function IntersectionObserverDemo() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set())
  const [intersectionLog, setIntersectionLog] = useState<string[]>([])

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      entries => {
        setVisibleIds(prev => {
          const next = new Set(prev)
          for (const entry of entries) {
            const id = Number(entry.target.getAttribute('data-id'))
            if (entry.isIntersecting) {
              next.add(id)
              setIntersectionLog(log =>
                [
                  `→ #${id} вошёл (ratio: ${entry.intersectionRatio.toFixed(2)})`,
                  ...log,
                ].slice(0, 8),
              )
            } else {
              next.delete(id)
              setIntersectionLog(log => [`← #${id} вышел`, ...log].slice(0, 8))
            }
          }
          return next
        })
      },
      { root, threshold: [0, 0.5, 1], rootMargin: '0px' },
    )

    itemRefs.current.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const setItemRef = (id: number) => (el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(id, el)
    else itemRefs.current.delete(id)
  }

  return (
    <div className='obs-demo-card'>
      <div className='obs-demo-header'>
        <h3>2. IntersectionObserver</h3>
        <span className='obs-badge'>Видимость во viewport</span>
      </div>

      <p className='obs-demo-desc'>
        Реагирует на пересечение элемента с viewport (или root-элементом). Используется для
        lazy-load изображений, бесконечного скролла, scroll-spy навигации, аналитики impressions.
      </p>

      <div className='obs-intersection-layout'>
        <div ref={scrollRef} className='obs-scroll-container'>
          {Array.from({ length: 12 }).map((_, i) => {
            const id = i + 1
            const isVisible = visibleIds.has(id)
            return (
              <div
                key={id}
                ref={setItemRef(id)}
                data-id={id}
                className={`obs-scroll-item ${isVisible ? 'visible' : ''}`}
              >
                <span className='obs-scroll-item-id'>#{id}</span>
                <span className='obs-scroll-item-state'>
                  {isVisible ? '👀 visible' : '💤 off-screen'}
                </span>
              </div>
            )
          })}
        </div>

        <div className='obs-intersection-side'>
          <div className='obs-stat-block'>
            <div className='obs-stat-label'>В viewport сейчас</div>
            <div className='obs-stat-value'>
              {[...visibleIds].sort((a, b) => a - b).join(', ') || '—'}
            </div>
          </div>

          <div className='obs-stat-block'>
            <div className='obs-stat-label'>Последние события</div>
            <ul className='obs-log'>
              {intersectionLog.length === 0 ? (
                <li className='obs-log-empty'>Прокрути контейнер...</li>
              ) : (
                intersectionLog.map((line, idx) => <li key={idx}>{line}</li>)
              )}
            </ul>
          </div>
        </div>
      </div>

      <details className='obs-code-block'>
        <summary>Показать код</summary>
        <pre>{`const observer = new IntersectionObserver(
  entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        loadImage(entry.target);
        observer.unobserve(entry.target);
      }
    }
  },
  {
    root: null,            // null = viewport браузера
    rootMargin: '50px',    // расширяем зону "видно" на 50px вокруг
    threshold: [0, 0.5, 1]
  }
);

document.querySelectorAll('img.lazy').forEach(img => observer.observe(img));`}</pre>
      </details>
    </div>
  )
}

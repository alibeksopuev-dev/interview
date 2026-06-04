import { useEffect, useRef, useState } from 'react'

// ─── 1. ResizeObserver demo ────────────────────────────────────────────────

function ResizeObserverDemo() {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [callCount, setCallCount] = useState(0)
  const [width, setWidth] = useState(300)

  useEffect(() => {
    const target = boxRef.current
    if (!target) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        // contentRect — это координаты в локальной системе отсчёта элемента
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

      <div
        ref={boxRef}
        className='obs-resize-target'
        style={{ width: `${width}px` }}
      >
        <span>Меняй ширину слайдером — ResizeObserver обновит надпись</span>
        <span className='obs-resize-readout'>
          {size.width} × {size.height}
        </span>
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

// ─── 2. IntersectionObserver demo (lazy-load + scroll spy) ─────────────────

function IntersectionObserverDemo() {
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
      {
        root,
        threshold: [0, 0.5, 1],
        rootMargin: '0px',
      },
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
        // элемент >= threshold во viewport — например, лениво загрузить картинку
        loadImage(entry.target);
        observer.unobserve(entry.target); // больше не следим
      }
    }
  },
  {
    root: null,            // null = viewport браузера
    rootMargin: '50px',    // расширяем зону "видно" на 50px вокруг
    threshold: [0, 0.5, 1] // получать события на 0%, 50%, 100% видимости
  }
);

document.querySelectorAll('img.lazy').forEach(img => observer.observe(img));`}</pre>
      </details>
    </div>
  )
}

// ─── 3. MutationObserver demo ──────────────────────────────────────────────

function MutationObserverDemo() {
  const listRef = useRef<HTMLUListElement | null>(null)
  const [mutations, setMutations] = useState<string[]>([])
  const [microtaskBatches, setMicrotaskBatches] = useState(0)
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const target = listRef.current
    if (!target) return

    const observer = new MutationObserver(records => {
      // Колбэк вызывается ОДИН раз за весь батч изменений (микрозадача)
      setMicrotaskBatches(b => b + 1)
      const summary = records.map(r => {
        if (r.type === 'childList') {
          const added = r.addedNodes.length
          const removed = r.removedNodes.length
          return `childList: +${added} -${removed}`
        }
        return `${r.type}`
      })
      setMutations(prev => [`🔔 batch (${records.length} records): ${summary.join(', ')}`, ...prev].slice(0, 6))
    })

    observer.observe(target, {
      childList: true,
      attributes: true,
      subtree: false,
    })

    return () => observer.disconnect()
  }, [])

  const addThreeSync = () => {
    const target = listRef.current
    if (!target) return
    // Три синхронных мутации → один батч → одна микрозадача
    for (let i = 0; i < 3; i++) {
      const li = document.createElement('li')
      li.textContent = `item ${itemCount + i + 1}`
      li.className = 'obs-mut-item'
      target.appendChild(li)
    }
    setItemCount(c => c + 3)
  }

  const clearAll = () => {
    const target = listRef.current
    if (!target) return
    while (target.firstChild) target.removeChild(target.firstChild)
    setItemCount(0)
  }

  return (
    <div className='obs-demo-card'>
      <div className='obs-demo-header'>
        <h3>3. MutationObserver</h3>
        <span className='obs-badge'>Изменения DOM (микрозадача)</span>
      </div>

      <p className='obs-demo-desc'>
        Реагирует на изменения DOM (добавление/удаление узлов, атрибутов, текста). Колбэк
        выполняется как <strong>микрозадача</strong> и батчит несколько изменений в один вызов.
      </p>

      <div className='obs-mut-controls'>
        <button className='obs-btn-primary' onClick={addThreeSync}>
          + Добавить 3 элемента синхронно
        </button>
        <button className='obs-btn-secondary' onClick={clearAll}>
          Очистить
        </button>
        <span className='obs-mut-stat'>
          Микрозадач: <strong>{microtaskBatches}</strong> · Элементов: <strong>{itemCount}</strong>
        </span>
      </div>

      <div className='obs-mut-layout'>
        <ul ref={listRef} className='obs-mut-list' />

        <div className='obs-stat-block'>
          <div className='obs-stat-label'>Лог колбэков</div>
          <ul className='obs-log'>
            {mutations.length === 0 ? (
              <li className='obs-log-empty'>Нажми кнопку добавления...</li>
            ) : (
              mutations.map((line, idx) => <li key={idx}>{line}</li>)
            )}
          </ul>
        </div>
      </div>

      <details className='obs-code-block'>
        <summary>Показать код</summary>
        <pre>{`const observer = new MutationObserver(records => {
  // records — массив, даже если ты сделал 100 мутаций подряд
  // callback вызовется ОДИН раз как микрозадача
  for (const r of records) {
    console.log(r.type, r.addedNodes, r.removedNodes);
  }
});

observer.observe(targetEl, {
  childList: true,       // добавление/удаление детей
  attributes: true,      // изменение атрибутов
  characterData: true,   // изменение текста
  subtree: true,         // отслеживать ВСЁ поддерево
  attributeOldValue: true, // сохранять старое значение атрибута
});

// 3 синхронных appendChild → 1 вызов колбэка с 3 records`}</pre>
      </details>
    </div>
  )
}

// ─── Comparison table ──────────────────────────────────────────────────────

function ObserversComparison() {
  return (
    <div className='obs-table-card'>
      <h3>Сравнение трёх observer-API</h3>
      <table className='obs-table'>
        <thead>
          <tr>
            <th>Свойство</th>
            <th>ResizeObserver</th>
            <th>IntersectionObserver</th>
            <th>MutationObserver</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Что наблюдает</strong></td>
            <td>Размер элемента (width, height, contentBox, borderBox)</td>
            <td>Пересечение с viewport / root-элементом</td>
            <td>Изменения DOM (children, attributes, text)</td>
          </tr>
          <tr>
            <td><strong>Когда срабатывает</strong></td>
            <td>В отдельной фазе после Layout, до Paint</td>
            <td>Асинхронно (обычно raf-подобно)</td>
            <td><strong>Микрозадача</strong> после mutation</td>
          </tr>
          <tr>
            <td><strong>Батчит изменения?</strong></td>
            <td>Да — все записи в одном callback</td>
            <td>Да — все entries в одном callback</td>
            <td>Да — за весь sync блок один вызов</td>
          </tr>
          <tr>
            <td><strong>Типичный use case</strong></td>
            <td>Адаптивные компоненты, charts без window.resize</td>
            <td>Lazy-load, infinite scroll, scroll-spy, impressions</td>
            <td>3rd-party виджеты, отслеживание привязок React Portal</td>
          </tr>
          <tr>
            <td><strong>Cleanup</strong></td>
            <td><code>observer.disconnect()</code></td>
            <td><code>unobserve(el)</code> или <code>disconnect()</code></td>
            <td><code>observer.disconnect()</code></td>
          </tr>
          <tr>
            <td><strong>Подводный камень</strong></td>
            <td>Loop при изменении размера внутри callback</td>
            <td>Колбэк отстаёт на ~1 frame от scroll</td>
            <td>
              <code>subtree: true</code> на большом дереве = дорого
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Main showcase component ───────────────────────────────────────────────

export function ObserversShowcase() {
  return (
    <div className='obs-showcase'>
      <header className='obs-header'>
        <h1 className='obs-title'>Browser Observers API</h1>
        <p className='obs-subtitle'>
          Три современных observer-API для отслеживания изменений в DOM и viewport: размеры,
          видимость и мутации. Каждый имеет свои правила выполнения относительно Event Loop.
        </p>
      </header>

      <ResizeObserverDemo />
      <IntersectionObserverDemo />
      <MutationObserverDemo />
      <ObserversComparison />

      <div className='obs-footer-note'>
        💡 Когда задают на интервью: «как реализовать lazy-load картинок без библиотек?» —{' '}
        <strong>IntersectionObserver</strong>. «Как чарт узнаёт о ресайзе своего контейнера, а не
        окна?» — <strong>ResizeObserver</strong>. «Как библиотека следит за DOM, который меняет
        не она?» — <strong>MutationObserver</strong>.
      </div>
    </div>
  )
}

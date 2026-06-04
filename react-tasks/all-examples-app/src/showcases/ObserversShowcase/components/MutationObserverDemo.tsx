import { useEffect, useRef, useState } from 'react'

export function MutationObserverDemo() {
  const listRef = useRef<HTMLUListElement | null>(null)
  const [mutations, setMutations] = useState<string[]>([])
  const [microtaskBatches, setMicrotaskBatches] = useState(0)
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const target = listRef.current
    if (!target) return

    const observer = new MutationObserver(records => {
      setMicrotaskBatches(b => b + 1)
      const summary = records.map(r => {
        if (r.type === 'childList') {
          return `childList: +${r.addedNodes.length} -${r.removedNodes.length}`
        }
        return `${r.type}`
      })
      setMutations(prev =>
        [`🔔 batch (${records.length} records): ${summary.join(', ')}`, ...prev].slice(0, 6),
      )
    })

    observer.observe(target, { childList: true, attributes: true, subtree: false })
    return () => observer.disconnect()
  }, [])

  const addThreeSync = () => {
    const target = listRef.current
    if (!target) return
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
          Микрозадач: <strong>{microtaskBatches}</strong> · Элементов:{' '}
          <strong>{itemCount}</strong>
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
  attributeOldValue: true,
});

// 3 синхронных appendChild → 1 вызов колбэка с 3 records`}</pre>
      </details>
    </div>
  )
}

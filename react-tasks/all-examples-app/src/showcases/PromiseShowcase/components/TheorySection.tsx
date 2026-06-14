export function TheorySection() {
  const sections = [
    {
      title: 'Promise.all vs Promise.allSettled',
      items: [
        { label: 'Promise.all', color: '#4f46e5', desc: 'Ждёт всех. Один reject → немедленный reject всего.' },
        { label: 'Promise.allSettled', color: '#0891b2', desc: 'Ждёт всех. Никогда не reject. Всегда массив с {status, value/reason}.' },
        { label: 'Когда all?', color: '#059669', desc: 'Нужны ВСЕ данные. Один провал → нет смысла продолжать.' },
        { label: 'Когда allSettled?', color: '#059669', desc: 'Нужны все попытки. Например: массовая загрузка 100 файлов.' },
      ],
    },
    {
      title: 'Promise.race vs Promise.any',
      items: [
        { label: 'Promise.race', color: '#d97706', desc: 'Первый завершившийся — победитель. Даже если это reject.' },
        { label: 'Promise.any', color: '#7c3aed', desc: 'Первый УСПЕШНЫЙ — победитель. reject-ы игнорируются.' },
        { label: 'Когда race?', color: '#059669', desc: 'Таймаут: race([fetch(), timeout(5s)]) — что быстрее?' },
        { label: 'Когда any?', color: '#059669', desc: 'Резервные источники: попробуй A, B, C — возьми быстрейший живой.' },
      ],
    },
    {
      title: '.then(onF, onR) vs .then(onF).catch(onR)',
      items: [
        {
          label: '.then(onF, onR)',
          color: '#4f46e5',
          desc: 'onR ловит ошибки только из исходного промиса. НЕ ловит ошибки из onF.',
        },
        {
          label: '.then(onF).catch(onR)',
          color: '#d97706',
          desc: 'onR ловит ошибки из промиса И из onF. Иногда это неожиданно!',
        },
        {
          label: 'Рекомендация',
          color: '#059669',
          desc: 'В Promise.all используй .then(onF, onR) — не хочешь ловить ошибки самого handler-а.',
        },
      ],
    },
    {
      title: 'async/await — синтаксический сахар',
      items: [
        { label: 'await x', color: '#4f46e5', desc: '= Promise.resolve(x).then(continuation). Код после await — это микрозадача.' },
        { label: 'До первого await', color: '#0891b2', desc: 'Выполняется СИНХРОННО при вызове async-функции.' },
        { label: 'После await', color: '#7c3aed', desc: 'Всегда микрозадача, даже если await числа: await 42.' },
        { label: 'try/catch', color: '#d97706', desc: 'Для await используй try/catch вместо .catch() — читабельнее.' },
      ],
    },
    {
      title: 'Промисы не отменяются',
      items: [
        { label: 'Проблема', color: '#ef4444', desc: 'После reject все остальные промисы в Promise.all продолжают работать в фоне.' },
        { label: 'Решение', color: '#059669', desc: 'AbortController + AbortSignal — для отмены fetch и других операций.' },
        { label: 'Пример', color: '#4f46e5', desc: 'const ctrl = new AbortController(); fetch(url, { signal: ctrl.signal }); ctrl.abort();' },
      ],
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sections.map(section => (
        <div
          key={section.title}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
            {section.title}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {section.items.map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span
                  style={{
                    flexShrink: 0,
                    padding: '2px 8px',
                    background: item.color + '15',
                    border: `1px solid ${item.color}40`,
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: item.color,
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </span>
                <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edge cases */}
      <div
        style={{
          background: '#fff7ed',
          border: '1px solid #fdba74',
          borderRadius: 12,
          padding: '16px 20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#9a3412' }}>
          Граничные случаи (Edge Cases)
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Promise.all([])', 'Пустой массив → resolve([]) мгновенно и синхронно'],
            ['Promise.any([])', 'Пустой массив → AggregateError немедленно'],
            ['Promise.resolve(promise)', 'Идемпотентен — возвращает тот же промис, не обёртывает'],
            ['Первый reject выигрывает', 'Promise.all и race → первый reject; повторные вызовы reject() игнорируются'],
            ['Не-промисы в массиве', 'Promise.all([1, "str", promise]) — числа и строки оборачиваются через Promise.resolve()'],
          ].map(([code, desc]) => (
            <div key={code} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <code style={{ flexShrink: 0, fontSize: 11, color: '#c2410c', background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                {code}
              </code>
              <span style={{ fontSize: 12, color: '#7c2d12', lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

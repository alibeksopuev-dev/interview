export function StatesDiagram() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
        Промис — это объект с тремя состояниями. Как только из <strong>pending</strong> переходит в другое — назад пути нет.
      </p>

      {/* State machine diagram */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Pending */}
        <div style={{
          background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)',
          border: '2px solid #fcd34d',
          borderRadius: 12,
          padding: '16px 20px',
          textAlign: 'center',
          minWidth: 110,
        }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>⏳</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>pending</div>
          <div style={{ fontSize: 10, color: '#92400e', marginTop: 2 }}>«жду»</div>
        </div>

        {/* Arrow to fulfilled */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 8px' }}>
          <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, marginBottom: 2 }}>resolve(value)</div>
          <div style={{ fontSize: 18, color: '#22c55e' }}>→</div>
        </div>

        {/* Fulfilled */}
        <div style={{
          background: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)',
          border: '2px solid #34d399',
          borderRadius: 12,
          padding: '16px 20px',
          textAlign: 'center',
          minWidth: 110,
        }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>fulfilled</div>
          <div style={{ fontSize: 10, color: '#065f46', marginTop: 2 }}>«выполнен»</div>
        </div>

        {/* Divider */}
        <div style={{ width: 40 }} />

        {/* Pending again (for reject path) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 8px' }}>
          <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>reject(reason)</div>
          <div style={{ fontSize: 18, color: '#ef4444' }}>→</div>
        </div>

        {/* Rejected */}
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
          border: '2px solid #f87171',
          borderRadius: 12,
          padding: '16px 20px',
          textAlign: 'center',
          minWidth: 110,
        }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>❌</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#991b1b' }}>rejected</div>
          <div style={{ fontSize: 10, color: '#991b1b', marginTop: 2 }}>«отклонён»</div>
        </div>
      </div>

      {/* Note about settled */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
        color: '#475569',
        lineHeight: 1.6,
        borderLeft: '3px solid #4f46e5',
      }}>
        <strong style={{ color: '#1e293b' }}>settled</strong> = fulfilled ИЛИ rejected. Как только промис «осел» — повторные вызовы <code>resolve()</code> или <code>reject()</code> игнорируются движком JavaScript.
      </div>

      {/* Code example */}
      <div style={{ background: '#0f172a', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 12 }}>
        {[
          { text: 'const p = new Promise((resolve, reject) => {', color: '#94a3b8' },
          { text: '  setTimeout(() => resolve("готово!"), 1000)', color: '#94a3b8' },
          { text: '})', color: '#94a3b8' },
          { text: '', color: '' },
          { text: 'p.then(val => console.log(val))   // "готово!"', color: '#38bdf8' },
          { text: 'p.catch(err => console.log(err))  // не вызовется', color: '#64748b' },
        ].map((line, i) => (
          <div key={i} style={{ color: line.color, lineHeight: 1.7 }}>{line.text || ' '}</div>
        ))}
      </div>
    </div>
  )
}

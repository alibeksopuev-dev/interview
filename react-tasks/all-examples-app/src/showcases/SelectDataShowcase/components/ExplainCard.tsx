export function ExplainCard({ title, code, desc }: { title: string; code: string; desc: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{title}</div>
      <pre
        style={{
          margin: 0,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#374151',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
        }}
      >
        {code}
      </pre>
      <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{desc}</p>
    </div>
  )
}

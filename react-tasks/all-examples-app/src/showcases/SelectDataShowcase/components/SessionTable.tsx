import type { Session } from '../types'

const USER_COLORS: Record<number, string> = {
  1: '#6366f1',
  2: '#f59e0b',
  7: '#10b981',
  8: '#ef4444',
}

export function SessionRow({ session, highlight }: { session: Session; highlight?: boolean }) {
  const color = USER_COLORS[session.user] ?? '#64748b'
  return (
    <tr
      style={{
        background: highlight ? `${color}12` : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      <td style={{ padding: '6px 10px', fontWeight: 600, color }}>#{session.user}</td>
      <td style={{ padding: '6px 10px' }}>{session.duration} мин</td>
      <td style={{ padding: '6px 10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {session.equipment.map(eq => (
            <span
              key={eq}
              style={{
                fontSize: 11,
                padding: '2px 7px',
                borderRadius: 9999,
                background: '#e0e7ff',
                color: '#3730a3',
                fontWeight: 500,
              }}
            >
              {eq}
            </span>
          ))}
        </div>
      </td>
    </tr>
  )
}

export function SessionTable({
  sessions,
  title,
  badge,
  empty = 'Нет результатов',
}: {
  sessions: Array<Session>
  title: string
  badge?: string
  empty?: string
}) {
  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#fff',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          background: '#f8fafc',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{title}</span>
        {badge && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 9999,
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #dbeafe',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {sessions.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          {empty}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '6px 10px', fontSize: 11, color: '#64748b', textAlign: 'left', fontWeight: 600 }}>User</th>
              <th style={{ padding: '6px 10px', fontSize: 11, color: '#64748b', textAlign: 'left', fontWeight: 600 }}>Duration</th>
              <th style={{ padding: '6px 10px', fontSize: 11, color: '#64748b', textAlign: 'left', fontWeight: 600 }}>Equipment</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <SessionRow
                key={i}
                session={s}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

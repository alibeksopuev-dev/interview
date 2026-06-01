import { useState } from 'react'

// ─── types ─────────────────────────────────────────────────────────────────

type Session = { user: number; duration: number; equipment: Array<string> }
type Options = {
  user?: number
  minDuration?: number
  equipment?: Array<string>
  merge?: boolean
}

// ─── selectData implementation ─────────────────────────────────────────────

function setHasOverlap<T>(setA: Set<T>, setB: Set<T>): boolean {
  for (const val of Array.from(setA)) {
    if (setB.has(val)) return true
  }
  return false
}

function selectData(sessions: Array<Session>, options?: Options): Array<Session> {
  const reversedSessions = sessions.slice().reverse()
  const sessionsForUser = new Map<
    number,
    { user: number; duration: number; equipment: Set<string> }
  >()
  const sessionsProcessed: Array<{
    user: number
    duration: number
    equipment: Set<string>
  }> = []

  reversedSessions.forEach(session => {
    if (options?.merge && sessionsForUser.has(session.user)) {
      const userSession = sessionsForUser.get(session.user)!
      userSession.duration += session.duration
      session.equipment.forEach(e => userSession.equipment.add(e))
    } else {
      const clonedSession = { ...session, equipment: new Set(session.equipment) }
      if (options?.merge) sessionsForUser.set(session.user, clonedSession)
      sessionsProcessed.push(clonedSession)
    }
  })

  sessionsProcessed.reverse()

  const optionEquipments = new Set(options?.equipment)
  const results: Array<Session> = []

  sessionsProcessed.forEach(session => {
    if (
      (options?.user != null && options.user !== session.user) ||
      (optionEquipments.size > 0 && !setHasOverlap(optionEquipments, session.equipment)) ||
      (options?.minDuration != null && options.minDuration > session.duration)
    ) {
      return
    }
    results.push({ ...session, equipment: Array.from(session.equipment).sort() })
  })

  return results
}

// ─── mergeData implementation ──────────────────────────────────────────────

function mergeData(sessions: Array<Session>): Array<Session> {
  // Map сохраняет порядок первой вставки — Map.values() даёт нужный порядок без отдельного results
  const sessionsForUser = new Map<
    number,
    { user: number; duration: number; equipment: Set<string> }
  >()

  sessions.forEach(session => {
    if (sessionsForUser.has(session.user)) {
      const userSession = sessionsForUser.get(session.user)!
      userSession.duration += session.duration
      session.equipment.forEach(eq => userSession.equipment.add(eq))
    } else {
      sessionsForUser.set(session.user, {
        ...session,
        equipment: new Set(session.equipment),
      })
    }
  })

  return Array.from(sessionsForUser.values()).map(session => ({
    ...session,
    equipment: Array.from(session.equipment).sort(),
  }))
}

// ─── static data ───────────────────────────────────────────────────────────

const SESSIONS: Array<Session> = [
  { user: 8, duration: 50, equipment: ['bench'] },
  { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
  { user: 1, duration: 10, equipment: ['barbell'] },
  { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
  { user: 7, duration: 200, equipment: ['bike'] },
  { user: 2, duration: 200, equipment: ['treadmill'] },
  { user: 2, duration: 200, equipment: ['bike'] },
]

const ALL_EQUIPMENT = ['barbell', 'bench', 'bike', 'dumbbell', 'kettlebell', 'treadmill']
const ALL_USERS = [...new Set(SESSIONS.map(s => s.user))].sort((a, b) => a - b)

const USER_COLORS: Record<number, string> = {
  1: '#6366f1',
  2: '#f59e0b',
  7: '#10b981',
  8: '#ef4444',
}

// ─── sub-components ────────────────────────────────────────────────────────

function SessionRow({ session, highlight }: { session: Session; highlight?: boolean }) {
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

function SessionTable({
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

// ─── main showcase ─────────────────────────────────────────────────────────

export function SelectDataShowcase() {
  const [filterUser, setFilterUser] = useState<number | undefined>(undefined)
  const [filterMinDuration, setFilterMinDuration] = useState<string>('')
  const [filterEquipment, setFilterEquipment] = useState<Array<string>>([])
  const [merge, setMerge] = useState(false)

  const options: Options = {
    ...(filterUser != null ? { user: filterUser } : {}),
    ...(filterMinDuration !== '' ? { minDuration: Number(filterMinDuration) } : {}),
    ...(filterEquipment.length > 0 ? { equipment: filterEquipment } : {}),
    ...(merge ? { merge: true } : {}),
  }

  const hasAnyFilter =
    filterUser != null || filterMinDuration !== '' || filterEquipment.length > 0 || merge

  const result = selectData(SESSIONS, hasAnyFilter ? options : undefined)

  const toggleEquipment = (eq: string) => {
    setFilterEquipment(prev => (prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]))
  }

  const reset = () => {
    setFilterUser(undefined)
    setFilterMinDuration('')
    setFilterEquipment([])
    setMerge(false)
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#1e293b' }}>
          selectData — фильтрация и агрегация сессий
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          Интерактивный разбор: настройте фильтры и наблюдайте, как меняется результат.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Controls */}
        <div
          style={{
            width: 260,
            flexShrink: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Опции (options)</span>
            <button
              onClick={reset}
              style={{
                fontSize: 11,
                padding: '3px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Сброс
            </button>
          </div>

          {/* user filter */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              user
              <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>фильтр по ID</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                onClick={() => setFilterUser(undefined)}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${filterUser == null ? '#6366f1' : '#e2e8f0'}`,
                  background: filterUser == null ? '#6366f1' : '#f8fafc',
                  color: filterUser == null ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontWeight: filterUser == null ? 600 : 400,
                }}
              >
                все
              </button>
              {ALL_USERS.map(u => (
                <button
                  key={u}
                  onClick={() => setFilterUser(filterUser === u ? undefined : u)}
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: `1px solid ${filterUser === u ? USER_COLORS[u] : '#e2e8f0'}`,
                    background: filterUser === u ? USER_COLORS[u] : '#f8fafc',
                    color: filterUser === u ? '#fff' : '#374151',
                    cursor: 'pointer',
                    fontWeight: filterUser === u ? 600 : 400,
                  }}
                >
                  #{u}
                </button>
              ))}
            </div>
          </div>

          {/* minDuration filter */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              minDuration
              <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>мин. время</span>
            </label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type='number'
                min={0}
                placeholder='мин'
                value={filterMinDuration}
                onChange={e => setFilterMinDuration(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: 13,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  outline: 'none',
                  color: '#1e293b',
                }}
              />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>мин</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {[100, 200, 400].map(v => (
                <button
                  key={v}
                  onClick={() => setFilterMinDuration(String(v))}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: `1px solid ${filterMinDuration === String(v) ? '#6366f1' : '#e2e8f0'}`,
                    background: filterMinDuration === String(v) ? '#eff6ff' : '#f8fafc',
                    color: filterMinDuration === String(v) ? '#6366f1' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  ≥{v}
                </button>
              ))}
            </div>
          </div>

          {/* equipment filter */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              equipment
              <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>хотя бы одно</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ALL_EQUIPMENT.map(eq => {
                const active = filterEquipment.includes(eq)
                return (
                  <button
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    style={{
                      fontSize: 12,
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: `1px solid ${active ? '#6366f1' : '#e2e8f0'}`,
                      background: active ? '#eff6ff' : '#f8fafc',
                      color: active ? '#4f46e5' : '#374151',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: active ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{active ? '✓' : '○'}</span>
                    {eq}
                  </button>
                )
              })}
            </div>
          </div>

          {/* merge toggle */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              merge
              <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>объединить по user</span>
            </label>
            <button
              onClick={() => setMerge(prev => !prev)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${merge ? '#10b981' : '#e2e8f0'}`,
                background: merge ? '#ecfdf5' : '#f8fafc',
                color: merge ? '#059669' : '#374151',
                cursor: 'pointer',
                fontWeight: merge ? 700 : 400,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>{merge ? '✓' : '○'}</span>
              {merge ? 'merge: true' : 'merge: false'}
            </button>
          </div>

          {/* current options preview */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              Вызов:
            </div>
            <pre
              style={{
                margin: 0,
                fontSize: 11,
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                fontFamily: 'monospace',
              }}
            >
              {`selectData(sessions${hasAnyFilter ? `,\n${JSON.stringify(options, null, 2)}` : ''})`}
            </pre>
          </div>
        </div>

        {/* Tables side by side */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <SessionTable
              sessions={SESSIONS}
              title='Исходные данные'
              badge={`${SESSIONS.length} сессий`}
            />
            <SessionTable
              sessions={result}
              title='Результат selectData'
              badge={`${result.length} сессий`}
            />
          </div>

          {/* Explanation cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <ExplainCard
              title='Без merge'
              code={`selectData(sessions, { minDuration: 200 })`}
              desc='Каждая сессия рассматривается отдельно. Фильтры применяются к оригинальным строкам.'
            />
            <ExplainCard
              title='С merge: true'
              code={`selectData(sessions, { merge: true, minDuration: 400 })`}
              desc='Сессии одного пользователя объединяются: duration суммируется, equipment дедуплицируется. Фильтры применяются к мёрдженным данным.'
            />
            <ExplainCard
              title='Double Reverse Trick'
              code={`sessions.slice().reverse()\n// обход → sessionsProcessed\nsessionsProcessed.reverse()`}
              desc='Реверс входного массива превращает «последнее» вхождение в «первое». После обхода второй reverse восстанавливает порядок — мёрдженная строка на месте последней исходной сессии пользователя.'
            />
          </div>
        </div>
      </div>

      {/* ── mergeData section ─────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 48,
          paddingTop: 40,
          borderTop: '2px solid #e2e8f0',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
            mergeData — агрегация без фильтров
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            Один проход слева направо. Мёрдженная строка занимает место{' '}
            <strong>первого</strong> вхождения пользователя (в отличие от{' '}
            <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>
              selectData({'{'} merge: true {'}'})
            </code>
            , где — <strong>последнего</strong>).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <SessionTable
            sessions={SESSIONS}
            title='Исходные данные'
            badge={`${SESSIONS.length} сессий`}
          />
          <SessionTable
            sessions={mergeData(SESSIONS)}
            title='mergeData(sessions)'
            badge={`${mergeData(SESSIONS).length} уникальных пользователей`}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <ExplainCard
            title='Shared reference trick'
            code={`sessionsForUser.set(user, clonedSession)\nresults.push(clonedSession)\n// оба указывают на один объект →\n// Map.get(user).duration += x\n// автоматически обновляет results[i]`}
            desc='Map и results хранят ссылку на один объект. Обновление через Map мгновенно отражается в results без поиска по индексу — O(1).'
          />
          <ExplainCard
            title='Vs selectData({ merge: true })'
            code={`// mergeData: прямой обход\n// → первое вхождение\n\n// selectData merge:\n// reverse → обход → reverse\n// → последнее вхождение`}
            desc='mergeData проще: один проход, без реверсов. selectData({ merge: true }) нужен double reverse trick, чтобы строка встала на место последнего вхождения.'
          />
          <ExplainCard
            title='Set для дедупликации equipment'
            code={`equipment: new Set(session.equipment)\n// при merge:\nuserSession.equipment.add(eq)\n// Set автоматически игнорирует дубли\n// финально: Array.from(set).sort()`}
            desc='Set.add — O(1) и никогда не добавит дублирующий элемент. Конвертация в отсортированный массив происходит один раз — в финальном .map().'
          />
        </div>
      </div>
    </div>
  )
}

function ExplainCard({ title, code, desc }: { title: string; code: string; desc: string }) {
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

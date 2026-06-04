import type { Step } from '../data/cases'

function PageSkeleton({ dim = false }: { dim?: boolean }) {
  return (
    <div className={`el-skeleton-card ${dim ? 'dim' : ''}`}>
      <div className='el-sk-avatar' />
      <div className='el-sk-lines'>
        <div className='el-sk-line' style={{ width: '60%' }} />
        <div className='el-sk-line' style={{ width: '80%' }} />
        <div className='el-sk-line' style={{ width: '45%' }} />
      </div>
    </div>
  )
}

function PageData({ dim = false }: { dim?: boolean }) {
  return (
    <div className={`el-data-card ${dim ? 'dim' : ''}`}>
      <div className='el-data-avatar'>👤</div>
      <div className='el-data-info'>
        <div className='el-data-name'>Alibek Sopuev</div>
        <div className='el-data-meta'>Senior Frontend Engineer</div>
        <div className='el-data-meta'>alibeksopuev@gmail.com</div>
      </div>
    </div>
  )
}

export function ReactPageDemo({
  step,
  variant = 'fetch',
}: {
  step: Step
  variant?: 'fetch' | 'render'
}) {
  // Derive UI state from the step's phase + console
  const isInitialRender =
    step.phase === 'react-render' && !step.console.includes('paint: skeleton')
  const isCommit = step.phase === 'react-commit'
  const isIdle = step.phase === 'idle'

  // Determine page state based on console history
  const log = step.console
  const skeletonShown = log.includes('render: loading') || isInitialRender
  const skeletonPainted = log.includes('paint: skeleton')
  const fetchStarted = log.includes('useEffect: fetch start')
  const networkReceived = log.includes('response received')
  const stateUpdated = log.includes('setState: data')
  const dataRendered = log.includes('render: success')
  const dataPainted = log.includes('paint: data shown')

  let stage:
    | 'mount'
    | 'render-skeleton'
    | 'commit-skeleton'
    | 'paint-skeleton'
    | 'fetching'
    | 'response'
    | 'updating'
    | 'render-data'
    | 'paint-data'
    | 'done' = 'mount'

  if (variant === 'render') {
    // For React render demo: simpler stages
    if (log.includes('paint')) stage = 'paint-data'
    else if (isCommit) stage = 'commit-skeleton'
    else if (step.phase === 'react-render') stage = 'render-skeleton'
    else if (isIdle) stage = 'done'
  } else {
    if (dataPainted) stage = 'paint-data'
    else if (dataRendered) stage = 'render-data'
    else if (stateUpdated) stage = 'updating'
    else if (networkReceived) stage = 'response'
    else if (fetchStarted) stage = 'fetching'
    else if (skeletonPainted) stage = 'paint-skeleton'
    else if (isCommit) stage = 'commit-skeleton'
    else if (skeletonShown) stage = 'render-skeleton'
  }

  const stageMeta: Record<
    typeof stage,
    { color: string; label: string; hint: string }
  > = {
    mount: { color: '#94a3b8', label: 'Mount', hint: 'React готовится к первому рендеру' },
    'render-skeleton': {
      color: '#0ea5e9',
      label: 'Render',
      hint: 'Компонент вызывается, status=loading',
    },
    'commit-skeleton': {
      color: '#6366f1',
      label: 'Commit',
      hint: 'Skeleton попадает в DOM',
    },
    'paint-skeleton': {
      color: '#22c55e',
      label: 'Paint',
      hint: 'Пользователь видит skeleton',
    },
    fetching: {
      color: '#f59e0b',
      label: 'Fetching',
      hint: 'useEffect → fetch() → ждём сеть',
    },
    response: {
      color: '#ef4444',
      label: 'Response',
      hint: 'Network macrotask: ответ пришёл',
    },
    updating: {
      color: '#a855f7',
      label: 'setState',
      hint: 'Микрозадача → setState → schedule render',
    },
    'render-data': {
      color: '#0ea5e9',
      label: 'Re-render',
      hint: 'React вызывает компонент с новыми данными',
    },
    'paint-data': {
      color: '#22c55e',
      label: 'Paint',
      hint: 'Пользователь видит данные',
    },
    done: { color: '#94a3b8', label: 'Idle', hint: 'Готово' },
  }

  const meta = stageMeta[stage]

  return (
    <div className='el-page-demo'>
      <div className='el-page-demo-header'>
        <span className='el-page-demo-title'>
          🌐 Что видит пользователь на странице
        </span>
        <span
          className='el-page-demo-stage'
          style={{ background: `${meta.color}1a`, color: meta.color, borderColor: meta.color }}
        >
          {meta.label}
        </span>
      </div>

      <div className='el-browser-frame'>
        <div className='el-browser-chrome'>
          <span className='el-browser-dot dot-r' />
          <span className='el-browser-dot dot-y' />
          <span className='el-browser-dot dot-g' />
          <span className='el-browser-url'>https://app.example.com/user</span>
        </div>

        <div className='el-browser-viewport'>
          {/* "Painted" state determines what's actually on screen */}
          {stage === 'mount' && (
            <div className='el-page-empty'>
              <span>пустая страница (рендер ещё не произошёл)</span>
            </div>
          )}

          {(stage === 'render-skeleton' || stage === 'commit-skeleton') && (
            <div className='el-page-buffer'>
              <div className='el-buffer-badge'>В памяти React: skeleton (ещё не paint)</div>
              <PageSkeleton dim />
            </div>
          )}

          {(stage === 'paint-skeleton' ||
            stage === 'fetching' ||
            stage === 'response' ||
            stage === 'updating') && (
            <div className='el-page-painted'>
              <PageSkeleton />
              {stage === 'fetching' && (
                <div className='el-net-bar'>
                  <span className='el-net-spinner' /> GET /api/user — pending...
                </div>
              )}
              {stage === 'response' && (
                <div className='el-net-bar el-net-bar-success'>
                  ✓ GET /api/user — 200 OK
                </div>
              )}
              {stage === 'updating' && (
                <div className='el-net-bar el-net-bar-info'>
                  ⚛ setState(data) → schedule re-render
                </div>
              )}
            </div>
          )}

          {stage === 'render-data' && (
            <div className='el-page-buffer'>
              <div className='el-buffer-badge'>В памяти React: новый DOM (ещё не paint)</div>
              <PageData dim />
            </div>
          )}

          {(stage === 'paint-data' || stage === 'done') && (
            <div className='el-page-painted'>
              <PageData />
            </div>
          )}
        </div>
      </div>

      <div className='el-page-demo-hint'>
        <strong>{meta.label}:</strong> {meta.hint}
      </div>
    </div>
  )
}

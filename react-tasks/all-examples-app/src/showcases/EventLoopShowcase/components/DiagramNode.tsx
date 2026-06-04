interface TooltipContent {
  title: string
  body: string
  sources: string[]
  priority: string
}

export function DiagramNode({
  className,
  label,
  sub,
  tooltip,
}: {
  className: string
  label: string
  sub: string
  tooltip: TooltipContent
}) {
  return (
    <div className={`el-loop-node ${className}`}>
      <span className='el-loop-node-label'>{label}</span>
      <span className='el-loop-node-sub'>{sub}</span>
      <div className='el-tooltip' role='tooltip'>
        <div className='el-tooltip-title'>{tooltip.title}</div>
        <div className='el-tooltip-body'>{tooltip.body}</div>
        <div className='el-tooltip-section'>
          <div className='el-tooltip-section-label'>Источники:</div>
          <ul>
            {tooltip.sources.map(s => (
              <li key={s}>
                <code>{s}</code>
              </li>
            ))}
          </ul>
        </div>
        <div className='el-tooltip-priority'>
          <strong>Приоритет:</strong> {tooltip.priority}
        </div>
      </div>
    </div>
  )
}

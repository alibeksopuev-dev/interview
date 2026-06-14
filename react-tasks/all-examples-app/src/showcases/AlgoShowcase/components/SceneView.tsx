import type { Scene, ArrayCell, MapEntry, ListNode, CollectionItem, GraphNode, GraphEdge, InfoCard } from '../data/types'
import { TreeView } from './TreeView'

// ── Graph view ─────────────────────────────────────────────────────

const W = 340, H = 220, PAD = 22

const CELL_FILL: Record<NonNullable<GraphNode['state']>, string> = {
  idle: '#ffffff', active: '#dbeafe', compared: '#fef3c7', discarded: '#f1f5f9',
  matched: '#d1fae5', merged: '#ede9fe', window: '#cffafe', visited: '#bbf7d0',
  queued: '#fde68a', stacked: '#fecaca',
}
const CELL_STROKE: Record<NonNullable<GraphNode['state']>, string> = {
  idle: '#cbd5e1', active: '#60a5fa', compared: '#f59e0b', discarded: '#cbd5e1',
  matched: '#10b981', merged: '#8b5cf6', window: '#06b6d4', visited: '#22c55e',
  queued: '#f59e0b', stacked: '#ef4444',
}
const EDGE_COLORS: Record<NonNullable<GraphEdge['state']>, string> = {
  idle: '#cbd5e1', active: '#60a5fa', compared: '#f59e0b', discarded: '#e2e8f0',
  matched: '#10b981', merged: '#8b5cf6', window: '#06b6d4', visited: '#22c55e',
  queued: '#f59e0b', stacked: '#ef4444',
}

function GraphBlock({ graph }: { graph: NonNullable<Scene['graph']> }) {
  const { nodes, edges, label } = graph

  const px = (n: GraphNode) => PAD + (n.x ?? 0.5) * (W - 2 * PAD)
  const py = (n: GraphNode) => PAD + (n.y ?? 0.5) * (H - 2 * PAD)
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

  return (
    <div className='ag-block'>
      {label && <div className='ag-block-label'>{label}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} className='ag-graph-svg' role='img'>
        <defs>
          <marker id='arrow' markerWidth='8' markerHeight='8' refX='7' refY='3' orient='auto'>
            <path d='M0,0 L0,6 L8,3 z' fill='#94a3b8' />
          </marker>
          <marker id='arrow-active' markerWidth='8' markerHeight='8' refX='7' refY='3' orient='auto'>
            <path d='M0,0 L0,6 L8,3 z' fill='#10b981' />
          </marker>
        </defs>
        {/* edges */}
        {edges.map((e, idx) => {
          const from = nodeMap[e.from]
          const to = nodeMap[e.to]
          if (!from || !to) return null
          const x1 = px(from), y1 = py(from), x2 = px(to), y2 = py(to)
          const dx = x2 - x1, dy = y2 - y1
          const len = Math.sqrt(dx * dx + dy * dy)
          const r = 14
          const sx = x1 + (dx / len) * r, sy = y1 + (dy / len) * r
          const ex = x2 - (dx / len) * (r + (e.directed ? 6 : 0))
          const ey = y2 - (dy / len) * (r + (e.directed ? 6 : 0))
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
          const color = EDGE_COLORS[e.state ?? 'idle']
          const isActive = e.state === 'matched' || e.state === 'compared'
          return (
            <g key={idx}>
              <line
                x1={sx} y1={sy} x2={ex} y2={ey}
                stroke={color}
                strokeWidth={isActive ? 2.5 : 1.5}
                markerEnd={e.directed ? (isActive ? 'url(#arrow-active)' : 'url(#arrow)') : undefined}
              />
              {e.weight !== undefined && (
                <text x={mx} y={my - 5} fontSize={10} fill='#64748b' textAnchor='middle' fontFamily='JetBrains Mono, monospace' fontWeight={600}>
                  {e.weight}
                </text>
              )}
            </g>
          )
        })}
        {/* nodes */}
        {nodes.map(n => {
          const x = px(n), y = py(n)
          const state = n.state ?? 'idle'
          return (
            <g key={n.id} transform={`translate(${x},${y})`}>
              <circle r={14} fill={CELL_FILL[state]} stroke={CELL_STROKE[state]} strokeWidth={state === 'idle' ? 1.5 : 2.5} />
              <text textAnchor='middle' dominantBaseline='middle' fontSize={12} fontWeight={700} fill='#0f172a' fontFamily='JetBrains Mono, monospace'>
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Info cards (data structure definition slides) ──────────────────

function InfoCardsBlock({ cards }: { cards: InfoCard[] }) {
  return (
    <div className='ag-info-cards'>
      {cards.map((card, idx) => (
        <div key={idx} className='ag-info-card'>
          <div className='ag-info-card-head'>
            <span className='ag-info-card-title'>{card.title}</span>
            {card.tag && <span className='ag-info-card-tag'>{card.tag}</span>}
          </div>
          <div className='ag-info-card-body'>{card.body}</div>
          {card.complexity && (
            <div className='ag-info-card-complexity'>
              <code>{card.complexity}</code>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ArrayBlock({ cells, label }: { cells: ArrayCell[]; label?: string }) {
  return (
    <div className='ag-block'>
      {label && <div className='ag-block-label'>{label}</div>}
      <div className='ag-array-cells'>
        {cells.length === 0 ? (
          <div className='ag-empty'>пусто</div>
        ) : (
          cells.map((cell, idx) => (
            <div key={idx} className={`ag-cell ag-cell-${cell.state ?? 'idle'}`}>
              <div className='ag-cell-value'>{cell.value}</div>
              <div className='ag-cell-index'>{idx}</div>
              {cell.label && <div className='ag-cell-tag'>{cell.label}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MapBlock({ entries, label }: { entries: MapEntry[]; label?: string }) {
  return (
    <div className='ag-block'>
      {label && <div className='ag-block-label'>{label}</div>}
      <div className='ag-map'>
        {entries.length === 0 ? (
          <div className='ag-empty'>пусто</div>
        ) : (
          entries.map((e, idx) => (
            <div key={idx} className={`ag-map-entry ag-cell-${e.state ?? 'idle'}`}>
              <span className='ag-map-key'>{e.key}</span>
              <span className='ag-map-arrow'>→</span>
              <span className='ag-map-val'>{e.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ListBlock({ nodes, label }: { nodes: ListNode[]; label?: string }) {
  return (
    <div className='ag-block'>
      {label && <div className='ag-block-label'>{label}</div>}
      <div className='ag-list'>
        {nodes.map((n, idx) => (
          <div key={idx} className='ag-list-cell-wrap'>
            <div className={`ag-list-cell ag-cell-${n.state ?? 'idle'}`}>
              <div className='ag-cell-value'>{n.value}</div>
            </div>
            {n.label && <div className='ag-list-label'>{n.label}</div>}
            {idx < nodes.length - 1 && <span className='ag-list-arrow'>→</span>}
          </div>
        ))}
        {nodes.length > 0 && <span className='ag-list-null'>null</span>}
      </div>
    </div>
  )
}

function StackBlock({ items, label }: { items: CollectionItem[]; label?: string }) {
  // Stack grows DOWN-to-UP visually: top of stack on TOP of UI
  return (
    <div className='ag-block ag-stack-block'>
      {label && <div className='ag-block-label'>{label}</div>}
      <div className='ag-stack'>
        <div className='ag-stack-cap'>↑ верх</div>
        {items.length === 0 ? (
          <div className='ag-empty'>пусто</div>
        ) : (
          [...items].reverse().map((it, idx) => (
            <div key={idx} className={`ag-stack-item ag-cell-${it.state ?? 'idle'}`}>
              {it.value}
            </div>
          ))
        )}
        <div className='ag-stack-base'>основание</div>
      </div>
    </div>
  )
}

function QueueBlock({ items, label }: { items: CollectionItem[]; label?: string }) {
  return (
    <div className='ag-block'>
      {label && <div className='ag-block-label'>{label}</div>}
      <div className='ag-queue'>
        <div className='ag-queue-head'>head →</div>
        {items.length === 0 ? (
          <div className='ag-empty'>пусто</div>
        ) : (
          items.map((it, idx) => (
            <div key={idx} className={`ag-queue-item ag-cell-${it.state ?? 'idle'}`}>
              {it.value}
            </div>
          ))
        )}
        <div className='ag-queue-tail'>← tail</div>
      </div>
    </div>
  )
}

function CallStackBlock({ items, label }: { items: CollectionItem[]; label?: string }) {
  return (
    <div className='ag-block'>
      {label && <div className='ag-block-label'>{label ?? 'call stack'}</div>}
      <div className='ag-callstack'>
        {items.length === 0 ? (
          <div className='ag-empty'>стек пуст</div>
        ) : (
          [...items].reverse().map((it, idx) => (
            <div key={idx} className={`ag-callstack-frame ag-cell-${it.state ?? 'idle'}`}>
              <span className='ag-callstack-arrow'>{idx === 0 ? '▶' : ' '}</span>
              <span>{it.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function VarsBlock({ vars }: { vars: Record<string, string | number> }) {
  return (
    <div className='ag-vars'>
      {Object.entries(vars).map(([k, v]) => (
        <span key={k} className='ag-var'>
          <code>{k}</code>={v}
        </span>
      ))}
    </div>
  )
}

export function SceneView({ scene }: { scene: Scene }) {
  return (
    <div className='ag-scene'>
      {scene.vars && Object.keys(scene.vars).length > 0 && <VarsBlock vars={scene.vars} />}
      {scene.cards && scene.cards.length > 0 && <InfoCardsBlock cards={scene.cards} />}
      {scene.graph && <GraphBlock graph={scene.graph} />}
      {scene.array && <ArrayBlock cells={scene.array.cells} label={scene.array.label} />}
      {scene.tree && <TreeView tree={scene.tree} />}
      {scene.list && <ListBlock nodes={scene.list.nodes} label={scene.list.label} />}
      {scene.map && <MapBlock entries={scene.map.entries} label={scene.map.label} />}
      <div className='ag-scene-row'>
        {scene.stack && <StackBlock items={scene.stack.items} label={scene.stack.label} />}
        {scene.queue && <QueueBlock items={scene.queue.items} label={scene.queue.label} />}
        {scene.callStack && (
          <CallStackBlock items={scene.callStack.items} label={scene.callStack.label} />
        )}
      </div>
      {scene.secondaryArray && (
        <ArrayBlock cells={scene.secondaryArray.cells} label={scene.secondaryArray.label} />
      )}
    </div>
  )
}

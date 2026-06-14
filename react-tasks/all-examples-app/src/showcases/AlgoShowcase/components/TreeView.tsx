import type { TreeNode } from '../data/types'

// Simple tidy-tree: we compute x positions via in-order traversal of leaves,
// then assign internal nodes the midpoint of their children.
interface PositionedNode {
  node: TreeNode
  x: number
  y: number
  children: PositionedNode[]
}

const NODE_R = 22
const X_GAP = 56
const Y_GAP = 64
const PAD = 12

function layout(node: TreeNode, depth: number, nextLeafX: { v: number }): PositionedNode {
  if (!node.children || node.children.length === 0) {
    const x = nextLeafX.v
    nextLeafX.v += X_GAP
    return { node, x, y: depth * Y_GAP + PAD + NODE_R, children: [] }
  }
  const childPositioned = node.children.map(c => layout(c, depth + 1, nextLeafX))
  const xs = childPositioned.map(c => c.x)
  const x = (Math.min(...xs) + Math.max(...xs)) / 2
  return { node, x, y: depth * Y_GAP + PAD + NODE_R, children: childPositioned }
}

function collectAll(p: PositionedNode): PositionedNode[] {
  return [p, ...p.children.flatMap(collectAll)]
}

const FILL: Record<NonNullable<TreeNode['state']>, string> = {
  idle: '#ffffff',
  active: '#dbeafe',
  compared: '#fef3c7',
  discarded: '#f1f5f9',
  matched: '#d1fae5',
  merged: '#ede9fe',
  window: '#cffafe',
  visited: '#bbf7d0',
  queued: '#fde68a',
  stacked: '#fecaca',
}
const STROKE: Record<NonNullable<TreeNode['state']>, string> = {
  idle: '#cbd5e1',
  active: '#60a5fa',
  compared: '#f59e0b',
  discarded: '#cbd5e1',
  matched: '#10b981',
  merged: '#8b5cf6',
  window: '#06b6d4',
  visited: '#22c55e',
  queued: '#f59e0b',
  stacked: '#ef4444',
}

export function TreeView({ tree }: { tree: TreeNode }) {
  const counter = { v: PAD + NODE_R }
  const positioned = layout(tree, 0, counter)
  const all = collectAll(positioned)
  const width = counter.v + PAD
  const height = Math.max(...all.map(n => n.y)) + NODE_R + PAD

  return (
    <div className='ag-tree-block'>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className='ag-tree-svg'
        role='img'
        aria-label='Tree visualization'
        style={{ width: '100%', maxHeight: 280 }}
      >
        {/* edges */}
        {all.flatMap(p =>
          p.children.map((c, idx) => (
            <line
              key={`e-${p.node.id}-${idx}`}
              x1={p.x}
              y1={p.y + NODE_R / 2}
              x2={c.x}
              y2={c.y - NODE_R / 2}
              stroke='#cbd5e1'
              strokeWidth={1.5}
            />
          ))
        )}
        {/* nodes */}
        {all.map(p => {
          const state = p.node.state ?? 'idle'
          return (
            <g key={p.node.id} transform={`translate(${p.x}, ${p.y})`}>
              <circle
                r={NODE_R}
                fill={FILL[state]}
                stroke={STROKE[state]}
                strokeWidth={state === 'idle' ? 1.5 : 2.5}
              />
              <text
                textAnchor='middle'
                dominantBaseline='middle'
                fontSize={13}
                fontWeight={700}
                fill='#0f172a'
                fontFamily='JetBrains Mono, monospace'
              >
                {p.node.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

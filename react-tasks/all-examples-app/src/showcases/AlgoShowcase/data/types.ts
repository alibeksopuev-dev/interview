// ─── Shared cell state (same colors as BigO showcase) ─────────────

export type CellState =
  | 'idle'
  | 'active'
  | 'compared'
  | 'discarded'
  | 'matched'
  | 'merged'
  | 'window'
  | 'visited'
  | 'queued'
  | 'stacked'

// ─── Array view ───────────────────────────────────────────────────

export interface ArrayCell {
  value: number | string
  state?: CellState
  label?: string
}

// ─── Tree view ────────────────────────────────────────────────────

export interface TreeNode {
  id: string
  value: number | string
  state?: CellState
  children?: TreeNode[]
}

// ─── Hash map view ────────────────────────────────────────────────

export interface MapEntry {
  key: string | number
  value: string | number
  state?: CellState
}

// ─── Linked list ──────────────────────────────────────────────────

export interface ListNode {
  value: number | string
  state?: CellState
  label?: string // "head", "prev", "cur", "next"
}

// ─── Stack / Queue / Set (generic linear collection) ──────────────

export interface CollectionItem {
  value: string | number
  state?: CellState
  label?: string
}

// ─── A "scene" is the full visual state at a single step ──────────

export interface Scene {
  /** Primary array view (e.g. input array, sorted array) */
  array?: { cells: ArrayCell[]; label?: string }
  /** Secondary array view (e.g. result, sliding window output) */
  secondaryArray?: { cells: ArrayCell[]; label?: string }
  /** Tree visualization */
  tree?: TreeNode
  /** Hash map / hash set visualization */
  map?: { entries: MapEntry[]; label?: string }
  /** Linked list */
  list?: { nodes: ListNode[]; label?: string }
  /** Stack (LIFO, drawn top-down) */
  stack?: { items: CollectionItem[]; label?: string }
  /** Queue (FIFO, drawn left-right with arrow) */
  queue?: { items: CollectionItem[]; label?: string }
  /** Call stack of recursive frames */
  callStack?: { items: CollectionItem[]; label?: string }
  /** Graph visualization */
  graph?: { nodes: GraphNode[]; edges: GraphEdge[]; label?: string }
  /** Info cards (for data-structure definition slides) */
  cards?: InfoCard[]
  /** Free-form variables (e.g. { L: 0, R: 5, sum: 12 }) */
  vars?: Record<string, string | number>
}

// ─── A step in the algorithm trace ────────────────────────────────

export interface Step {
  /** Highlighted code line (1-based) */
  line: number
  /** Russian explanation of what happens */
  action: string
  /** Visual scene */
  scene: Scene
  /** Cumulative operation count */
  ops: number
  /** Big-picture lesson hint shown in a callout */
  hint?: string
}

// ─── Graph view ───────────────────────────────────────────────────

export interface GraphNode {
  id: string
  label: string | number
  state?: CellState
  /** position hint 0..1 for SVG layout */
  x?: number
  y?: number
}

export interface GraphEdge {
  from: string
  to: string
  weight?: number
  state?: CellState
  directed?: boolean
}

// ─── Info card (for data structure definitions) ───────────────────

export interface InfoCard {
  title: string
  body: string
  complexity?: string
  tag?: string
}

// ─── Topic categories for grouping cases ──────────────────────────

export type Topic =
  | 'Деревья'
  | 'Рекурсия'
  | 'Два указателя'
  | 'Хэш-таблицы'
  | 'Стек & Очередь'
  | 'Связный список'
  | 'Структуры данных'
  | 'Графы'

// ─── Full case study ──────────────────────────────────────────────

export interface CaseStudy {
  id: string
  topic: Topic
  title: string
  /** Big O complexity badge */
  complexity: string
  /** What does the algorithm do (plain russian) */
  about: string
  /** Why is this important / when do we use it */
  whenToUse: string
  /** Real-life analogy */
  analogy: string
  /** Code shown on the left, 1-based lines */
  code: string[]
  /** Step-by-step trace */
  steps: Step[]
  /** Common newbie mistakes */
  pitfalls: string[]
  /** Where to look in the repo for more */
  source?: string
}

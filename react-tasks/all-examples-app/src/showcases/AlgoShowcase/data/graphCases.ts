import type { CaseStudy, GraphNode, GraphEdge } from './types'

// ─── Helper: build graph snapshot ─────────────────────────────────
// Nodes are pre-positioned on a unit circle for 6-node graph layout

const NODES_BASE: GraphNode[] = [
  { id: 'A', label: 'A', x: 0.5,  y: 0.05 },
  { id: 'B', label: 'B', x: 0.1,  y: 0.4  },
  { id: 'C', label: 'C', x: 0.9,  y: 0.4  },
  { id: 'D', label: 'D', x: 0.1,  y: 0.75 },
  { id: 'E', label: 'E', x: 0.55, y: 0.75 },
  { id: 'F', label: 'F', x: 0.9,  y: 0.75 },
]

const EDGES_BASE: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4  },
  { from: 'A', to: 'C', weight: 2  },
  { from: 'B', to: 'D', weight: 5  },
  { from: 'B', to: 'E', weight: 1  },
  { from: 'C', to: 'E', weight: 8  },
  { from: 'C', to: 'F', weight: 2  },
  { from: 'D', to: 'E', weight: 2  },
  { from: 'E', to: 'F', weight: 3  },
]

function nodes(states: Record<string, GraphNode['state']>): GraphNode[] {
  return NODES_BASE.map(n => ({ ...n, state: states[n.id] ?? 'idle' }))
}
function edges(active: string[], visited: string[]): GraphEdge[] {
  return EDGES_BASE.map(e => ({
    ...e,
    state: active.includes(`${e.from}-${e.to}`) ? 'compared'
         : visited.includes(`${e.from}-${e.to}`) ? 'matched'
         : 'idle',
  }))
}

// ─── Graph intro / representation ─────────────────────────────────

const graphIntroCase: CaseStudy = {
  id: 'graph-intro',
  topic: 'Графы',
  title: 'Граф — основы и представления',
  complexity: 'Хранение: O(V + E)',
  about:
    'Граф — набор вершин (Vertex) и рёбер (Edge) между ними. В отличие от дерева, у графа нет "корня", могут быть циклы, и одна вершина может быть связана с любым количеством других.',
  whenToUse:
    'Социальные сети (друзья), карты (дороги), интернет (маршруты), зависимости пакетов, расписания. Если у тебя есть "связи" между объектами — это граф.',
  analogy:
    'Карта метро: станции — вершины, переходы — рёбра. Между станциями может быть несколько маршрутов, есть кольцевые линии (циклы).',
  code: [
    '// Матрица смежности — O(V²) память',
    'const matrix = [',
    '  [0,1,1,0,0,0],  // A→B, A→C',
    '  [1,0,0,1,1,0],  // B→A, B→D, B→E',
    '  // ...',
    '];',
    '',
    '// Список смежности — O(V+E) память',
    'const adj = {',
    '  A: ["B","C"],',
    '  B: ["A","D","E"],',
    '  C: ["A","E","F"],',
    '  // ...',
    '};',
  ],
  steps: [
    {
      line: 8,
      action: 'Вот наш граф: 6 вершин, 8 рёбер с весами. Рёбра двунаправленные (неориентированный граф).',
      scene: {
        graph: {
          nodes: nodes({}),
          edges: edges([], []),
          label: 'неориентированный взвешенный граф',
        },
        cards: [
          {
            title: '🗂️ Виды графов',
            body: '• Направленный (directed/digraph): A→B ≠ B→A\n• Ненаправленный: A—B = B—A\n• Взвешенный: ребро имеет вес/стоимость\n• Ацикличный (DAG): без циклов. Используется для зависимостей.',
            tag: 'классификация',
          },
        ],
      },
      ops: 0,
      hint: 'V = число вершин, E = число рёбер. Граф записывают как G = (V, E).',
    },
    {
      line: 1,
      action: 'Матрица смежности: matrix[i][j] = 1 если есть ребро i→j. Быстрая проверка O(1), но O(V²) памяти.',
      scene: {
        graph: { nodes: nodes({}), edges: edges([], []) },
        array: {
          cells: ['A→B', 'A→C', 'B→D', 'B→E', 'C→E', 'C→F', 'D→E', 'E→F'].map(v => ({ value: v, state: 'idle' })),
          label: 'все рёбра (список)',
        },
        cards: [
          {
            title: '📊 Матрица vs Список',
            body: 'Матрица: проверить ребро O(1), но O(V²) памяти. Плохо для разреженных графов.\nСписок смежности: O(V+E) памяти. Хорошо для BFS/DFS. Проверить ребро O(degree).',
            tag: 'representation',
          },
        ],
      },
      ops: 0,
    },
    {
      line: 8,
      action: 'Список смежности — каждой вершине сопоставлен список её соседей. O(V+E) памяти. Стандарт для BFS/DFS.',
      scene: {
        graph: { nodes: nodes({}), edges: edges([], []) },
        map: {
          entries: [
            { key: 'A', value: '[B, C]' },
            { key: 'B', value: '[A, D, E]' },
            { key: 'C', value: '[A, E, F]' },
            { key: 'D', value: '[B, E]' },
            { key: 'E', value: '[B, C, D, F]' },
            { key: 'F', value: '[C, E]' },
          ],
          label: 'adj (список смежности)',
        },
      },
      ops: 0,
      hint: 'В JS список смежности = объект/Map где ключи — вершины, значения — массивы соседей.',
    },
  ],
  pitfalls: [
    'Матрицу смежности НЕ используют для больших разреженных графов: 1000 вершин = 10⁶ ячеек, из которых 99% нулей.',
    'Цикл в графе означает: обязательно помечай посещённые вершины в BFS/DFS, иначе — бесконечная петля.',
    'Дерево = частный случай графа (связный, ациклический, ненаправленный). Все алгоритмы для деревьев работают на графах, не наоборот.',
  ],
}

// ─── BFS на графе ────────────────────────────────────────────────

const graphBfsCase: CaseStudy = {
  id: 'graph-bfs',
  topic: 'Графы',
  title: 'BFS на графе — кратчайший путь',
  complexity: 'O(V + E)',
  about:
    'BFS (обход в ширину) на графе работает так же, как на дереве — через очередь. Главное отличие: граф может иметь ЦИКЛЫ, поэтому нужно хранить множество посещённых вершин.',
  whenToUse:
    'Кратчайший путь в невзвешенном графе (число рёбер). "На сколько шагов мне до X?" в соцсети, игре, лабиринте.',
  analogy:
    'Ты стоишь в центре города и хочешь найти ближайший магазин. Идёшь по всем соседним улицам одновременно (BFS по уровням), не пропуская ни одну — пока не найдёшь.',
  code: [
    'function bfs(adj, start, target) {',
    '  const visited = new Set([start]);',
    '  const queue = [[start, 0]];  // [вершина, расстояние]',
    '  while (queue.length) {',
    '    const [node, dist] = queue.shift();',
    '    if (node === target) return dist;',
    '    for (const neighbor of adj[node]) {',
    '      if (!visited.has(neighbor)) {',
    '        visited.add(neighbor);',
    '        queue.push([neighbor, dist + 1]);',
    '      }',
    '    }',
    '  }',
    '  return -1;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Ищем кратчайший путь от A до F. Стартуем BFS с A. visited={A}, queue=[(A,0)].',
      scene: {
        graph: { nodes: nodes({ A: 'matched' }), edges: edges([], []) },
        queue: { items: [{ value: 'A (d=0)', state: 'queued' }], label: 'очередь' },
        vars: { start: 'A', target: 'F' },
      },
      ops: 1,
    },
    {
      line: 5,
      action: 'Берём A. Соседи: B, C. Оба не посещены → добавляем в очередь. visited={A,B,C}.',
      scene: {
        graph: {
          nodes: nodes({ A: 'visited', B: 'queued', C: 'queued' }),
          edges: edges(['A-B', 'A-C'], []),
        },
        queue: {
          items: [
            { value: 'B (d=1)', state: 'queued' },
            { value: 'C (d=1)', state: 'queued' },
          ],
        },
        vars: { visited: '{A,B,C}' },
      },
      ops: 3,
      hint: 'Оба на расстоянии 1 от A. BFS гарантирует, что первый найденный путь — кратчайший.',
    },
    {
      line: 5,
      action: 'Берём B (d=1). Соседи: D, E не посещены → queue. A — посещён, пропускаем.',
      scene: {
        graph: {
          nodes: nodes({ A: 'visited', B: 'visited', C: 'queued', D: 'queued', E: 'queued' }),
          edges: edges(['B-D', 'B-E'], ['A-B']),
        },
        queue: {
          items: [
            { value: 'C (d=1)', state: 'queued' },
            { value: 'D (d=2)', state: 'queued' },
            { value: 'E (d=2)', state: 'queued' },
          ],
        },
        vars: { visited: '{A,B,C,D,E}' },
      },
      ops: 5,
    },
    {
      line: 5,
      action: 'Берём C (d=1). Сосед F не посещён → добавляем! E уже в visited — пропускаем.',
      scene: {
        graph: {
          nodes: nodes({ A: 'visited', B: 'visited', C: 'visited', D: 'queued', E: 'queued', F: 'queued' }),
          edges: edges(['C-F'], ['A-B', 'A-C', 'B-D', 'B-E']),
        },
        queue: {
          items: [
            { value: 'D (d=2)', state: 'queued' },
            { value: 'E (d=2)', state: 'queued' },
            { value: 'F (d=2)', state: 'queued' },
          ],
        },
        vars: { 'C→F': 'd=2', visited: '{A,B,C,D,E,F}' },
      },
      ops: 7,
    },
    {
      line: 6,
      action: 'Берём D — не target. Берём E — не target. Берём F (d=2) — это TARGET! Возвращаем 2.',
      scene: {
        graph: {
          nodes: nodes({ A: 'visited', B: 'visited', C: 'visited', D: 'visited', E: 'visited', F: 'matched' }),
          edges: edges([], ['A-C', 'C-F']),
        },
        vars: { 'путь': 'A→C→F', 'расстояние': 2 },
        cards: [
          {
            title: '✅ Кратчайший путь',
            body: 'A→C→F = 2 ребра. BFS всегда находит путь с МИНИМАЛЬНЫМ числом рёбер. Для взвешенных дорог нужен Dijkstra.',
            complexity: 'O(V+E)',
          },
        ],
      },
      ops: 10,
      hint: 'BFS = кратчайший по числу шагов. Dijkstra = кратчайший по сумме весов.',
    },
  ],
  pitfalls: [
    'Забыть visited → бесконечный цикл на графе с циклом. Всегда помечай ДО добавления в очередь.',
    'queue.shift() — O(n) на массиве! Для больших графов используй двусвязный список или индекс head.',
    'BFS даёт кратчайший путь ТОЛЬКО для невзвешенных графов (или где все веса = 1). Для весов — Dijkstra.',
  ],
}

// ─── DFS на графе ─────────────────────────────────────────────────

const graphDfsCase: CaseStudy = {
  id: 'graph-dfs',
  topic: 'Графы',
  title: 'DFS на графе — обнаружение цикла',
  complexity: 'O(V + E)',
  about:
    'DFS на графе идёт как можно глубже, прежде чем откатиться. Используется для: поиска циклов, топологической сортировки, нахождения компонент связности, проверки двудольности.',
  whenToUse:
    'Есть ли цикл в зависимостях пакетов? Можно ли упорядочить задачи без зависимостей? DFS отвечает на эти вопросы.',
  analogy:
    'Ты идёшь по лабиринту, ставя отметки на стенах. Если встречаешь свою старую отметку — нашёл цикл. Если тупик — возвращаешься и идёшь другим путём.',
  code: [
    'function hasCycle(adj) {',
    '  const visited = new Set();',
    '  const inStack = new Set(); // текущий путь DFS',
    '',
    '  function dfs(v) {',
    '    visited.add(v); inStack.add(v);',
    '    for (const neighbor of adj[v]) {',
    '      if (!visited.has(neighbor)) {',
    '        if (dfs(neighbor)) return true;',
    '      } else if (inStack.has(neighbor)) {',
    '        return true; // нашли ребро назад = цикл!',
    '      }',
    '    }',
    '    inStack.delete(v);',
    '    return false;',
    '  }',
    '  return [...Object.keys(adj)].some(v => !visited.has(v) && dfs(v));',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Проверяем граф на цикл. Используем два множества: visited (весь граф) и inStack (текущий путь DFS).',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.5, y: 0.05 },
            { id: 'B', label: 'B', x: 0.15, y: 0.5 },
            { id: 'C', label: 'C', x: 0.85, y: 0.5 },
            { id: 'D', label: 'D', x: 0.5, y: 0.9 },
          ],
          edges: [
            { from: 'A', to: 'B', directed: true },
            { from: 'B', to: 'D', directed: true },
            { from: 'D', to: 'C', directed: true },
            { from: 'C', to: 'A', directed: true },
          ],
          label: 'directed graph (есть цикл!)',
        },
        cards: [
          {
            title: '🔄 inStack vs visited',
            body: 'visited = "мы уже были здесь когда-то"\ninStack = "мы СЕЙЧАС идём через эту вершину"\nЕсли сосед в inStack — значит мы нашли ребро назад = ЦИКЛ.',
            tag: 'cycle detection',
          },
        ],
      },
      ops: 0,
    },
    {
      line: 5,
      action: 'dfs(A): visited={A}, inStack={A}. Идём к соседу B.',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.5, y: 0.05, state: 'stacked' },
            { id: 'B', label: 'B', x: 0.15, y: 0.5, state: 'active' },
            { id: 'C', label: 'C', x: 0.85, y: 0.5 },
            { id: 'D', label: 'D', x: 0.5, y: 0.9 },
          ],
          edges: [
            { from: 'A', to: 'B', directed: true, state: 'compared' },
            { from: 'B', to: 'D', directed: true },
            { from: 'D', to: 'C', directed: true },
            { from: 'C', to: 'A', directed: true },
          ],
        },
        stack: { items: [{ value: 'A', state: 'stacked' }], label: 'inStack' },
        vars: { visited: '{A}' },
      },
      ops: 1,
    },
    {
      line: 5,
      action: 'dfs(B): visited={A,B}, inStack={A,B}. Идём к D.',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.5, y: 0.05, state: 'stacked' },
            { id: 'B', label: 'B', x: 0.15, y: 0.5, state: 'stacked' },
            { id: 'C', label: 'C', x: 0.85, y: 0.5 },
            { id: 'D', label: 'D', x: 0.5, y: 0.9, state: 'active' },
          ],
          edges: [
            { from: 'A', to: 'B', directed: true, state: 'matched' },
            { from: 'B', to: 'D', directed: true, state: 'compared' },
            { from: 'D', to: 'C', directed: true },
            { from: 'C', to: 'A', directed: true },
          ],
        },
        stack: {
          items: [{ value: 'A', state: 'idle' }, { value: 'B', state: 'stacked' }],
          label: 'inStack',
        },
      },
      ops: 2,
    },
    {
      line: 5,
      action: 'dfs(D) → dfs(C). inStack={A,B,D,C}. Смотрим соседей C: сосед A.',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.5, y: 0.05, state: 'stacked' },
            { id: 'B', label: 'B', x: 0.15, y: 0.5, state: 'stacked' },
            { id: 'C', label: 'C', x: 0.85, y: 0.5, state: 'stacked' },
            { id: 'D', label: 'D', x: 0.5, y: 0.9, state: 'stacked' },
          ],
          edges: [
            { from: 'A', to: 'B', directed: true, state: 'matched' },
            { from: 'B', to: 'D', directed: true, state: 'matched' },
            { from: 'D', to: 'C', directed: true, state: 'matched' },
            { from: 'C', to: 'A', directed: true, state: 'compared' },
          ],
        },
        stack: {
          items: [
            { value: 'A', state: 'idle' },
            { value: 'B', state: 'idle' },
            { value: 'D', state: 'idle' },
            { value: 'C', state: 'stacked' },
          ],
          label: 'inStack',
        },
      },
      ops: 4,
    },
    {
      line: 10,
      action: 'A — в inStack! C→A — это ребро НАЗАД. ЦИКЛ НАЙДЕН! Возвращаем true.',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.5, y: 0.05, state: 'matched' },
            { id: 'B', label: 'B', x: 0.15, y: 0.5, state: 'visited' },
            { id: 'C', label: 'C', x: 0.85, y: 0.5, state: 'compared' },
            { id: 'D', label: 'D', x: 0.5, y: 0.9, state: 'visited' },
          ],
          edges: [
            { from: 'A', to: 'B', directed: true, state: 'matched' },
            { from: 'B', to: 'D', directed: true, state: 'matched' },
            { from: 'D', to: 'C', directed: true, state: 'matched' },
            { from: 'C', to: 'A', directed: true, state: 'compared' },
          ],
        },
        vars: { 'hasCycle': 'true', 'цикл': 'A→B→D→C→A' },
        cards: [
          {
            title: '🎯 Реальное применение',
            body: '• npm: цикличные зависимости пакетов\n• Git: проверка истории коммитов\n• Планирование задач: нельзя начать B раньше A, а A раньше B\n• Compilers: circular imports',
            tag: 'use cases',
          },
        ],
      },
      ops: 5,
      hint: 'inStack — это текущий "стек рекурсии". Ребро назад = прыжок к предку = цикл.',
    },
  ],
  pitfalls: [
    'visited ≠ inStack. visited говорит "мы заходили". inStack говорит "мы сейчас внутри этого пути". Для цикла нужен именно inStack.',
    'На неориентированном графе нельзя использовать этот подход напрямую: нужно исключить ребро к "родителю".',
    'DFS на графе без пометки посещённых → Stack Overflow на связном цикличном графе.',
  ],
}

// ─── Dijkstra ─────────────────────────────────────────────────────

const dijkstraCase: CaseStudy = {
  id: 'graph-dijkstra',
  topic: 'Графы',
  title: 'Алгоритм Дейкстры',
  complexity: 'O((V + E) log V) с Heap',
  about:
    'Дейкстра находит КРАТЧАЙШИЙ ПУТЬ от одной вершины до всех остальных в взвешенном графе без отрицательных весов. Принцип: жадно берём ближайшую непосещённую вершину.',
  whenToUse:
    'GPS навигация. Сетевая маршрутизация (OSPF). Игры (A* — улучшенный Дейкстра). Любая задача "найди минимальную стоимость пути".',
  analogy:
    'Представь, что ты раздаёшь воздушные шарики из точки A. Шарики летят по рёбрам, и скорость обратно пропорциональна весу. В какую вершину шарик прилетит первым — туда и кратчайший путь.',
  code: [
    'function dijkstra(adj, start) {',
    '  const dist = {}, visited = new Set();',
    '  // Инициализация: dist[start] = 0, остальные = ∞',
    '  for (const v in adj) dist[v] = v === start ? 0 : Infinity;',
    '',
    '  while (true) {',
    '    // Берём непосещённую вершину с мин. dist',
    '    const u = minDist(dist, visited);',
    '    if (!u) break;',
    '    visited.add(u);',
    '    for (const [v, w] of adj[u]) {',
    '      if (dist[u] + w < dist[v])',
    '        dist[v] = dist[u] + w; // relax!',
    '    }',
    '  }',
    '  return dist;',
    '}',
  ],
  steps: [
    {
      line: 4,
      action: 'Инициализация: dist[A]=0, все остальные=∞. Ищем кратчайший путь от A.',
      scene: {
        graph: { nodes: nodes({ A: 'matched' }), edges: edges([], []) },
        map: {
          entries: [
            { key: 'A', value: 0, state: 'matched' },
            { key: 'B', value: '∞', state: 'idle' },
            { key: 'C', value: '∞', state: 'idle' },
            { key: 'D', value: '∞', state: 'idle' },
            { key: 'E', value: '∞', state: 'idle' },
            { key: 'F', value: '∞', state: 'idle' },
          ],
          label: 'dist (кратчайшее расстояние)',
        },
      },
      ops: 0,
    },
    {
      line: 8,
      action: 'Берём A (dist=0, минимальный). Обновляем соседей: B=4, C=2.',
      scene: {
        graph: {
          nodes: nodes({ A: 'visited', B: 'compared', C: 'compared' }),
          edges: edges(['A-B', 'A-C'], []),
        },
        map: {
          entries: [
            { key: 'A', value: 0, state: 'visited' },
            { key: 'B', value: 4, state: 'compared' },
            { key: 'C', value: 2, state: 'compared' },
            { key: 'D', value: '∞' },
            { key: 'E', value: '∞' },
            { key: 'F', value: '∞' },
          ],
        },
        vars: { 'relaxed': 'B=0+4=4, C=0+2=2' },
      },
      ops: 3,
      hint: '"Relax" = обновить dist[v] если нашли более короткий путь через u.',
    },
    {
      line: 8,
      action: 'Берём C (dist=2, минимальный из непосещённых). Обновляем: E=2+8=10, F=2+2=4.',
      scene: {
        graph: {
          nodes: nodes({ A: 'visited', B: 'queued', C: 'visited', E: 'compared', F: 'compared' }),
          edges: edges(['C-E', 'C-F'], ['A-B', 'A-C']),
        },
        map: {
          entries: [
            { key: 'A', value: 0, state: 'visited' },
            { key: 'B', value: 4 },
            { key: 'C', value: 2, state: 'visited' },
            { key: 'D', value: '∞' },
            { key: 'E', value: 10, state: 'compared' },
            { key: 'F', value: 4, state: 'compared' },
          ],
        },
        vars: { 'через C': 'E=10, F=4' },
      },
      ops: 6,
    },
    {
      line: 8,
      action: 'Берём B (dist=4). Обновляем: D=4+5=9, E=min(10, 4+1)=5 (улучшение!).',
      scene: {
        graph: {
          nodes: nodes({ A: 'visited', B: 'visited', C: 'visited', D: 'compared', E: 'compared', F: 'queued' }),
          edges: edges(['B-D', 'B-E'], ['A-B', 'A-C', 'C-F']),
        },
        map: {
          entries: [
            { key: 'A', value: 0, state: 'visited' },
            { key: 'B', value: 4, state: 'visited' },
            { key: 'C', value: 2, state: 'visited' },
            { key: 'D', value: 9, state: 'compared' },
            { key: 'E', value: 5, state: 'matched' },
            { key: 'F', value: 4 },
          ],
        },
        vars: { 'E обновлён!': '10 → 5', путь: 'A→B→E' },
      },
      ops: 9,
      hint: 'Это и есть "relaxation" — мы нашли более короткий путь до E через B.',
    },
    {
      line: 8,
      action: 'Берём F (dist=4). E через F: 4+3=7>5, нет улучшения. Берём E (dist=5): D=min(9,5+2)=7.',
      scene: {
        graph: {
          nodes: nodes({ A: 'visited', B: 'visited', C: 'visited', D: 'compared', E: 'visited', F: 'visited' }),
          edges: edges([], ['A-B', 'A-C', 'B-E', 'C-F', 'D-E']),
        },
        map: {
          entries: [
            { key: 'A', value: 0, state: 'visited' },
            { key: 'B', value: 4, state: 'visited' },
            { key: 'C', value: 2, state: 'visited' },
            { key: 'D', value: 7, state: 'compared' },
            { key: 'E', value: 5, state: 'visited' },
            { key: 'F', value: 4, state: 'visited' },
          ],
        },
      },
      ops: 13,
    },
    {
      line: 16,
      action: 'Берём D (dist=7). Готово! Кратчайшие пути от A: B=4, C=2, D=7, E=5, F=4.',
      scene: {
        graph: {
          nodes: nodes({ A: 'matched', B: 'matched', C: 'matched', D: 'matched', E: 'matched', F: 'matched' }),
          edges: edges([], ['A-C', 'A-B', 'B-E', 'C-F', 'D-E']),
        },
        map: {
          entries: [
            { key: 'A', value: 0, state: 'matched' },
            { key: 'B', value: 4, state: 'matched' },
            { key: 'C', value: 2, state: 'matched' },
            { key: 'D', value: 7, state: 'matched' },
            { key: 'E', value: 5, state: 'matched' },
            { key: 'F', value: 4, state: 'matched' },
          ],
        },
        cards: [
          {
            title: '🗺️ Реальное применение',
            body: '• Google Maps / навигаторы\n• Сетевые протоколы (OSPF)\n• Игры: NPC находит путь к цели\n• Авиарейсы: оптимальная пересадка',
            tag: 'use cases',
          },
        ],
        vars: { 'A→F': '4 (через C)', 'A→E': '5 (через B)', 'A→D': '7 (через B→E)' },
      },
      ops: 15,
      hint: 'Dijkstra не работает с отрицательными весами. Для них — алгоритм Беллмана-Форда.',
    },
  ],
  pitfalls: [
    'Dijkstra НЕ работает с отрицательными весами рёбер. Для этого — Bellman-Ford O(V·E).',
    'Наивная реализация O(V²) — подходит для матрицы смежности. С min-heap: O((V+E)logV) — для больших разреженных графов.',
    'A* = Dijkstra + эвристика. Используется в навигации: "направление к цели" ускоряет поиск.',
  ],
}

// ─── Topological Sort ─────────────────────────────────────────────

const topoSortCase: CaseStudy = {
  id: 'graph-topo',
  topic: 'Графы',
  title: 'Топологическая сортировка',
  complexity: 'O(V + E)',
  about:
    'Топологическая сортировка упорядочивает вершины DAG (ориентированного ациклического графа) так, что если есть ребро A→B, то A стоит перед B. Работает только если в графе НЕТ циклов.',
  whenToUse:
    'Порядок сборки: скомпилировать A перед B. Порядок установки пакетов. Последовательность курсов. Любая задача с зависимостями.',
  analogy:
    'Ты готовишь рецепт: нельзя жарить лук, пока не нарезал, нельзя нарезать, пока не купил. Топологическая сортировка — это правильный порядок действий.',
  code: [
    '// Kahn\'s algorithm (BFS-based)',
    'function topoSort(graph) {',
    '  const inDegree = {};     // кол-во входящих рёбер',
    '  const order = [];',
    '  const queue = [];        // вершины с inDegree=0',
    '',
    '  // Считаем входящие степени',
    '  for (const [u, neighbors] of graph) {',
    '    for (const v of neighbors) inDegree[v] = (inDegree[v]||0)+1;',
    '  }',
    '  // Стартуем с вершин без зависимостей',
    '  for (const v of graph.keys())',
    '    if (!inDegree[v]) queue.push(v);',
    '',
    '  while (queue.length) {',
    '    const u = queue.shift();',
    '    order.push(u);',
    '    for (const v of graph.get(u))',
    '      if (--inDegree[v] === 0) queue.push(v);',
    '  }',
    '  return order; // пустой если есть цикл',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Зависимости курсов: нужно пройти A и B перед C, C перед D, B перед E.',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.1, y: 0.3 },
            { id: 'B', label: 'B', x: 0.1, y: 0.7 },
            { id: 'C', label: 'C', x: 0.45, y: 0.3 },
            { id: 'D', label: 'D', x: 0.8, y: 0.3 },
            { id: 'E', label: 'E', x: 0.45, y: 0.7 },
          ],
          edges: [
            { from: 'A', to: 'C', directed: true },
            { from: 'B', to: 'C', directed: true },
            { from: 'C', to: 'D', directed: true },
            { from: 'B', to: 'E', directed: true },
          ],
          label: 'зависимости курсов',
        },
        map: {
          entries: [
            { key: 'A', value: 'inDeg=0' },
            { key: 'B', value: 'inDeg=0' },
            { key: 'C', value: 'inDeg=2' },
            { key: 'D', value: 'inDeg=1' },
            { key: 'E', value: 'inDeg=1' },
          ],
          label: 'inDegree (входящие)',
        },
      },
      ops: 0,
      hint: 'inDegree[v] = сколько курсов надо пройти ПЕРЕД v. Нулевые — можно начать прямо сейчас.',
    },
    {
      line: 12,
      action: 'A и B имеют inDegree=0 → добавляем в очередь. Это курсы без предварительных требований.',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.1, y: 0.3, state: 'queued' },
            { id: 'B', label: 'B', x: 0.1, y: 0.7, state: 'queued' },
            { id: 'C', label: 'C', x: 0.45, y: 0.3 },
            { id: 'D', label: 'D', x: 0.8, y: 0.3 },
            { id: 'E', label: 'E', x: 0.45, y: 0.7 },
          ],
          edges: [
            { from: 'A', to: 'C', directed: true },
            { from: 'B', to: 'C', directed: true },
            { from: 'C', to: 'D', directed: true },
            { from: 'B', to: 'E', directed: true },
          ],
        },
        queue: { items: [{ value: 'A', state: 'queued' }, { value: 'B', state: 'queued' }] },
        secondaryArray: { cells: [], label: 'order' },
      },
      ops: 2,
    },
    {
      line: 16,
      action: 'Берём A. order=[A]. Уменьшаем inDegree[C]: 2→1. Не 0, в очередь не кладём.',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.1, y: 0.3, state: 'visited' },
            { id: 'B', label: 'B', x: 0.1, y: 0.7, state: 'queued' },
            { id: 'C', label: 'C', x: 0.45, y: 0.3, state: 'compared' },
            { id: 'D', label: 'D', x: 0.8, y: 0.3 },
            { id: 'E', label: 'E', x: 0.45, y: 0.7 },
          ],
          edges: [
            { from: 'A', to: 'C', directed: true, state: 'compared' },
            { from: 'B', to: 'C', directed: true },
            { from: 'C', to: 'D', directed: true },
            { from: 'B', to: 'E', directed: true },
          ],
        },
        queue: { items: [{ value: 'B', state: 'queued' }] },
        secondaryArray: { cells: [{ value: 'A', state: 'matched' }], label: 'order' },
        map: {
          entries: [
            { key: 'C', value: 'inDeg=1', state: 'compared' },
            { key: 'D', value: 'inDeg=1' },
            { key: 'E', value: 'inDeg=1' },
          ],
        },
      },
      ops: 3,
    },
    {
      line: 16,
      action: 'Берём B. order=[A,B]. inDegree[C]: 1→0 (→ в очередь!). inDegree[E]: 1→0 (→ в очередь!).',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.1, y: 0.3, state: 'visited' },
            { id: 'B', label: 'B', x: 0.1, y: 0.7, state: 'visited' },
            { id: 'C', label: 'C', x: 0.45, y: 0.3, state: 'queued' },
            { id: 'D', label: 'D', x: 0.8, y: 0.3 },
            { id: 'E', label: 'E', x: 0.45, y: 0.7, state: 'queued' },
          ],
          edges: [
            { from: 'A', to: 'C', directed: true, state: 'matched' },
            { from: 'B', to: 'C', directed: true, state: 'compared' },
            { from: 'C', to: 'D', directed: true },
            { from: 'B', to: 'E', directed: true, state: 'compared' },
          ],
        },
        queue: { items: [{ value: 'C', state: 'queued' }, { value: 'E', state: 'queued' }] },
        secondaryArray: { cells: [{ value: 'A' }, { value: 'B', state: 'matched' }], label: 'order' },
      },
      ops: 5,
    },
    {
      line: 20,
      action: 'Берём C → order=[A,B,C], inDeg[D]: 1→0. Берём E → [A,B,C,E]. Берём D → [A,B,C,E,D]. Готово!',
      scene: {
        graph: {
          nodes: [
            { id: 'A', label: 'A', x: 0.1, y: 0.3, state: 'matched' },
            { id: 'B', label: 'B', x: 0.1, y: 0.7, state: 'matched' },
            { id: 'C', label: 'C', x: 0.45, y: 0.3, state: 'matched' },
            { id: 'D', label: 'D', x: 0.8, y: 0.3, state: 'matched' },
            { id: 'E', label: 'E', x: 0.45, y: 0.7, state: 'matched' },
          ],
          edges: [
            { from: 'A', to: 'C', directed: true, state: 'matched' },
            { from: 'B', to: 'C', directed: true, state: 'matched' },
            { from: 'C', to: 'D', directed: true, state: 'matched' },
            { from: 'B', to: 'E', directed: true, state: 'matched' },
          ],
        },
        secondaryArray: {
          cells: [
            { value: 'A', state: 'matched' }, { value: 'B', state: 'matched' },
            { value: 'C', state: 'matched' }, { value: 'E', state: 'matched' },
            { value: 'D', state: 'matched' },
          ],
          label: 'order (правильный порядок курсов)',
        },
        cards: [
          {
            title: '📦 npm install',
            body: 'Именно топологическую сортировку использует npm для установки пакетов. A зависит от B,C → устанавливает B и C первыми, потом A.',
            tag: 'real use case',
          },
        ],
      },
      ops: 8,
      hint: 'Если после алгоритма order.length < V — в графе есть цикл, топологическая сортировка невозможна.',
    },
  ],
  pitfalls: [
    'Если grafo содержит цикл — топологическая сортировка невозможна (курсы взаимозависимы). Проверяй: order.length === V.',
    'Топологический порядок НЕ единственный. A,B,C,E,D и B,A,C,E,D — оба валидны.',
    'DFS-вариант: обходишь весь граф DFS, добавляешь вершину в СТЕК при выходе. Потом переворачиваешь. Тоже O(V+E).',
  ],
}

export const GRAPH_CASES: CaseStudy[] = [graphIntroCase, graphBfsCase, graphDfsCase, dijkstraCase, topoSortCase]

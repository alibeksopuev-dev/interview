import type { CaseStudy, TreeNode, CellState } from './types'

// Same example tree for all traversals:
//        1
//       / \
//      2   3
//     / \   \
//    4   5   6
//
// Pre-order  (root, left, right):   1, 2, 4, 5, 3, 6
// In-order   (left, root, right):   4, 2, 5, 1, 3, 6
// Post-order (left, right, root):   4, 5, 2, 6, 3, 1
// BFS (level order):                1, 2, 3, 4, 5, 6

// Helper to build a fresh tree with a per-node state map
const buildTree = (states: Record<string, CellState>): TreeNode => ({
  id: '1',
  value: 1,
  state: states['1'] ?? 'idle',
  children: [
    {
      id: '2',
      value: 2,
      state: states['2'] ?? 'idle',
      children: [
        { id: '4', value: 4, state: states['4'] ?? 'idle' },
        { id: '5', value: 5, state: states['5'] ?? 'idle' },
      ],
    },
    {
      id: '3',
      value: 3,
      state: states['3'] ?? 'idle',
      children: [{ id: '6', value: 6, state: states['6'] ?? 'idle' }],
    },
  ],
})

// ─── DFS Pre-order ────────────────────────────────────────────────

const dfsPreorderCase: CaseStudy = {
  id: 'dfs-preorder',
  topic: 'Деревья',
  title: 'DFS — обход в глубину (pre-order)',
  complexity: 'O(n) время / O(h) память',
  about:
    'DFS (Depth-First Search) — обход «в глубину». Идём по дереву как можно глубже, пока есть дети. Pre-order: сначала записываем УЗЕЛ, потом идём в левое поддерево, потом в правое.',
  whenToUse:
    'Копирование дерева, сериализация JSON, выгрузка структуры файлов «сначала папка, потом её содержимое».',
  analogy:
    'Представь, что ты исследуешь пещеру с развилками. На каждой развилке ты помечаешь её и идёшь сначала в левый туннель до самого конца, потом возвращаешься и идёшь в правый. Это и есть DFS.',
  code: [
    'function preorder(node, result = []) {',
    '  if (!node) return result;',
    '  result.push(node.value);   // 1. узел',
    '  preorder(node.left, result);  // 2. левое поддерево',
    '  preorder(node.right, result); // 3. правое поддерево',
    '  return result;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Стартуем с корня (1). Это первый вызов preorder.',
      scene: {
        tree: buildTree({ '1': 'active' }),
        callStack: { items: [{ value: 'preorder(1)', state: 'stacked' }], label: 'call stack' },
        secondaryArray: { cells: [], label: 'result' },
      },
      ops: 1,
      hint: 'Call Stack — это то, как JS отслеживает вложенные вызовы рекурсии.',
    },
    {
      line: 3,
      action: 'Записываем значение узла 1 в результат. (pre-order = «узел ДО детей»)',
      scene: {
        tree: buildTree({ '1': 'visited' }),
        callStack: { items: [{ value: 'preorder(1)', state: 'stacked' }] },
        secondaryArray: { cells: [{ value: 1, state: 'merged' }], label: 'result' },
      },
      ops: 2,
    },
    {
      line: 4,
      action: 'Идём в ЛЕВОГО ребёнка узла 1 → это узел 2. Новый вызов кладётся на call stack.',
      scene: {
        tree: buildTree({ '1': 'visited', '2': 'active' }),
        callStack: {
          items: [
            { value: 'preorder(1)', state: 'idle' },
            { value: 'preorder(2)', state: 'stacked' },
          ],
        },
        secondaryArray: { cells: [{ value: 1 }], label: 'result' },
      },
      ops: 3,
    },
    {
      line: 3,
      action: 'Записываем 2.',
      scene: {
        tree: buildTree({ '1': 'visited', '2': 'visited' }),
        callStack: {
          items: [
            { value: 'preorder(1)', state: 'idle' },
            { value: 'preorder(2)', state: 'stacked' },
          ],
        },
        secondaryArray: { cells: [{ value: 1 }, { value: 2, state: 'merged' }], label: 'result' },
      },
      ops: 4,
    },
    {
      line: 4,
      action: 'Идём в левого ребёнка узла 2 → узел 4. Глубже не идём (нет детей), но сначала запишем 4.',
      scene: {
        tree: buildTree({ '1': 'visited', '2': 'visited', '4': 'active' }),
        callStack: {
          items: [
            { value: 'preorder(1)' },
            { value: 'preorder(2)' },
            { value: 'preorder(4)', state: 'stacked' },
          ],
        },
        secondaryArray: { cells: [{ value: 1 }, { value: 2 }], label: 'result' },
      },
      ops: 5,
    },
    {
      line: 3,
      action: 'Записали 4. У 4 нет детей — функция возвращается, кадр снимается со стека.',
      scene: {
        tree: buildTree({ '1': 'visited', '2': 'visited', '4': 'visited' }),
        callStack: {
          items: [{ value: 'preorder(1)' }, { value: 'preorder(2)', state: 'stacked' }],
        },
        secondaryArray: {
          cells: [{ value: 1 }, { value: 2 }, { value: 4, state: 'merged' }],
          label: 'result',
        },
      },
      ops: 6,
      hint: 'Возврат из рекурсии = снятие кадра со стека вызовов.',
    },
    {
      line: 5,
      action: 'Теперь идём в ПРАВОГО ребёнка узла 2 → узел 5. Записываем 5.',
      scene: {
        tree: buildTree({ '1': 'visited', '2': 'visited', '4': 'visited', '5': 'visited' }),
        callStack: {
          items: [{ value: 'preorder(1)' }, { value: 'preorder(2)' }, { value: 'preorder(5)', state: 'stacked' }],
        },
        secondaryArray: {
          cells: [{ value: 1 }, { value: 2 }, { value: 4 }, { value: 5, state: 'merged' }],
          label: 'result',
        },
      },
      ops: 8,
    },
    {
      line: 5,
      action: 'Левое поддерево узла 1 закончено. Снимаемся со стека до узла 1 и идём в его правого ребёнка → 3.',
      scene: {
        tree: buildTree({ '1': 'visited', '2': 'visited', '4': 'visited', '5': 'visited', '3': 'active' }),
        callStack: {
          items: [{ value: 'preorder(1)' }, { value: 'preorder(3)', state: 'stacked' }],
        },
        secondaryArray: {
          cells: [{ value: 1 }, { value: 2 }, { value: 4 }, { value: 5 }],
          label: 'result',
        },
      },
      ops: 9,
    },
    {
      line: 3,
      action: 'Записываем 3, потом идём в его правого ребёнка 6 и записываем 6.',
      scene: {
        tree: buildTree({
          '1': 'visited',
          '2': 'visited',
          '4': 'visited',
          '5': 'visited',
          '3': 'visited',
          '6': 'visited',
        }),
        callStack: { items: [{ value: 'preorder(1)' }] },
        secondaryArray: {
          cells: [
            { value: 1 },
            { value: 2 },
            { value: 4 },
            { value: 5 },
            { value: 3, state: 'merged' },
            { value: 6, state: 'merged' },
          ],
          label: 'result',
        },
      },
      ops: 12,
    },
    {
      line: 6,
      action: 'Все узлы обойдены. Стек пуст. Возвращаем [1,2,4,5,3,6].',
      scene: {
        tree: buildTree({
          '1': 'matched',
          '2': 'matched',
          '4': 'matched',
          '5': 'matched',
          '3': 'matched',
          '6': 'matched',
        }),
        callStack: { items: [] },
        secondaryArray: {
          cells: [
            { value: 1, state: 'matched' },
            { value: 2, state: 'matched' },
            { value: 4, state: 'matched' },
            { value: 5, state: 'matched' },
            { value: 3, state: 'matched' },
            { value: 6, state: 'matched' },
          ],
          label: 'result',
        },
      },
      ops: 12,
      hint: 'Время O(n) — каждый узел посещаем 1 раз. Память O(h) — глубина рекурсии = высота дерева.',
    },
  ],
  pitfalls: [
    'Не забывай условие `if (!node) return` — иначе на пустой ветке будет TypeError.',
    'Для очень глубоких деревьев (h ~ 10000) рекурсия может вызвать stack overflow. Решение — итеративная версия со своим стеком.',
    'Порядок узел/левый/правый — это pre-order. Поменяй порядок строк → получишь in-order или post-order.',
  ],
  source: 'algo: tree traversal',
}

// ─── DFS In-order ─────────────────────────────────────────────────

const dfsInorderCase: CaseStudy = {
  id: 'dfs-inorder',
  topic: 'Деревья',
  title: 'DFS — обход in-order',
  complexity: 'O(n) время / O(h) память',
  about:
    'In-order: сначала идём в ЛЕВОЕ поддерево, потом записываем узел, потом идём в правое. Для бинарного дерева поиска (BST) это даёт значения в ОТСОРТИРОВАННОМ порядке.',
  whenToUse:
    'Получить отсортированный список из BST. Найти k-й по величине элемент. Проверить, что дерево — корректный BST.',
  analogy:
    'Представь книжный стеллаж, где книги слева — алфавитно раньше. Чтобы прочитать названия по алфавиту, ты сначала идёшь в самый левый угол, потом возвращаешься, читаешь центр, и идёшь направо.',
  code: [
    'function inorder(node, result = []) {',
    '  if (!node) return result;',
    '  inorder(node.left, result);   // 1. левое',
    '  result.push(node.value);      // 2. узел',
    '  inorder(node.right, result);  // 3. правое',
    '  return result;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Стартуем с корня 1. Но НЕ записываем его сразу — сначала надо обойти левое поддерево.',
      scene: {
        tree: buildTree({ '1': 'active' }),
        callStack: { items: [{ value: 'inorder(1)', state: 'stacked' }] },
        secondaryArray: { cells: [], label: 'result' },
      },
      ops: 1,
    },
    {
      line: 3,
      action: 'Идём в левого ребёнка 1 → узел 2. У него тоже есть левый ребёнок — идём ещё глубже.',
      scene: {
        tree: buildTree({ '1': 'active', '2': 'active' }),
        callStack: {
          items: [{ value: 'inorder(1)' }, { value: 'inorder(2)', state: 'stacked' }],
        },
        secondaryArray: { cells: [] },
      },
      ops: 2,
    },
    {
      line: 3,
      action: 'Идём в узел 4. У 4 нет детей. Можно записать 4!',
      scene: {
        tree: buildTree({ '1': 'active', '2': 'active', '4': 'visited' }),
        callStack: {
          items: [
            { value: 'inorder(1)' },
            { value: 'inorder(2)' },
            { value: 'inorder(4)', state: 'stacked' },
          ],
        },
        secondaryArray: { cells: [{ value: 4, state: 'merged' }], label: 'result' },
      },
      ops: 4,
      hint: 'Левая ветка пуста → можно «сесть в центр» = записать сам узел.',
    },
    {
      line: 4,
      action: 'Возвращаемся к узлу 2. Левое поддерево обойдено → записываем 2. Потом пойдём в правое.',
      scene: {
        tree: buildTree({ '1': 'active', '2': 'visited', '4': 'visited' }),
        callStack: { items: [{ value: 'inorder(1)' }, { value: 'inorder(2)', state: 'stacked' }] },
        secondaryArray: {
          cells: [{ value: 4 }, { value: 2, state: 'merged' }],
          label: 'result',
        },
      },
      ops: 5,
    },
    {
      line: 5,
      action: 'Идём в правого ребёнка 2 → узел 5. У него нет детей, записываем 5.',
      scene: {
        tree: buildTree({ '1': 'active', '2': 'visited', '4': 'visited', '5': 'visited' }),
        callStack: { items: [{ value: 'inorder(1)' }, { value: 'inorder(2)' }, { value: 'inorder(5)', state: 'stacked' }] },
        secondaryArray: {
          cells: [{ value: 4 }, { value: 2 }, { value: 5, state: 'merged' }],
          label: 'result',
        },
      },
      ops: 7,
    },
    {
      line: 4,
      action: 'Левое поддерево корня 1 полностью обойдено → записываем 1.',
      scene: {
        tree: buildTree({ '1': 'visited', '2': 'visited', '4': 'visited', '5': 'visited' }),
        callStack: { items: [{ value: 'inorder(1)', state: 'stacked' }] },
        secondaryArray: {
          cells: [{ value: 4 }, { value: 2 }, { value: 5 }, { value: 1, state: 'merged' }],
          label: 'result',
        },
      },
      ops: 8,
    },
    {
      line: 5,
      action: 'Правое поддерево корня: идём в 3, потом в его правого ребёнка 6. У 3 нет левого, записываем 3 → потом 6.',
      scene: {
        tree: buildTree({
          '1': 'visited',
          '2': 'visited',
          '4': 'visited',
          '5': 'visited',
          '3': 'visited',
          '6': 'visited',
        }),
        callStack: { items: [{ value: 'inorder(1)' }] },
        secondaryArray: {
          cells: [
            { value: 4 },
            { value: 2 },
            { value: 5 },
            { value: 1 },
            { value: 3, state: 'merged' },
            { value: 6, state: 'merged' },
          ],
          label: 'result',
        },
      },
      ops: 11,
    },
    {
      line: 6,
      action: 'Готово: [4, 2, 5, 1, 3, 6]. Заметь — на BST это был бы отсортированный список!',
      scene: {
        tree: buildTree({
          '1': 'matched',
          '2': 'matched',
          '4': 'matched',
          '5': 'matched',
          '3': 'matched',
          '6': 'matched',
        }),
        secondaryArray: {
          cells: [
            { value: 4, state: 'matched' },
            { value: 2, state: 'matched' },
            { value: 5, state: 'matched' },
            { value: 1, state: 'matched' },
            { value: 3, state: 'matched' },
            { value: 6, state: 'matched' },
          ],
          label: 'result',
        },
      },
      ops: 11,
      hint: 'In-order BST → отсортированный массив. Это магия бинарного дерева поиска.',
    },
  ],
  pitfalls: [
    'In-order имеет смысл в основном для бинарных деревьев. Для деревьев с >2 детей порядок неоднозначен.',
    'На небинарном-поисковом дереве in-order НЕ даст сортировку — только если это именно BST.',
    'Часто путают: «in-order» ≠ «алфавитный». Это просто порядок «лево-узел-право».',
  ],
}

// ─── BFS Level-order ──────────────────────────────────────────────

const bfsCase: CaseStudy = {
  id: 'bfs',
  topic: 'Деревья',
  title: 'BFS — обход в ширину (по уровням)',
  complexity: 'O(n) время / O(w) память',
  about:
    'BFS (Breadth-First Search) — обход «в ширину». Сначала весь верхний уровень, потом следующий, потом ещё ниже. Для этого нужна ОЧЕРЕДЬ (FIFO).',
  whenToUse:
    'Найти КРАТЧАЙШИЙ путь в графе (по числу шагов). Обход страниц по «связям». Поиск ближайших друзей в соцсети.',
  analogy:
    'Представь, что ты раздаёшь листовки в офисе по этажам. Сначала первый этаж — всем. Потом весь второй. Потом весь третий. Не прыгаешь между этажами — это и есть BFS.',
  code: [
    'function bfs(root) {',
    '  const result = [];',
    '  const queue = [root];          // очередь FIFO',
    '  while (queue.length > 0) {',
    '    const node = queue.shift();  // забираем из начала',
    '    result.push(node.value);',
    '    if (node.left)  queue.push(node.left);',
    '    if (node.right) queue.push(node.right);',
    '  }',
    '  return result;',
    '}',
  ],
  steps: [
    {
      line: 3,
      action: 'Кладём корень 1 в очередь. Очередь = [1].',
      scene: {
        tree: buildTree({ '1': 'queued' }),
        queue: { items: [{ value: 1, state: 'queued' }], label: 'очередь (FIFO)' },
        secondaryArray: { cells: [], label: 'result' },
      },
      ops: 1,
      hint: 'BFS использует ОЧЕРЕДЬ, а не стек. В этом — главная разница с DFS.',
    },
    {
      line: 5,
      action: 'Забираем 1 из НАЧАЛА очереди. Записываем в результат.',
      scene: {
        tree: buildTree({ '1': 'visited' }),
        queue: { items: [], label: 'очередь' },
        secondaryArray: { cells: [{ value: 1, state: 'merged' }], label: 'result' },
      },
      ops: 2,
    },
    {
      line: 7,
      action: 'У 1 есть дети 2 и 3 → добавляем их в КОНЕЦ очереди. Очередь = [2, 3].',
      scene: {
        tree: buildTree({ '1': 'visited', '2': 'queued', '3': 'queued' }),
        queue: {
          items: [
            { value: 2, state: 'queued' },
            { value: 3, state: 'queued' },
          ],
        },
        secondaryArray: { cells: [{ value: 1 }], label: 'result' },
      },
      ops: 3,
    },
    {
      line: 5,
      action: 'Забираем 2 из начала. Записываем 2. Добавляем его детей 4 и 5 в конец.',
      scene: {
        tree: buildTree({ '1': 'visited', '2': 'visited', '3': 'queued', '4': 'queued', '5': 'queued' }),
        queue: {
          items: [
            { value: 3, state: 'queued' },
            { value: 4, state: 'queued' },
            { value: 5, state: 'queued' },
          ],
        },
        secondaryArray: { cells: [{ value: 1 }, { value: 2, state: 'merged' }], label: 'result' },
      },
      ops: 5,
      hint: 'Заметь: 3 идёт ПЕРЕД 4 и 5, потому что 3 уже была в очереди. FIFO!',
    },
    {
      line: 5,
      action: 'Забираем 3. Записываем 3. Добавляем 6 в конец. Очередь = [4, 5, 6].',
      scene: {
        tree: buildTree({
          '1': 'visited',
          '2': 'visited',
          '3': 'visited',
          '4': 'queued',
          '5': 'queued',
          '6': 'queued',
        }),
        queue: {
          items: [
            { value: 4, state: 'queued' },
            { value: 5, state: 'queued' },
            { value: 6, state: 'queued' },
          ],
        },
        secondaryArray: {
          cells: [{ value: 1 }, { value: 2 }, { value: 3, state: 'merged' }],
          label: 'result',
        },
      },
      ops: 7,
    },
    {
      line: 5,
      action: 'Забираем 4, потом 5, потом 6. У них нет детей. Очередь опустеет.',
      scene: {
        tree: buildTree({
          '1': 'visited',
          '2': 'visited',
          '3': 'visited',
          '4': 'visited',
          '5': 'visited',
          '6': 'visited',
        }),
        queue: { items: [] },
        secondaryArray: {
          cells: [
            { value: 1 },
            { value: 2 },
            { value: 3 },
            { value: 4, state: 'merged' },
            { value: 5, state: 'merged' },
            { value: 6, state: 'merged' },
          ],
          label: 'result',
        },
      },
      ops: 10,
    },
    {
      line: 10,
      action: 'Готово: [1, 2, 3, 4, 5, 6] — порядок строго по уровням.',
      scene: {
        tree: buildTree({
          '1': 'matched',
          '2': 'matched',
          '3': 'matched',
          '4': 'matched',
          '5': 'matched',
          '6': 'matched',
        }),
        secondaryArray: {
          cells: [
            { value: 1, state: 'matched' },
            { value: 2, state: 'matched' },
            { value: 3, state: 'matched' },
            { value: 4, state: 'matched' },
            { value: 5, state: 'matched' },
            { value: 6, state: 'matched' },
          ],
          label: 'result',
        },
      },
      ops: 10,
      hint: 'BFS = очередь. DFS = стек (или рекурсия). Запомни это намертво.',
    },
  ],
  pitfalls: [
    'queue.shift() — это O(n) на массиве! Для больших деревьев используй настоящую очередь (двусвязный список или указатель head).',
    'Память BFS — O(ширины уровня), а не O(глубины). На «широких» деревьях BFS может съесть больше памяти, чем DFS.',
    'Если задача — «найти КРАТЧАЙШИЙ путь», почти всегда нужен BFS, а не DFS.',
  ],
}

export const TREE_CASES: CaseStudy[] = [dfsPreorderCase, dfsInorderCase, bfsCase]

import type { CaseStudy } from './types'

// ─── Array ────────────────────────────────────────────────────────

const arrayCase: CaseStudy = {
  id: 'ds-array',
  topic: 'Структуры данных',
  title: 'Массив (Array)',
  complexity: 'Доступ O(1) / Поиск O(n)',
  about:
    'Массив — базовая структура данных. Элементы хранятся в памяти ПОДРЯД. Благодаря этому доступ по индексу мгновенный (O(1)), но вставка/удаление в середину требует сдвига всех соседей.',
  whenToUse:
    'Когда индекс элемента известен и тебе нужен быстрый доступ. Случайный доступ, фиксированный размер, итерация по порядку.',
  analogy:
    'Стеллаж с пронумерованными ящиками. Ящик №7 — сразу берёшь. Но чтобы вставить ящик между №3 и №4, надо сдвинуть все остальные.',
  code: [
    'const arr = [10, 20, 30, 40, 50];',
    '',
    '// O(1) — доступ по индексу',
    'arr[2];          // → 30',
    '',
    '// O(1) amortized — push в конец',
    'arr.push(60);',
    '',
    '// O(n) — вставка в середину (сдвиг!)',
    'arr.splice(2, 0, 99);',
    '',
    '// O(n) — поиск',
    'arr.indexOf(40); // → 3',
  ],
  steps: [
    {
      line: 1,
      action: 'Массив создан. Все элементы лежат ПОДРЯД в памяти — это главное свойство массива.',
      scene: {
        array: {
          cells: [10, 20, 30, 40, 50].map((v, i) => ({ value: v, state: 'idle', label: `[${i}]` })),
          label: 'arr (адреса в памяти последовательные)',
        },
        cards: [
          {
            title: '📦 Массив в памяти',
            body: 'Каждая ячейка = 8 байт. arr[i] = базовый_адрес + i × 8. Поэтому доступ всегда O(1) — одна арифметика.',
            complexity: 'access: O(1)',
            tag: 'ключевое свойство',
          },
        ],
      },
      ops: 0,
      hint: 'Смежное расположение в памяти — именно это делает доступ по индексу мгновенным.',
    },
    {
      line: 4,
      action: 'arr[2] — берём элемент по индексу. Одна операция вычисления адреса. O(1).',
      scene: {
        array: {
          cells: [10, 20, 30, 40, 50].map((v, i) => ({
            value: v,
            state: i === 2 ? 'matched' : 'idle',
            label: i === 2 ? '[2]✓' : `[${i}]`,
          })),
        },
        vars: { 'arr[2]': 30, сложность: 'O(1)' },
      },
      ops: 1,
    },
    {
      line: 7,
      action: 'push(60) — добавляем в КОНЕЦ. Не нужно сдвигать никого. Амортизированный O(1).',
      scene: {
        array: {
          cells: [10, 20, 30, 40, 50, 60].map((v, i) => ({
            value: v,
            state: i === 5 ? 'merged' : 'idle',
            label: i === 5 ? 'NEW' : `[${i}]`,
          })),
        },
        vars: { 'push(60)': 'O(1) amortized' },
      },
      ops: 2,
      hint: '"Амортизированный O(1)": иногда массив расширяется (×2) — это дорого, но в среднем на элемент всё равно O(1).',
    },
    {
      line: 10,
      action: 'splice(2, 0, 99) — вставка в середину. Нужно сдвинуть все элементы правее. O(n)!',
      scene: {
        array: {
          cells: [10, 20, 99, 30, 40, 50, 60].map((v, i) => ({
            value: v,
            state: i === 2 ? 'compared' : i > 2 ? 'window' : 'idle',
            label: i === 2 ? 'NEW' : i > 2 ? '←сдвиг' : `[${i}]`,
          })),
        },
        vars: { 'splice(2,0,99)': 'O(n) — сдвинули 4 элемента' },
      },
      ops: 6,
      hint: 'Именно поэтому в горячих местах кода избегают вставки в начало/середину массива.',
    },
    {
      line: 13,
      action: 'indexOf(40) — ищем элемент. Приходится смотреть на каждый. O(n).',
      scene: {
        array: {
          cells: [10, 20, 99, 30, 40, 50, 60].map((v, i) => ({
            value: v,
            state: v === 40 ? 'matched' : i < 4 ? 'discarded' : 'idle',
          })),
        },
        vars: { 'indexOf(40)': 4 },
        cards: [
          {
            title: '📊 Сложность массива',
            body: 'Доступ: O(1) | Поиск: O(n) | Push в конец: O(1)* | Вставка в середину: O(n) | Удаление: O(n)',
            tag: 'шпаргалка',
          },
        ],
      },
      ops: 11,
    },
  ],
  pitfalls: [
    'Array в JS — объект, не настоящий массив C. Дырки (sparse array) ломают оптимизацию V8.',
    'Не используй unshift() в горячем цикле — это O(n) каждый раз из-за сдвига всех элементов.',
    'TypedArray (Uint8Array, Float32Array) — настоящие массивы в памяти. В 5-10× быстрее для чисел.',
  ],
}

// ─── Heap / Priority Queue ────────────────────────────────────────

const heapCase: CaseStudy = {
  id: 'ds-heap',
  topic: 'Структуры данных',
  title: 'Куча (Heap / Priority Queue)',
  complexity: 'peek O(1) / push O(log n) / pop O(log n)',
  about:
    'Куча — дерево, где родитель ВСЕГДА больше (max-heap) или меньше (min-heap) детей. В массивном виде. Позволяет мгновенно получить максимум/минимум и эффективно добавлять/удалять элементы.',
  whenToUse:
    'Планировщик задач (высокоприоритетные — первые). Алгоритм Дейкстры. Медиана потока. Merge k sorted lists. Топ-K элементов.',
  analogy:
    'Приёмный покой в больнице: новый пациент встаёт в очередь, но всегда первым берут самого тяжёлого. Это и есть Priority Queue.',
  code: [
    '// Min-Heap через массив',
    '// parent(i) = (i-1)>>1',
    '// left(i)   = 2*i + 1',
    '// right(i)  = 2*i + 2',
    '',
    'class MinHeap {',
    '  heap = [];',
    '  peek()  { return this.heap[0]; }     // O(1)',
    '  push(v) { this.heap.push(v);         // O(log n)',
    '             this._bubbleUp(); }',
    '  pop()   { /* swap, pop, sinkDown */  // O(log n)',
    '             return this._sinkDown(); }',
    '}',
  ],
  steps: [
    {
      line: 6,
      action: 'Min-Heap — дерево в виде массива. Минимум ВСЕГДА на вершине (индекс 0).',
      scene: {
        tree: {
          id: '1',
          value: 1,
          state: 'matched',
          children: [
            {
              id: '2',
              value: 3,
              state: 'idle',
              children: [
                { id: '4', value: 7, state: 'idle' },
                { id: '5', value: 5, state: 'idle' },
              ],
            },
            {
              id: '3',
              value: 4,
              state: 'idle',
              children: [{ id: '6', value: 8, state: 'idle' }],
            },
          ],
        },
        array: {
          cells: [1, 3, 4, 7, 5, 8].map((v, i) => ({
            value: v,
            state: i === 0 ? 'matched' : 'idle',
            label: i === 0 ? 'heap[0]' : `heap[${i}]`,
          })),
          label: 'heap (в виде массива)',
        },
        cards: [
          {
            title: '🔑 Свойство кучи',
            body: 'parent(i) ≤ children(i) для min-heap. Минимум ВСЕГДА heap[0]. Никакой сортировки нет — только это гарантируется.',
            tag: 'heap property',
          },
        ],
      },
      ops: 0,
      hint: 'Куча ≠ отсортированный массив. Она лишь гарантирует, что родитель ≤ детей.',
    },
    {
      line: 8,
      action: 'peek() — минимум всегда heap[0]. Одна операция. O(1).',
      scene: {
        array: {
          cells: [1, 3, 4, 7, 5, 8].map((v, i) => ({
            value: v,
            state: i === 0 ? 'matched' : 'idle',
          })),
        },
        vars: { 'peek()': 1, сложность: 'O(1)' },
      },
      ops: 1,
    },
    {
      line: 9,
      action: 'push(2) — добавляем в конец массива и "всплываем" вверх (bubble up), пока нарушено свойство кучи.',
      scene: {
        array: {
          cells: [1, 3, 4, 7, 5, 8, 2].map((v, i) => ({
            value: v,
            state: i === 6 ? 'compared' : 'idle',
            label: i === 6 ? 'NEW' : undefined,
          })),
        },
        vars: { 'push(2)': 'bubble up начат' },
      },
      ops: 2,
    },
    {
      line: 9,
      action: '2 < parent(6) = heap[2] = 4 → меняем местами. 2 < heap[0]=1? Нет. Стоп. Куча восстановлена.',
      scene: {
        array: {
          cells: [1, 3, 2, 7, 5, 8, 4].map((v, i) => ({
            value: v,
            state: i === 2 ? 'merged' : i === 6 ? 'discarded' : 'idle',
          })),
        },
        vars: { 'push(2)': 'O(log n) = 1 своп' },
        cards: [
          {
            title: '📤 Bubble Up',
            body: 'Новый элемент поднимается вверх, пока меньше родителя. Максимум log₂(n) шагов = высота дерева.',
            complexity: 'O(log n)',
          },
        ],
      },
      ops: 4,
      hint: 'log₂(7) ≈ 3 — это максимум шагов. Не важно, сколько элементов в куче — высота растёт медленно.',
    },
    {
      line: 11,
      action: 'pop() — берём минимум (heap[0]=1). Кладём последний элемент на его место, затем "тонем" вниз (sink down).',
      scene: {
        array: {
          cells: [4, 3, 2, 7, 5, 8].map((v, i) => ({
            value: v,
            state: i === 0 ? 'compared' : 'idle',
            label: i === 0 ? 'sink→' : undefined,
          })),
        },
        vars: { 'pop()': 'returned 1', 'теперь heap[0]': 4 },
      },
      ops: 5,
    },
    {
      line: 11,
      action: 'Sink down: 4 > min(3, 2)=2 → меняем с 2. 4 > min(8,_)? Нет. Куча восстановлена.',
      scene: {
        array: {
          cells: [2, 3, 4, 7, 5, 8].map((v, i) => ({
            value: v,
            state: i === 0 ? 'matched' : i === 2 ? 'merged' : 'idle',
          })),
        },
        vars: { 'pop()': 'O(log n)', 'новый min': 2 },
        cards: [
          {
            title: '📊 Реальные применения',
            body: '• Dijkstra — приоритетная очередь вершин\n• Task scheduler — высокоприоритетные задачи вперёд\n• Медиана потока — два heap\n• Merge k sorted arrays',
            tag: 'use cases',
          },
        ],
      },
      ops: 7,
    },
  ],
  pitfalls: [
    'В JS нет встроенного Heap — нужно реализовывать самому или использовать библиотеку (например, @datastructures-js/heap).',
    'Heap ≠ отсортированный массив. Если нужен полный порядок — сортируй. Если только min/max — используй heap.',
    'Heap sort: строишь кучу O(n), потом n раз pop O(log n) → сортировка O(n log n) на месте, O(1) памяти.',
  ],
}

// ─── BST ──────────────────────────────────────────────────────────

const bstCase: CaseStudy = {
  id: 'ds-bst',
  topic: 'Структуры данных',
  title: 'Двоичное дерево поиска (BST)',
  complexity: 'Поиск/вставка/удаление O(log n) avg / O(n) worst',
  about:
    'BST — бинарное дерево, где для каждого узла: ВСЕ в левом поддереве < узел < ВСЕ в правом. Это свойство позволяет искать как в бинарном поиске, но в динамической структуре.',
  whenToUse:
    'Когда нужны быстрые вставка + поиск + удаление + итерация по порядку. Основа: множества, словари, базы данных (B-tree).',
  analogy:
    'Библиотека с правилом: «в левый ряд — авторы на A..M, в правый — N..Z». В каждом ряду то же правило. Искать книгу — как бинарный поиск по рядам.',
  code: [
    'function insert(root, val) {',
    '  if (!root) return { val, left: null, right: null };',
    '  if (val < root.val)',
    '    root.left = insert(root.left, val);',
    '  else',
    '    root.right = insert(root.right, val);',
    '  return root;',
    '}',
    '',
    'function search(root, val) {',
    '  if (!root || root.val === val) return root;',
    '  if (val < root.val) return search(root.left, val);',
    '  return search(root.right, val);',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'BST с корнем 5. Слева — меньшие, справа — большие. Поищем 7.',
      scene: {
        tree: {
          id: '5',
          value: 5,
          state: 'active',
          children: [
            {
              id: '3',
              value: 3,
              state: 'idle',
              children: [
                { id: '1', value: 1, state: 'idle' },
                { id: '4', value: 4, state: 'idle' },
              ],
            },
            {
              id: '7',
              value: 7,
              state: 'idle',
              children: [
                { id: '6', value: 6, state: 'idle' },
                { id: '9', value: 9, state: 'idle' },
              ],
            },
          ],
        },
        vars: { 'ищем': 7 },
        cards: [
          {
            title: '🔑 Инвариант BST',
            body: 'left.val < node.val < right.val — для КАЖДОГО узла. Это позволяет на каждом шаге отбрасывать половину дерева.',
            tag: 'BST property',
          },
        ],
      },
      ops: 0,
    },
    {
      line: 11,
      action: 'root=5. 7 > 5 → идём в правое поддерево. Левое (все < 5) отброшено навсегда.',
      scene: {
        tree: {
          id: '5',
          value: 5,
          state: 'compared',
          children: [
            { id: '3', value: 3, state: 'discarded', children: [{ id: '1', value: 1, state: 'discarded' }, { id: '4', value: 4, state: 'discarded' }] },
            { id: '7', value: 7, state: 'active', children: [{ id: '6', value: 6, state: 'idle' }, { id: '9', value: 9, state: 'idle' }] },
          ],
        },
        vars: { '7 > 5': '→ идём вправо' },
      },
      ops: 1,
      hint: 'Один шаг = отброшено ≈ половина дерева. Как бинарный поиск!',
    },
    {
      line: 11,
      action: 'root=7. 7 === 7 → НАШЛИ! Всего 2 сравнения для дерева из 7 узлов.',
      scene: {
        tree: {
          id: '5',
          value: 5,
          state: 'discarded',
          children: [
            { id: '3', value: 3, state: 'discarded', children: [{ id: '1', value: 1, state: 'discarded' }, { id: '4', value: 4, state: 'discarded' }] },
            { id: '7', value: 7, state: 'matched', children: [{ id: '6', value: 6, state: 'idle' }, { id: '9', value: 9, state: 'idle' }] },
          ],
        },
        vars: { 'найдено': 7, 'шагов': 2 },
      },
      ops: 2,
    },
    {
      line: 1,
      action: 'Вставка 8: 8>5→право, 8>7→право, 8<9→влево. Вставляем как левый ребёнок 9.',
      scene: {
        tree: {
          id: '5',
          value: 5,
          state: 'idle',
          children: [
            { id: '3', value: 3, state: 'idle', children: [{ id: '1', value: 1, state: 'idle' }, { id: '4', value: 4, state: 'idle' }] },
            {
              id: '7',
              value: 7,
              state: 'idle',
              children: [
                { id: '6', value: 6, state: 'idle' },
                { id: '9', value: 9, state: 'idle', children: [{ id: '8', value: 8, state: 'merged' }] },
              ],
            },
          ],
        },
        vars: { 'insert(8)': 'O(log n) = 3 шага' },
      },
      ops: 5,
    },
    {
      line: 1,
      action: '⚠️ Проблема: если вставлять 1,2,3,4,5... по порядку — дерево вырождается в список!',
      scene: {
        tree: {
          id: 'a1',
          value: 1,
          state: 'idle',
          children: [
            {
              id: 'a2', value: 2, state: 'idle',
              children: [{ id: 'a3', value: 3, state: 'idle', children: [{ id: 'a4', value: 4, state: 'compared', children: [{ id: 'a5', value: 5, state: 'compared' }] }] }],
            },
          ],
        },
        cards: [
          {
            title: '⚠️ Вырожденный BST',
            body: 'Данные в порядке → высота = n → поиск O(n). Решение: самобалансирующиеся деревья AVL / Red-Black (используются в std::map, TreeMap).',
            tag: 'degenerate case',
          },
        ],
      },
      ops: 5,
      hint: 'AVL-дерево и Red-Black дерево — это BST с авто-балансировкой. Они гарантируют O(log n) всегда.',
    },
  ],
  pitfalls: [
    'Неупорядоченные вставки → вырождение → O(n). Всегда используй AVL/RB-tree в реальном коде.',
    'In-order обход BST даёт отсортированный массив — это бесплатная сортировка за O(n).',
    'BST не поддерживает O(1) поиск. Если нужен быстрый поиск без порядка — используй хэш-таблицу.',
  ],
}

// ─── Trie ─────────────────────────────────────────────────────────

const trieCase: CaseStudy = {
  id: 'ds-trie',
  topic: 'Структуры данных',
  title: 'Префиксное дерево (Trie)',
  complexity: 'Вставка/поиск O(L) где L — длина слова',
  about:
    'Trie (prefix tree) — дерево, где каждое ребро = один символ. Путь от корня до листа = слово. Все слова с одинаковым префиксом делят общие узлы.',
  whenToUse:
    'Автодополнение (Google suggest). Spell checker. IP routing. Поиск по префиксу. Любое хранилище строк с быстрым prefix-поиском.',
  analogy:
    'Телефонный справочник дерево-разбивкой по буквам. Т → та → тан → тань→ танья. Все "Та..." делят первые два ребра. Не ищешь весь список — только ветку.',
  code: [
    'class TrieNode {',
    '  children = {};',
    '  isEnd = false;',
    '}',
    '',
    'class Trie {',
    '  root = new TrieNode();',
    '',
    '  insert(word) {',
    '    let node = this.root;',
    '    for (const ch of word) {',
    '      if (!node.children[ch])',
    '        node.children[ch] = new TrieNode();',
    '      node = node.children[ch];',
    '    }',
    '    node.isEnd = true;',
    '  }',
    '}',
  ],
  steps: [
    {
      line: 6,
      action: 'Пустой Trie. Корень — пустой узел без символа.',
      scene: {
        tree: { id: 'root', value: '∅', state: 'idle' },
        cards: [
          {
            title: '🔤 Trie vs HashMap',
            body: 'HashMap ищет слово целиком. Trie ищет по ПРЕФИКСУ. "ca" → найдёт "cat", "car", "card" за O(2) — два шага по дереву.',
            tag: 'prefix search',
          },
        ],
      },
      ops: 0,
    },
    {
      line: 9,
      action: 'insert("cat"). Проходим по буквам c → a → t, создаём узлы.',
      scene: {
        tree: {
          id: 'root', value: '∅', state: 'idle',
          children: [
            {
              id: 'c', value: 'c', state: 'merged',
              children: [
                {
                  id: 'ca', value: 'a', state: 'merged',
                  children: [{ id: 'cat', value: 't', state: 'matched' }],
                },
              ],
            },
          ],
        },
        vars: { 'insert': '"cat"', 'isEnd[t]': 'true' },
      },
      ops: 3,
    },
    {
      line: 9,
      action: 'insert("car"). c → a — УЖЕ существуют, переиспользуем! Создаём только r.',
      scene: {
        tree: {
          id: 'root', value: '∅', state: 'idle',
          children: [
            {
              id: 'c', value: 'c', state: 'idle',
              children: [
                {
                  id: 'ca', value: 'a', state: 'idle',
                  children: [
                    { id: 'cat', value: 't', state: 'visited' },
                    { id: 'car', value: 'r', state: 'merged' },
                  ],
                },
              ],
            },
          ],
        },
        vars: { 'shared prefix': '"ca"', 'новый узел': 'r только' },
      },
      ops: 5,
      hint: '"ca" переиспользовано! Это экономия памяти и скорость prefix-поиска.',
    },
    {
      line: 9,
      action: 'insert("card"). Путь c→a→r уже есть, создаём только d.',
      scene: {
        tree: {
          id: 'root', value: '∅', state: 'idle',
          children: [
            {
              id: 'c', value: 'c', state: 'idle',
              children: [
                {
                  id: 'ca', value: 'a', state: 'idle',
                  children: [
                    { id: 'cat', value: 't', state: 'visited' },
                    {
                      id: 'car', value: 'r', state: 'visited',
                      children: [{ id: 'card', value: 'd', state: 'merged' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        vars: { 'prefix "car"': 'уже есть', 'новый': 'd' },
      },
      ops: 6,
    },
    {
      line: 11,
      action: 'Поиск всех слов по префиксу "ca": идём c→a, затем обходим все поддерево. Мгновенно находим "cat", "car", "card".',
      scene: {
        tree: {
          id: 'root', value: '∅', state: 'idle',
          children: [
            {
              id: 'c', value: 'c', state: 'matched',
              children: [
                {
                  id: 'ca', value: 'a', state: 'matched',
                  children: [
                    { id: 'cat', value: 't★', state: 'matched' },
                    { id: 'car', value: 'r★', state: 'matched', children: [{ id: 'card', value: 'd★', state: 'matched' }] },
                  ],
                },
              ],
            },
          ],
        },
        cards: [
          {
            title: '⚡ Prefix search O(L)',
            body: '"ca" → 2 шага вниз → обходим поддерево. Для словаря в миллион слов нашли всё за 2 шага независимо от размера!',
            complexity: 'O(L + K) где K — кол-во результатов',
          },
        ],
      },
      ops: 8,
      hint: 'L = длина префикса. Не зависит от числа слов в Trie. Это и есть сила префиксного дерева.',
    },
  ],
  pitfalls: [
    'Trie может занимать много памяти: каждый узел хранит объект children. Оптимизация — compressed Trie (Patricia tree).',
    'Для хранения только целых слов без prefix-поиска — HashMap<string, bool> быстрее по памяти.',
    'Trie не подходит для поиска с опечатками. Для этого — BK-tree или Levenshtein automaton.',
  ],
}

// ─── Tree (general definition) ────────────────────────────────────

const treeDefinitionCase: CaseStudy = {
  id: 'ds-tree',
  topic: 'Структуры данных',
  title: 'Дерево (Tree)',
  complexity: 'Обход O(n) / Поиск O(h)',
  about:
    'Дерево — нелинейная структура данных: один корневой узел, от которого ветвятся дочерние узлы, образуя иерархию без циклов.',
  whenToUse:
    'Файловые системы, DOM в браузере, AST компиляторов, иерархия организации, маршрутизация сетей, компрессия (Huffman).',
  analogy:
    'Родословное дерево семьи: один прародитель (корень), дети, внуки — каждый узнаёт только своих потомков.',
  code: [
    '// Узел дерева',
    'class TreeNode {',
    '  val: number',
    '  left: TreeNode | null',
    '  right: TreeNode | null',
    '  constructor(val: number) {',
    '    this.val = val',
    '    this.left = null',
    '    this.right = null',
    '  }',
    '}',
    '',
    '// Высота дерева',
    'function height(node: TreeNode | null): number {',
    '  if (!node) return 0',
    '  return 1 + Math.max(height(node.left), height(node.right))',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Дерево — узлы и рёбра без циклов. Корень — вверху, листья — внизу.',
      ops: 0,
      hint: 'Главное отличие от графа: в дереве нет циклов и есть ровно один путь между любыми двумя узлами.',
      scene: {
        tree: {
          id: 'root', value: 'Корень', state: 'active',
          children: [
            {
              id: 'b', value: 'Узел', state: 'idle',
              children: [
                { id: 'd', value: 'Лист', state: 'matched' },
                { id: 'e', value: 'Лист', state: 'matched' },
              ],
            },
            {
              id: 'c', value: 'Узел', state: 'idle',
              children: [
                { id: 'f', value: 'Лист', state: 'matched' },
              ],
            },
          ],
        },
        cards: [
          { title: 'Корень (Root)', body: 'Единственный узел без родителя. Выделен синим.', tag: 'активен' },
          { title: 'Лист (Leaf)', body: 'Узел без детей — самый нижний уровень. Выделен зелёным.', tag: 'matched' },
          { title: 'Высота (Height)', body: 'Кол-во рёбер на самом длинном пути от корня до листа.', complexity: 'O(n) для вычисления' },
          { title: 'Глубина (Depth)', body: 'Кол-во рёбер от корня до данного узла. Корень на глубине 0.', complexity: 'O(1) если хранить' },
        ],
      },
    },
    {
      line: 2,
      action: 'Бинарное дерево: у каждого узла максимум два ребёнка — left и right.',
      ops: 0,
      hint: 'Бинарное дерево ≠ BST. Обычное бинарное дерево не гарантирует порядка значений.',
      scene: {
        tree: {
          id: 'r', value: 1, state: 'active',
          children: [
            {
              id: 'l', value: 2, state: 'idle',
              children: [
                { id: 'll', value: 4, state: 'idle' },
                { id: 'lr', value: 5, state: 'idle' },
              ],
            },
            {
              id: 'r2', value: 3, state: 'idle',
              children: [
                { id: 'rl', value: 6, state: 'idle' },
                { id: 'rr', value: 7, state: 'idle' },
              ],
            },
          ],
        },
        cards: [
          { title: 'Корень = 1', body: 'Узел 1 — корень, глубина 0.', tag: 'root' },
          { title: 'Листья', body: 'Узлы 4, 5, 6, 7 — листья, глубина 2.', tag: 'leaf' },
          { title: 'Высота = 2', body: '2 рёбра от корня до листьев.', complexity: 'h = 2' },
        ],
      },
    },
    {
      line: 2,
      action: 'Виды деревьев по форме — от них зависит высота h и скорость алгоритмов.',
      ops: 0,
      hint: 'Все алгоритмы на деревьях работают за O(h). Сбалансированное: h = log n. Вырожденное: h = n.',
      scene: {
        tree: {
          id: 'p', value: 1, state: 'active',
          children: [
            {
              id: 'p2', value: 2, state: 'visited',
              children: [
                { id: 'p4', value: 4, state: 'matched' },
                { id: 'p5', value: 5, state: 'matched' },
              ],
            },
            {
              id: 'p3', value: 3, state: 'visited',
              children: [
                { id: 'p6', value: 6, state: 'matched' },
                { id: 'p7', value: 7, state: 'matched' },
              ],
            },
          ],
        },
        cards: [
          { title: 'Совершенное (Perfect)', body: 'Все листья на одном уровне, каждый узел имеет ровно 2 детей. Это дерево выше — пример.', tag: 'идеал', complexity: 'h = O(log n)' },
          { title: 'Вырожденное', body: 'Каждый узел имеет одного ребёнка — превращается в связный список. Худший случай для BST.', tag: 'плохо', complexity: 'h = O(n)' },
          { title: 'Complete', body: 'Все уровни заполнены кроме последнего (слева направо). Так хранится куча в массиве.', tag: 'heap' },
        ],
      },
    },
    {
      line: 13,
      action: 'Высота дерева: рекурсивно идём в оба поддерева, берём максимум + 1.',
      ops: 7,
      hint: 'height(null) = 0 — базовый случай. height(лист) = 1. Посещаем каждый узел ровно раз → O(n).',
      scene: {
        tree: {
          id: 'h1', value: 1, state: 'active',
          children: [
            {
              id: 'h2', value: 2, state: 'compared',
              children: [
                { id: 'h4', value: 4, state: 'visited' },
                { id: 'h5', value: 5, state: 'visited' },
              ],
            },
            {
              id: 'h3', value: 3, state: 'compared',
              children: [
                { id: 'h6', value: 6, state: 'visited' },
                { id: 'h7', value: 7, state: 'visited' },
              ],
            },
          ],
        },
        vars: { 'height(корень)': 3, 'height(2)': 2, 'height(3)': 2, 'height(лист)': 1 },
        cards: [
          { title: 'Алгоритм', body: 'height(n) = 1 + max(height(left), height(right)). Базовый случай: height(null) = 0.', complexity: 'O(n)' },
        ],
      },
    },
    {
      line: 1,
      action: 'Деревья везде в разработке — знай их в лицо.',
      ops: 0,
      hint: 'DOM браузера, JSON, файловая система, Git-коммиты, TypeScript AST — всё это деревья.',
      scene: {
        tree: {
          id: 'app', value: 'App', state: 'active',
          children: [
            {
              id: 'header', value: 'Header', state: 'idle',
              children: [
                { id: 'nav', value: 'Nav', state: 'matched' },
                { id: 'logo', value: 'Logo', state: 'matched' },
              ],
            },
            {
              id: 'main', value: 'Main', state: 'idle',
              children: [
                { id: 'list', value: 'List', state: 'matched' },
                { id: 'form', value: 'Form', state: 'matched' },
              ],
            },
          ],
        },
        cards: [
          { title: 'DOM / React-дерево', body: 'App → Header/Main → дочерние компоненты. Дерево выше — это React-компоненты.', tag: 'браузер' },
          { title: 'Файловая система', body: '/ → /home → /user → файлы. Каталоги — узлы, файлы — листья.', tag: 'ОС' },
          { title: 'Компилятор (AST)', body: 'TypeScript парсит код в Abstract Syntax Tree — дерево выражений и операторов.', tag: 'компилятор' },
          { title: 'Huffman (сжатие)', body: 'Частые символы ближе к корню, редкие — глубже. Двоичный путь = код (zip, gzip).', tag: 'сжатие', complexity: 'O(n log n)' },
        ],
      },
    },
  ],
  pitfalls: [
    'Путаница: бинарное дерево ≠ BST. BST — это бинарное дерево с инвариантом порядка.',
    'Высота h может быть от log n (сбалансированное) до n (вырожденное). Всегда думай о worst-case.',
    'null-проверка обязательна: TreeNode.left / right может быть null — не забудь базовый случай в рекурсии.',
    'Обход дерева итеративно (со стеком) сложнее читается, но избегает stack overflow на очень глубоких деревьях.',
  ],
}

export const DATA_STRUCTURES_CASES: CaseStudy[] = [treeDefinitionCase, arrayCase, heapCase, bstCase, trieCase]

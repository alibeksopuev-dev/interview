import type { Topic } from './types'
import { TREE_CASES } from './treeCases'
import { RECURSION_CASES } from './recursionCases'
import { TWO_POINTERS_CASES } from './twoPointersCases'
import { HASHMAP_CASES } from './hashMapCases'
import { OTHER_CASES } from './otherCases'
import { DATA_STRUCTURES_CASES } from './dataStructuresCases'
import { GRAPH_CASES } from './graphCases'

export const ALL_CASES = [
  ...TREE_CASES,
  ...RECURSION_CASES,
  ...TWO_POINTERS_CASES,
  ...HASHMAP_CASES,
  ...OTHER_CASES,
  ...DATA_STRUCTURES_CASES,
  ...GRAPH_CASES,
]

export const TOPIC_INFO: Record<
  Topic,
  { emoji: string; color: string; description: string }
> = {
  Деревья: {
    emoji: '🌳',
    color: '#10b981',
    description:
      'DFS и BFS — два главных способа обойти дерево или граф. На них стоит половина задач интервью.',
  },
  Рекурсия: {
    emoji: '🔄',
    color: '#8b5cf6',
    description:
      'Функция, которая зовёт сама себя. Основа DFS, обхода JSON, динамического программирования.',
  },
  'Два указателя': {
    emoji: '👉👈',
    color: '#06b6d4',
    description:
      'Семейство приёмов: два указателя с концов, скользящее окно. Превращают O(n²) в O(n).',
  },
  'Хэш-таблицы': {
    emoji: '🗂️',
    color: '#3b82f6',
    description: 'Map / Set. Поиск за O(1) убивает наивные двойные циклы. Используй везде.',
  },
  'Стек & Очередь': {
    emoji: '📚',
    color: '#f59e0b',
    description: 'Стек (LIFO) для парсинга и DFS. Очередь (FIFO) для BFS и планировщиков задач.',
  },
  'Связный список': {
    emoji: '🔗',
    color: '#ef4444',
    description:
      'Узел знает только следующего. Развороты, проверка цикла, слияние — классика интервью.',
  },
  'Структуры данных': {
    emoji: '🏗️',
    color: '#0ea5e9',
    description:
      'Array, Heap, BST, Trie — как устроены, что гарантируют, где применяются в реальных системах.',
  },
  Графы: {
    emoji: '🕸️',
    color: '#a855f7',
    description:
      'Вершины и рёбра. BFS, DFS, Дейкстра, топологическая сортировка — алгоритмы для сетей и зависимостей.',
  },
}

export const TOPICS: Topic[] = [
  'Деревья',
  'Рекурсия',
  'Два указателя',
  'Хэш-таблицы',
  'Стек & Очередь',
  'Связный список',
  'Структуры данных',
  'Графы',
]

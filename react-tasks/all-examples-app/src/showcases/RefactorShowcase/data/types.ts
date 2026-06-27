export type Level = 'middle' | 'senior'

export type Category =
  | 'hooks'
  | 'performance'
  | 'typescript'
  | 'state'
  | 'async'
  | 'memory-leak'
  | 'a11y'
  | 'patterns'
  | 'react-19'

export interface Bug {
  /** Короткое название проблемы */
  title: string
  /** Подробное объяснение: что не так и к чему приводит */
  detail: string
}

export interface RefactorTask {
  id: string
  title: string
  level: Level
  categories: Category[]
  /** Краткое введение в контекст задачи */
  brief: string
  /** Код с ошибками (то, что видит кандидат) */
  brokenCode: string
  /** Список багов — раскрывается под спойлером */
  bugs: Bug[]
  /** Эталонный рефакторинг */
  fixedCode: string
  /** Резюме: почему так лучше */
  takeaway: string
}

export const CATEGORY_LABELS: Record<Category, string> = {
  hooks: 'Hooks',
  performance: 'Performance',
  typescript: 'TypeScript',
  state: 'State',
  async: 'Async',
  'memory-leak': 'Memory Leak',
  a11y: 'A11y',
  patterns: 'Patterns',
  'react-19': 'React 19',
}

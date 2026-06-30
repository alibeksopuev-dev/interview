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

/** Один проверочный тест плейграунда */
export interface PlaygroundTest {
  /** Название теста (показывается в результатах) */
  name: string
  /**
   * Выражение, которое должно вернуть true.
   * Имеет доступ к экспортам/переменным пользовательского кода
   * и к хелперу expect(actual).toEqual(expected).
   */
  assert: string
}

/** Интерактивный плейграунд: редактируемый код + запуск с тестами */
export interface Playground {
  /**
   * Стартовый код в редакторе (обычно — заготовка/«грязная» версия,
   * которую нужно довести). Чистый TS, выполнимый в браузере.
   */
  starter: string
  /** Проверочные тесты, прогоняются после выполнения кода */
  tests: PlaygroundTest[]
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
  /**
   * Опциональный интерактивный плейграунд. Есть только у задач
   * с запускаемой логикой (чистые функции, дженерики, type guards).
   * React-компоненты и чисто типовые кейсы плейграунда не имеют.
   */
  playground?: Playground
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

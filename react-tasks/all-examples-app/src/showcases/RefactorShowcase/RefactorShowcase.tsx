import { FC, useMemo, useState } from 'react'
import './styles.css'
import { REFACTOR_TASKS } from './data/tasks'
import { TS_TASKS } from './data/tsTasks'
import { CATEGORY_LABELS, Category, Level } from './data/types'
import { TaskCard } from './components/TaskCard'

const ALL_TASKS = [...REFACTOR_TASKS, ...TS_TASKS]

type LevelFilter = Level | 'all'
type CategoryFilter = Category | 'all'

export const RefactorShowcase: FC = () => {
  const [level, setLevel] = useState<LevelFilter>('all')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [sandboxOnly, setSandboxOnly] = useState(false)

  const sandboxCount = useMemo(
    () => ALL_TASKS.filter(t => t.playground).length,
    [],
  )

  const visibleTasks = useMemo(
    () =>
      ALL_TASKS.filter(t => {
        const byLevel = level === 'all' || t.level === level
        const byCat = category === 'all' || t.categories.includes(category)
        const bySandbox = !sandboxOnly || Boolean(t.playground)
        return byLevel && byCat && bySandbox
      }),
    [level, category, sandboxOnly],
  )

  const usedCategories = useMemo(() => {
    const set = new Set<Category>()
    ALL_TASKS.forEach(t => t.categories.forEach(c => set.add(c)))
    return [...set]
  }, [])

  return (
    <div className='rf-root'>
      <header className='rf-header'>
        <h1 className='rf-title'>Тренажёр рефакторинга · React + TypeScript</h1>
        <p className='rf-subtitle'>
          {ALL_TASKS.length} задач с реальными ошибками уровня middle/senior:
          хуки, гонки запросов, мемоизация, типизация, утечки и контекст. Изучи
          «грязный» код, найди баги самостоятельно — затем раскрой подробный разбор
          и эталонный рефакторинг.
        </p>
      </header>

      <div className='rf-filters'>
        <div className='rf-filter-group'>
          <span className='rf-filter-label'>Песочница</span>
          <button
            className={`rf-chip rf-chip-sandbox${sandboxOnly ? ' rf-chip-active' : ''}`}
            onClick={() => setSandboxOnly(v => !v)}
          >
            🛠 Только с песочницей ({sandboxCount})
          </button>
        </div>

        <div className='rf-filter-group'>
          <span className='rf-filter-label'>Уровень</span>
          {(['all', 'middle', 'senior'] as LevelFilter[]).map(l => (
            <button
              key={l}
              className={`rf-chip${level === l ? ' rf-chip-active' : ''}`}
              onClick={() => setLevel(l)}
            >
              {l === 'all' ? 'Все' : l}
            </button>
          ))}
        </div>

        <div className='rf-filter-group'>
          <span className='rf-filter-label'>Категория</span>
          <button
            className={`rf-chip${category === 'all' ? ' rf-chip-active' : ''}`}
            onClick={() => setCategory('all')}
          >
            Все
          </button>
          {usedCategories.map(c => (
            <button
              key={c}
              className={`rf-chip${category === c ? ' rf-chip-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className='rf-count'>
        Показано: {visibleTasks.length} из {ALL_TASKS.length}
      </div>

      <div className='rf-list'>
        {visibleTasks.map((task, i) => (
          <TaskCard key={task.id} task={task} index={i} />
        ))}
        {visibleTasks.length === 0 && (
          <p className='rf-empty'>Нет задач под выбранные фильтры.</p>
        )}
      </div>
    </div>
  )
}

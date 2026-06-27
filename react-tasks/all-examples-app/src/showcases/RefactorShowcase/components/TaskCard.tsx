import { FC, useState } from 'react'
import { RefactorTask, CATEGORY_LABELS } from '../data/types'
import { CodeBlock } from './CodeBlock'

interface TaskCardProps {
  task: RefactorTask
  index: number
}

export const TaskCard: FC<TaskCardProps> = ({ task, index }) => {
  const [revealed, setRevealed] = useState(false)

  return (
    <article className='rf-card'>
      <header className='rf-card-head'>
        <div className='rf-card-titlerow'>
          <span className='rf-card-num'>{String(index + 1).padStart(2, '0')}</span>
          <h3 className='rf-card-title'>{task.title}</h3>
        </div>
        <div className='rf-card-tags'>
          <span className={`rf-level rf-level-${task.level}`}>{task.level}</span>
          {task.categories.map(c => (
            <span
              key={c}
              className={`rf-cat${c === 'react-19' ? ' rf-cat-r19' : ''}`}
            >
              {CATEGORY_LABELS[c]}
            </span>
          ))}
        </div>
      </header>

      <p className='rf-card-brief'>{task.brief}</p>

      <CodeBlock code={task.brokenCode} label='Код с ошибками' variant='broken' />

      {!revealed ? (
        <button className='rf-reveal-btn' onClick={() => setRevealed(true)}>
          Сначала найди баги сам → затем покажи разбор
        </button>
      ) : (
        <div className='rf-solution'>
          <div className='rf-bugs'>
            <h4 className='rf-section-title'>Найденные проблемы</h4>
            <ol className='rf-bug-list'>
              {task.bugs.map((bug, i) => (
                <li key={i} className='rf-bug'>
                  <span className='rf-bug-title'>{bug.title}</span>
                  <span className='rf-bug-detail'>{bug.detail}</span>
                </li>
              ))}
            </ol>
          </div>

          <CodeBlock code={task.fixedCode} label='Рефакторинг' variant='fixed' />

          <div className='rf-takeaway'>
            <span className='rf-takeaway-label'>Вывод</span>
            <p>{task.takeaway}</p>
          </div>

          <button className='rf-hide-btn' onClick={() => setRevealed(false)}>
            Скрыть разбор
          </button>
        </div>
      )}
    </article>
  )
}

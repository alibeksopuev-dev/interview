import { useState, useRef, FC } from 'react'
import { throttle } from '../../../../../../throttle/throttle.ts'

interface LogEntry {
  id: string
  time: string
  status: 'allowed' | 'ignored'
}

export const SubmitButton: FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [clickCount, setClickCount] = useState(0)

  // Throttled функция отправки
  const throttledSubmit = useRef(
    throttle(() => {
      const now = new Date()
      const timeStr =
        now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0')
      setLogs(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          time: timeStr,
          status: 'allowed',
        },
        ...prev.slice(0, 7), // Храним последние 8 записей
      ])
    }, 2000), // не чаще раза в 2 секунды
  ).current

  const handleClick = () => {
    setClickCount(c => c + 1)

    // Регистрируем попытку клика
    const now = new Date()
    const timeStr =
      now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0')

    // Вызываем throttledSubmit
    const prevLogsLength = logs.length
    throttledSubmit()

    // Проверим, был ли клик проигнорирован (shouldThrottle в throttle.ts равен true)
    // Так как throttle выполняется синхронно в первый раз, мы можем просто добавить "ignored" запись,
    // если allowed запись не добавилась первой в очереди в этот же тик.
    // Для более точной визуализации мы добавим запись в лог
    setLogs(prev => {
      // Если последний элемент в логе не обновился на "allowed" в текущее время,
      // или если мы хотим показать попытку
      const hasJustAllowed =
        prev.length > prevLogsLength && prev[0].status === 'allowed' && prev[0].time === timeStr
      if (!hasJustAllowed) {
        return [
          {
            id: Math.random().toString(36).substr(2, 9),
            time: timeStr,
            status: 'ignored',
          },
          ...prev.slice(0, 7),
        ]
      }
      return prev
    })
  }

  const clearLogs = () => {
    setLogs([])
    setClickCount(0)
  }

  return (
    <div className='throttle-card'>
      <div className='card-header'>
        <h3>2. Submit Button (Спам-клики)</h3>
        <span className='badge badge-amber'>Interval: 2000ms</span>
      </div>
      <p className='card-desc'>
        Нажмите кнопку несколько раз подряд. Вызовы блокируются на 2 секунды после первого клика.
      </p>

      <div className='submit-demo-container'>
        <div className='action-row'>
          <button
            className='btn btn-submit'
            onClick={handleClick}
          >
            Отправить форму
          </button>
          <button
            className='btn btn-clear'
            onClick={clearLogs}
          >
            Очистить
          </button>
          <span className='click-counter'>Всего кликов: {clickCount}</span>
        </div>

        <div className='log-panel'>
          <div className='log-header'>Лог событий (клик по кнопке)</div>
          <div className='log-list'>
            {logs.length === 0 ? (
              <div className='log-empty'>Нажмите кнопку, чтобы начать логирование...</div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className={`log-item ${log.status}`}
                >
                  <span className='log-time'>[{log.time}]</span>
                  <span className='log-text'>
                    {log.status === 'allowed'
                      ? '✅ Запрос отправлен на сервер'
                      : '❌ Проигнорировано (throttle)'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Задача: добавь exhaustiveness-проверку через assertNever(x: never), чтобы
// забытый case по новому варианту Action ловился ошибкой компиляции,
// а не тихо обрабатывался в default.
//
// Открой этот файл в IDE, исправь реализацию ниже и запусти файл,
// чтобы проверить тесты в конце.

type Action = { type: 'increment' } | { type: 'decrement' } | { type: 'reset' }

function assertNever(x: never): never {
  throw new Error('Необработанный вариант: ' + JSON.stringify(x))
}

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    case 'reset':
      return 0
    default:
      // если добавить новый Action и забыть case —
      // здесь будет ошибка компиляции ✅
      return assertNever(action)
  }
}

// ── Демонстрация ──────────────────────────────────────────────────────────

console.log(reducer(0, { type: 'increment' }))
console.log(reducer(5, { type: 'decrement' }))
console.log(reducer(5, { type: 'reset' }))

// Раскомментируй — должна быть ошибка компиляции (несуществующий вариант):
// reducer(0, { type: 'double' })

// ── Тесты ──────────────────────────────────────────────────────────────────

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`)
}

assertEqual(reducer(0, { type: 'increment' }), 1, 'increment увеличивает state на 1')
assertEqual(reducer(5, { type: 'decrement' }), 4, 'decrement уменьшает state на 1')
assertEqual(reducer(5, { type: 'reset' }), 0, 'reset возвращает 0')
assertEqual(reducer(10, { type: 'increment' }), 11, 'increment работает с произвольным state')

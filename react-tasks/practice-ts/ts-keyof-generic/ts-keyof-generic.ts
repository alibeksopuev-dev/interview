// Задача: типизируй get так, чтобы:
// 1) key принимал только реальные ключи obj (опечатка — ошибка компиляции);
// 2) тип результата зависел от key (а не был any).
//
// Открой этот файл в IDE, исправь реализацию ниже и запусти файл,
// чтобы проверить тесты в конце.

function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

// ── Демонстрация ──────────────────────────────────────────────────────────

const user = { name: 'Ann', age: 30 }
console.log(get(user, 'name')) // 'Ann'
console.log(get(user, 'age')) // 30

// Раскомментируй — должна быть ошибка компиляции (опечатка в ключе):
// get(user, 'naem')

// ── Тесты ──────────────────────────────────────────────────────────────────

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`)
}

assertEqual(get(user, 'name'), 'Ann', 'get возвращает значение по строковому ключу')
assertEqual(get(user, 'age'), 30, 'get возвращает значение по числовому полю')
assertEqual(get({ profile: { city: 'NY' } }, 'profile'), { city: 'NY' }, 'get работает с вложенным объектом как значением')

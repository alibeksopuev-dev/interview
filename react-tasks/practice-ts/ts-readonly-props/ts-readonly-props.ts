// Задача: типизируй getSortedList так, чтобы:
// 1) items нельзя было мутировать (.sort, .push, ...) — ошибка компиляции;
// 2) функция возвращала новый отсортированный массив, не трогая исходный.
//
// Открой этот файл в IDE, исправь реализацию ниже и запусти файл,
// чтобы проверить тесты в конце.

function getSortedList(items: readonly number[]): number[] {
  return [...items].sort((a, b) => a - b)
}

// ── Демонстрация ──────────────────────────────────────────────────────────

const original = [3, 1, 2]
console.log(getSortedList(original)) // [1, 2, 3]
console.log(original) // [3, 1, 2] — не изменился

// Раскомментируй — должна быть ошибка компиляции (readonly запрещает мутацию):
// function broken(items: readonly number[]) { items.sort((a, b) => a - b) }

// ── Тесты ──────────────────────────────────────────────────────────────────

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`)
}

assertEqual(getSortedList([3, 1, 2]), [1, 2, 3], 'getSortedList возвращает отсортированный по возрастанию массив')

{
  const originalArr = [3, 1, 2]
  getSortedList(originalArr)
  assertEqual(originalArr, [3, 1, 2], 'getSortedList не мутирует исходный массив-аргумент')
}

assertEqual(getSortedList([1, 2, 3]), [1, 2, 3], 'getSortedList корректно работает с уже отсортированным массивом')

{
  const originalArr = [5, -1, 0, 2]
  const sorted = getSortedList(originalArr)
  assertEqual(sorted, [-1, 0, 2, 5], 'getSortedList сортирует массив с отрицательными числами')
  assertEqual(originalArr, [5, -1, 0, 2], 'getSortedList не мутирует исходный массив даже для другого набора данных')
}

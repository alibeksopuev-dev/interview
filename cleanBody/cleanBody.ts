// =================================================================
// РЕШЕНИЕ 1: базовая реализация — фильтр + преобразование числел
// =================================================================

export function cleanBodyV1(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => v !== '' && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => [k, typeof v === 'number' ? String(v) : v]),
  )
}

// =================================================================
// РЕШЕНИЕ 2: явные переменные — тот же результат, читаемее
// =================================================================

export function cleanBodyV2(data: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.entries(data)

  const filtered = entries.filter(([, value]) => {
    const isEmptyString = value === ''
    const isEmptyArray = Array.isArray(value) && value.length === 0
    return !isEmptyString && !isEmptyArray
  })

  const mapped = filtered.map(([key, value]) => {
    const converted = typeof value === 'number' ? String(value) : value
    return [key, converted] as [string, unknown]
  })

  return Object.fromEntries(mapped)
}

// =================================================================
// РЕШЕНИЕ 3: reduce — один проход, без промежуточных массивов
// =================================================================

export function cleanBodyV3(data: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      return acc // пропускаем — не добавляем в аккумулятор
    }
    acc[key] = typeof value === 'number' ? String(value) : value
    return acc
  }, {})
}

// =================================================================
// ТЕСТЫ
// =================================================================

const input = {
  name: 'Alice',
  age: 30,          // число — должно стать строкой "30"
  email: '',        // пустая строка — должна выброситься
  tags: [],         // пустой массив — должен выброситься
  tags2: ['a', 'b'], // непустой массив — остаётся как есть
  score: 0,         // 0 — это тоже число, должно стать "0"
  active: true,     // boolean — не трогаем
}

console.log('V1:', cleanBodyV1(input))
console.log('V2:', cleanBodyV2(input))
console.log('V3:', cleanBodyV3(input))

// Ожидаемый вывод:
// {
//   name: 'Alice',
//   age: '30',
//   tags2: ['a', 'b'],
//   score: '0',
//   active: true,
// }

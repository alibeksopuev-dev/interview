type Session = { user: number; duration: number; equipment: Array<string> }
type SessionWithSet = { user: number; duration: number; equipment: Set<string> }
type Options = {
  user?: number
  minDuration?: number
  equipment?: Array<string>
  merge?: boolean
}

/**
 * Вспомогательная функция для проверки пересечения множеств за O(min(|A|, |B|))
 */
function setHasOverlap<T>(setA: Set<T>, setB: Set<T>): boolean {
  return false
}

/**
 * Алгоритм selectData:
 * Фильтрует, группирует (при merge: true) и сортирует сессии пользователей.
 *
 * Шаги для реализации:
 * 1. Реверс: Сделайте копию и разверните исходный массив, чтобы последнее вхождение стало первым.
 * 2. Группировка (Мерж):
 *    - Если `merge: true`, накапливайте `duration` и объединяйте `equipment` в Set.
 *    - Ссылки на объекты-клоны храните в `Map<userId, SessionWithSet>` для быстрого доступа.
 * 3. Восстановление порядка: Разверните обработанный массив обратно (reversedSessions -> sessionsProcessed.reverse()).
 * 4. Фильтрация и форматирование:
 *    - Создайте `Set` из `options.equipment` для O(1) поиска.
 *    - Отфильтруйте по `user`, `minDuration` и `equipment` (через setHasOverlap).
 *    - Преобразуйте Set оборудования обратно в отсортированный массив `Array.from(set).sort()`.
 */

const SESSIONS: Array<Session> = [
  { user: 8, duration: 50, equipment: ['bench'] },
  { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
  { user: 1, duration: 10, equipment: ['barbell'] },
  { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
  { user: 7, duration: 200, equipment: ['bike'] },
  { user: 2, duration: 200, equipment: ['treadmill'] },
  { user: 2, duration: 200, equipment: ['bike'] },
]
export default function selectData(sessions: Array<Session>, options?: Options): Array<Session> {
  return []
}

selectData(SESSIONS)
// [
//   { user: 8, duration: 50, equipment: ['bench'] },
//   { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
//   { user: 1, duration: 10, equipment: ['barbell'] },
//   { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
//   { user: 7, duration: 200, equipment: ['bike'] },
//   { user: 2, duration: 200, equipment: ['treadmill'] },
//   { user: 2, duration: 200, equipment: ['bike'] },
// ];
selectData(SESSIONS, { user: 2 })
// [
//   { user: 2, duration: 200, equipment: ['treadmill'] },
//   { user: 2, duration: 200, equipment: ['bike'] },
// ];
selectData(SESSIONS, { minDuration: 200 })
// [
//   { user: 7, duration: 200, equipment: ['bike'] },
//   { user: 2, duration: 200, equipment: ['treadmill'] },
//   { user: 2, duration: 200, equipment: ['bike'] },
// ];
selectData(SESSIONS, { minDuration: 400 })
// [];
selectData(SESSIONS, { equipment: ['bike', 'dumbbell'] })
// [
//   { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
//   { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
//   { user: 7, duration: 200, equipment: ['bike'] },
//   { user: 2, duration: 200, equipment: ['bike'] },
// ];
selectData(SESSIONS, { merge: true })
// [
//   { user: 8, duration: 50, equipment: ['bench'] },
//   { user: 1, duration: 10, equipment: ['barbell'] },
//   { user: 7, duration: 450, equipment: ['bike', 'dumbbell', 'kettlebell'] },
//   { user: 2, duration: 400, equipment: ['bike', 'treadmill'] },
// ];
selectData(SESSIONS, { merge: true, minDuration: 400 })
// [
//   { user: 7, duration: 450, equipment: ['bike', 'dumbbell', 'kettlebell'] },
//   { user: 2, duration: 400, equipment: ['bike', 'treadmill'] },
// ];

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false
    }
    return true
  }
  return false
}

const tests = [
  {
    name: 'Без опций (возвращает копию всех элементов)',
    options: undefined,
    expected: [
      { user: 8, duration: 50, equipment: ['bench'] },
      { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
      { user: 1, duration: 10, equipment: ['barbell'] },
      { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
      { user: 7, duration: 200, equipment: ['bike'] },
      { user: 2, duration: 200, equipment: ['treadmill'] },
      { user: 2, duration: 200, equipment: ['bike'] },
    ],
  },
  {
    name: 'Фильтрация по пользователю (options.user)',
    options: { user: 2 },
    expected: [
      { user: 2, duration: 200, equipment: ['treadmill'] },
      { user: 2, duration: 200, equipment: ['bike'] },
    ],
  },
  {
    name: 'Фильтрация по минимальной длительности (options.minDuration)',
    options: { minDuration: 200 },
    expected: [
      { user: 7, duration: 200, equipment: ['bike'] },
      { user: 2, duration: 200, equipment: ['treadmill'] },
      { user: 2, duration: 200, equipment: ['bike'] },
    ],
  },
  {
    name: 'Фильтрация по оборудованию (options.equipment)',
    options: { equipment: ['bike', 'dumbbell'] },
    expected: [
      { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
      { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
      { user: 7, duration: 200, equipment: ['bike'] },
      { user: 2, duration: 200, equipment: ['bike'] },
    ],
  },
  {
    name: 'Слияние сессий (options.merge: true)',
    options: { merge: true },
    expected: [
      { user: 8, duration: 50, equipment: ['bench'] },
      { user: 1, duration: 10, equipment: ['barbell'] },
      { user: 7, duration: 450, equipment: ['bike', 'dumbbell', 'kettlebell'] },
      { user: 2, duration: 400, equipment: ['bike', 'treadmill'] },
    ],
  },
  {
    name: 'Слияние + Фильтрация (merge: true, minDuration: 400)',
    options: { merge: true, minDuration: 400 },
    expected: [
      { user: 7, duration: 450, equipment: ['bike', 'dumbbell', 'kettlebell'] },
      { user: 2, duration: 400, equipment: ['bike', 'treadmill'] },
    ],
  },
]

function runTests() {
  console.log('🚀 Запуск тестов для selectData...\n')
  let passedCount = 0

  tests.forEach((t, i) => {
    try {
      const result = selectData(SESSIONS, t.options)
      if (deepEqual(result, t.expected)) {
        console.log(` ✅ Тест ${i + 1}: "${t.name}" — ПРОЙДЕН`)
        passedCount++
      } else {
        console.log(` ❌ Тест ${i + 1}: "${t.name}" — СБОЙ`)
        console.log('    Ожидалось:', JSON.stringify(t.expected))
        console.log('    Получено: ', JSON.stringify(result))
      }
    } catch (err: any) {
      console.log(` ❌ Тест ${i + 1}: "${t.name}" — ВЫЗВАЛ ОШИБКУ: ${err.message}`)
    }
  })

  console.log(`\n📊 Итог: ${passedCount} из ${tests.length} тестов пройдены.`)
}

runTests()

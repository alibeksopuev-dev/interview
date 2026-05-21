/**
 * Promise.all() — метод, который принимает массив промисов и возвращает один промис,
 * выполняющийся, когда все входные промисы выполнены, или отклоняющийся при первом rejection.
 *
 * ⚠️ EDGE CASES (Граничные случаи):
 * - Пустой массив: немедленно resolve([]) синхронно.
 * - Не-промисные значения: оборачиваются через Promise.resolve(), попадают в results по индексу.
 * - Первый rejection: немедленно отклоняет внешний промис; остальные продолжают работать, но игнорируются.
 * - Порядок результатов: соответствует порядку входных данных, а не порядку завершения.
 *
 * @param iterable - Массив промисов или обычных значений.
 * @returns Промис, который выполнится массивом результатов или отклонится с первой ошибкой.
 */

/**
 * Типизация:
 *
 * `T extends readonly unknown[] | []`
 *   — ограничение дженерика: принимает массивы и кортежи (readonly нужен для кортежей).
 *   `| []` — хак для вывода кортежного типа вместо обобщённого массива.
 *
 * `{ -readonly [P in keyof T]: Awaited<T[P]> }`
 *   — Mapped Type: итерируется по ключам T (индексам кортежа),
 *     убирает readonly (-readonly) и разворачивает промисы через Awaited<>.
 *
 * `Awaited<T[P]>`:
 *   Promise<string> → string, Promise<Promise<number>> → number, boolean → boolean.
 */
type ReturnValue<T> = { -readonly [P in keyof T]: Awaited<T[P]> }

/**
 * Подход 1: async/await внутри forEach.
 * Рекомендуется для собеседования — явно показывает механику координации.
 * Координация: счётчик `unresolved` + массив `results`, индексированный по позиции.
 */
export function promiseAll<T extends readonly unknown[] | []>(
  iterable: T,
): Promise<ReturnValue<T>> {
  return new Promise((resolve, reject) => {
    // Сохраняем порядок: results[i] = значение i-го промиса.
    const results = new Array(iterable.length)
    let unresolved = iterable.length

    // Edge case: пустой массив — resolve синхронно, без итерации.
    if (unresolved === 0) {
      resolve(results as ReturnValue<T>)
      return
    }

    iterable.forEach(async (item, index) => {
      try {
        // await работает и с промисами, и с обычными значениями (число, строка и т.д.)
        const value = await item
        results[index] = value
        unresolved -= 1

        // Когда все промисы выполнены — разрешаем внешний промис.
        if (unresolved === 0) {
          resolve(results as ReturnValue<T>)
        }
      } catch (err) {
        // Первый rejection немедленно отклоняет весь promiseAll.
        // Последующие вызовы reject() будут проигнорированы (промис уже settled).
        reject(err)
      }
    })
  })
}

/**
 * Подход 2: .then() явно (без async/await).
 * Более идиоматичен: два колбэка .then(onFulfilled, onRejected).
 * Второй аргумент .then() ловит ошибки только текущего промиса,
 * не ошибки из onFulfilled (в отличие от .catch()).
 */
export function promiseAllWithThen<T extends readonly unknown[] | []>(
  iterable: T,
): Promise<ReturnValue<T>> {
  return new Promise((resolve, reject) => {
    const results = new Array(iterable.length)
    let unresolved = iterable.length

    if (unresolved === 0) {
      resolve(results as ReturnValue<T>)
      return
    }

    iterable.forEach((item, index) => {
      // Promise.resolve() — идемпотентен для промисов, оборачивает обычные значения.
      Promise.resolve(item).then(
        (value) => {
          results[index] = value
          unresolved -= 1
          if (unresolved === 0) {
            resolve(results as ReturnValue<T>)
          }
        },
        (reason) => {
          reject(reason)
        },
      )
    })
  })
}

// ── Тесты ──────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('--- Тест 1: Базовое использование (смешанные типы) ---')
  const p0 = Promise.resolve(3)
  const p1 = 42 // Не промис
  const p2 = new Promise<string>((resolve) => setTimeout(() => resolve('foo'), 100))
  const result1 = await promiseAll([p0, p1, p2])
  console.log(result1) // [3, 42, 'foo']

  console.log('--- Тест 2: Пустой массив ---')
  const result2 = await promiseAll([])
  console.log(result2) // []

  console.log('--- Тест 3: Rejection (первый побеждает) ---')
  try {
    const fail0 = Promise.resolve(30)
    const fail1 = new Promise<number>((_, reject) =>
      setTimeout(() => reject('Первая ошибка'), 50),
    )
    const fail2 = new Promise<number>((resolve) => setTimeout(() => resolve(100), 200))
    await promiseAll([fail0, fail1, fail2])
  } catch (err) {
    console.log('Поймана ошибка:', err) // 'Первая ошибка'
  }

  console.log('--- Тест 4: Сохранение порядка (медленный промис на первом месте) ---')
  const slow = new Promise<string>((resolve) => setTimeout(() => resolve('медленный'), 100))
  const fast = Promise.resolve('быстрый')
  const result4 = await promiseAll([slow, fast])
  console.log(result4) // ['медленный', 'быстрый'] — порядок сохранён!

  console.log('--- Тест 5: promiseAllWithThen (вариант с .then) ---')
  const result5 = await promiseAllWithThen([Promise.resolve(1), 2, Promise.resolve(3)])
  console.log(result5) // [1, 2, 3]
}

runTests()

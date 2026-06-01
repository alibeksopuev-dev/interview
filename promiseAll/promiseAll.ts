// ─────────────────────────────────────────────────────────────────────────────
// Что такое промис? (Быстрое напоминание)
//
// Промис — объект с тремя возможными состояниями:
//   pending   → ещё не завершён (ждём)
//   fulfilled → завершён успешно (есть значение)
//   rejected  → завершён с ошибкой
//
// Создание промиса:
//   new Promise((resolve, reject) => {
//     resolve(42)     // переводит в fulfilled
//     reject('упал') // переводит в rejected
//   })
//
// ВАЖНО: как только промис перешёл в fulfilled/rejected — он уже не изменится.
// Повторные вызовы resolve() или reject() JavaScript просто игнорирует.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ТИПИЗАЦИЯ: Разбираем по частям
//
// Зачем нам Generic <T>?
//   Мы не знаем заранее, что придёт в массиве: [Promise<number>, string, boolean]?
//   [Promise<string>]? Generic T запомнит точный тип и пронесёт его до конца.
//
// T extends readonly unknown[] | []
//   Ограничение: T должен быть массивом или кортежем.
//   · readonly  — позволяет принять кортежи (они readonly по умолчанию в TS)
//   · unknown[] — безопаснее чем any[], тип каждого элемента пока неизвестен
//   · | []      — подсказка TS: "T — кортеж конечной длины, не бесконечный массив"
//                 Без неё TS выведет (number|string)[] вместо [number, string]
//
// { -readonly [P in keyof T]: Awaited<T[P]> }  — это Mapped Type
//   Работает как .map() но для типов:
//   · [P in keyof T]  → проходим по каждому индексу: '0', '1', '2', ...
//   · -readonly       → убираем readonly с каждого элемента (чтобы results[] был изменяемым)
//   · Awaited<T[P]>   → "разворачиваем" промисы: Promise<string>→string, number→number
//
// Итог для T = [Promise<number>, string, Promise<boolean>]:
//   ReturnValue<T> = [number, string, boolean]  ← точный кортеж, не дженерик массив
// ─────────────────────────────────────────────────────────────────────────────
type ReturnValue<T> = { -readonly [P in keyof T]: Awaited<T[P]> }

// ─────────────────────────────────────────────────────────────────────────────
// ПОДХОД 1: async/await внутри forEach
//
// Идея:
//   Создаём один "внешний" промис. Внутри него проходим по всем элементам массива,
//   ждём каждый и записываем результат по индексу. Когда все готовы — resolve().
//
// Почему forEach, а не for...of с await?
//   for...of + await выполнял бы промисы последовательно (один за другим).
//   forEach запускает async-колбэк для каждого элемента и сразу идёт дальше —
//   все промисы начинают "ждаться" одновременно. Это и даёт параллельность.
//
// Как работает счётчик unresolved:
//   unresolved = N (сколько промисов ещё не завершились)
//   Каждый раз когда промис выполняется → unresolved--
//   Когда unresolved === 0 → все завершились → resolve(results)
// ─────────────────────────────────────────────────────────────────────────────
export function promiseAll<T extends readonly unknown[] | []>(
  iterable: T,
): Promise<ReturnValue<T>> {
  return new Promise((resolve, reject) => {
    // results[i] будет хранить результат i-го промиса.
    // Используем new Array(N) а не [] чтобы сразу зарезервировать нужный размер.
    const results = new Array(iterable.length)
    let unresolved = iterable.length

    // Edge case: пустой массив.
    // "Все ноль промисов выполнены" — истина немедленно.
    // resolve вызывается синхронно, forEach не запускается вообще.
    if (unresolved === 0) {
      resolve(results as ReturnValue<T>)
      return
    }

    iterable.forEach(async (item, index) => {
      try {
        // await работает с чем угодно:
        //   await Promise.resolve(3)  → 3
        //   await 42                  → 42 (не промис? JS сам обернёт)
        //   await fetch(url)          → ответ сервера
        const value = await item

        // Записываем в нужную ячейку по индексу.
        // Это гарантирует: results[0] = результат первого, results[1] = второго, и т.д.
        // Даже если второй промис завершился быстрее первого — порядок сохранится.
        results[index] = value
        unresolved -= 1

        if (unresolved === 0) {
          // Все промисы завершились → отдаём результат.
          // "as ReturnValue<T>" нужен потому что TS не может сам доказать корректность
          // — он не "видит" что мы аккуратно заполнили каждую ячейку по индексу.
          resolve(results as ReturnValue<T>)
        }
      } catch (err) {
        // Любой rejection → немедленно отклоняем весь promiseAll.
        // Если потом другие промисы вызовут resolve/reject — JS проигнорирует,
        // промис уже settled (осевший), изменить его состояние нельзя.
        reject(err)
      }
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// ПОДХОД 2: .then() явно (без async/await)
//
// То же самое, но выражено через явные колбэки .then(onFulfilled, onRejected).
//
// Зачем .then(onF, onR) а не .then(onF).catch(onR)?
//
//   promise.then(onFulfilled, onRejected)
//     → onRejected ловит только ошибки ИЗ САМОГО ПРОМИСА
//
//   promise.then(onFulfilled).catch(onRejected)
//     → onRejected ловит ошибки из промиса И из onFulfilled!
//     (если внутри onFulfilled выбросится исключение — .catch его поймает)
//
//   Для нас это важно: мы не хотим случайно поймать ошибку из нашего же кода
//   обработчика как будто это ошибка входного промиса.
//
// Promise.resolve(item) — зачем он здесь?
//   В подходе 1 await сам справляется с не-промисами.
//   Здесь мы явно работаем с .then(), которого у числа/строки нет.
//   Promise.resolve(42) создаёт уже выполненный промис — и теперь .then() есть.
// ─────────────────────────────────────────────────────────────────────────────
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
      Promise.resolve(item).then(
        // onFulfilled: промис выполнился успешно
        (value) => {
          results[index] = value
          unresolved -= 1
          if (unresolved === 0) {
            resolve(results as ReturnValue<T>)
          }
        },
        // onRejected: промис отклонён → сразу отклоняем весь promiseAll
        (reason) => {
          reject(reason)
        },
      )
    })
  })
}

// ── Тесты ──────────────────────────────────────────────────────────────────
//
// Запуск: npx ts-node promiseAll.ts
// или:    npx tsx promiseAll.ts

async function runTests() {
  console.log('--- Тест 1: Базовое использование (смешанные типы) ---')
  // p0 — промис, p1 — обычное число (не промис), p2 — промис с задержкой
  const p0 = Promise.resolve(3)
  const p1 = 42
  const p2 = new Promise<string>((resolve) => setTimeout(() => resolve('foo'), 100))
  const result1 = await promiseAll([p0, p1, p2])
  console.log(result1) // [3, 42, 'foo']

  console.log('--- Тест 2: Пустой массив ---')
  // unresolved = 0 → resolve([]) вызывается синхронно, сразу
  const result2 = await promiseAll([])
  console.log(result2) // []

  console.log('--- Тест 3: Rejection (первый побеждает) ---')
  try {
    const fail0 = Promise.resolve(30)
    const fail1 = new Promise<number>((_, reject) =>
      // отклоняется через 50мс
      setTimeout(() => reject('Первая ошибка'), 50),
    )
    const fail2 = new Promise<number>((resolve) =>
      // выполняется через 200мс, но promiseAll уже отклонён к тому времени
      setTimeout(() => resolve(100), 200),
    )
    await promiseAll([fail0, fail1, fail2])
  } catch (err) {
    console.log('Поймана ошибка:', err) // 'Первая ошибка'
  }

  console.log('--- Тест 4: Сохранение порядка (медленный промис на первом месте) ---')
  // slow завершится позже, но должен быть на ПЕРВОМ месте в results
  const slow = new Promise<string>((resolve) => setTimeout(() => resolve('медленный'), 100))
  const fast = Promise.resolve('быстрый')
  const result4 = await promiseAll([slow, fast])
  console.log(result4) // ['медленный', 'быстрый'] — порядок сохранён!

  console.log('--- Тест 5: promiseAllWithThen (вариант с .then) ---')
  const result5 = await promiseAllWithThen([Promise.resolve(1), 2, Promise.resolve(3)])
  console.log(result5) // [1, 2, 3]
}

runTests()

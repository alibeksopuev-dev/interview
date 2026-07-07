// ─────────────────────────────────────────────────────────────────────────────
// ЗАДАЧА: Middlewares (композиция промежуточных функций)
//
// Реализовать функцию middlewares, которая принимает любое количество
// middleware-функций и объединяет их в одну вызываемую функцию.
// Скомпонованная функция принимает context, возвращает Promise
// и вызывает каждый middleware ПО ПОРЯДКУ.
//
// Каждый middleware получает два аргумента:
//   · context — объект, общий для всех middleware (они его мутируют)
//   · next    — функция, которая запускает СЛЕДУЮЩИЙ middleware в цепочке
//
// Когда вызывается next(), запускается следующий middleware.
// Если middleware НЕ вызвал next() — цепочка останавливается.
//
// Выполнение должно быть АСИНХРОННЫМ и ПОСЛЕДОВАТЕЛЬНЫМ,
// как middleware работает во фреймворках вроде Koa.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ТИПИЗАЦИЯ
//
// MiddlewareFn — это функция, которая может быть либо async (возвращает Promise),
// либо обычной (возвращает void). Оба варианта валидны:
//
//   async function fn1(ctx, next) { await next() }   ← async, ждёт next()
//   function fn3(ctx, next)       { next() }          ← sync, не ждёт
//
// next: () => Promise<void> — вызов next() всегда возвращает промис,
//   чтобы внутри middleware можно было написать `await next()`.
// ─────────────────────────────────────────────────────────────────────────────
type MiddlewareFn =
  | ((context: any, next: () => Promise<void>) => Promise<void>)
  | ((context: any, next: () => Promise<void>) => void)

// ─────────────────────────────────────────────────────────────────────────────
// РЕШЕНИЕ: рекурсивная композиция
//
// Главная идея — это композиция функций с передачей управления через next().
// Ключевой приём — РЕКУРСИЯ.
//
// Почему НЕ обычный цикл for?
//   Цикл всегда прогнал бы все функции подряд. Но здесь middleware сам решает,
//   вызывать ли next() и когда. `await next()` должен приостановить текущий
//   middleware, пока не завершится ВСЯ нижележащая часть цепочки.
//   Цикл такого "паузa посередине" не умеет — а рекурсия умеет.
//
// Форма стека вызовов — "луковица" (onion):
//   fn1 начал → await next() → fn2 начал → await next() → fn3 (нет next) → резолв
//   → fn2 продолжил после await → fn1 продолжил после await
// ─────────────────────────────────────────────────────────────────────────────
export default function middlewares(...fns: Array<MiddlewareFn>) {
  // Возвращаем скомпонованную функцию. Она принимает context (по умолчанию {})
  // и возвращает Promise (потому что async).
  return async function (context: any = {}): Promise<void> {
    // execute(index) — запускает middleware под номером index.
    async function execute(index: number): Promise<void> {
      // Дошли до конца цепочки — останавливаемся.
      // Это база рекурсии: последний next() просто ничего не делает.
      if (index === fns.length) {
        return
      }

      // Берём текущий middleware.
      const fn = fns[index]

      // Вызываем его, передавая:
      //   · context — общий объект
      //   · () => execute(index + 1) — это и есть next(). Когда middleware
      //     вызовет next(), запустится СЛЕДУЮЩИЙ middleware.
      //
      // await нужен, чтобы если middleware async и делает `await next()`,
      // мы дождались завершения всей нижележащей цепочки прежде чем
      // продолжить текущий (та самая "луковица").
      await fn(context, () => execute(index + 1))
    }

    // Запускаем цепочку с первого middleware.
    await execute(0)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// АЛЬТЕРНАТИВНЫЙ ПОДХОД: только промисы (без async/await)
//
// То же самое, но выражено через Promise.resolve().then(...).
// Promise.resolve() позволяет и sync, и async middleware идти по одному пути.
// ─────────────────────────────────────────────────────────────────────────────
export function middlewaresWithThen(...fns: Array<MiddlewareFn>) {
  return function (context: any = {}): Promise<void> {
    function execute(index: number): Promise<void> {
      if (index === fns.length) {
        return Promise.resolve()
      }
      const fn = fns[index]
      // Оборачиваем результат fn(...) в Promise.resolve, чтобы sync и async
      // middleware обрабатывались одинаково.
      return Promise.resolve(fn(context, () => execute(index + 1)))
    }
    return execute(0)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ЧАСТАЯ ОШИБКА (антипаттерн): index как переменная снаружи
//
// index НЕ должен быть переменной снаружи функции — иначе все вызовы
// скомпонованной функции будут делить один index, и её можно вызвать
// только один раз. Правильно — index это аргумент execute(index),
// он свой для каждого запуска цепочки (см. execute выше).
// ─────────────────────────────────────────────────────────────────────────────

// ── Тесты ──────────────────────────────────────────────────────────────────
//
// Запуск: npx tsx middlewares.ts
// или:    npx ts-node middlewares.ts

async function runTests() {
  console.log('--- Тест 1: Базовая композиция (луковица) ---')
  async function fn1(ctx: any, next: () => Promise<void>) {
    ctx.stack.push('fn1-start')
    await next()
    ctx.stack.push('fn1-end')
  }
  async function fn2(ctx: any, next: () => Promise<void>) {
    ctx.stack.push('fn2-start')
    await new Promise((resolve) => setTimeout(resolve, 100))
    await next()
    ctx.stack.push('fn2-end')
  }
  function fn3(ctx: any, next: () => Promise<void>) {
    ctx.stack.push('fn3-start')
    next()
    ctx.stack.push('fn3-end')
  }

  const composedFn = middlewares(fn1, fn2, fn3)
  const context: { stack: string[] } = { stack: [] }
  await composedFn(context)
  console.log(context.stack)
  // ['fn1-start', 'fn2-start', 'fn3-start', 'fn3-end', 'fn2-end', 'fn1-end']

  console.log('--- Тест 2: Middleware не вызвал next() → цепочка стоп ---')
  const stopStack: string[] = []
  const stopComposed = middlewares(
    (ctx, next) => {
      stopStack.push('A')
      next()
    },
    (ctx, next) => {
      stopStack.push('B')
      // next() НЕ вызван → C не запустится
    },
    (ctx, next) => {
      stopStack.push('C')
      next()
    },
  )
  await stopComposed({})
  console.log(stopStack) // ['A', 'B']

  console.log('--- Тест 3: Пустой список middleware ---')
  const emptyComposed = middlewares()
  await emptyComposed({}) // ничего не делает, не падает
  console.log('OK — не упало')

  console.log('--- Тест 4: Общий context мутируется всеми ---')
  const counterComposed = middlewares(
    async (ctx, next) => {
      ctx.count = (ctx.count ?? 0) + 1
      await next()
    },
    async (ctx, next) => {
      ctx.count += 10
      await next()
    },
  )
  const ctx4: { count?: number } = {}
  await counterComposed(ctx4)
  console.log(ctx4.count) // 11

  console.log('--- Тест 5: Вариант с .then (middlewaresWithThen) ---')
  const thenStack: string[] = []
  const thenComposed = middlewaresWithThen(
    async (ctx, next) => {
      thenStack.push('1-start')
      await next()
      thenStack.push('1-end')
    },
    async (ctx, next) => {
      thenStack.push('2')
      await next()
    },
  )
  await thenComposed({})
  console.log(thenStack) // ['1-start', '2', '1-end']
}

runTests()

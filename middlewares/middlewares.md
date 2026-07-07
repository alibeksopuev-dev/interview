# Разбор задачи `middlewares` (композиция middleware-функций)

> `middlewares` — функция, которая принимает любое количество middleware-функций и объединяет их в **одну** вызываемую функцию. Скомпонованная функция принимает `context`, возвращает `Promise` и вызывает каждый middleware **по порядку**. Так работает middleware в фреймворках вроде **Koa** и **Express**.

---

## ❓ Зачем вообще нужны middleware

Middleware решают проблему **разделения сквозной логики** (logging, auth, CORS, error handling) от бизнес-логики. Без них пришлось бы копировать один и тот же код проверки токена, логирования и т.д. в каждый обработчик запроса.

Ключевые причины, почему это удобно:

1. **Композиция вместо копипасты** — общую логику (auth, логи, CORS) пишешь один раз, переиспользуешь для всех роутов.
2. **Порядок и контроль потока** — каждый middleware сам решает, пропускать запрос дальше (`next()`) или оборвать цепочку (например, `401` при отсутствии токена) — это как охрана на входе.
3. **"Луковица" даёт код до и после** — тот же `logger` может замерить время **до** и **после** обработки запроса одной функцией, без обёртки try/finally в каждом хендлере.
4. **Расширяемость без изменения ядра** — добавить новую фичу (rate-limiting, кэш) = добавить ещё один middleware в цепочку, не трогая остальные.

Это как конвейер: каждый этап независим, знает только про `context` и `next`, а весь порядок обработки настраивается снаружи одной строкой (`middlewares(errorHandler, logger, auth, handler)`).

---

## 🧠 Что такое middleware — для тех кто только начинает

**Middleware** (промежуточное ПО) — это функция, которая стоит "посередине" между входящим запросом и финальным обработчиком. Через неё проходит поток управления: она может что-то сделать **до** передачи управления дальше, передать управление следующему звену, а потом сделать что-то **после**.

Представьте себе очередь на паспортном контроле в аэропорту:

```
Вы → [проверка билета] → [проверка паспорта] → [проверка багажа] → Самолёт
```

Каждый пункт (middleware) может:
- пропустить вас дальше (вызвать `next()`),
- остановить вас (не вызвать `next()`),
- сделать что-то до и после того, как вы прошли следующие пункты.

Каждый middleware получает два аргумента:

| Аргумент | Что это |
|---|---|
| `context` | Общий объект, который передаётся через ВСЮ цепочку. Middleware читают и мутируют его. |
| `next` | Функция, которая запускает **следующий** middleware. Вызвал → цепочка идёт дальше. Не вызвал → цепочка останавливается. |

```typescript
async function fn1(ctx, next) {
  ctx.stack.push('fn1-start')
  await next()                  // ← передаём управление вниз по цепочке
  ctx.stack.push('fn1-end')     // ← выполнится ПОСЛЕ того как всё нижнее завершилось
}
```

---

## 📌 Введение: в чём идея?

Middleware-композиция — это **управляемый вызовом поток**, а не цикл, который всегда прогоняет все функции. Каждый middleware сам решает, вызывать ли `next()`, и `await next()` приостанавливает текущий middleware, пока не завершится вся нижележащая работа.

### Пример из условия:

```typescript
async function fn1(ctx, next) {
  ctx.stack.push('fn1-start')
  await next()
  ctx.stack.push('fn1-end')
}

async function fn2(ctx, next) {
  ctx.stack.push('fn2-start')
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await next()
  ctx.stack.push('fn2-end')
}

function fn3(ctx, next) {
  ctx.stack.push('fn3-start')
  next()
  ctx.stack.push('fn3-end')
}

const composedFn = middlewares(fn1, fn2, fn3)

const context = { stack: [] }
await composedFn(context)

console.log(context.stack)
// ['fn1-start', 'fn2-start', 'fn3-start', 'fn3-end', 'fn2-end', 'fn1-end']
```

Обратите внимание на порядок в результате — сначала все `-start` идут **вниз**, потом все `-end` идут **вверх**. Это и есть "луковичная" модель.

Эта задача часто встречается на собеседованиях, так как проверяет понимание:
- **Композиции функций** (передача управления через колбэк `next`)
- **Рекурсии** вместо цикла
- **Асинхронного последовательного выполнения** (`async/await`)
- **Замыканий** (каждый вызов скомпонованной функции — независим)

---

## ⏱️ 1. Временная сложность (Time Complexity): `O(N)`

- **`N`** — количество middleware-функций.
- Каждая функция вызывается ровно один раз (при условии, что все вызывают `next()`).
- Само время выполнения зависит от того, что делает каждый middleware внутри (сеть, таймеры), а не от нашей реализации. Мы лишь координируем порядок.

---

## 💾 2. Пространственная сложность (Space Complexity): `O(N)`

- Рекурсия `execute(0) → execute(1) → ... → execute(N)` создаёт **N вложенных вызовов** на стеке (форма "луковицы").
- Каждый приостановленный `await next()` держит свой кадр стека до тех пор, пока нижняя часть не завершится.
- Итого: `O(N)` глубина стека.

---

## 🔬 3. Пошаговый разбор (Трассировка)

### Ментальная модель — "луковица" (onion):

```
        ┌─────────── fn1 ───────────┐
        │  fn1-start                │
        │   ┌──────── fn2 ────────┐ │
        │   │  fn2-start          │ │
        │   │   ┌───── fn3 ─────┐ │ │
        │   │   │ fn3-start     │ │ │
        │   │   │ fn3-end       │ │ │   ← ядро (нет next или конец цепочки)
        │   │   └───────────────┘ │ │
        │   │  fn2-end            │ │
        │   └─────────────────────┘ │
        │  fn1-end                  │
        └───────────────────────────┘

Вход:  fn1-start → fn2-start → fn3-start   (идём внутрь)
Выход: fn3-end   → fn2-end   → fn1-end     (разворачиваемся наружу)
```

### Входные данные:
```typescript
const composedFn = middlewares(fn1, fn2, fn3)
await composedFn({ stack: [] })
```

---

### 🔁 Шаг 1: `execute(0)` — запускается `fn1`

```
index = 0, fn = fn1
Вызываем: fn1(context, next=() => execute(1))

fn1 выполняет:
  ctx.stack.push('fn1-start')   →  stack = ['fn1-start']
  await next()                  →  ПРИОСТАНАВЛИВАЕМСЯ, уходим в execute(1)
  (строка fn1-end пока НЕ выполнена — ждём завершения next)
```

---

### 🔁 Шаг 2: `execute(1)` — запускается `fn2`

```
index = 1, fn = fn2
Вызываем: fn2(context, next=() => execute(2))

fn2 выполняет:
  ctx.stack.push('fn2-start')            →  stack = ['fn1-start', 'fn2-start']
  await new Promise(setTimeout, 1000)    →  ждём 1 секунду (асинхронно!)
  await next()                           →  уходим в execute(2)
  (fn2-end пока НЕ выполнена)
```

---

### 🔁 Шаг 3: `execute(2)` — запускается `fn3`

```
index = 2, fn = fn3
Вызываем: fn3(context, next=() => execute(3))

fn3 выполняет:
  ctx.stack.push('fn3-start')   →  stack = [..., 'fn3-start']
  next()                        →  вызывает execute(3)
```

---

### 🔁 Шаг 4: `execute(3)` — конец цепочки (ядро луковицы)

```
index = 3, fns.length = 3
index === fns.length → return   (просто выходим, ничего не делаем)
```

Это **база рекурсии**. Последний `next()` не запускает ничего — он мгновенно резолвится.

---

### 🔁 Шаг 5: Разворачиваемся наружу (unwind)

Теперь стек начинает "сворачиваться" в обратном порядке:

```
fn3 продолжает после next():
  ctx.stack.push('fn3-end')   →  stack = [..., 'fn3-start', 'fn3-end']
  (fn3 завершился)

fn2 продолжает после `await next()`:
  ctx.stack.push('fn2-end')   →  stack = [..., 'fn2-end']
  (fn2 завершился)

fn1 продолжает после `await next()`:
  ctx.stack.push('fn1-end')   →  stack = [..., 'fn1-end']
  (fn1 завершился)
```

**Финальный стек:**
```
['fn1-start', 'fn2-start', 'fn3-start', 'fn3-end', 'fn2-end', 'fn1-end']
```

---

## 🚫 4. Частая ошибка: `for` вместо рекурсии

Инстинктивно хочется написать цикл:

```typescript
// ❌ НЕПРАВИЛЬНО
for (let i = 0; i < fns.length; i++) {
  await fns[i](context, next)
}
```

**Почему это не работает?**

Цикл всегда прогоняет **все** функции подряд. Но по условию middleware сам решает, вызывать ли `next()` и **когда**. Смысл в том, чтобы "запустить middleware `index`, и если он вызовет `next()`, продолжить с `index + 1` — прежде чем вернуть управление вызвавшему".

`await next()` должен **приостановить** текущий middleware посередине, дождаться всю нижнюю часть цепочки, и только потом продолжить. Цикл такой "паузы посередине" сделать не может — а рекурсия может, потому что каждый уровень держит свой кадр на стеке.

---

## 🔍 4.5. Подробная трассировка вызова (шаг за шагом)

Ниже — **реальный вывод** функции `middlewaresTraced` (версия с логами из [middlewares.ts](middlewares.ts)) для трёх middleware:

```typescript
async function fn1(ctx, next) {
  ctx.stack.push('fn1-start')
  await next()
  ctx.stack.push('fn1-end')
}
async function fn2(ctx, next) {
  ctx.stack.push('fn2-start')
  await new Promise((resolve) => setTimeout(resolve, 100)) // задержка 100мс
  await next()
  ctx.stack.push('fn2-end')
}
function fn3(ctx, next) {          // ← синхронный (нет await)
  ctx.stack.push('fn3-start')
  next()
  ctx.stack.push('fn3-end')
}

await middlewaresTraced(fn1, fn2, fn3)({ stack: [] })
```

### Обозначения в логе:

| Метка | Значение |
|---|---|
| `↓ ВХОД`  | Вызываем middleware `#index` — управление идёт **вниз** |
| `→ NEXT`  | Middleware вызвал `next()`, передаёт управление на уровень ниже |
| `⏸ AWAIT` | Middleware приостановлен на `await next()`, ждёт всю нижнюю цепочку |
| `⌂ ЯДРО`  | Конец цепочки (`index === fns.length`), запускать больше некого |
| `▶ RESUME`| Нижняя часть завершилась, middleware продолжает после `await next()` |
| `↑ ВЫХОД` | Middleware `#index` полностью завершился |

Отступ `│` = глубина рекурсии. `stack=[...]` показывает содержимое `context.stack` в этот момент.

### Полная трассировка:

```
══════════════════════════════════════════════════════════════════════
🚀 СТАРТ. Всего middleware: 3. context = { stack: [] }
══════════════════════════════════════════════════════════════════════
шаг  1 ↓ ВХОД  #0: вызываем middleware #0                  stack=[]
шаг  2 → NEXT  #0: #0 вызвал next() → управление #1        stack=[fn1-start]
шаг  3 ⏸ AWAIT #0: #0 приостановлен, ждёт нижнюю цепочку   stack=[fn1-start]
шаг  4 │  ↓ ВХОД  #1: вызываем middleware #1               stack=[fn1-start]
шаг  5 │  → NEXT  #1: #1 вызвал next() → управление #2     stack=[fn1-start, fn2-start]
шаг  6 │  ⏸ AWAIT #1: #1 приостановлен, ждёт нижнюю цепочку stack=[fn1-start, fn2-start]
шаг  7 │  │  ↓ ВХОД  #2: вызываем middleware #2            stack=[fn1-start, fn2-start]
шаг  8 │  │  → NEXT  #2: #2 вызвал next() → управление #3  stack=[fn1-start, fn2-start, fn3-start]
шаг  9 │  │  ⏸ AWAIT #2: #2 приостановлен, ждёт нижнюю     stack=[fn1-start, fn2-start, fn3-start]
шаг 10 │  │  │  ⌂ ЯДРО #3: конец цепочки, next() пуст      stack=[fn1-start, fn2-start, fn3-start]
шаг 11 │  │  ▶ RESUME #2: нижняя завершилась → #2 после await stack=[..., fn3-start, fn3-end]
шаг 12 │  │  ↑ ВЫХОД #2: middleware #2 завершился          stack=[..., fn3-start, fn3-end]
шаг 13 │  ▶ RESUME #1: нижняя завершилась → #1 после await stack=[..., fn3-end]
шаг 14 │  ↑ ВЫХОД #1: middleware #1 завершился             stack=[..., fn3-end, fn2-end]
шаг 15 ▶ RESUME #0: нижняя завершилась → #0 после await    stack=[..., fn2-end]
шаг 16 ↑ ВЫХОД #0: middleware #0 завершился                stack=[..., fn2-end, fn1-end]
══════════════════════════════════════════════════════════════════════
🏁 ФИНАЛ. stack = ['fn1-start','fn2-start','fn3-start','fn3-end','fn2-end','fn1-end']
══════════════════════════════════════════════════════════════════════
```

### Разбор трассировки по фазам:

**📥 Фаза 1: спуск вниз (шаги 1–10)** — управление уходит вглубь цепочки:
- Шаги 1–3: `fn1` пушит `fn1-start`, вызывает `next()`, приостанавливается на `await`.
- Шаги 4–6: `fn2` пушит `fn2-start`, **ждёт 100мс** (тут между шагами реальная задержка!), затем `next()`, приостанавливается.
- Шаги 7–9: `fn3` пушит `fn3-start`, вызывает `next()`.
- Шаг 10: `execute(3)` — **ядро луковицы**. `index === fns.length`, возвращаемся немедленно.

**📤 Фаза 2: подъём наверх / разворот луковицы (шаги 11–16)** — управление возвращается в обратном порядке:
- Шаги 11–12: `fn3` продолжает после `next()`, пушит `fn3-end`, завершается.
- Шаги 13–14: `fn2` продолжает после `await next()`, пушит `fn2-end`, завершается.
- Шаги 15–16: `fn1` продолжает после `await next()`, пушит `fn1-end`, завершается.

**🔑 Ключевой момент — почему `fn3-end` идёт РАНЬШЕ `fn2-end`:**

Порядок выхода **обратный** порядку входа (LIFO, "последним вошёл — первым вышел"):
```
Вход:  fn1 → fn2 → fn3     (0, 1, 2)
Выход: fn3 → fn2 → fn1     (2, 1, 0)  ← зеркально!
```

Именно поэтому финальный стек имеет "луковичную" форму:
```
fn1-start, fn2-start, fn3-start,  ← спуск (start в прямом порядке)
fn3-end,   fn2-end,   fn1-end     ← подъём (end в обратном порядке)
```

**⏱️ Про асинхронность:** между шагами 5 и 7 (внутри `fn2`) проходит реальная задержка в 100мс от `setTimeout`. Пока `fn2` ждёт, `fn3` ещё **не запущен** — выполнение строго последовательное. Event Loop в это время свободен для других задач, но наша цепочка честно ждёт.

---

## 🔡 5. Разбор типизации TypeScript

### Тип middleware-функции:

```typescript
type MiddlewareFn =
  | ((context: any, next: () => Promise<void>) => Promise<void>)
  | ((context: any, next: () => Promise<void>) => void)
```

**Почему union из двух вариантов?**

Middleware может быть двух видов:

| Вариант | Пример | Возвращает |
|---|---|---|
| **async** | `async function fn1(ctx, next) { await next() }` | `Promise<void>` |
| **sync** | `function fn3(ctx, next) { next() }` | `void` |

Оба варианта должны приниматься. Поэтому тип — это объединение (`|`) обеих сигнатур.

**Почему `next: () => Promise<void>`?**

Чтобы внутри middleware можно было написать `await next()`. Вызов `next()` всегда возвращает промис (потому что `execute` — это `async function`), и `await` на нём приостановит middleware до завершения нижней части цепочки.

### Полная сигнатура:

```typescript
export default function middlewares(...fns: Array<MiddlewareFn>) {
  return async function (context: any = {}): Promise<void> {
    async function execute(index: number): Promise<void> {
      if (index === fns.length) {
        return
      }
      const fn = fns[index]
      await fn(context, () => execute(index + 1))
    }
    await execute(0)
  }
}
```

| Часть | Что делает |
|---|---|
| `...fns: Array<MiddlewareFn>` | Rest-параметр: принимаем любое число middleware |
| `return async function (context = {})` | Возвращаем скомпонованную функцию с дефолтным пустым context |
| `execute(index)` | Рекурсивно запускает middleware по индексу |
| `if (index === fns.length) return` | База рекурсии — конец цепочки |
| `() => execute(index + 1)` | Это и есть `next()` — запускает следующий middleware |

---

## ⚠️ 6. Частая ошибка: `index` снаружи функции

`index` **не должен** быть переменной снаружи возвращаемой функции — иначе все вызовы скомпонованной функции будут делить один `index`, и функцию можно будет вызвать только **один раз**.

```typescript
// ❌ АНТИПАТТЕРН: index — общая переменная
export default function middlewares(...fns) {
  return async function (context = {}) {
    let index = 0  // ← ОШИБКА: общий для всех вызовов
    async function execute() {
      if (index === fns.length) return
      const fn = fns[index]
      index++   // ← после первого вызова index уже = fns.length навсегда
      await fn(context, () => execute())
    }
    await execute()
  }
}
```

Проблема: если вызвать `composedFn(ctx1)`, а потом `composedFn(ctx2)` — второй раз `index` уже равен `fns.length`, и **ничего не запустится**.

**Правильно** — `index` это аргумент `execute(index)`, свой для каждого запуска цепочки. Тогда каждый вызов скомпонованной функции получает свой собственный "проход" по цепочке. Именно это делает скомпонованную функцию переиспользуемой.

---

## 💡 7. Разбор двух подходов

### Подход 1: `async/await` (рекомендуемый)

```typescript
async function execute(index: number): Promise<void> {
  if (index === fns.length) {
    return
  }
  const fn = fns[index]
  await fn(context, () => execute(index + 1))
}
```

**Плюс:** Читается почти как синхронный код. `await` естественно выражает "дождись всей нижней части цепочки".

**Минус:** Требует понимания того, что `await next()` приостанавливает функцию посередине.

---

### Подход 2: только промисы (без async/await)

```typescript
function execute(index: number): Promise<void> {
  if (index === fns.length) {
    return Promise.resolve()
  }
  const fn = fns[index]
  return Promise.resolve(fn(context, () => execute(index + 1)))
}
```

**Плюс:** Не использует `async/await`. `Promise.resolve()` позволяет sync и async middleware идти по одному пути — обычное значение оборачивается в промис, а промис возвращается как есть (идемпотентно).

**Минус:** Менее читаемо, чем `async/await`.

---

## ⚠️ 8. Edge Cases (Граничные случаи)

### 1. Middleware не предоставлены

```typescript
const composed = middlewares()
await composed()
// Ничего не делает, не падает.
```

`execute(0)` сразу видит `index === fns.length` (0 === 0) и выходит.

---

### 2. Синхронный middleware

```typescript
function fn(ctx, next) {
  next()   // вызван синхронно, без await
}
```

Код всё равно работает корректно, даже если `next()` вызван синхронно и не проожидан (`await`). Рекурсивная структура гарантирует правильный порядок.

---

### 3. Middleware не вызывает `next()` → цепочка стоп

```typescript
const composed = middlewares(
  (ctx, next) => { console.log('A'); next() },
  (ctx, next) => { console.log('B') },  // ← не вызвал next()
  (ctx, next) => { console.log('C'); next() },
)
await composed({})
// Вывод: 'A', 'B'   ('C' НЕ запустится)
```

Это **ожидаемое поведение**. Middleware, который не вызывает `next()`, останавливает цепочку — это распространённый приём (например, ранний выход при ошибке аутентификации).

---

### 4. Middleware бросает исключение

```typescript
async function fn(ctx, next) {
  throw new Error('упал')
}
```

Оборачивание каждого вызова в `try/catch` может обработать это аккуратно, но строго спецификацией не требуется. Ошибка пробросится наверх через отклонённый промис.

---

## 🔄 9. Как это связано с очередью микрозадач

Когда middleware делает `await next()`, текущая функция **приостанавливается** и её продолжение планируется в очереди микрозадач. Это позволяет асинхронным операциям (таймерам, сетевым запросам) завершиться перед тем, как цепочка развернётся обратно.

```typescript
async function fn2(ctx, next) {
  ctx.stack.push('fn2-start')
  await new Promise((resolve) => setTimeout(resolve, 1000))  // ← пауза на 1с
  await next()                                                // ← только потом вниз
  ctx.stack.push('fn2-end')
}
```

Здесь `fn3` не запустится, пока `fn2` не отработает свою задержку в 1 секунду. Выполнение **строго последовательное**.

---

## 🌍 10. Применение в реальных проектах

Middleware — это фундамент почти всех серверных фреймворков. Ниже — где именно эта модель используется и какие функции обычно передают.

### Где встречается middleware:

| Фреймворк / инструмент | Что это |
|---|---|
| **Express** | `app.use(fn)` — самый популярный Node.js фреймворк |
| **Koa** | Именно из него взята "луковичная" модель с `await next()` |
| **Redux** | `applyMiddleware(logger, thunk)` — обработка экшенов до редьюсера |
| **Next.js** | `middleware.ts` — перехват запросов на edge |
| **Axios / fetch** | Интерсепторы запросов и ответов |
| **NestJS** | Guards, interceptors, pipes — всё это middleware-подобные слои |

### 🧬 Прямые аналоги нашей функции `middlewares()`

Выше — фреймворки, где *используется* идея middleware вообще. А вот конкретные реализации **той же самой** compose-функции (рекурсивный `execute(index)` с `next()`), максимально близкие к тому, что мы написали:

| Библиотека / место | Чем похожа |
|---|---|
| **`koa-compose`** (npm-пакет) | Эталон — практически то же самое, что наш код: `dispatch(i)` рекурсивно вызывает `fn(context, () => dispatch(i + 1))` |
| **Express Router** (`layer.handle_request`) | Похожий рекурсивный обход слоёв через `next()`, но с доп. веткой `next(err)` для ошибок |
| **Redux `applyMiddleware`** | Похожий compose, но `next` там — не индекс в массиве, а вложенный `dispatch`: `store => next => action => {...}` |
| **tRPC middleware / Fastify hooks** | Тот же принцип "before/after вокруг `next()`" для RPC-вызовов и плагинов |
| **`compose-function` / отдельно взятый `koa-compose`** | Иногда ставят как generic-утилиту вне Koa — просто чтобы получить готовую compose-функцию с такой же сигнатурой |

Если нужно на собеседовании назвать "где эта же функция уже реализована в реальной библиотеке" — правильный ответ: **`koa-compose`**, это буквально тот же алгоритм.

### Типичные middleware-функции (по порядку в цепочке):

Обычно передают функции в таком порядке — от "общих" к "конкретным":

```
1. Логирование      → записать входящий запрос
2. CORS             → выставить заголовки доступа
3. Парсинг тела     → превратить JSON-строку в объект
4. Аутентификация   → проверить токен, найти пользователя
5. Авторизация      → проверить права доступа
6. Валидация        → проверить корректность данных
7. Бизнес-логика    → собственно обработчик
8. Обработка ошибок → поймать всё, что упало (оборачивает остальные)
```

### 📝 1. Логирование (Logger)

Самый частый middleware. Использует луковицу: замеряет время **до** и **после** обработки запроса.

```typescript
async function logger(ctx, next) {
  const start = Date.now()
  console.log(`→ ${ctx.method} ${ctx.url}`)  // до обработки

  await next()                                // ← вся обработка запроса тут

  const ms = Date.now() - start
  console.log(`← ${ctx.status} за ${ms}мс`)   // после обработки
}
```

Обратите внимание: `Date.now()` до и после `await next()` — классический пример, зачем нужна луковичная модель. Без неё измерить полное время обработки было бы невозможно.

### 🔐 2. Аутентификация (Auth) — останавливает цепочку

```typescript
async function auth(ctx, next) {
  const token = ctx.headers['authorization']

  if (!token) {
    ctx.status = 401
    ctx.body = 'Требуется авторизация'
    return  // ← НЕ вызываем next() → цепочка остановлена, обработчик не запустится
  }

  ctx.user = verifyToken(token)  // кладём пользователя в context для следующих middleware
  await next()                   // токен валиден → пропускаем дальше
}
```

Это классическое применение "не вызвать `next()`" — при неудачной аутентификации мы **обрываем** цепочку и не даём запросу дойти до бизнес-логики.

### 🛡️ 3. Обработка ошибок (Error handler) — оборачивает всё

Ставится **первым**, чтобы его `try/catch` оборачивал всю остальную цепочку:

```typescript
async function errorHandler(ctx, next) {
  try {
    await next()  // ← если ЛЮБОЙ middleware ниже бросит ошибку — поймаем здесь
  } catch (err) {
    ctx.status = 500
    ctx.body = { error: err.message }
    console.error('Поймана ошибка:', err)
  }
}
```

Поскольку `await next()` разворачивает всю цепочку, `try/catch` вокруг него ловит ошибки из **любого** нижележащего middleware. Поэтому error handler всегда идёт первым.

### 🌐 4. CORS (заголовки доступа)

```typescript
async function cors(ctx, next) {
  ctx.headers['Access-Control-Allow-Origin'] = '*'
  ctx.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE'
  await next()
}
```

### ✅ 5. Валидация тела запроса

```typescript
async function validateBody(schema) {
  // Фабрика: возвращает middleware, настроенный под конкретную схему
  return async function (ctx, next) {
    const result = schema.safeParse(ctx.body)
    if (!result.success) {
      ctx.status = 400
      ctx.body = 'Некорректные данные'
      return  // ← стоп, дальше не идём
    }
    ctx.validData = result.data
    await next()
  }
}
```

Обратите внимание на приём **фабрики middleware**: `validateBody(schema)` возвращает настроенный middleware. Так же работают, например, `express.json()` или `cors({ origin })`.

### 🔄 6. Axios / fetch — интерсепторы

⚠️ **Важно: это НЕ та же модель, что в Koa/Express.** Тут нет `next()` и нет рекурсивной "луковицы". Интерсепторы axios — это плоский пайплайн промисов (`.then()`-цепочка), а не наша функция `middlewares()`.

```typescript
// request-интерсептор: принимает config, ДОЛЖЕН вернуть (изменённый) config
axios.interceptors.request.use(
  (config) => {
    config.headers['Authorization'] = `Bearer ${getToken()}`
    return config          // ← явный return вместо next()
  },
  (error) => Promise.reject(error),
)

// response-интерсептор: принимает response, ДОЛЖЕН вернуть (изменённый) response
axios.interceptors.response.use(
  (response) => response,  // ← явный return вместо next()
  (error) => {
    if (error.response?.status === 401) refreshToken()
    return Promise.reject(error)
  },
)
```

Под капотом axios просто строит цепочку `.then()`:

```
Promise.resolve(config)
  .then(requestInterceptor1)
  .then(requestInterceptor2)
  .then(actualHttpCall)       // ← сам fetch/XHR
  .then(responseInterceptor1)
  .then(responseInterceptor2)
```

Отличия от рекурсивной модели `middlewares(fn1, fn2, fn3)`:

| | Koa/Express (`middlewares()`) | Axios interceptors |
|---|---|---|
| Передача управления | вызов `next()` внутри функции | `return value` из `.then()`-обработчика |
| Остановка цепочки | не вызвать `next()` | бросить/вернуть `Promise.reject(...)` |
| "До" и "после" одной функцией | да (`await next()` разделяет код) | нет — до/после это **разные** функции (`request` vs `response` интерсепторы) |
| Форма | рекурсия, "луковица" | плоский линейный пайплайн `.then()` |

Поэтому `request` и `response` интерсепторы регистрируются раздельно — в отличие от Koa, где один и тот же middleware естественно содержит код "до" и "после" вокруг `await next()`.

### 🧩 Как это собирается вместе:

```typescript
const app = middlewares(
  errorHandler,   // 1. оборачивает всё в try/catch
  logger,         // 2. логирует время
  cors,           // 3. заголовки
  auth,           // 4. проверяет токен (может оборвать)
  handler,        // 5. бизнес-логика
)

// context = "запрос", проходит через всю цепочку
await app({ method: 'GET', url: '/api/user', headers: { authorization: 'token123' } })
```

**Поток выполнения (луковица):**
```
errorHandler(try) → logger(start) → cors → auth → handler
                                                      ↓
errorHandler(catch) ← logger(end) ← ─────────────── ←
```

Полный рабочий пример этой цепочки — в [middlewares.ts](middlewares.ts), функция `realWorldExample()`.

---

## 📐 Итоговая карточка

```
┌──────────────────────────────────────────────────────────────┐
│                    middlewares: Big O                        │
├──────────────────────────────┬───────────────────────────────┤
│  Временная сложность         │  O(N) — каждый middleware 1 раз│
│  Пространственная сложность  │  O(N) — глубина рекурсии       │
│  Ключевые концепции          │  Композиция функций,          │
│                              │  Рекурсия, Замыкания, async   │
└──────────────────────────────┴───────────────────────────────┘

Ключевые инварианты:
  ✅ Порядок вниз (start) = порядок middleware
  ✅ Порядок вверх (end)  = обратный порядок (луковица)
  ✅ Нет next() → цепочка останавливается
  ✅ Пустой список → ничего не делает, не падает
  ✅ index — аргумент execute, а НЕ общая переменная (переиспользуемость)
```

---

## 🗺️ Схема алгоритма

```
middlewares(...fns)
│
└─ return async (context = {}) =>
   │
   └─ execute(index):
      │
      ├─ [index === fns.length?] ──YES──→ return  (конец цепочки, ядро)
      │
      ├─ fn = fns[index]
      │
      └─ await fn(context, next=() => execute(index + 1))
                          │
                          └─ вызов next() → рекурсивно запускает
                             следующий middleware, приостанавливая текущий
                             (await next()) до завершения нижней части
```

---

## 🔗 Аналогия из жизни

| Концепция | Аналогия |
|---|---|
| middleware | Пункты паспортного контроля в аэропорту |
| `next()` | "Проходите к следующему окошку" |
| не вызвать `next()` | Вас развернули — дальше вы не идёте |
| код до `await next()` | Что проверяют, когда вы **входите** |
| код после `await next()` | Что делают, когда вы **возвращаетесь** (луковица) |
| `context` | Ваш паспорт — его читают и ставят печати все пункты |
```

# Разбор алгоритма `Promise.all()`

> `Promise.all()` — это встроенный метод JavaScript, который принимает массив промисов и возвращает один новый промис. Он выполняется успешно, когда **все** входные промисы выполнены, и немедленно отклоняется, если **хотя бы один** из них отклонён.

---

## 🧠 Что такое промис — для тех кто только начинает

Прежде чем разбирать `Promise.all`, нужно понять, что такое **промис**.

**Промис** — это объект, который представляет "обещание" получить значение в будущем. Думайте о нём как о квитанции из химчистки: вы сдали вещи, получили бумажку (промис). Вещи ещё не готовы — но когда будут, вы придёте с этой бумажкой и заберёте их.

Промис находится в одном из трёх состояний:

```
pending   → "жду" (ещё не завершён)
fulfilled → "выполнен" (есть результат)
rejected  → "отклонён" (произошла ошибка)
```

Важно: как только промис переходит из `pending` в `fulfilled` или `rejected` — **он уже не изменится**. Это называется "settled" (осевший).

```typescript
// Создание промиса вручную
const myPromise = new Promise((resolve, reject) => {
  // Этот колбэк выполняется СИНХРОННО, прямо сейчас
  // resolve(значение) — сигнализирует "готово, вот результат"
  // reject(причина)   — сигнализирует "что-то пошло не так"
  
  setTimeout(() => {
    resolve('готово!') // через 1 секунду промис выполнится
  }, 1000)
})

// Как "забрать" результат промиса:
myPromise.then((result) => {
  console.log(result) // 'готово!'
})

// Или через async/await (более читаемый синтаксис):
const result = await myPromise // ждём пока промис выполнится
console.log(result) // 'готово!'
```

### ❓ Связь `resolve(value)` и `onFulfilled` (из `.then(onFulfilled)`)

Частый вопрос: **Является ли вызов `resolve(result)` непосредственным запуском `onFulfilled`?**

**Нет, это разные этапы.**

* **`resolve(result)`** — это вызов функции управления состоянием, предоставляемой JS-движком. Он переводит промис из состояния `pending` в `fulfilled` и фиксирует результат `result`.
* **`onFulfilled(result)`** — это ваш колбэк, который вы передали в `.then(onFulfilled)`.

**Как они связаны на самом деле:**
1. Вы вызываете `resolve(result)`.
2. Промис переходит в состояние `fulfilled`.
3. JS-движок планирует запуск `onFulfilled(result)`, добавляя его в **очередь микрозадач** (Microtask Queue).
4. Колбэк `onFulfilled` вызывается **асинхронно**, когда стек вызовов очистится.

---

## 📌 Введение: в чём идея `Promise.all`?

Представьте, вам нужно загрузить данные с трёх разных серверов. Если делать это **последовательно** — каждый запрос ждёт, пока завершится предыдущий:

```
запрос 1 → ждём 300мс → запрос 2 → ждём 200мс → запрос 3 → ждём 100мс
Итого: 600мс
```

Если делать **параллельно** через `Promise.all` — все запросы стартуют одновременно:

```
запрос 1 ──────────────── 300мс ──────────────→ ✓
запрос 2 ───────────── 200мс ───────────────→ ✓
запрос 3 ────── 100мс ────────────────────→ ✓
Итого: 300мс (ждём только самый медленный!)
```

```typescript
// Параллельная загрузка данных с трёх эндпоинтов
const [user, posts, tags] = await Promise.all([
  fetch('/api/user').then((r) => r.json()),
  fetch('/api/posts').then((r) => r.json()),
  fetch('/api/tags').then((r) => r.json()),
])
// Все три запроса стартуют одновременно.
// Общее время ожидания = самый медленный запрос, а не сумма всех трёх.
```

Эта задача часто встречается на собеседованиях, так как проверяет понимание:
- **Асинхронного программирования (async/await, Promises)**
- **Конструктора `new Promise()`** и его внутренней механики
- **Сохранения порядка результатов** (независимо от порядка завершения промисов)
- **Продвинутой типизации TypeScript** (Mapped Types, Conditional Types, Generics)

---

## ⏱️ 1. Временная сложность (Time Complexity): `O(N)`

- **`N`** — количество промисов в массиве.
- Мы итерируемся по массиву один раз (`forEach`), привязывая к каждому элементу обработчик `.then()` или `await`.
- Само по себе время разрешения промисов определяется асинхронными операциями, а не нашей реализацией. Алгоритм лишь координирует их.

---

## 💾 2. Пространственная сложность (Space Complexity): `O(N)`

- Мы создаём массив `results` размером `N` для хранения результатов.
- Дополнительно хранится счётчик `unresolved` (O(1)).
- Итого: `O(N)`.

---

## 🔬 3. Пошаговый разбор (Трассировка)

### Ментальная модель:
Представьте себе **стойку в гардеробе**: вы сдаёте `N` вещей (промисов). У каждой вещи есть свой номерок (индекс). Забрать вещи можно только тогда, когда **все** номерки сданы обратно. Если кто-то потерял вещь (rejection) — весь процесс немедленно прерывается.

### Входные данные:
```typescript
const p0 = Promise.resolve(3)        // Выполнится мгновенно
const p1 = 42                        // Не промис, просто значение
const p2 = new Promise((resolve) => {
  setTimeout(() => resolve('foo'), 100) // Выполнится через 100мс
})

await promiseAll([p0, p1, p2]) // Ожидаем: [3, 42, 'foo']
```

---

### 🔁 Шаг 1: Инициализация

Когда мы вызываем `promiseAll([p0, p1, p2])`, внутри функции происходит следующее:

```
1. Создаётся новый "внешний" промис через new Promise(...)
2. Создаётся пустой массив results = [ _, _, _ ]  (3 пустых ячейки)
3. Создаётся счётчик unresolved = 3  (сколько промисов ещё не завершились)
4. Проверяем: unresolved === 0? Нет → продолжаем
```

Зачем нам `unresolved`? Это как счётчик на кассе: мы знаем, сколько покупателей в очереди. Когда счётчик достигнет 0 — все промисы завершились, можно вернуть результат.

---

### 🔁 Шаг 2: Итерация по массиву (`forEach`)

Для каждого элемента мы оборачиваем его в `Promise.resolve()`. Это ключевой приём:

```typescript
Promise.resolve(42)              // → промис со значением 42 (уже выполнен)
Promise.resolve(Promise.resolve(3)) // → тот же самый промис (идемпотентно)
```

Зачем это нужно? Потому что в массиве могут быть **и промисы, и обычные числа/строки**. `Promise.resolve()` позволяет обрабатывать всё через один и тот же код — он либо "оборачивает" обычное значение в промис, либо просто возвращает уже существующий промис как есть.

**Обработчики привязаны к каждому элементу (почти мгновенно):**
```
index=0: обработчик ждёт p0
index=1: обработчик ждёт Promise.resolve(42)
index=2: обработчик ждёт p2
```

Важно понять: `forEach` не "останавливается" и не "ждёт". Он просто прикрепляет обработчики и сразу идёт дальше. Все три промиса начинают ждаться **одновременно**.

---

### 🔁 Шаг 3: `p0` и `p1` выполняются (почти мгновенно)

**Выполняется `p0` (index=0):**
```
value = 3
results[0] = 3  →  results = [3, _, _]
unresolved = 3 - 1 = 2
Проверка: unresolved === 0? Нет.
```

**Выполняется `p1` (index=1):**
```
value = 42
results[1] = 42  →  results = [3, 42, _]
unresolved = 2 - 1 = 1
Проверка: unresolved === 0? Нет.
```

---

### 🔁 Шаг 4: Через 100мс выполняется `p2`

**Выполняется `p2` (index=2):**
```
value = 'foo'
results[2] = 'foo'  →  results = [3, 42, 'foo']
unresolved = 1 - 1 = 0
Проверка: unresolved === 0? ДА! Все промисы завершились!
→ вызывается resolve([3, 42, 'foo'])
```

Внешний промис выполнен. Тот, кто написал `await promiseAll([p0, p1, p2])`, наконец получит `[3, 42, 'foo']`.

---

### 🔁 Сценарий Rejection (немедленный выход):

```typescript
const p0 = Promise.resolve(30)
const p1 = new Promise((_, reject) => setTimeout(() => reject('Ошибка!'), 50))
const p2 = new Promise((resolve) => setTimeout(() => resolve(100), 200))

await promiseAll([p0, p1, p2]) // Отклоняется с 'Ошибка!' через 50мс
```

Что происходит пошагово:
```
~0мс:   p0 выполнился → results[0] = 30, unresolved = 2
~50мс:  p1 отклонился → вызывается reject('Ошибка!')
        Внешний промис мгновенно переходит в rejected
~200мс: p2 выполняется, но... промис уже settled!
        Повторный вызов resolve() игнорируется JavaScript-движком
```

Это важный нюанс: **промис нельзя "вернуть обратно"**. Как только он стал `rejected` — он им останется навсегда. Попытки ещё раз вызвать `resolve()` или `reject()` просто ничего не делают.

---

## 🔡 4. Разбор типизации TypeScript

Эта задача содержит один из самых показательных примеров продвинутой типизации TypeScript. Разберём каждый элемент.

### Полная сигнатура функции:
```typescript
type ReturnValue<T> = { -readonly [P in keyof T]: Awaited<T[P]> }

export default function promiseAll<T extends readonly unknown[] | []>(
  iterable: T,
): Promise<ReturnValue<T>>
```

---

### Что такое Generics (`<T>`) — простыми словами

**Generic** — это "переменная для типа". Вместо того чтобы написать конкретный тип, мы говорим TypeScript: "я не знаю заранее, что сюда придёт — запомни это как `T` и используй дальше".

```typescript
// Без дженерика — работает только с числами:
function identity(x: number): number { return x }

// С дженериком — работает с чем угодно, сохраняя точный тип:
function identity<T>(x: T): T { return x }

identity(42)      // TypeScript знает: вернётся number
identity('hello') // TypeScript знает: вернётся string
```

---

### `T extends readonly unknown[] | []`

**Что это?** Ограничение (constraint) на дженерик `T`. Говорим TypeScript: "Принимай только массивы".

**Зачем `readonly unknown[]`?**

`unknown[]` — массив значений неизвестного типа. Это безопаснее, чем `any[]` — TypeScript хотя бы заставит нас проверить тип перед использованием.

`readonly` нужен, чтобы TypeScript принял **кортежи (tuples)**:

```typescript
// Обычный массив:
const arr = [1, 'hello', true]
// TypeScript видит его тип как: (number | string | boolean)[]

// Кортеж (tuple) — TypeScript знает тип каждого элемента по позиции:
const tuple = [1, 'hello', true] as const
// TypeScript видит его тип как: readonly [number, string, boolean]
//                                ↑↑↑↑↑↑↑↑
//                                обратите внимание: readonly!
```

Без `readonly` в ограничении, TypeScript не смог бы принять кортежи. А кортежи нам нужны, чтобы итоговый тип был точным: `[number, string, boolean]`, а не просто `(number | string | boolean)[]`.

**Зачем `| []`?**

Это специальный хак для TypeScript. Когда TypeScript видит `| []`, он понимает, что `T` — это кортеж **конечной, фиксированной длины** (не просто "массив непонятно какой длины"). Это помогает ему вывести точный тип для каждой позиции в результате.

```typescript
// Без | [] TypeScript выведет:
Promise<(number | string | boolean)[]>  // неточно

// С | [] TypeScript выведет:
Promise<[number, string, boolean]>      // точно!
```

---

### `type ReturnValue<T> = { -readonly [P in keyof T]: Awaited<T[P]> }`

Это **Mapped Type** — один из самых мощных инструментов TypeScript.

**Простая аналогия:** Mapped Type — это как `map()` для типов. Так же как `[1,2,3].map(x => x*2)` проходит по каждому элементу массива и преобразует его, Mapped Type проходит по каждому ключу типа и преобразует соответствующий тип.

**Разбор по частям:**

| Часть | Название | Что делает |
|---|---|---|
| `[P in keyof T]` | Mapped Type | Итерируется по всем ключам типа `T` (для кортежа — это `'0'`, `'1'`, `'2'`, ...) |
| `-readonly` | Modifier | **Удаляет** модификатор `readonly` (знак `-` означает "убрать"). Нужно, чтобы результирующий массив был изменяемым. |
| `Awaited<T[P]>` | Conditional Type | "Разворачивает" промис: `Awaited<Promise<string>>` → `string`, `Awaited<number>` → `number` |

**Визуально, для `T = [Promise<number>, string, Promise<boolean>]`:**
```
ReturnValue<T> = {
  -readonly [0]: Awaited<Promise<number>>  → number
  -readonly [1]: Awaited<string>           → string
  -readonly [2]: Awaited<Promise<boolean>> → boolean
}
// Итог: [number, string, boolean]
```

---

### `Awaited<T[P]>` — встроенная утилита TypeScript

`Awaited<Type>` — это встроенный условный тип (появился в TS 4.5), который рекурсивно "разворачивает" промисы:
- `Awaited<Promise<string>>` → `string`
- `Awaited<Promise<Promise<number>>>` → `number` (работает рекурсивно!)
- `Awaited<boolean>` → `boolean` (не промис — возвращает как есть)

**Зачем он нам?** Потому что `Promise.all` принимает `[Promise<number>, string]`, а возвращает уже готовые значения `[number, string]` — без оберток промисов. `Awaited` описывает именно это преобразование.

---

### `results as ReturnValue<T>`

**Почему нужен `as`?**

`as` — это "приведение типа" (type assertion). Мы говорим TypeScript: "Я знаю лучше тебя, поверь мне — это `ReturnValue<T>`".

TypeScript не может самостоятельно доказать, что `new Array(iterable.length)` после всех присваиваний `results[index] = value` является корректным `ReturnValue<T>`. Это знаем только мы — в runtime всё точно заполнено. Поэтому используется явное приведение в конце.

**Аналогия:** Это как подписать бумагу "Я, Иван, ответственен за это" — TypeScript нам верит, но проверить не может.

---

## 💡 5. Разбор двух подходов

### Подход 1: `async/await` внутри `forEach`
```typescript
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
    reject(err)
  }
})
```

**Плюс:** Читается почти как синхронный код — легко понять что происходит.

**Минус:** `async` функция внутри `forEach` создаёт отдельный "микро-промис" на каждый элемент. Это работает корректно, но поведение менее очевидно для новичков. **Важно:** `forEach` НЕ ждёт `async` колбэк — он просто запускает его и идёт дальше. Это намеренное поведение в нашем случае (мы и хотим параллельность!), но может быть ловушкой в других ситуациях.

---

### Подход 2: `.then()` явно
```typescript
iterable.forEach((item, index) => {
  // Promise.resolve() — идемпотентен для промисов, оборачивает обычные значения.
  Promise.resolve(item).then(
    (value) => {           // onFulfilled — вызывается при успехе
      results[index] = value
      unresolved -= 1
      if (unresolved === 0) {
        resolve(results as ReturnValue<T>)
      }
    },
    (reason) => {          // onRejected — вызывается при ошибке
      reject(reason)
    },
  )
})
```

**Плюс:** Явная передача двух колбэков в `.then(onFulfilled, onRejected)` — это более идиоматичный способ работы с промисами.

**Важный нюанс — `.then(onF, onR)` vs `.then(onF).catch(onR)`:**

```typescript
// Вариант А: два колбэка в .then()
promise.then(onFulfilled, onRejected)
// onRejected ловит только ошибки из САМОГО ПРОМИСА

// Вариант Б: .then().catch()
promise.then(onFulfilled).catch(onRejected)
// onRejected ловит ошибки из промиса И из onFulfilled!
```

Для нашего случая важно использовать Вариант А — мы не хотим случайно поймать ошибки, возникшие в коде самого обработчика.

---

## ⚠️ 6. Edge Cases (Граничные случаи)

### 1. Пустой массив `promiseAll([])`

```typescript
const result = await promiseAll([])
// result = []
```

Что происходит:
- `unresolved = 0` (длина пустого массива)
- Проверка `if (unresolved === 0)` срабатывает **до** `forEach`
- `resolve([])` вызывается **синхронно, немедленно**
- `forEach` по пустому массиву просто не запускается

Это правильное поведение — "все ноль промисов выполнены" истинно немедленно.

---

### 2. Не-промисные значения

```typescript
await promiseAll([42, 'hello', true])
// [42, 'hello', true] — работает как ожидается
```

`await 42` и `Promise.resolve(42)` — оба работают одинаково. JavaScript автоматически "заворачивает" обычные значения, когда вы их `await`-ите. Обработчик вызывается в следующей микрозадаче (microtask), но результат корректно попадает в `results[index]`.

---

### 3. Первый rejection выигрывает

```typescript
await promiseAll([
  new Promise((_, rej) => setTimeout(() => rej('ошибка 1'), 100)),
  new Promise((_, rej) => setTimeout(() => rej('ошибка 2'), 200)),
])
// Выбрасывает: 'ошибка 1'  (не 'ошибка 2'!)
```

Как только `reject('ошибка 1')` вызван, промис переходит в `rejected`. Когда через 200мс приходит `reject('ошибка 2')` — промис уже settled, повторный вызов `reject()` игнорируется движком.

---

### 4. Промисы не отменяются

```typescript
const p2 = fetch('/api/slow-endpoint') // начал запрос к серверу

await promiseAll([
  Promise.reject('упал'),
  p2 // этот fetch продолжает работать на сервере, даже если мы уже получили rejection!
])
```

После rejection все остальные промисы **продолжают работать в фоне** — сетевые запросы идут, таймеры тикают. Результаты просто нигде не сохраняются. Для настоящей отмены нужен `AbortController` — это отдельная тема.

---

## 🔄 7. Как работают микрозадачи (Microtasks) — бонус для глубокого понимания

JavaScript — однопоточный язык. "Параллельность" промисов — это иллюзия, организованная через **Event Loop** (цикл событий).

```
Стек вызовов (Call Stack)          Очередь микрозадач (Microtask Queue)
─────────────────────────          ────────────────────────────────────
runTests()                    →    [пусто]
  promiseAll([p0, p1, p2])   →    [пусто]
    forEach → привязывает         
    обработчики к промисам    →    [колбэки p0 и p1 добавятся сюда]
  ← forEach завершился        
← promiseAll вернул промис    
                              
                              →    Движок проверяет очередь:
                                   [p0.onFulfilled, p1.onFulfilled]
                                   Выполняет p0.onFulfilled → results[0]=3
                                   Выполняет p1.onFulfilled → results[1]=42
                              
                              →    Через 100мс: p2 завершается
                                   [p2.onFulfilled]
                                   Выполняет p2.onFulfilled → results[2]='foo'
                                   unresolved=0 → resolve(results)!
```

**Ключевые моменты:**
- Промисы не "работают параллельно" в смысле многопоточности — JavaScript однопоточен
- Они "параллельны" в смысле того, что не блокируют друг друга в очереди ожидания
- `.then()` колбэки попадают в очередь микрозадач, которая проверяется после каждой задачи

---

## 📐 Итоговая карточка

```
┌──────────────────────────────────────────────────────────────┐
│                    Promise.all: Big O                        │
├──────────────────────────────┬───────────────────────────────┤
│  Временная сложность         │  O(N) — итерация по массиву  │
│  Пространственная сложность  │  O(N) — массив results        │
│  Ключевые концепции          │  Promises, Closures,          │
│                              │  Microtasks, Mapped Types     │
└──────────────────────────────┴───────────────────────────────┘

Ключевые инварианты:
  ✅ Порядок результатов = порядок входных данных
  ✅ Пустой массив → resolve([]) синхронно
  ✅ Первый rejection → немедленный reject внешнего промиса
  ✅ Не-промисы оборачиваются через Promise.resolve()
  ✅ Промис settled → повторные вызовы resolve/reject игнорируются
```

---

## 🗺️ Схема алгоритма

```
promiseAll(iterable)
│
├─ results = new Array(N)
├─ unresolved = N
│
├─ [unresolved === 0?] ──YES──→ resolve([]) немедленно
│
└─ forEach(item, index):
   │
   └─ Promise.resolve(item)
      │
      ├─ .then(value =>
      │    results[index] = value
      │    unresolved--
      │    [unresolved === 0?] ──YES──→ resolve(results) ✓
      │  )
      │
      └─ .catch(err =>
           reject(err)  ✗  ← первый rejection → всё, финал
         )
```

---

# Полный Promise API — справочник по всем методам

---

## 🔴 Promise.all — поведение при ошибке (Fail Fast)

Если хотя бы один промис упал — `Promise.all` немедленно отклоняется. Остальные промисы продолжают работать в фоне, но результаты теряются.

```typescript
try {
  const [a, b, c] = await Promise.all([
    fetchA(),  // OK
    fetchB(),  // ОШИБКА через 800мс
    fetchC(),  // OK, но результат потерян
  ])
} catch (err) {
  console.log(err) // "Network Error"
}
```

**Пошаговый алгоритм:**
1. **Параллельный старт** — все промисы запускаются одновременно в фоновом режиме.
2. **Первое отклонение** — на 800мс падает `fetchB`. Внутри срабатывает `catch`, который вызывает `reject(err)` внешнего промиса.
3. **Игнорирование остальных** — на 1200мс и 1500мс завершаются `fetchC` и `fetchA`. Но внешний промис уже перешёл в статус `rejected`, его состояние изменить нельзя.

**Связь resolve/reject с .then/.catch:**
> Первый же возникший `reject(err)` во внутреннем цикле мгновенно отклоняет весь `Promise.all`. Любые последующие успешные выполнения `resolve()` или другие `reject()` игнорируются, так как состояние промиса уже зафиксировано. Внешние обработчики `.catch()` сработают незамедлительно.

**Big O:**
- Время: `O(N)` — подписка на промисы
- Память: `O(N)` — хранение результатов до первой ошибки

**Ключевой вывод:** Это называется "fail-fast" — провал одного убивает всё. Для устойчивости используй `allSettled`.

---

## 🔵 Promise.allSettled

Ждёт ВСЕ промисы, независимо от результата. Никогда не отклоняется. Возвращает массив объектов со статусом каждого промиса.

```typescript
const results = await Promise.allSettled([
  fetchA(),  // OK
  fetchB(),  // ОШИБКА
  fetchC(),  // OK
])

// results[0] → { status: "fulfilled", value: "A" }
// results[1] → { status: "rejected",  reason: "err" }
// results[2] → { status: "fulfilled", value: "C" }
```

**Ручная реализация:**

```typescript
type SettledResult<T> =
  | { status: "fulfilled"; value: Awaited<T> }
  | { status: "rejected"; reason: any };

export default function promiseAllSettled<T extends readonly unknown[] | []>(
  iterable: T,
): Promise<{ -readonly [P in keyof T]: SettledResult<T[P]> }> {
  return new Promise((resolve) => {
    const results = new Array(iterable.length);
    let unresolved = iterable.length;

    if (unresolved === 0) {
      resolve(results as any);
      return;
    }

    iterable.forEach(async (item, index) => {
      try {
        const value = await item;
        results[index] = { status: "fulfilled", value };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      } finally {
        unresolved -= 1;
        if (unresolved === 0) {
          resolve(results as any);
        }
      }
    });
  });
}
```

**Пошаговый алгоритм:**
1. **Инициализация** — создаётся внешний промис. `reject` не объявляется, так как метод никогда не отклоняется.
2. **Безопасный перехват** — каждый элемент ожидает выполнения. Успех записывается как `{status: "fulfilled", value}`. Сбой перехватывается в `catch` и записывается как `{status: "rejected", reason}`.
3. **Финальный сбор** — в блоке `finally` уменьшается `unresolved`. Когда все элементы обработаны (`unresolved === 0`), вызывается `resolve(results)`.

**Связь resolve/reject с .then/.catch:**
> Функция `reject` во внешнем `new Promise` никогда не вызывается. Все исключения перехватываются в блоке `catch` и превращаются в обычные объекты со свойством `status: "rejected"`. Внешний промис всегда переходит в состояние `fulfilled`, что позволяет обрабатывать результаты в секции `.then()` без риска ухода в `.catch()`.

**Big O:**
- Время: `O(N)` — ожидание всех элементов
- Память: `O(N)` — массив результатов, содержащий описания статусов

**Когда использовать:** нужно собрать ВСЕ результаты, даже если часть упала. Например: массовая загрузка файлов.

---

## 🟡 Promise.race

Возвращает результат ПЕРВОГО завершившегося промиса — неважно, выполнен или отклонён. Остальные промисы продолжают работать, но игнорируются.

```typescript
const result = await Promise.race([
  fetchData(),         // долго
  timeout(3000),       // 3 секунды
])
// Кто первый — тот и выиграл!
```

**Ручная реализация:**

```typescript
export default function promiseRace<T extends readonly unknown[] | []>(
  iterable: T,
): Promise<Awaited<T[number]>> {
  return new Promise((resolve, reject) => {
    if (iterable.length === 0) {
      return; // Оставляем в состоянии pending навсегда (как и нативный Promise.race)
    }

    iterable.forEach(async (item) => {
      try {
        const result = await item;
        resolve(result as Awaited<T[number]>);
      } catch (err) {
        reject(err);
      }
    });
  });
}
```

**Пошаговый алгоритм:**
1. **Запуск гонки** — все промисы запускаются параллельно. Если передан пустой массив, промис зависает в состоянии `pending` навсегда (поведение JS-спецификации).
2. **Первое событие** — как только один из промисов разрешается или отклоняется, его результат передаётся внешнему `resolve()` или `reject()`.
3. **Фиксация состояния** — поскольку промисы одноразовые, все последующие результаты просто игнорируются.

**Связь resolve/reject с .then/.catch:**
> Кто первый вызовет `resolve(result)` или `reject(err)` внутри цикла, тот и определит финальный исход внешнего промиса. После первого вызова состояние фиксируется, и все последующие вызовы от других участников гонки игнорируются.

**Big O:**
- Время: `O(N)` — подписка на все промисы
- Память: `O(1)` — память под результаты не выделяется

**Когда использовать:** таймауты — `Promise.race([fetch(...), timeout(5000)])` — что быстрее?

---

## 🟣 Promise.any

Возвращает результат ПЕРВОГО успешно выполненного промиса. Ошибки игнорируются. Отклоняется только если ВСЕ промисы провалились (`AggregateError`).

```typescript
const data = await Promise.any([
  fetchFromServerA(),  // ОШИБКА
  fetchFromServerB(),  // OK (медленно)
  fetchFromCache(),    // OK (быстро) ← победитель
])
// Первый успех — данные из кеша
```

**Ручная реализация:**

```typescript
export default function promiseAny<T extends readonly unknown[] | []>(
  iterable: T,
): Promise<Awaited<T[number]>> {
  return new Promise((resolve, reject) => {
    let rejectedCount = 0;
    const errors: any[] = [];

    if (iterable.length === 0) {
      reject(new AggregateError([], "All promises were rejected"));
      return;
    }

    iterable.forEach(async (item, index) => {
      try {
        const value = await item;
        resolve(value as Awaited<T[number]>);
      } catch (err) {
        errors[index] = err;
        rejectedCount += 1;
        if (rejectedCount === iterable.length) {
          reject(new AggregateError(errors, "All promises were rejected"));
        }
      }
    });
  });
}
```

**Пошаговый алгоритм:**
1. **Инициализация** — создаётся внешний промис, счётчик `rejectedCount = 0` и массив ошибок `errors`.
2. **Игнорирование ошибок** — если промис падает в `catch`, записываем его ошибку в массив по индексу и инкрементируем счётчик.
3. **Быстрый успех или финальный сбой** — первый успешный промис немедленно вызывает `resolve()`. Если абсолютно все промисы упали, срабатывает условие `rejectedCount === N` и вызывается `reject(new AggregateError(...))`.

**Связь resolve/reject с .then/.catch:**
> Любой первый успешный промис вызывает `resolve(value)`, фиксируя успешное состояние. Внутренний `reject` вызывается только если счётчик ошибок достигает N. При этом создаётся объект `AggregateError`, содержащий все накопленные ошибки. Навешенный `.catch()` сработает только при тотальном сбое.

**Big O:**
- Время: `O(N)` — подписка на промисы
- Память: `O(N)` — для хранения ошибок всех промисов на случай общего сбоя

**Когда использовать:** резервные источники — попробуй сервер A, B, C — возьми ответ самого быстрого живого.

**Отличие от race:**
| | `race` | `any` |
|---|---|---|
| Реагирует на | Первый любой (успех **или** ошибку) | Первый успешный |
| При всех reject | reject с первой ошибкой | reject с `AggregateError` |

---

## ⚫ new Promise() — конструктор

Ручное создание промиса. Внутрь передаётся функция-executor с двумя колбэками: `resolve` (успех) и `reject` (ошибка). Executor запускается **синхронно**.

```typescript
const myPromise = new Promise((resolve, reject) => {
  // Этот код выполняется СИНХРОННО прямо сейчас

  setTimeout(() => {
    const success = Math.random() > 0.3
    if (success) {
      resolve("Готово!")
    } else {
      reject("Что-то пошло не так")
    }
  }, 1000)
})
```

**Практический пример — обёртка setTimeout:**

```typescript
const wait = (ms: number) => {
  return new Promise<void>((resolve, reject) => {
    if (ms < 0) return reject(new Error("Некорректное время"));
    setTimeout(() => {
      resolve(); // сигнализирует об успешном завершении
    }, ms);
  });
};
```

**Пошаговый алгоритм:**
1. **Запуск executor-а** — колбэк, переданный в `new Promise`, выполняется немедленно и синхронно. Асинхронным является только разрешение промиса в будущем.
2. **Связь с Promise.resolve/reject** — вызов `resolve(val)` ведёт себя аналогично `Promise.resolve(val)` (если `val` не является промисом). Вызов `reject(err)` — аналогично `Promise.reject(err)`.
3. **Связь с .then/.catch** — как только вызван один из колбэков, среда выполнения планирует запуск соответствующих методов-слушателей в очереди микрозадач.

**Связь resolve/reject с .then/.catch:**
> `resolve` и `reject` — это системные функции JavaScript, передаваемые в executor. Вызов `resolve(x)` переводит состояние из `pending` в `fulfilled` и вызывает обработчики `.then()`. Вызов `reject(e)` переводит его в `rejected` и активирует цепочку `.catch()`. Вызов `.finally()` сработает при любом исходе после очистки текущей микрозадачи.

**Big O:**
- Время: `O(1)` — создание экземпляра промиса
- Память: `O(1)` — выделение памяти под внутреннее состояние

**Когда использовать:** когда нужно обернуть callback-based API (`setTimeout`, `XMLHttpRequest`, `fs.readFile`) в промис.

---

## 🟢 Promise.resolve / Promise.reject

`Promise.resolve(value)` создаёт уже выполненный промис. `Promise.reject(reason)` — уже отклонённый.

```typescript
// Уже выполненный промис:
const p1 = Promise.resolve(42)
await p1 // → 42 (мгновенно)

// Уже отклонённый промис:
const p2 = Promise.reject(new Error("fail"))
await p2 // → throws Error("fail")

// Идемпотентность:
Promise.resolve(p1) === p1 // true (тот же объект)
```

**Эквиваленты через конструктор:**

```typescript
const myResolve = (value) => new Promise((resolve) => resolve(value));
const myReject = (reason) => new Promise((_, reject) => reject(reason));

// Проверка идемпотентности:
const original = Promise.resolve(10);
console.log(Promise.resolve(original) === original); // true
```

**Пошаговый алгоритм:**
1. **Прямой переход** — промис создаётся сразу в состоянии `fulfilled` или `rejected` без нахождения в состоянии `pending`.
2. **Идемпотентность** — если передать промис в `Promise.resolve()`, он возвращается как есть. Это полезно, чтобы гарантировать, что переменная является промисом, не создавая лишних обёрток.

**Связь resolve/reject с .then/.catch:**
> `Promise.resolve(val)` — это короткая запись для `new Promise(r => r(val))`, за исключением того, что если `val` уже является промисом, `Promise.resolve` вернёт его без изменений (идемпотентность). Они напрямую переходят в `fulfilled/rejected` и запускают `.then()/.catch()` в следующей микрозадаче.

**Big O:**
- Время: `O(1)` — создание предрешённого промиса
- Память: `O(1)` — константная память

---

## 🔗 .then / .catch / .finally — методы экземпляра

Методы экземпляра промиса. `.then(onFulfilled, onRejected)` — обрабатывает успех/ошибку. `.catch(onRejected)` — только ошибки. `.finally(fn)` — выполняется всегда.

```typescript
fetch("/api/user")
  .then(res => res.json())      // парсим JSON
  .then(user => user.name)      // берём имя
  .catch(err => "Гость")        // при ошибке — дефолт
  .finally(() => setLoading(false)) // всегда
```

**Имитация создания нового промиса в цепочке:**

```typescript
const myThen = (onFulfilled) => {
  return new Promise((resolve, reject) => {
    // При успехе текущего промиса вызывается onFulfilled:
    try {
      const result = onFulfilled(currentValue);
      resolve(result); // возвращаем новый выполненный промис
    } catch (err) {
      reject(err); // если упало — новый промис отклонён
    }
  });
};
```

**Пошаговый алгоритм:**
1. **Создание нового промиса** — каждый вызов `.then()`, `.catch()`, `.finally()` возвращает новый промис. Это позволяет строить последовательные цепочки асинхронных шагов.
2. **Перехват ошибок с помощью .catch** — `.catch(fn)` эквивалентен `.then(null, fn)`. Он ловит ошибку на любом предыдущем шаге цепочки, если она не была обработана ранее.
3. **Нейтральный .finally** — функция в `.finally` не принимает аргументов и её возвращаемое значение игнорируется (если она не бросает ошибку), позволяя пробросить результат цепочки далее.

**Связь resolve/reject с .then/.catch:**
> Каждый вызов `.then()` или `.catch()` создаёт новый промис и возвращает его. Если колбэк внутри возвращает обычное значение, созданный промис переходит в `fulfilled(значение)`. Если возвращает промис — перенимает его состояние. Если выбрасывает исключение `throw` — автоматически вызывает `reject(error)`. Метод `.finally(fn)` пропускает исходное значение дальше, не изменяя его.

**Big O:**
- Время: `O(M)` — где M это длина цепочки вызовов
- Память: `O(M)` — каждый вызов `.then/.catch` возвращает новый промис

**Важный нюанс — `.then(onF, onR)` vs `.then(onF).catch(onR)`:**

```typescript
// Вариант А: два колбэка в .then()
promise.then(onFulfilled, onRejected)
// onRejected ловит только ошибки из САМОГО ПРОМИСА

// Вариант Б: .then().catch()
promise.then(onFulfilled).catch(onRejected)
// onRejected ловит ошибки из промиса И из onFulfilled!
```

---

## 📊 Сводная таблица всех методов

| Метод | Ждёт | Результат при успехе | Результат при ошибке | Когда использовать |
|---|---|---|---|---|
| `Promise.all` | Всех | `[val1, val2, ...]` | reject с первой ошибкой | Нужны все данные |
| `Promise.allSettled` | Всех | `[{status, value/reason}]` | Никогда не reject | Нужны все попытки |
| `Promise.race` | Первого (любого) | Первое значение | Первая ошибка | Таймаут |
| `Promise.any` | Первого успешного | Первое значение | `AggregateError` | Резервные источники |
| `Promise.resolve` | — | Готовый fulfilled | — | Обернуть значение |
| `Promise.reject` | — | — | Готовый rejected | Тесты, заглушки |
| `new Promise()` | Вручную | Через `resolve(val)` | Через `reject(err)` | Обернуть callback API |

---

## ⚠️ Граничные случаи всех методов

```typescript
Promise.all([])         // → resolve([]) синхронно
Promise.allSettled([])  // → resolve([]) синхронно
Promise.race([])        // → pending навсегда (никогда не resolve!)
Promise.any([])         // → AggregateError немедленно

Promise.resolve(somePromise)   // → тот же промис (идемпотентен)
Promise.all([1, "str", true])  // числа/строки оборачиваются через Promise.resolve()
```

---

## 🔗 Аналогии из жизни

| Метод | Аналогия |
|---|---|
| `Promise.all` | Сдал 3 вещи в химчистку, жди пока все готовы. Одна потерялась — никто ничего не отдаёт |
| `Promise.allSettled` | Отправил 3 письма. Жди ответа на все — пришёл ли ответ или «не доставлено» |
| `Promise.race` | Несёшь ноутбук в 3 сервисных центра. Кто первый позвонит — к тому и едешь |
| `Promise.any` | Спрашиваешь у 3 друзей дорогу. Первый, кто знает — отвечает. Незнание одного ничего не значит |
| `new Promise()` | Сам пишешь квитанцию и сам решаешь когда написать «готово» или «ошибка» |

---

## 🎯 onFulfilled и onRejected — колбэки внутри .then()

### Что это такое

`onFulfilled` и `onRejected` — два необязательных колбэка, которые передаются в `.then()`:

```javascript
promise.then(onFulfilled, onRejected)
```

| Колбэк | Когда вызывается | Что получает |
|---|---|---|
| `onFulfilled` | Промис выполнен (fulfilled) | Значение из `resolve(value)` |
| `onRejected` | Промис отклонён (rejected) | Причина из `reject(reason)` |

Оба необязательны. Можно передать только один:

```javascript
promise.then(onFulfilled)          // только успех
promise.then(null, onRejected)     // только ошибка (= .catch)
promise.then(onFulfilled, onRejected) // оба случая
```

---

### Что возвращает .then()

`.then()` **всегда возвращает новый промис**. Его состояние зависит от того, что произошло внутри колбэка:

```javascript
// 1. Колбэк вернул обычное значение → новый промис fulfilled(значение)
promise.then(val => val * 2)
// если promise → 5, новый промис → 10

// 2. Колбэк вернул промис → новый промис "перенимает" его состояние
promise.then(val => fetch('/api/data'))
// новый промис ждёт fetch, потом принимает его результат

// 3. Колбэк бросил ошибку → новый промис rejected(ошибка)
promise.then(val => { throw new Error('упс') })
// новый промис → rejected('упс')

// 4. Колбэк не передан (null/undefined/пустой вызов) → значение/ошибка проходит насквозь
promise.then() 
// новый промис = копия исходного по значению/состоянию
```

#### ❓ Можно ли ничего не передавать в `.then()`?

**Да, абсолютно.** Вызов `promise.then()` без аргументов (или `promise.then(null, null)`) полностью валиден. В этом случае происходит **проброс значения (pass-through)**:

```javascript
// Значение проходит насквозь:
Promise.resolve(42)
  .then() // ничего не передали
  .then(val => console.log(val)) // выведет: 42

// Ошибка проходит насквозь:
Promise.reject("ошибка")
  .then() // ничего не передали
  .catch(err => console.log(err)) // выведет: "ошибка"
```

**Как это работает внутри JS:**
Если аргумент не является функцией, JS-движок негласно подставляет дефолтные заглушки:
* Вместо отсутствующего `onFulfilled`: `value => value` (возвращает значение как есть).
* Вместо отсутствующего `onRejected`: `reason => { throw reason; }` (пробрасывает ошибку дальше).

---

### Пошаговый пример

```javascript
Promise.resolve(1)
  .then(val => val + 1)      // onFulfilled: 1 → 2
  .then(val => val * 3)      // onFulfilled: 2 → 6
  .then(val => {
    throw new Error('сбой') // бросаем ошибку
  })
  .then(
    val => console.log('успех:', val),   // onFulfilled — НЕ вызовется
    err => console.log('ошибка:', err),  // onRejected — вызовется с Error('сбой')
  )
```

---

### Ключевое отличие: `.then(onF, onR)` vs `.then(onF).catch(onR)`

Это самый частый источник ошибок:

```javascript
// Вариант А
promise.then(onFulfilled, onRejected)
```

`onRejected` поймает ошибки только из **исходного `promise`**.  
Если ошибка возникнет внутри `onFulfilled` — она НЕ попадёт в `onRejected`.

```javascript
// Вариант Б
promise.then(onFulfilled).catch(onRejected)
```

`onRejected` (через `.catch`) поймает ошибки из **исходного промиса** И из **`onFulfilled`**.

**Наглядно:**

```javascript
const p = Promise.resolve('ok')

// Вариант А — onRejected НЕ сработает на ошибку внутри onFulfilled:
p.then(
  val => { throw new Error('ошибка в onFulfilled') },
  err => console.log('поймал:', err)  // НЕ вызовется!
)
// Необработанная ошибка улетит дальше по цепочке

// Вариант Б — catch поймает всё:
p.then(val => { throw new Error('ошибка в onFulfilled') })
 .catch(err => console.log('поймал:', err))  // ✅ вызовется
```

**Когда использовать Вариант А:**  
Внутри `Promise.all`, когда хочешь поймать ошибки только из конкретного промиса, но не из обработчика.

**Когда использовать Вариант Б:**  
В большинстве пользовательского кода — `.catch()` в конце цепочки как общий обработчик ошибок.

---

### Пропуск (pass-through) — если колбэк не передан

Если `onFulfilled` или `onRejected` не переданы (или переданы `null`/`undefined`), значение или ошибка **проходят сквозь** `.then()` к следующему звену цепочки:

```javascript
Promise.resolve(42)
  .then(null, null)       // нет колбэков → 42 проходит насквозь
  .then(val => val + 1)   // val = 42, результат = 43

Promise.reject('ошибка')
  .then(val => val)       // onFulfilled есть, но rejected → пропускается
  .catch(err => err)      // ловит 'ошибка'
```

Именно так работает `.catch(fn)` — это просто `.then(null, fn)` под капотом.

---

### Связь с очередью микрозадач

Колбэки `onFulfilled` и `onRejected` **никогда не вызываются синхронно**, даже если промис уже settled:

```javascript
const p = Promise.resolve('готово')

p.then(val => console.log('2:', val)) // запланировано в microtask queue

console.log('1: синхронно')

// Вывод:
// 1: синхронно
// 2: готово
```

Это гарантия спецификации — `.then()` всегда асинхронен. Каждый `onFulfilled`/`onRejected` добавляется в очередь микрозадач и выполняется после завершения текущего синхронного кода.

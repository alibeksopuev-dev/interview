# Разбор алгоритма Debounce и Big O

---

## Что такое Debounce?

**Debounce** — техника управления частотой вызовов функции.

Если debounced-функцию вызывают несколько раз подряд, реальный вызов `func` произойдёт только один раз — через `wait` мс **после последнего** вызова.

**Аналогия из жизни:** кнопка «Держать дверь открытой» в лифте. Пока кто-то её нажимает — дверь не закрывается. Только после того, как перестали нажимать и прошло X секунд — дверь закрывается (func вызывается).

---

## Ключевые концепции

| Концепция | Роль в debounce |
|-----------|----------------|
| **Замыкание (closure)** | `timeoutID` живёт между вызовами — каждый новый вызов видит один и тот же ID |
| **`setTimeout`** | Планирует отложенный вызов `func` |
| **`clearTimeout`** | Отменяет предыдущий таймер — сбрасывает отсчёт |
| **`this`** | Должен быть таким же, как у вызывателя — передаётся через `apply` |
| **`...args`** | Берутся из **последнего** вызова (не первого) |

---

## TypeScript-типизация

### Проблема с `Function`

Наивная сигнатура `debounce(func: Function): Function` теряет информацию о типах аргументов. TypeScript не сможет проверить, правильно ли вы вызываете debounced-функцию.

### Строгая версия через Generic

```ts
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void
```

Разбор каждого элемента:

---

#### `T extends (...args: any[]) => any`

**Generic с ограничением (constraint).** `T` — это не просто "любой тип", а только тип-функция.

```ts
// ✅ T может быть:
(query: string, limit: number) => Promise<User[]>
(event: MouseEvent) => void
() => number

// ❌ T не может быть:
string   // не функция — TS ошибка
number   // не функция — TS ошибка
```

Ограничение нужно чтобы `Parameters<T>` и `ReturnType<T>` работали — они требуют функцию.

---

#### `Parameters<T>`

**Встроенный utility type.** Извлекает типы аргументов функции `T` в виде tuple.

```ts
type F = (query: string, limit: number) => Promise<User[]>

Parameters<F>  // → [query: string, limit: number]

// Под капотом:
type Parameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never
// infer P — TS "вытаскивает" тип аргументов из сигнатуры T в переменную P
```

Возвращаем `(...args: Parameters<T>) => void` — дебаунсированная функция принимает **те же аргументы**, что и оригинал. TS теперь проверяет типы на вызове.

---

#### `ReturnType<typeof setTimeout>`

**Кросс-платформенный тип ID таймера.**

```ts
// Браузер:  setTimeout возвращает number
// Node.js:  setTimeout возвращает NodeJS.Timeout (объект)

// Поэтому НЕ пишем:
let timeoutID: number | null = null       // ❌ сломается в Node.js

// А пишем:
let timeoutID: ReturnType<typeof setTimeout> | null = null  // ✅ везде работает

// typeof setTimeout — берёт тип самой функции setTimeout
// ReturnType<...>   — извлекает тип её возвращаемого значения
```

---

#### `this: any` — фиктивный параметр

TypeScript позволяет объявить `this` первым параметром функции — это **не реальный параметр** (в JS его нет), только аннотация для компилятора.

```ts
return function (this: any, ...args: Parameters<T>) { ... }
//               ^^^^^^^^
//               Говорит TS: "эта функция может быть вызвана с любым this"
//               Без этого TS в strict-режиме ругается на использование this внутри
```

---

#### `null ?? undefined`

`clearTimeout` принимает `number | undefined`, но **не принимает `null`**.

```ts
clearTimeout(null)       // ❌ TypeScript Error: не тот тип
clearTimeout(undefined)  // ✅ no-op (безопасная операция)
clearTimeout(timeoutID ?? undefined)  // ✅ null → undefined, число → число
```

---

### Вывод типов в действии

TypeScript **автоматически** выводит `T` из переданного аргумента:

```ts
async function fetchUsers(query: string, limit: number): Promise<User[]> { ... }

const debouncedFetch = debounce(fetchUsers, 300)
//    ↑ T = (query: string, limit: number) => Promise<User[]>
//    Parameters<T> = [query: string, limit: number]
//    debouncedFetch: (query: string, limit: number) => void

debouncedFetch("react", 10)  // ✅ корректно
debouncedFetch(42, 10)       // ❌ TS Error: number не совместим со string
debouncedFetch("react")      // ❌ TS Error: не хватает аргумента limit
```

---

### `Function` vs Generic — сравнение

| | `func: Function` | `func: T extends (...)` |
|---|---|---|
| Проверка типов аргументов | ❌ Нет | ✅ Да |
| Автодополнение в IDE | ❌ Нет | ✅ Да |
| Читаемость сигнатуры | Проще | Сложнее |
| Безопасность | Слабая | Строгая |
| Когда использовать | Прототип / учебный пример | Продакшен / библиотека |

---

## Две реализации

### Реализация 1 — сохраняем `this` в переменную `context`

```ts
return function (this: any, ...args: any[]) {
  const context = this;           // ← сохраняем до входа в setTimeout
  clearTimeout(timeoutID ?? undefined);
  timeoutID = setTimeout(function () {
    func.apply(context, args);    // ← используем сохранённый context
  }, wait);
};
```

Внутри `setTimeout(function() {...})` своя область — `this` там был бы `undefined` (strict) или `globalThis`. Поэтому нужна переменная `context`.

---

### Реализация 2 — стрелочная функция в setTimeout

```ts
return function (this: any, ...args: any[]) {
  clearTimeout(timeoutID ?? undefined);
  timeoutID = setTimeout(() => {   // ← стрелка, нет своего this
    func.apply(this, args);        // ← this берётся из обёртки выше
  }, wait);
};
```

Стрелочная функция не имеет собственного `this` — она захватывает его **лексически** из объемлющей `function`. Переменная `context` не нужна.

> **Важно:** сама обёртка (`return function`) не должна быть стрелкой — иначе `this` зафиксируется навсегда (в момент создания debounce), а не в момент каждого вызова.

---

## Пошаговая трассировка

### Пример 1: Одиночный вызов

```
let i = 0;
const debouncedIncrement = debounce(() => i++, 100);
```

```
t =   0ms  →  debouncedIncrement()
              clearTimeout(null)          — нет предыдущего таймера, ничего не происходит
              timeoutID = setTimeout(..., 100)  — запланировали вызов на t=100

t =  50ms  →  i всё ещё 0 (таймер ещё не сработал)

t = 100ms  →  setTimeout срабатывает
              timeoutID = null
              func.apply(context, args)  — i++ → i = 1
```

**Итог: i = 1**

---

### Пример 2: Два вызова подряд — второй сбрасывает таймер первого

```
t =   0ms  →  debouncedIncrement()
              clearTimeout(null)          — нет таймера
              timeoutID = setTimeout(#1, 100)   — таймер #1 на t=100

t =  50ms  →  debouncedIncrement()
              clearTimeout(#1)            — ОТМЕНЯЕМ таймер #1 !
              timeoutID = setTimeout(#2, 100)   — новый таймер #2 на t=150

t = 100ms  →  Таймер #1 уже отменён — ничего не происходит, i = 0

t = 150ms  →  Таймер #2 срабатывает
              func.apply(context, args)  — i++ → i = 1
```

**Итог: i = 1** (хотя вызывали дважды — func выполнилась один раз)

---

### Пример 3: Серия быстрых вызовов (поиск по мере ввода)

```
const search = debounce(fetchResults, 300);

t =   0ms  →  search("р")      → clearTimeout(null),  таймер #1 на t=300
t =  80ms  →  search("ре")     → clearTimeout(#1),    таймер #2 на t=380
t = 150ms  →  search("реа")    → clearTimeout(#2),    таймер #3 на t=450
t = 230ms  →  search("реак")   → clearTimeout(#3),    таймер #4 на t=530
t = 310ms  →  search("реакт")  → clearTimeout(#4),    таймер #5 на t=610

t = 610ms  →  Таймер #5 срабатывает → fetchResults("реакт")
```

**Итог:** Только **один** HTTP-запрос с финальным словом «реакт», вместо 5 запросов.

---

## Разбор кода с комментариями

```ts
export function debounceV2(func: Function, wait: number = 0): Function {
  //  ┌─ замыкание: timeoutID живёт между всеми вызовами debounced-функции
  let timeoutID: ReturnType<typeof setTimeout> | null = null;
  //  └─ null = нет активного таймера

  //  Обычная function (НЕ стрелка) — this определяется в момент вызова
  return function (this: any, ...args: any[]) {
    //  Отменяем предыдущий таймер.
    //  clearTimeout(null) / clearTimeout(undefined) — безопасно, это no-op
    clearTimeout(timeoutID ?? undefined);

    //  Планируем НОВЫЙ вызов через wait мс
    //  Стрелка внутри захватывает this из объемлющей function (↑)
    timeoutID = setTimeout(() => {
      timeoutID = null;          // сигнал: таймер отработал
      func.apply(this, args);    // вызываем func с правильным this и аргументами
    }, wait);
    //  Старый таймер отменён → func НЕ будет вызвана "по старому расписанию"
    //  Только этот новый таймер может вызвать func
  };
}
```

---

## Типичные ошибки

| Ошибка | Что сломается |
|--------|--------------|
| Обёртка — стрелочная функция | `this` зафиксируется навсегда при создании debounce, не при вызове |
| Не сохранять `this` (V1) / не использовать стрелку (V2) | `func` получит неправильный `this` — баг в методах объектов |
| Не вызывать `clearTimeout` | Таймеры накапливаются, func вызывается несколько раз |
| Использовать первые `args`, не последние | Потеря актуального ввода пользователя |

---

## Big O

### Временная сложность: `O(1)` на каждый вызов

| Операция | Сложность |
|----------|-----------|
| `clearTimeout` | `O(1)` |
| `setTimeout` | `O(1)` |
| Итого на вызов | **`O(1)`** |

Сама функция `func` вызывается только один раз в конце — её сложность не входит в debounce.

### Пространственная сложность: `O(1)`

Хранится только одна переменная `timeoutID` в замыкании — независимо от количества вызовов. `args` перезаписываются каждый раз, а не накапливаются.

---

## Где применяется Debounce

| Сценарий | wait |
|----------|------|
| Поиск по мере ввода (input → API) | 300–500 мс |
| Автосохранение черновика | 1000–2000 мс |
| Resize/scroll обработчики | 100–200 мс |
| Валидация поля после ввода | 300–500 мс |

---

## Debounce vs Throttle

| | **Debounce** | **Throttle** |
|---|---|---|
| Когда вызывается func | После паузы в вызовах | С фиксированным интервалом |
| Гарантия вызова | Только если вызовы прекратились | Минимум раз в N мс |
| Применение | Поиск, автосохранение | Scroll, resize, rate-limit |
| Аналогия | Лифт ждёт последнего пассажира | Лифт уходит строго по расписанию |

---

## React: реальные примеры из продакшена

### Паттерн 1 — `useDebouncedValue` (переиспользуемый хук)

```tsx
export const useDebouncedValue = (
  value: string | number | boolean,
  timeout: number,
) => {
  // Держим "тихое" значение — обновляется только после паузы
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    // Каждый раз когда value меняется — планируем обновление через timeout мс
    const timeoutID = setTimeout(() => {
      setDebouncedValue(value);
    }, timeout);

    // Cleanup: если value снова изменится ДО истечения timeout —
    // предыдущий таймер отменяется, новый запускается заново
    // Это и есть debounce: сбрасываем счётчик при каждом изменении
    return () => {
      clearTimeout(timeoutID);
    };
  }, [value, timeout]); // эффект перезапускается при каждом новом value

  return debouncedValue;
};
```

**Трассировка** — пользователь быстро вводит "react":

```
value="r"    → useEffect запускает таймер #1 (timeout=300)
value="re"   → cleanup отменяет #1, запускает таймер #2
value="rea"  → cleanup отменяет #2, запускает таймер #3
value="reac" → cleanup отменяет #3, запускает таймер #4
value="react"→ cleanup отменяет #4, запускает таймер #5

через 300мс → таймер #5 срабатывает → setDebouncedValue("react")
             → ререндер → debouncedValue = "react"
```

**Ключевой момент:** `return () => clearTimeout(timeoutID)` — это cleanup функция `useEffect`. React вызывает её перед каждым следующим запуском эффекта. Без неё все таймеры накопились бы и `setDebouncedValue` вызывался бы 5 раз.

---

### Паттерн 2 — `InputField` с debounce через хук

```tsx
export const InputField: React.FC<InputFieldProps> = ({
  onChange,
  debounceTimeout = 0, // если 0 — debounce отключён
  ...rest
}) => {
  const [inputValue, setInputValue] = React.useState('');

  // inputValue меняется на каждый keystroke, но debouncedValue —
  // только после паузы debounceTimeout мс
  const debouncedValue = useDebouncedValue(inputValue, debounceTimeout);

  React.useEffect(() => {
    // Этот эффект срабатывает только когда debouncedValue "устоялось"
    // т.е. пользователь перестал печатать на debounceTimeout мс
    if (onChange && debounceTimeout) {
      onChange({
        target: { id: rest.id, name: rest.name, value: debouncedValue },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [debouncedValue]); // НЕ зависит от inputValue напрямую

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value); // обновляем сразу — для отображения в UI

    // Если debounce не нужен (timeout=0) — вызываем onChange немедленно
    if (onChange && !debounceTimeout) {
      onChange(event);
    }
  };

  // ...
};
```

**Схема потока данных:**

```
Пользователь печатает
       ↓
handleChange → setInputValue("react")   ← UI обновляется мгновенно
       ↓
useDebouncedValue следит за inputValue
       ↓ (пауза 300мс)
debouncedValue = "react"
       ↓
useEffect → onChange({ value: "react" }) ← внешний обработчик вызван один раз
```

**Зачем два состояния (`inputValue` и `debouncedValue`)?**
- `inputValue` — для `<input value={inputValue}>`. Без него поле будет "лагать", пропуская символы.
- `debouncedValue` — для `onChange` наружу. Родительский компонент получает только финальное значение.

---

### Паттерн 3 — Inline debounce для поиска клиентов (Autocomplete + RTK Query)

```tsx
// Два состояния: "живой" ввод и "осевшее" значение для запроса
const [customerSearchInput, setCustomerSearchInput] = useState('')
const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('')

useEffect(() => {
  // Запускаем таймер при каждом изменении customerSearchInput
  const timer = setTimeout(() => {
    setDebouncedCustomerSearch(customerSearchInput) // → триггерит RTK Query
  }, 300)
  return () => clearTimeout(timer) // cleanup = отмена предыдущего таймера
}, [customerSearchInput])

// Запрос уходит только с debouncedCustomerSearch — не на каждый символ
const shouldSearchByEmail = debouncedCustomerSearch && isValidEmailFormat(debouncedCustomerSearch)
const { data: customersData } = customersApi.useGetCustomersQuery({
  limit: 25,
  offset: 0,
  // email добавляется только если поиск валидный email-адрес
  ...(shouldSearchByEmail ? { email: debouncedCustomerSearch } : {}),
})
```

**Трассировка — пользователь вводит "user@":**

```
ввод "u"      → setCustomerSearchInput("u")      → таймер #1
ввод "us"     → clearTimeout(#1), таймер #2
ввод "use"    → clearTimeout(#2), таймер #3
ввод "user"   → clearTimeout(#3), таймер #4
ввод "user@"  → clearTimeout(#4), таймер #5

+300ms → setDebouncedCustomerSearch("user@")
       → isValidEmailFormat("user@") = false
       → RTK Query: запрос БЕЗ email (показываем всех, limit 25)

ввод "user@example.com" → ... → setDebouncedCustomerSearch("user@example.com")
       → isValidEmailFormat("user@example.com") = true
       → RTK Query: { email: "user@example.com" } ← только теперь поиск по email
```

**Что даёт debounce здесь:**
- Без debounce: 15 HTTP-запросов при вводе "user@example.com"
- С debounce 300мс: 1–2 запроса (только на "паузах")

**Autocomplete: почему `reason === 'input'`?**

```tsx
onInputChange={(_, newInputValue, reason) => {
  // reason может быть: 'input' | 'reset' | 'clear'
  // 'reset' — когда пользователь выбрал опцию (не надо делать новый поиск)
  // 'clear' — нажата кнопка очистки
  // 'input' — только реальный ввод пользователя → запускаем debounce
  if (reason === 'input') {
    setCustomerSearchInput(newInputValue)
  }
}}
```

Без проверки `reason` — поиск бы запускался и при выборе опции из списка, перетирая выбор.

---

## Сравнение трёх React-паттернов

| | Паттерн 1: хук | Паттерн 2: InputField | Паттерн 3: inline |
|---|---|---|---|
| **Переиспользование** | Максимальное | Компонент | Нет (копипаста) |
| **Гибкость** | Высокая | Средняя | Полная |
| **Сложность** | Низкая | Средняя | Низкая |
| **Когда использовать** | Везде, где нужен debounced state | Компонент формы | Быстрый одноразовый случай |

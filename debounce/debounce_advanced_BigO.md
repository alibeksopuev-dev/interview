# Debounce с cancel() и flush() — Разбор и Big O

---

## Отличие от базового debounce

В базовой версии debounced-функция — просто функция. Здесь она ещё и **объект с методами**:

| Метод | Что делает |
|-------|-----------|
| `cancel()` | Отменяет ожидающий вызов — func не вызовется |
| `flush()` | Немедленно выполняет ожидающий вызов — не дожидаясь таймера |

---

## Ключевая идея: один "ожидающий вызов"

В любой момент времени debounced-функция хранит **не более одного** отложенного вызова. Он описывается тремя переменными в замыкании:

```
timeoutId    — есть ли активный таймер (undefined = нет)
context      — this из последнего вызова
argsToInvoke — аргументы из последнего вызова
```

Все три переменные обновляются вместе при каждом новом вызове. `cancel` и `flush` работают с этим же общим состоянием.

---

## Архитектура: два хелпера

```
clearTimer()  →  отменяет таймер + timeoutId = undefined
invoke()      →  если есть ожидающий вызов → clearTimer() + func.apply()
```

Оба хелпера разделяются между тремя сценариями:

```
таймер истёк  →  setTimeout → invoke()
flush()       →  напрямую  → invoke()
cancel()      →  напрямую  → clearTimer() (invoke не вызывается)
```

---

## Пошаговая трассировка

### Сценарий 1: cancel() — отмена до срабатывания таймера

```
let i = 0
const debouncedIncrement = debounce(() => i++, 100)

t =  0ms  →  debouncedIncrement()
             clearTimer()                 — нет таймера, no-op
             argsToInvoke = [], context = undefined
             timeoutId = setTimeout(invoke, 100)   — таймер #1

t = 50ms  →  debouncedIncrement.cancel()
             = clearTimer()
             clearTimeout(#1)             — таймер отменён
             timeoutId = undefined        — нет активного ожидания

t = 100ms →  invoke не вызван (таймер был отменён)
             i = 0                        — func не выполнялась
```

**Итог: i = 0**

---

### Сценарий 2: flush() — немедленное выполнение

```
let i = 0
const debouncedIncrement = debounce(() => i++, 100)

t =  0ms  →  debouncedIncrement()
             timeoutId = setTimeout(invoke, 100)   — таймер #1

t = 51ms  →  debouncedIncrement.flush()
             = invoke()
             timeoutId == #1 (не null) → продолжаем
             clearTimer()               — clearTimeout(#1), timeoutId = undefined
             func.apply(context, args)  — i++ → i = 1

t = 100ms →  таймер уже отменён в clearTimer() внутри invoke()
             повторного вызова нет
             i = 1
```

**Итог: i = 1** (выполнилось в t=51ms, а не в t=100ms)

---

### Сценарий 3: flush() без активного вызова — no-op

```
t =  0ms  →  debouncedIncrement.flush()
             = invoke()
             timeoutId == undefined → timeoutId == null  ✅
             return  — выходим немедленно, func не вызвана
```

`== null` (не `=== null`) ловит и `null` и `undefined` — оба означают "нет ожидающего вызова".

---

### Сценарий 4: серия вызовов → flush в конце

```
t =  0ms  →  debouncedIncrement()   — таймер #1 на t=100
t = 40ms  →  debouncedIncrement()   — clearTimer(#1), таймер #2 на t=140
t = 80ms  →  debouncedIncrement()   — clearTimer(#2), таймер #3 на t=180

t = 90ms  →  debouncedIncrement.flush()
             invoke() → clearTimer(#3), func.apply() → i = 1

t = 180ms →  таймер #3 уже отменён — повторного вызова нет
```

**Итог: i = 1** в t=90ms вместо t=180ms

---

## Разбор кода с комментариями

```ts
interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void; // сама функция с той же сигнатурой что и оригинал
  cancel: () => void;
  flush: () => void;
}
// Это call signature внутри interface — так описывают "вызываемый объект" в TS
// Обычный interface описывает объект; добавив (...): void делаем его и функцией тоже
```

```ts
let timeoutId: ReturnType<typeof setTimeout> | undefined;
let context: any = undefined;
let argsToInvoke: Parameters<T> | undefined = undefined;
// Три переменные описывают один "ожидающий вызов"
// undefined везде = нет активного ожидания
// Обновляются атомарно в fn() при каждом новом вызове
```

```ts
function clearTimer() {
  clearTimeout(timeoutId); // безопасно с undefined — clearTimeout игнорирует невалидный ID
  timeoutId = undefined;   // сигнал: нет активного таймера
}
// Не сбрасывает context и argsToInvoke — flush() мог бы их использовать
// Но после clearTimer() invoke() сразу выйдет (timeoutId == null) — безопасно
```

```ts
function invoke() {
  if (timeoutId == null) { // == null ловит undefined тоже — нет ожидающего вызова
    return;
  }
  clearTimer();            // важно: сначала отменяем таймер
  func.apply(context, argsToInvoke); // потом вызываем — иначе таймер сработает ещё раз
}
```

```ts
function fn(this: any, ...args: Parameters<T>) {
  clearTimer();        // сбрасываем предыдущий таймер — каждый вызов обнуляет отсчёт
  argsToInvoke = args; // \
  context = this;      //  > обновляем состояние "ожидающего вызова" — всегда последние данные
  timeoutId = setTimeout(function () { //
    invoke();          // по истечении wait → invoke выполнит func
  }, wait);
}
```

```ts
fn.cancel = clearTimer;
fn.flush = invoke;
// JS-функция — это объект. Свойства навешиваются как на любой объект.
// cancel и flush просто ссылаются на уже объявленные функции — не копии, те же самые.
```

```ts
return fn as unknown as DebouncedFunction<T>;
// Двойной каст нужен потому что TS видит fn как Function без cancel/flush
// до момента их присвоения. as unknown снимает ограничения типа,
// as DebouncedFunction<T> говорит TS что теперь это именно наш интерфейс.
```

---

## Отличие от базовой версии

| | Базовый debounce | С cancel/flush |
|---|---|---|
| Переменные замыкания | `timeoutID` | `timeoutId` + `context` + `argsToInvoke` |
| this | сохраняется в `const context` внутри fn | сохраняется в переменной замыкания |
| Отмена вызова | невозможна | `cancel()` |
| Принудительный вызов | невозможен | `flush()` |
| Возвращаемый тип | `(...args) => void` | `DebouncedFunction<T>` (функция + методы) |

**Зачем выносить context в замыкание (а не в const внутри fn)?**
В базовой версии `const context = this` создавался внутри fn и захватывался замыканием `setTimeout`. Здесь `context` вынесен наружу чтобы `invoke()` мог получить к нему доступ — она объявлена на том же уровне, не внутри fn.

---

## Big O

### Временная сложность

| Операция | Сложность |
|----------|-----------|
| Вызов debounced-функции | `O(1)` |
| `cancel()` | `O(1)` |
| `flush()` | `O(1)` + сложность самого `func` |

### Пространственная сложность: `O(1)`

Хранятся ровно три переменные (`timeoutId`, `context`, `argsToInvoke`) — независимо от количества вызовов. `argsToInvoke` перезаписывается каждый раз, не накапливается.

---

## React: useDebouncedCallback с cancel() и flush()

В обычном debounce состояние (`timeoutId`, `context`, `argsToInvoke`) живёт в замыкании функции — один раз при создании. В React компонент рендерится заново при каждом изменении state, и если хранить состояние в замыкании — оно сбросится. Поэтому используем `useRef`.

| | Обычный debounce | React-хук |
|---|---|---|
| Где хранится `timeoutId` | замыкание (`let`) | `useRef` (`.current`) |
| Где хранятся `args/context` | замыкание (`let`) | `useRef` (`.current`) |
| Стабильность ссылки на функцию | всегда (замыкание) | `useCallback` |
| Cleanup при unmount | не нужен | `useEffect` → `return clearTimer` |

### Реализация

```tsx
import { useRef, useCallback, useEffect } from 'react'

type DebouncedCallback<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void; // call signature — та же сигнатура что и оригинал
  cancel: () => void;
  flush: () => void;
}

function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  wait: number,
): DebouncedCallback<T> {

  // useRef — "ящик" который живёт всё время жизни компонента
  // изменение .current НЕ вызывает ререндер (в отличие от useState)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const argsRef    = useRef<Parameters<T> | undefined>(undefined);
  const contextRef = useRef<any>(undefined);

  // useCallback(fn, []) — мемоизирует функцию, одна ссылка на весь цикл жизни компонента
  // без этого: каждый рендер → новый clearTimer → useEffect видит изменение deps → бесконечный цикл
  const clearTimer = useCallback(() => {
    clearTimeout(timeoutRef.current); // безопасно с undefined — no-op
    timeoutRef.current = undefined;   // нет активного таймера
  }, []);

  const invoke = useCallback(() => {
    if (timeoutRef.current == null) { // == null ловит и null и undefined
      return;
    }
    clearTimer();
    callback.apply(contextRef.current, argsRef.current);
  }, [callback, clearTimer]);

  const debounced = useCallback(function (this: any, ...args: Parameters<T>) {
    argsRef.current    = args; // сохраняем в ref — не в замыкание, иначе устареет после рендера
    contextRef.current = this;
    clearTimer();
    timeoutRef.current = setTimeout(invoke, wait);
  }, [wait, callback, clearTimer, invoke]) as DebouncedCallback<T>;

  useEffect(() => {
    debounced.cancel = clearTimer;
    debounced.flush  = invoke;

    return () => clearTimer(); // unmount — отменяем таймер, иначе setState на мёртвом компоненте
  }, [debounced, clearTimer, invoke]);

  return debounced;
}
```

### Пример: поиск с кнопками "Найти сейчас" и "Отмена"

```tsx
function CustomerSearch() {
  const [results, setResults] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Стабильная ссылка — не пересоздаётся при каждом рендере
  // без useDebouncedCallback пришлось бы useRef вручную или терять cancel/flush
  const search = useDebouncedCallback(async (query: string) => {
    if (!query) return
    setIsLoading(true)
    const data = await fetchCustomers(query)
    setResults(data)
    setIsLoading(false)
  }, 300)

  return (
    <div>
      <input
        onChange={e => search(e.target.value)}  // запускает debounce при каждом символе
        placeholder="Поиск клиента..."
      />

      {/* flush: не ждём 300мс — выполняем немедленно текущий ожидающий вызов */}
      <button onClick={search.flush}>Найти сейчас</button>

      {/* cancel: отменяем ожидающий вызов — запрос не уйдёт */}
      <button onClick={search.cancel}>Отмена</button>

      {isLoading && <Spinner />}
      {results.map(c => <div key={c.id}>{c.email}</div>)}
    </div>
  )
}
```

### Трассировка — пользователь вводит "user@" затем нажимает "Найти сейчас"

```
ввод "u"     → search("u")     → clearTimer, таймер #1 на +300мс
ввод "us"    → search("us")    → clearTimer(#1), таймер #2 на +300мс
ввод "use"   → search("use")   → clearTimer(#2), таймер #3 на +300мс
ввод "user"  → search("user")  → clearTimer(#3), таймер #4 на +300мс
ввод "user@" → search("user@") → clearTimer(#4), таймер #5 на +300мс

клик "Найти сейчас" → search.flush() = invoke()
  timeoutRef.current == #5 (не null) → продолжаем
  clearTimer(#5)                     → таймер отменён
  callback.apply(ctx, ["user@"])     → fetchCustomers("user@") немедленно

+300мс → таймер #5 уже отменён — повторного запроса нет
```

### Трассировка — пользователь нажимает "Отмена"

```
ввод "user@" → таймер #5 активен

клик "Отмена" → search.cancel() = clearTimer()
  clearTimeout(#5)           → таймер отменён
  timeoutRef.current = undefined

+300мс → invoke не вызван, fetchCustomers не вызван
```

### Ключевые отличия от `useDebouncedValue`

`useDebouncedValue` — debounce над **значением** (state), возвращает `debouncedValue` для использования в JSX или другом `useEffect`.

`useDebouncedCallback` — debounce над **функцией**, плюс `cancel`/`flush`. Подходит когда нужен контроль: прервать поиск, немедленно отправить форму, не дожидаясь таймера.

```tsx
// useDebouncedValue — когда нужно реагировать на изменение значения
const debouncedQuery = useDebouncedValue(query, 300)
useEffect(() => { fetchResults(debouncedQuery) }, [debouncedQuery])

// useDebouncedCallback — когда нужен прямой вызов + cancel/flush
const search = useDebouncedCallback(fetchResults, 300)
<button onClick={search.flush}>Найти сейчас</button>
```

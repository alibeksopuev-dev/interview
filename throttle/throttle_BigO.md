# Throttle — Разбор и Big O

---

## Что такое Throttle?

**Throttle** — техника ограничения частоты вызовов функции.

Если throttled-функцию вызывают несколько раз подряд, `func` выполняется **немедленно при первом вызове**, а все последующие вызовы в течение `wait` мс **игнорируются**. После истечения `wait` — следующий вызов снова выполнится немедленно.

**Аналогия:** турникет в метро. Пропускает — блокируется на N секунд — пропускает снова. Сколько бы раз ты ни прикладывал карту в период блокировки — ничего не произойдёт.

---

## Debounce vs Throttle

| | **Debounce** | **Throttle** |
|---|---|---|
| Когда вызывается func | После паузы в N мс | Немедленно, затем блокировка на N мс |
| Что происходит при повторных вызовах | Таймер сбрасывается | Вызовы игнорируются |
| Гарантия вызова | Только после остановки | Минимум раз в N мс |
| Хранит в замыкании | `timeoutID` | `shouldThrottle` (boolean) |
| Аналогия | Лифт ждёт всех пассажиров | Турникет блокируется после прохода |
| Применение | Поиск по мере ввода | Scroll, resize, rate-limit кнопок |

---

## Ключевая идея: булев флаг-замок

Throttle проще debounce — не нужно хранить `args` или `context` для отложенного вызова, потому что `func` вызывается **сразу**. Нужен только один флаг:

```
shouldThrottle = false  →  окно открыто, func выполнится
shouldThrottle = true   →  окно заблокировано, вызовы игнорируются
```

---

## TypeScript-типизация

### `ThrottleFunction<T>` vs generic по функции

В debounce использовали `T extends (...args: any[]) => any` — generic по всей функции.
Здесь `T extends any[]` — generic по **tuple аргументов**:

```ts
type ThrottleFunction<T extends any[]> = (this: any, ...args: T) => any

// T = [string, number]
// ThrottleFunction<[string, number]> = (this: any, query: string, limit: number) => any
```

Оба подхода эквивалентны. Разница только в точке "где живёт T":
- `T extends (...args) => any` → `Parameters<T>` чтобы достать аргументы
- `T extends any[]` → T уже и есть tuple аргументов, `Parameters` не нужен

### `(this: any, ...args: T) => any`

- `this: any` — фиктивный параметр, разрешает любой `this` в strict-режиме
- `...args: T` — rest-параметр с типом tuple `T`
- `any` в возврате — throttled-функция возвращает `void` (игнорируем `func`'s return)

---

## Пошаговая трассировка

### Сценарий 1: базовый — вызов, блокировка, вызов

```
let i = 0
const throttledIncrement = throttle(() => i++, 100)

t =   0ms  →  throttledIncrement()
              shouldThrottle = false → не блокируем
              shouldThrottle = true  → закрываем окно
              setTimeout(unlock, 100)
              func.apply() → i++ → i = 1

t =  50ms  →  throttledIncrement()
              shouldThrottle = true → ИГНОРИРУЕМ, выходим
              i = 1  (не изменился)

t = 100ms  →  setTimeout срабатывает → shouldThrottle = false → окно открыто

t = 101ms  →  throttledIncrement()
              shouldThrottle = false → не блокируем
              shouldThrottle = true  → закрываем окно
              setTimeout(unlock, 100)
              func.apply() → i++ → i = 2
```

**Итог: i = 2** (два вызова за ~101мс вместо трёх)

---

### Сценарий 2: серия быстрых кликов на кнопку (rate-limit)

```
const saveForm = throttle(sendToServer, 2000)

t =    0мс  →  saveForm()  — shouldThrottle=false → sendToServer() вызван, окно закрыто
t =  300мс  →  saveForm()  — shouldThrottle=true  → ИГНОРИРУЕТСЯ
t =  600мс  →  saveForm()  — shouldThrottle=true  → ИГНОРИРУЕТСЯ
t =  900мс  →  saveForm()  — shouldThrottle=true  → ИГНОРИРУЕТСЯ
t = 2000мс  →  shouldThrottle=false → окно открыто
t = 2100мс  →  saveForm()  — shouldThrottle=false → sendToServer() вызван снова
```

**Результат:** 2 запроса вместо 5 за 2.1 секунды

---

### Сценарий 3: scroll-обработчик

```
const onScroll = throttle(updatePosition, 200)
window.addEventListener('scroll', onScroll)

t =   0мс  →  scroll → updatePosition() → shouldThrottle=true
t =  16мс  →  scroll → ИГНОРИРУЕТСЯ
t =  32мс  →  scroll → ИГНОРИРУЕТСЯ
...
t = 200мс  →  shouldThrottle=false
t = 216мс  →  scroll → updatePosition() → shouldThrottle=true
```

Браузер стреляет scroll ~60 раз/сек (каждые 16мс). С throttle 200мс — 5 вызовов/сек вместо 60.

---

## Разбор кода с комментариями

```ts
type ThrottleFunction<T extends any[]> = (this: any, ...args: T) => any
// T extends any[] — T это tuple аргументов: [string] или [number, boolean] и т.д.
// (this: any) — фиктивный параметр, разрешает любой this в strict-режиме
// ...args: T  — аргументы с типом tuple T
// => any      — возвращаемое значение не важно (throttle его игнорирует)
```

```ts
export function throttle<T extends any[]>(
  func: ThrottleFunction<T>,
  wait: number,
): ThrottleFunction<T> {
// Возвращаем функцию с точно той же сигнатурой что и func
// T выводится автоматически из переданного func
```

```ts
  let shouldThrottle = false
  // Единственная переменная замыкания — булев флаг
  // false = окно открыто | true = окно заблокировано
  // В отличие от debounce — не храним timeoutID, args, context
  // (func вызывается сразу, откладывать нечего)
```

```ts
  return function (this: any, ...args: T) {
  // Обычная function — НЕ стрелка
  // this определяется в момент вызова снаружи
  // Стрелка зафиксировала бы this навсегда при создании throttle
```

```ts
    if (shouldThrottle) {
      return
    }
    // Ранний выход — самое важное в throttle
    // Никакого setTimeout, никакого сохранения args — просто игнорируем вызов
```

```ts
    shouldThrottle = true
    setTimeout(function () {
      shouldThrottle = false
    }, wait)
    // Сначала закрываем окно, потом вызываем func
    // Порядок важен: если func бросит исключение — окно уже закрыто
    // setTimeout внутри — обычная function, this не нужен (только меняем флаг)
```

```ts
    func.apply(this, args)
    // apply(this, args) — единственный способ передать и this и args вместе
    // func(..args) — потеряет this
    // func.call(this, args[0], args[1]...) — громоздко при неизвестном числе аргументов
```

---

## React: реальные примеры

### Паттерн 1 — throttle scroll-обработчика через useEffect

```tsx
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    // throttle создаётся один раз внутри useEffect
    const handleScroll = throttle(() => {
      setScrollY(window.scrollY) // обновляем state не чаще раза в 200мс
    }, 200)

    window.addEventListener('scroll', handleScroll)

    // cleanup: снимаем тот же обработчик что добавили
    // важно: handleScroll — та же ссылка (замыкание useEffect), removeEventListener найдёт её
    return () => window.removeEventListener('scroll', handleScroll)
  }, []) // [] — создаём и удаляем обработчик один раз

  return <div>Scroll Y: {scrollY}</div>
}
```

**Трассировка scroll:**
```
рендер     → useEffect: throttle создан, addEventListener
scroll↓    → handleScroll() → shouldThrottle=false → setScrollY(120) → shouldThrottle=true
scroll↓    → handleScroll() → shouldThrottle=true  → ИГНОРИРУЕТСЯ
scroll↓    → handleScroll() → shouldThrottle=true  → ИГНОРИРУЕТСЯ
+200мс     → shouldThrottle=false
scroll↓    → handleScroll() → setScrollY(480) → shouldThrottle=true
unmount    → removeEventListener(handleScroll)
```

---

### Паттерн 2 — throttle кнопки отправки формы (rate-limit)

```tsx
function SubmitButton({ onSubmit }: { onSubmit: () => void }) {
  // useRef — храним throttled-функцию между рендерами без ререндера
  // useCallback не подходит: throttle создаёт внутреннее состояние (shouldThrottle),
  // пересоздание при каждом рендере сбросит флаг
  const throttledSubmit = useRef(
    throttle(() => {
      onSubmit()
    }, 2000) // не чаще раза в 2 секунды
  ).current

  return (
    <button onClick={throttledSubmit}>
      Отправить
    </button>
  )
}
```

**Трассировка — пользователь дважды кликает быстро:**
```
клик t=0мс    → throttledSubmit() → onSubmit() → shouldThrottle=true
клик t=50мс   → throttledSubmit() → shouldThrottle=true → ИГНОРИРУЕТСЯ
t=2000мс      → shouldThrottle=false → можно снова
клик t=2100мс → throttledSubmit() → onSubmit() → shouldThrottle=true
```

**Почему `useRef`, а не `useMemo` или `useCallback`?**
- `useMemo` — может пересчитаться (React не гарантирует стабильность)
- `useCallback` — пересоздаёт функцию при изменении deps, сбрасывает `shouldThrottle`
- `useRef` — `.current` никогда не меняется после первого присвоения

---

### Паттерн 3 — throttle resize через useThrottle хук

```tsx
// Переиспользуемый хук — аналог useDebouncedValue но для throttle
function useThrottledValue<T>(value: T, wait: number): T {
  const [throttledValue, setThrottledValue] = useState(value)
  // useRef хранит throttled-сеттер — не пересоздаётся при рендере
  const setter = useRef(
    throttle((v: T) => setThrottledValue(v), wait)
  ).current

  useEffect(() => {
    setter(value) // при каждом новом value — пробуем обновить (throttle сам решит)
  }, [value])

  return throttledValue
}

// Использование:
function ResizeAwareComponent() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // windowWidth меняется на каждый пиксель resize — throttledWidth не чаще раза в 300мс
  const throttledWidth = useThrottledValue(windowWidth, 300)

  return <div>Ширина (throttled): {throttledWidth}px</div>
}
```

---

## Big O

### Временная сложность: `O(1)` на каждый вызов

| Операция | Сложность |
|----------|-----------|
| Проверка `shouldThrottle` | `O(1)` |
| `setTimeout` | `O(1)` |
| `func.apply` | `O(1)` + сложность `func` |
| Итого на вызов | **`O(1)`** |

### Пространственная сложность: `O(1)`

Одна булева переменная `shouldThrottle` — не зависит от количества вызовов.

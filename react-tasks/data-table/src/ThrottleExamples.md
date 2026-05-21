# Разбор ThrottleExamples.tsx — построчный анализ

## Что такое throttle?

Throttle — это техника ограничения частоты вызовов функции.
Принцип: первый вызов проходит **сразу**, все последующие вызовы в течение заданного времени **блокируются**.

Пример: пользователь скроллит страницу и браузер стреляет 30 событий за секунду. Без throttle твой код будет перерисовывать UI 30 раз. С throttle(fn, 200) — максимум 5 раз в секунду.

---

## Часть 1 — хук `useThrottledValue` (строки 7–24)

```tsx
export function useThrottledValue<T>(value: T, wait: number): T {
```
Обобщённый (generic) хук. Принимает любое значение `value` и задержку `wait` в миллисекундах.
Возвращает то же значение, но обновляющееся не чаще чем раз в `wait` мс.

```tsx
const [throttledValue, setThrottledValue] = useState(value)
```
Локальное состояние — это "замедленная копия" входного значения.
Изначально равна исходному значению.

```tsx
const setter = useRef(
  throttle((v: T) => {
    setThrottledValue(v)
  }, wait)
).current
```
Здесь происходит ключевая вещь — **один раз** при монтировании компонента создаётся throttled-функция и кладётся в `useRef`.

Почему `useRef`?
- `useRef` не вызывает перерендер при изменении
- Значение внутри `.current` живёт всё время жизни компонента
- Если бы мы написали просто `throttle(...)` без `useRef` — при каждом рендере создавалась бы **новая** throttle-функция с обнулённым таймером, и throttle бы не работал

`.current` в конце — сразу достаём значение из ref, чтобы не писать `setter.current()` при каждом вызове.

```tsx
useEffect(() => {
  setter(value)
}, [value, setter])
```
Когда входное `value` меняется — вызываем throttled setter.
`setter` в зависимостях потому, что ESLint требует указывать все переменные из closure. На практике `setter` никогда не меняется (он в `useRef`).

```tsx
return throttledValue
```
Возвращаем замедлённое значение. Компонент снаружи получает значение, которое обновляется реже.

---

## Часть 2 — `ScrollTracker` (строки 29–88)

**Задача:** показать разницу между реальными событиями скролла и throttled-обновлениями.

```tsx
const [scrollY, setScrollY] = useState(0)       // throttled позиция
const [realScrollY, setRealScrollY] = useState(0) // реальная позиция
const [throttleCount, setThrottleCount] = useState(0) // сколько раз сработал throttle
const [realCount, setRealCount] = useState(0)   // сколько раз браузер стрельнул событием
```
Четыре счётчика для визуального сравнения "сырые события vs throttled".

```tsx
const handleScrollThrottled = useRef(
  throttle((y: number) => {
    setScrollY(y)
    setThrottleCount(c => c + 1)
  }, 200)
).current
```
Throttled обработчик с задержкой 200 мс. Та же идея с `useRef` — функция создаётся один раз.
Внутри: обновляем throttled-позицию и увеличиваем счётчик throttled-вызовов.

```tsx
const handleScroll = (event: UIEvent<HTMLDivElement>) => {
  const currentScrollY = event.currentTarget.scrollTop
  setRealScrollY(currentScrollY)  // обновляем ВСЕГДА
  setRealCount(c => c + 1)        // считаем ВСЕ события
  handleScrollThrottled(currentScrollY) // throttle решает, обновить ли state
}
```
Это обычный (не throttled) обработчик. Он:
1. Берёт текущую позицию скролла из события
2. Всегда обновляет "реальные" данные — чтобы показать сколько событий реально было
3. Передаёт позицию в throttled функцию — та решит, пропустить или заблокировать

```tsx
<div className="scroll-box" onScroll={handleScroll}>
  {[...Array(50)].map((_, i) => (
    <div key={i} className="scroll-item">Элемент списка #{i + 1}</div>
  ))}
```
Создаём 50 элементов чтобы был скролл. `[...Array(50)]` — быстрый способ создать массив из 50 пустых слотов.

---

## Часть 3 — `SubmitButton` (строки 99–203)

**Задача:** защита кнопки от спам-кликов. Первый клик проходит, следующие 2 секунды — блокируются.

```tsx
interface LogEntry {
  id: string
  time: string
  status: 'allowed' | 'ignored'
}
```
Тип для записи в лог. `status` — либо "пропущен", либо "заблокирован".

```tsx
const throttledSubmit = useRef(
  throttle(() => {
    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0')
    setLogs(prev => [
      { id: Math.random().toString(36).substr(2, 9), time: timeStr, status: 'allowed' },
      ...prev.slice(0, 7), // не больше 8 записей в логе
    ])
  }, 2000)
).current
```
Throttled функция "отправки". Задержка 2000 мс (2 секунды).

Разбор строки времени:
- `now.toTimeString()` → `"14:32:05 GMT+0600 (...)"`
- `.split(' ')[0]` → `"14:32:05"`
- `+ '.' + String(now.getMilliseconds()).padStart(3, '0')` → `"14:32:05.047"`

`Math.random().toString(36).substr(2, 9)` — генерация короткого случайного id (base36 = цифры + буквы).

`prev.slice(0, 7)` — берём первые 7 из предыдущих записей, добавляем новую → итого максимум 8 в списке.

```tsx
const handleClick = () => {
  setClickCount(c => c + 1)
  const prevLogsLength = logs.length
  throttledSubmit()
```
При клике: считаем клик, запоминаем текущую длину лога, вызываем throttled submit.

```tsx
  setLogs(prev => {
    const hasJustAllowed = prev.length > prevLogsLength 
      && prev[0].status === 'allowed' 
      && prev[0].time === timeStr
    if (!hasJustAllowed) {
      return [{ id: ..., time: timeStr, status: 'ignored' }, ...prev.slice(0, 7)]
    }
    return prev
  })
```
Логика определения "был ли клик заблокирован":
- Если `throttledSubmit()` выполнился → лог вырос (`prev.length > prevLogsLength`) и первый элемент — `allowed`
- Если throttle заблокировал → лог не изменился → добавляем запись `ignored`

Это хак для визуализации: throttle не возвращает "пропущен/нет", поэтому смотрим на изменение стейта.

---

## Часть 4 — `ResizeAwareComponent` (строки 208–285)

**Задача:** показать throttle при отслеживании размеров — окна браузера и локального элемента.

```tsx
const [windowWidth, setWindowWidth] = useState(window.innerWidth)
```
Начальное значение — текущая ширина окна при монтировании компонента.

```tsx
useEffect(() => {
  const handleResize = () => setWindowWidth(window.innerWidth)
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```
Подписка на событие `resize` окна.
`return () => removeEventListener(...)` — это cleanup функция: вызывается при размонтировании компонента, чтобы не было утечки памяти.

```tsx
const throttledWindowWidth = useThrottledValue(windowWidth, 300)
```
Используем наш хук из части 1. `windowWidth` меняется на каждый пиксель — `throttledWindowWidth` не чаще раза в 300 мс.

```tsx
const observer = new ResizeObserver(entries => {
  for (let entry of entries) {
    setLocalWidth(entry.contentRect.width)
  }
})
observer.observe(resizeBoxRef.current)
return () => observer.disconnect()
```
`ResizeObserver` — браузерный API, следит за размером конкретного DOM-элемента (в отличие от `resize` события, которое только для окна).
`observer.disconnect()` в cleanup — отписываемся при размонтировании.

```tsx
const throttledLocalWidth = useThrottledValue(localWidth, 300)
```
То же самое: реальная ширина обновляется часто, throttled — раз в 300 мс.

---

## Часть 5 — `RafTracker` (строки 290–371)

**Задача:** сравнить `requestAnimationFrame` (rAF) и throttle для отслеживания мыши.

```tsx
const rafIdRef = useRef<number | null>(null)
const pendingPosRef = useRef({ x: 0, y: 0 })
```
- `rafIdRef` — хранит ID текущего запроса rAF (нужен чтобы отменить предыдущий)
- `pendingPosRef` — хранит последнюю позицию мыши (не вызывает ререндер!)

```tsx
const throttledSetPos = useRef(
  throttle((pos: { x: number; y: number }) => {
    setThrottledPos(pos)
  }, 100)
).current
```
Throttled обновление позиции: не чаще раза в 100 мс.

```tsx
const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const pos = {
    x: Math.round(e.clientX - rect.left),
    y: Math.round(e.clientY - rect.top),
  }
```
`getBoundingClientRect()` — даёт координаты элемента относительно viewport.
`e.clientX - rect.left` — переводим координаты мыши из "относительно экрана" в "относительно элемента".
`Math.round` — округляем до целых пикселей.

```tsx
  setRawCount(c => c + 1)
  pendingPosRef.current = pos  // сохраняем последнюю позицию в ref (без ререндера!)
  throttledSetPos(pos)         // throttle обновляет стейт (с ограничением)
```
Счётчик сырых событий растёт при каждом движении мыши.
Позиция сохраняется в `ref` — это "буфер" для rAF.

```tsx
  if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
  rafIdRef.current = requestAnimationFrame(() => {
    setRafPos(pendingPosRef.current)  // берём ПОСЛЕДНЮЮ позицию из буфера
    setRafCount(c => c + 1)
    rafIdRef.current = null
  })
```
Паттерн "отменить предыдущий rAF и поставить новый":
- Если мышь движется быстро и два события пришли до следующего кадра — отменяем старый rAF, ставим новый
- Итог: rAF всегда берёт **последнюю** позицию и выполняется синхронно с перерисовкой браузера (~60 fps = ~16 мс)

**Разница между rAF и throttle(100):**
- throttle(100) — жёсткий таймер. Обновляет позицию раз в 100 мс вне зависимости от кадров браузера
- rAF — синхронизирован с монитором. Обновляет ровно перед каждой перерисовкой (~16 мс на 60hz)
- rAF лучше для анимаций, throttle лучше для API-запросов и тяжёлых вычислений

```tsx
useEffect(() => {
  return () => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
  }
}, [])
```
Cleanup: при размонтировании отменяем pending rAF чтобы не было обращения к размонтированному компоненту.

---

## Часть 6 — `ThrottleShowcase` (строки 376–392)

```tsx
export const ThrottleShowcase: FC = () => {
  return (
    <div className="throttle-showcase-container">
      <ScrollTracker />
      <SubmitButton />
      <ResizeAwareComponent />
      <RafTracker />
    </div>
  )
}
```
Простой контейнер — собирает все четыре демо-компонента на одну страницу. Никакой логики, только вёрстка.

---

## Ключевые паттерны в файле

| Паттерн | Зачем |
|---|---|
| `useRef` для throttled функции | Чтобы функция создавалась один раз, не пересоздавалась при каждом рендере |
| `.current` сразу после `useRef(...)` | Удобство — не писать `.current` при каждом вызове |
| `return () => cleanup()` в useEffect | Отписка от событий и наблюдателей при размонтировании |
| `pendingPosRef` для rAF | Ref как "буфер" — хранит данные без вызова ререндера |
| `cancelAnimationFrame` перед новым rAF | Дедупликация: берём только последнее значение за один кадр |

---

## Итог

Файл демонстрирует **4 реальных сценария применения throttle** в React:
1. **Скролл** — не обновлять UI на каждый пиксель прокрутки
2. **Кнопка** — защита от случайных двойных кликов и спама
3. **Resize** — не пересчитывать layout на каждый пиксель изменения окна
4. **Мышь** — сравнение throttle с requestAnimationFrame для плавных анимаций

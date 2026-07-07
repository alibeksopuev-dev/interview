# Разбор задачи `EventEmitter` (паттерн publish-subscribe)

> `EventEmitter` — небольшой объект, который позволяет одной части кода **эмитить** именованные события, а любому количеству других частей кода **слушать** их. Это ядро **паттерна publish-subscribe (pub/sub)** и один из самых распространённых способов разделить производителей и потребителей событий в JavaScript.

---

## ❓ Где встречается этот паттерн в реальном коде

API `EventEmitter` встречается по всей экосистеме JavaScript:

- **Node.js streams и core-модули.** `stream.on('data', chunk => ...)`, `process.on('exit', ...)`, `httpServer.on('request', ...)` — все используют встроенный в Node `EventEmitter`.
- **Браузер, `EventTarget`.** Каждый DOM-узел — это `EventTarget`, и `addEventListener`, `removeEventListener`, `dispatchEvent` следуют той же форме. Современные Node и браузеры напрямую предоставляют `EventTarget`, поэтому многим приложениям кастомный класс уже не нужен.
- **Хуки библиотек.** События Express middleware, комнаты Socket.io, pub/sub-клиенты Redis, change streams MongoDB, и большинство CLI-инструментов строят pub/sub поверх эмиттера.
- **Раздельная связь внутри приложения.** Небольшой эмиттер может служить хребтом для кросс-компонентных событий (например, глобальная шина тостов, диспетчер аналитики, сигнал обновления feature-флагов), когда глобальный state был бы избыточен.

### Когда писать свой эмиттер, а когда взять готовый

| Вариант | Когда обращаться |
|---|---|
| `EventTarget` (DOM/Node) | По умолчанию для большинства приложений. Встроен в платформу, поддерживает `AbortSignal` для очистки, без зависимостей. |
| Node `EventEmitter` | Серверный код, которому нужны специфичные для Node возможности вроде `setMaxListeners`, событий ошибок или `once`. |
| Кастомный эмиттер (эта задача) | Когда нужно что-то, чего нет во встроенных — перечисление всех слушателей, wildcard-события, приоритеты, или именно для собеседования. |
| Observer pattern (RxJS, MobX) | Синхронизация «один ко многим» для **состояния**, а не отдельных именованных событий. |
| Store-based state (Redux, Zustand) | Глобальный state с подписками и time-travel дебагом. Не используйте эмиттер как store состояния — потеряете причинность. |

Задача — реализовать `EventEmitter`-класс, похожий на встроенный в Node. Она проверяет, как вы проектируете небольшой публичный API, выбираете структуру данных и обрабатываете тонкие баги, которые допускает большинство базовых реализаций.

---

## 🧠 Что такое pub/sub — для тех кто только начинает

**Publish-subscribe** — это способ развязать код, который что-то *делает* (издатель/publisher), от кода, который на это *реагирует* (подписчик/subscriber). Издатель не знает, кто его слушает и сколько слушателей вообще есть — он просто «эмитит» событие с именем.

Представьте радиостанцию:

```
Радиостанция эмитит на частоте "новости" → любой, у кого приёмник настроен на "новости", услышит
```

- Подписаться на частоту = `emitter.on('news', listener)`
- Радиостанция транслирует = `emitter.emit('news', ...)`
- Отписаться = `emitter.off('news', listener)`
- Радиостанция ничего не знает о том, сколько приёмников её слушают — это и есть развязка (decoupling).

---

## 📌 Введение: в чём идея?

`EventEmitter` — это **реестр слушателей**, сгруппированный по имени события. Основная задача реализации — поддерживать этот реестр так, чтобы:

- порядок регистрации слушателей сохранялся,
- один и тот же слушатель можно было зарегистрировать несколько раз,
- поведение оставалось предсказуемым при добавлении/удалении слушателей.

### Пример из условия:

```typescript
const emitter = new EventEmitter()

function addTwoNumbers(a, b) {
  console.log(`The sum is ${a + b}`)
}
emitter.on('foo', addTwoNumbers)
emitter.emit('foo', 2, 5)
// > "The sum is 7"

emitter.on('foo', (a, b) => console.log(`The product is ${a * b}`))
emitter.emit('foo', 4, 5)
// > "The sum is 9"
// > "The product is 20"

emitter.off('foo', addTwoNumbers)
emitter.emit('foo', -3, 9)
// > "The product is -27"
```

Обратите внимание: после `off('foo', addTwoNumbers)` первый слушатель больше не вызывается, а второй (анонимная функция произведения) продолжает работать — `off()` удаляет **только** указанный слушатель, не трогая остальные в той же корзине.

Эта задача часто встречается на собеседованиях, так как проверяет понимание:
- **Выбора структуры данных** (почему `Map`/объект-без-прототипа, а не плоский массив)
- **Инкапсуляции состояния** (каждый экземпляр — своя независимая корзина событий)
- **Работы с массивами** (`push`, `findIndex`, `splice`, `slice`)
- **Тонких edge cases** (дубликаты слушателей, мутация во время `emit()`, коллизии с встроенными именами)

---

## ⏱️ 1. Временная сложность (Time Complexity)

| Метод | Сложность | Почему |
|---|---|---|
| `on(eventName, listener)` | `O(1)` амортизированно | `push()` в конец массива |
| `off(eventName, listener)` | `O(L)` | `findIndex()` линейно ищет слушателя среди `L` слушателей события, `splice()` тоже `O(L)` |
| `emit(eventName, ...args)` | `O(L)` | Клонируем массив (`O(L)`) и вызываем каждого из `L` слушателей |

Где `L` — количество слушателей, зарегистрированных на **конкретное** имя события (а не общее число событий во всём эмиттере).

---

## 💾 2. Пространственная сложность (Space Complexity): `O(N)`

- `N` — суммарное количество зарегистрированных пар `(eventName, listener)` по всем событиям.
- `_events` хранит по одному массиву на каждое уникальное имя события; каждый элемент массива — ссылка на функцию-слушатель.
- `emit()` дополнительно создаёт временный клон массива слушателей (`O(L)` на время одного вызова).

---

## 🔬 3. Пошаговый разбор (Трассировка)

### Структура данных:

Правильная модель данных — «одна корзина слушателей на одно имя события»:

```typescript
events = {
  foo: [Function1, Function3],
  bar: [Function2],
}
```

Эта структура делает все три операции прямыми:
- `on()` дописывает в одну корзину события,
- `off()` ищет внутри одной корзины события,
- `emit()` читает одну корзину события и проходит её по порядку.

Плоский список пар `{ eventName, listener }` тоже работал бы, но заставлял бы каждый `off()` и `emit()` сканировать посторонние записи для других событий.

### Входные данные:

```typescript
const emitter = new EventEmitter()
function onFoo(a, b) { console.log(a + b) }
emitter.on('foo', onFoo)
emitter.emit('foo', 2, 5)
emitter.off('foo', onFoo)
emitter.emit('foo', 2, 5)
```

---

### 🔁 Шаг 1: `on('foo', onFoo)`

```
_events = {}                          (Object.create(null))
Object.hasOwn(_events, 'foo') → false
_events.foo = []                      создаём корзину впервые
_events.foo.push(onFoo)               _events = { foo: [onFoo] }
return this                           для чейнинга
```

---

### 🔁 Шаг 2: `emit('foo', 2, 5)`

```
Object.hasOwn(_events, 'foo') → true, длина корзины > 0
listeners = _events.foo.slice()       СНИМОК: [onFoo]
listeners.forEach(listener => listener.apply(null, [2, 5]))
  → onFoo(2, 5) вызван, this === null внутри onFoo
  → печатает "7"
return true                            у события были слушатели
```

---

### 🔁 Шаг 3: `off('foo', onFoo)`

```
Object.hasOwn(_events, 'foo') → true
listeners = _events.foo                [onFoo]
index = listeners.findIndex(fn => fn === onFoo)   → 0
index >= 0 → splice(0, 1)
_events.foo = []                        корзина опустела, но НЕ удалена как ключ
return this
```

---

### 🔁 Шаг 4: `emit('foo', 2, 5)` (повторно)

```
Object.hasOwn(_events, 'foo') → true, НО _events.foo.length === 0
→ return false сразу, слушатели не вызываются
```

**Ключевой момент:** после `off()` ключ `'foo'` остаётся в `_events` (со значением `[]`), но `emit()` проверяет `.length === 0` и корректно возвращает `false`, а не пытается вызвать пустой список.

---

## 🚫 4. Частая ошибка: обычный объект `{}` вместо `Object.create(null)`

Инстинктивно хочется написать:

```typescript
// ❌ РИСКОВАННО
this._events = {}
```

**Почему это проблема?**

`eventName` — это **пользовательский ввод**. Обычный объектный литерал `{}` наследует `Object.prototype` со свойствами вроде `toString`, `valueOf`, `constructor`, `hasOwnProperty`. Если кто-то вызовет:

```typescript
const emitter = new EventEmitter()
emitter.emit('toString')
```

— с `{}` в некоторых реализациях можно случайно наткнуться на унаследованное свойство `toString` (функцию), а не на `undefined`, что либо ломает проверки вида `if (this._events[eventName])`, либо приводит к неожиданному поведению при попытке вызвать его как массив слушателей.

**Два стандартных решения:**

1. Использовать `Map` вместо объекта — современный подход, у `Map` нет прототипных коллизий по определению.
2. Создавать хранилище через `Object.create(null)` — объект без прототипа, обращения по любому имени, включая `toString`, `valueOf`, `constructor`, безопасны и предсказуемы.

В решении ниже используется `Object.create(null)` вместе с `Object.hasOwn()` (а не `in` или `.hasOwnProperty()`, который на объекте без прототипа отсутствовал бы как метод).

---

## 🔡 5. Разбор типизации TypeScript

### Публичный контракт:

```typescript
interface IEventEmitter {
  on(eventName: string, listener: Function): IEventEmitter
  off(eventName: string, listener: Function): IEventEmitter
  emit(eventName: string, ...args: Array<any>): boolean
}
```

| Часть | Что делает |
|---|---|
| `on(...): IEventEmitter` | Возвращает `this`, чтобы вызовы можно было цеплять: `emitter.on('a', f).on('b', g)` |
| `off(...): IEventEmitter` | Тоже возвращает `this` для симметрии с `on()` |
| `emit(eventName, ...args): boolean` | `...args: Array<any>` — эмиттер не знает и не должен знать сигнатуру слушателей заранее |

### Хранилище:

```typescript
_events: Record<string, Array<Function>>
```

`Record<string, Array<Function>>` описывает форму данных (`{ [eventName: string]: Function[] }`), но фактический объект создаётся через `Object.create(null)`, а не литерал `{}` — типизация описывает *форму*, а не то, как именно создан объект во время выполнения.

### Полная сигнатура:

```typescript
export default class EventEmitter implements IEventEmitter {
  _events: Record<string, Array<Function>>

  constructor() {
    this._events = Object.create(null)
  }

  on(eventName: string, listener: Function): EventEmitter {
    if (!Object.hasOwn(this._events, eventName)) {
      this._events[eventName] = []
    }
    this._events[eventName].push(listener)
    return this
  }

  off(eventName: string, listener: Function): EventEmitter {
    if (!Object.hasOwn(this._events, eventName)) {
      return this
    }
    const listeners = this._events[eventName]
    const index = listeners.findIndex((listenerItem) => listenerItem === listener)
    if (index < 0) {
      return this
    }
    this._events[eventName].splice(index, 1)
    return this
  }

  emit(eventName: string, ...args: Array<any>): boolean {
    if (!Object.hasOwn(this._events, eventName) || this._events[eventName].length === 0) {
      return false
    }
    const listeners = this._events[eventName].slice()
    listeners.forEach((listener) => {
      listener.apply(null, args)
    })
    return true
  }
}
```

---

## ⚠️ 6. Частая ошибка: общая корзина слушателей на все экземпляры

`_events` **обязан** создаваться заново в `constructor()` — если случайно вынести его в статическое/модульное поле, все экземпляры `EventEmitter` начнут делить одно хранилище, и события одного эмиттера начнут «протекать» в другой.

```typescript
// ❌ АНТИПАТТЕРН: общее хранилище на уровне класса
class EventEmitter {
  static _events = Object.create(null)   // ← ОШИБКА: одно на все инстансы

  on(eventName, listener) {
    if (!Object.hasOwn(EventEmitter._events, eventName)) {
      EventEmitter._events[eventName] = []
    }
    EventEmitter._events[eventName].push(listener)
    return this
  }
  // ...
}

const a = new EventEmitter()
const b = new EventEmitter()
a.on('foo', () => console.log('a услышал'))
b.emit('foo')  // ❌ 'a услышал' — событие "утекло" из a в b!
```

По условию задачи, **события и слушатели изолированы между экземплярами**; `b.emit('foo')` не должен запускать ничего, зарегистрированного через `a.on(...)`.

**Правильно** — `_events = Object.create(null)` внутри `constructor()`, инициализируется заново для каждого `new EventEmitter()`. Именно это делает экземпляры независимыми друг от друга.

---

## 💡 7. Разбор двух подходов

### Подход 1: ES6-класс (рекомендуемый)

```typescript
export default class EventEmitter implements IEventEmitter {
  _events: Record<string, Array<Function>>
  constructor() {
    this._events = Object.create(null)
  }
  on(eventName, listener) { /* ... */ }
  off(eventName, listener) { /* ... */ }
  emit(eventName, ...args) { /* ... */ }
}
```

**Плюс:** современный, читаемый синтаксис; методы автоматически лежат на `EventEmitter.prototype`, поэтому не дублируются в каждом экземпляре.

**Минус:** требует понимания, что `this` внутри методов класса — это конкретный экземпляр.

---

### Подход 2: функция-конструктор + `.prototype` (без `class`)

```typescript
function EventEmitter() {
  this._events = Object.create(null)
}

EventEmitter.prototype.on = function (eventName, listener) {
  if (!Object.hasOwn(this._events, eventName)) {
    this._events[eventName] = []
  }
  this._events[eventName].push(listener)
  return this
}
// off и emit аналогично на .prototype
```

**Плюс:** не использует синтаксис `class` — так исторически писали до ES6, иногда просят именно такой вариант на собеседовании.

**Минус:** чуть более многословно, легче случайно забыть привязать `this` при отдельном использовании методов (`const on = emitter.on; on(...)` сломается).

---

## ⚠️ 8. Edge Cases (Граничные случаи)

### 1. `emit()` без аргументов, кроме `eventName`

```typescript
emitter.on('ping', () => console.log('pong'))
emitter.emit('ping')
// печатает 'pong', args === []
```

`...args` просто будет пустым массивом — `listener.apply(null, [])` эквивалентно вызову без аргументов.

---

### 2. Один и тот же listener добавлен несколько раз

```typescript
const emitter = new EventEmitter()
const fn = () => console.log('called')

emitter.on('double', fn)
emitter.on('double', fn)
emitter.emit('double')
// печатает 'called' ДВАЖДЫ — это две отдельные регистрации
```

Каждый вызов `on()` — это **отдельная запись** в массиве, даже если это одна и та же функция.

---

### 3. `off()` при дублированных регистрациях удаляет только одну

```typescript
emitter.off('double', fn)   // после двух on() выше
emitter.emit('double')
// печатает 'called' ОДИН РАЗ — удалилась только первая найденная регистрация
```

`findIndex()` находит **первое** совпадение, `splice(index, 1)` удаляет **одну** запись — остальные дубликаты остаются нетронутыми.

---

### 4. `emit()`/`off()` для несуществующего события

```typescript
const emitter = new EventEmitter()
emitter.off('ghost', () => {})   // не падает, просто return this
emitter.emit('ghost')            // не падает, возвращает false
```

Оба метода сначала проверяют `Object.hasOwn(this._events, eventName)` — если события никогда не было, ничего не делают.

---

### 5. `eventName`, совпадающий с встроенными именами объекта

```typescript
const emitter = new EventEmitter()
emitter.on('toString', () => console.log('кастомный слушатель'))
emitter.emit('toString')   // true, слушатель вызывается корректно
```

Благодаря `Object.create(null)` имена вроде `toString`, `valueOf`, `constructor` — обычные строковые ключи, без коллизий с прототипом.

---

### 6. Мутация слушателей во время `emit()`

```typescript
const emitter = new EventEmitter()
function a() {
  emitter.off('x', b)          // b удаляется ПРЯМО во время emit
}
function b() {
  console.log('b вызван')
}
emitter.on('x', a)
emitter.on('x', b)
emitter.emit('x')
// 'b вызван' ВСЁ РАВНО печатается — b был в снимке (slice()) на момент старта emit
```

`emit()` клонирует массив слушателей **до** начала итерации. Слушатель, удалённый во время текущего `emit()`, всё равно отработает в этом проходе (он уже есть в снимке) — эффект применится только к **следующему** `emit()`. То же самое справедливо и для слушателей, добавленных во время `emit()` — они не попадут в текущий снимок и запустятся лишь при следующем вызове `emit()`.

---

## 🔄 9. Почему `listener.apply(null, args)`, а не `listener(...args)`

```typescript
listeners.forEach((listener) => {
  listener.apply(null, args)
})
```

`.apply(null, args)` явно фиксирует `this` внутри слушателя как `null` (в нестрогом режиме будет `globalThis`, но по условию задачи `this` может быть `null` — то есть не должно зависеть от эмиттера или от способа вызова). Форма `listener(...args)` вызвала бы функцию с `this === undefined` в строгом режиме — по сути то же намерение, но `.apply` — более явный и традиционный способ показать это в реализациях `EventEmitter`.

---

## 🌍 10. Применение в реальных проектах

`EventEmitter` — это фундамент многих серверных и клиентских инструментов. Ниже — где именно эта модель используется.

### Где встречается EventEmitter / pub-sub:

| Библиотека / место | Что это |
|---|---|
| **Node.js `events` модуль** | Эталонная реализация — `class EventEmitter`, от которой наследуются `http.Server`, `stream.Readable`, `process` и многое другое |
| **DOM `EventTarget`** | `addEventListener`/`removeEventListener`/`dispatchEvent` — та же идея, встроенная в браузер |
| **Socket.io** | `socket.on('message', ...)`, `socket.emit('message', ...)` — тот же API поверх WebSocket |
| **Redux** | `store.subscribe(listener)` — упрощённый одно-событийный вариант той же идеи (без `eventName`) |
| **RxJS `Subject`** | Похож на EventEmitter, но встроен в мир Observable с операторами (`map`, `filter`, `debounceTime`) |
| **Электрон (Electron) IPC** | `ipcMain.on(channel, handler)` — тот же паттерн для меж-процессного взаимодействия |

### 🧬 Прямой аналог нашего класса

| Библиотека | Чем похожа |
|---|---|
| **Node.js `events.EventEmitter`** | Практически то же самое: `Map`/объект по именам событий → массив слушателей, `on`/`off` (`removeListener`)/`emit`. Node дополнительно поддерживает `once()`, `prependListener()`, автоматическое предупреждение при `> 10` слушателей (`setMaxListeners`) и специальное событие `'error'` |

Если на собеседовании спросят «где эта же структура уже есть в реальной библиотеке» — правильный ответ: **встроенный модуль `events` в Node.js**, это концептуально тот же алгоритм.

### 📝 Типичный пример: шина тост-уведомлений

Небольшой эмиттер как глобальная шина событий — частый способ показывать уведомления из любого места приложения, не прокидывая колбэки через пропсы:

```typescript
type ToastPayload = { message: string; type: 'success' | 'error' | 'info' }

const toastBus = new EventEmitter()

function showToast({ message, type }: ToastPayload) {
  console.log(`[${type.toUpperCase()}] ${message}`)
}

toastBus.on('toast', showToast)

toastBus.emit('toast', { message: 'Файл сохранён', type: 'success' })
toastBus.emit('toast', { message: 'Не удалось подключиться к серверу', type: 'error' })

toastBus.off('toast', showToast)
toastBus.emit('toast', { message: 'Это уже никто не увидит', type: 'info' })
// emit вернёт false — слушателей больше нет
```

Любой модуль приложения может импортировать `toastBus` и вызывать `emit('toast', ...)`, не зная, кто и сколько компонентов сейчас показывают тосты — классический пример развязки издателя и подписчиков.

Полный рабочий пример — в [eventEmitter.ts](eventEmitter.ts), функция `realWorldExample()`.

---

## 📐 Итоговая карточка

```
┌──────────────────────────────────────────────────────────────┐
│                    EventEmitter: Big O                       │
├──────────────────────────────┬───────────────────────────────┤
│  on()                        │  O(1) амортизированно (push)   │
│  off()                       │  O(L) — L = слушателей события │
│  emit()                      │  O(L) — клон + вызов каждого   │
│  Пространство                │  O(N) — N = все пары событий   │
│  Ключевые концепции           │  Инкапсуляция, Map/объект без  │
│                              │  прототипа, изоляция экземпляров│
└──────────────────────────────┴───────────────────────────────┘

Ключевые инварианты:
  ✅ on()   добавляет в конец корзины, сохраняя порядок регистрации
  ✅ off()  удаляет ТОЛЬКО первое совпадение (===), остальные дубликаты остаются
  ✅ emit() вызывает СНИМОК слушателей — мутации во время emit не влияют на текущий проход
  ✅ emit() возвращает false для несуществующих/пустых событий, иначе true
  ✅ _events создаётся в constructor() — экземпляры полностью изолированы
  ✅ Object.create(null) — eventName вроде 'toString' не коллизирует с прототипом
```

---

## 🗺️ Схема алгоритма

```
new EventEmitter()
│
└─ this._events = Object.create(null)     ← своя корзина на каждый инстанс

on(eventName, listener)
│
├─ [_events[eventName] нет?] ──YES──→ создать пустой массив
│
└─ _events[eventName].push(listener) → return this

off(eventName, listener)
│
├─ [_events[eventName] нет?] ──YES──→ return this (ничего не делаем)
│
├─ index = _events[eventName].findIndex(fn => fn === listener)
│
├─ [index < 0?] ──YES──→ return this (совпадений нет)
│
└─ _events[eventName].splice(index, 1) → return this

emit(eventName, ...args)
│
├─ [нет события ИЛИ корзина пуста?] ──YES──→ return false
│
├─ listeners = _events[eventName].slice()   ← снимок на этот вызов
│
├─ listeners.forEach(fn => fn.apply(null, args))
│
└─ return true
```

---

## 🔗 Аналогия из жизни

| Концепция | Аналогия |
|---|---|
| `EventEmitter` | Радиостанция |
| `eventName` | Частота вещания |
| `on(eventName, listener)` | Настроить приёмник на частоту |
| `off(eventName, listener)` | Выключить именно этот приёмник |
| `emit(eventName, ...args)` | Трансляция сообщения на этой частоте |
| Разные экземпляры `EventEmitter` | Разные, никак не связанные радиостанции |
| `_events` | Список всех частот и подключённых к ним приёмников |

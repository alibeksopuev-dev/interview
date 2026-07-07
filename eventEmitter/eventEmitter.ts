// ─────────────────────────────────────────────────────────────────────────────
// ЗАДАЧА: EventEmitter (реализация паттерна publish-subscribe)
//
// Реализовать класс EventEmitter, похожий на встроенный в Node.js.
// Экземпляры EventEmitter изолированы друг от друга — события и слушатели
// одного экземпляра не должны реагировать на события другого экземпляра.
//
//   new EventEmitter()               — создать новый экземпляр
//   emitter.on(eventName, listener)  — подписать listener на событие eventName
//   emitter.off(eventName, listener) — отписать listener от события eventName
//   emitter.emit(eventName, ...args) — вызвать всех слушателей eventName по порядку
//
// on() и off() возвращают this (для чейнинга).
// emit() возвращает true, если у события были слушатели, иначе false.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ТИПИЗАЦИЯ
//
// Публичный контракт вынесен в интерфейс — так сигнатуры методов видны
// отдельно от реализации, и на них проще ссылаться в тестах/документации.
// ─────────────────────────────────────────────────────────────────────────────
interface IEventEmitter {
  on(eventName: string, listener: Function): IEventEmitter
  off(eventName: string, listener: Function): IEventEmitter
  emit(eventName: string, ...args: Array<any>): boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// РЕШЕНИЕ: класс на основе Map<eventName, Function[]>
//
// Ключевая идея — «одна корзина слушателей на одно имя события».
// on() добавляет в корзину, off() ищет и удаляет ОДНО совпадение из корзины,
// emit() читает копию корзины и последовательно вызывает каждого слушателя.
//
// Почему Object.create(null), а не {}?
//   eventName приходит от пользователя (внешний ввод). Обычный объект {}
//   имеет прототип Object.prototype с методами вроде toString, valueOf,
//   hasOwnProperty. Если кто-то вызовет emitter.on('toString', fn), а
//   хранилище — обычный объект, можно случайно столкнуться с унаследованным
//   свойством вместо создания нового. Object.create(null) создаёт объект
//   БЕЗ прототипа — коллизий с встроенными именами не будет.
//   (Альтернатива — использовать Map, она не имеет этой проблемы вообще.)
// ─────────────────────────────────────────────────────────────────────────────
export default class EventEmitter implements IEventEmitter {
  // Храним слушателей в объекте без прототипа: eventName → массив функций.
  _events: Record<string, Array<Function>>

  constructor() {
    this._events = Object.create(null)
  }

  // ───────────────────────────────────────────────────────────────────────
  // on(eventName, listener)
  //
  // Добавляет listener в конец массива для eventName. Если события ещё не
  // было — создаём для него пустой массив.
  //
  // Один и тот же listener можно добавить несколько раз — каждая регистрация
  // это ОТДЕЛЬНАЯ запись, и при emit() он будет вызван соответствующее число раз.
  // ───────────────────────────────────────────────────────────────────────
  on(eventName: string, listener: Function): EventEmitter {
    if (!Object.hasOwn(this._events, eventName)) {
      this._events[eventName] = []
    }

    this._events[eventName].push(listener)
    return this
  }

  // ───────────────────────────────────────────────────────────────────────
  // off(eventName, listener)
  //
  // Удаляет ПЕРВОЕ совпадение listener из корзины eventName.
  // Если события не существует — ничего не делаем (не бросаем ошибку).
  // Если listener был зарегистрирован несколько раз — удаляется только
  // ОДНА регистрация, остальные продолжают работать.
  // ───────────────────────────────────────────────────────────────────────
  off(eventName: string, listener: Function): EventEmitter {
    if (!Object.hasOwn(this._events, eventName)) {
      return this
    }

    const listeners = this._events[eventName]

    // Находим первый индекс, где лежит именно эта функция (===).
    const index = listeners.findIndex((listenerItem) => listenerItem === listener)

    if (index < 0) {
      return this
    }

    this._events[eventName].splice(index, 1)
    return this
  }

  // ───────────────────────────────────────────────────────────────────────
  // emit(eventName, ...args)
  //
  // Вызывает каждого слушателя eventName по очереди, передавая ...args.
  // this внутри слушателей равен null (вызываем через .apply(null, args)).
  //
  // Возвращает false, если события нет или список слушателей пуст —
  // иначе true.
  //
  // Клонируем массив слушателей (.slice()) ПЕРЕД тем, как их вызывать.
  // Это защищает текущий проход emit() от мутаций: если один из слушателей
  // добавит (on) или уберёт (off) другого слушателя ПРЯМО ВО ВРЕМЯ emit,
  // это не должно повлиять на уже стартовавший проход — оно повлияет
  // только на следующий emit().
  // ───────────────────────────────────────────────────────────────────────
  emit(eventName: string, ...args: Array<any>): boolean {
    if (!Object.hasOwn(this._events, eventName) || this._events[eventName].length === 0) {
      return false
    }

    // Снимок текущего состояния корзины — «замороженный» список на этот emit.
    const listeners = this._events[eventName].slice()
    listeners.forEach((listener) => {
      listener.apply(null, args)
    })

    return true
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// АЛЬТЕРНАТИВНЫЙ ПОДХОД: прототипное решение (без class)
//
// То же самое, но через function + .prototype — так исторически выглядел
// код до ES6-классов. Полезно знать, если попросят «без class».
// ─────────────────────────────────────────────────────────────────────────────
interface EventEmitterProto {
  _events: Record<string, Array<Function>>
  on(eventName: string, listener: Function): EventEmitterProto
  off(eventName: string, listener: Function): EventEmitterProto
  emit(eventName: string, ...args: Array<any>): boolean
}

export function EventEmitterFn(this: EventEmitterProto) {
  this._events = Object.create(null)
}

EventEmitterFn.prototype.on = function (
  this: EventEmitterProto,
  eventName: string,
  listener: Function,
): EventEmitterProto {
  if (!Object.hasOwn(this._events, eventName)) {
    this._events[eventName] = []
  }

  this._events[eventName].push(listener)
  return this
}

EventEmitterFn.prototype.off = function (
  this: EventEmitterProto,
  eventName: string,
  listener: Function,
): EventEmitterProto {
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

EventEmitterFn.prototype.emit = function (
  this: EventEmitterProto,
  eventName: string,
  ...args: Array<any>
): boolean {
  if (!Object.hasOwn(this._events, eventName) || this._events[eventName].length === 0) {
    return false
  }

  const listeners = this._events[eventName].slice()
  listeners.forEach((listener) => {
    listener.apply(null, args)
  })

  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// ВЕРСИЯ С ПОДРОБНОЙ ТРАССИРОВКОЙ (для наглядности)
//
// Та же логика, что и в EventEmitter, но с console.log на каждом шаге.
// Показывает, что происходит с внутренней корзиной слушателей при
// on/off/emit — особенно полезно для дубликатов и снапшота при emit().
// ─────────────────────────────────────────────────────────────────────────────
export class EventEmitterTraced implements IEventEmitter {
  _events: Record<string, Array<Function>>
  private step = 0

  constructor() {
    this._events = Object.create(null)
    console.log('🚀 Создан новый EventEmitterTraced')
  }

  private log(msg: string) {
    this.step += 1
    console.log(`шаг ${String(this.step).padStart(2, ' ')} ${msg}`)
  }

  private snapshot(eventName: string): string {
    const listeners = this._events[eventName] ?? []
    return `[${listeners.map((fn) => fn.name || '<anonymous>').join(', ')}]`
  }

  on(eventName: string, listener: Function): EventEmitterTraced {
    if (!Object.hasOwn(this._events, eventName)) {
      this._events[eventName] = []
      this.log(`on('${eventName}'): корзина создана впервые`)
    }

    this._events[eventName].push(listener)
    this.log(`on('${eventName}', ${listener.name || '<anonymous>'}) → корзина теперь ${this.snapshot(eventName)}`)
    return this
  }

  off(eventName: string, listener: Function): EventEmitterTraced {
    if (!Object.hasOwn(this._events, eventName)) {
      this.log(`off('${eventName}'): события не существует → ничего не делаем`)
      return this
    }

    const listeners = this._events[eventName]
    const index = listeners.findIndex((listenerItem) => listenerItem === listener)

    if (index < 0) {
      this.log(`off('${eventName}', ${listener.name || '<anonymous>'}): совпадений не найдено`)
      return this
    }

    this._events[eventName].splice(index, 1)
    this.log(
      `off('${eventName}', ${listener.name || '<anonymous>'}) удалил запись #${index} → корзина теперь ${this.snapshot(eventName)}`,
    )
    return this
  }

  emit(eventName: string, ...args: Array<any>): boolean {
    if (!Object.hasOwn(this._events, eventName) || this._events[eventName].length === 0) {
      this.log(`emit('${eventName}'): слушателей нет → return false`)
      return false
    }

    const listeners = this._events[eventName].slice()
    this.log(`emit('${eventName}', ${JSON.stringify(args)}): снимок слушателей ${this.snapshot(eventName)}`)

    listeners.forEach((listener, i) => {
      this.log(`  вызываю слушателя #${i} (${listener.name || '<anonymous>'})`)
      listener.apply(null, args)
    })

    this.log(`emit('${eventName}') завершён → return true`)
    return true
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ЧАСТАЯ ОШИБКА (антипаттерн): общий объект слушателей на все экземпляры
//
// _events НЕ должен быть статическим/модульным объектом — иначе все
// инстансы EventEmitter будут делить одну и ту же корзину, и события
// одного эмиттера будут «протекать» в другой. _events обязан создаваться
// заново в constructor() для каждого экземпляра (см. выше).
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ПРИМЕР ИЗ РЕАЛЬНОГО ПРОЕКТА: мини pub/sub для тостов уведомлений
//
// Типичный сценарий использования: глобальная шина событий для показа
// тост-уведомлений из любого места приложения без прокидывания props.
// ─────────────────────────────────────────────────────────────────────────────

type ToastPayload = { message: string; type: 'success' | 'error' | 'info' }

const toastBus = new EventEmitter()

function showToast({ message, type }: ToastPayload) {
  console.log(`  🔔 [${type.toUpperCase()}] ${message}`)
}

async function realWorldExample() {
  console.log('\n=== Реальный пример: шина тост-уведомлений ===')

  toastBus.on('toast', showToast)

  toastBus.emit('toast', { message: 'Файл сохранён', type: 'success' } satisfies ToastPayload)
  toastBus.emit('toast', { message: 'Не удалось подключиться к серверу', type: 'error' } satisfies ToastPayload)

  toastBus.off('toast', showToast)
  const hadListeners = toastBus.emit('toast', { message: 'Это уже никто не увидит', type: 'info' } satisfies ToastPayload)
  console.log('  emit после off() вернул:', hadListeners) // false
}

// ── Тесты ──────────────────────────────────────────────────────────────────
//
// Запуск: npx tsx eventEmitter.ts
// или:    npx ts-node eventEmitter.ts

function runTests() {
  console.log('--- Тест 1: Базовые on/emit ---')
  const emitter = new EventEmitter()

  function addTwoNumbers(a: number, b: number) {
    console.log(`Сумма: ${a + b}`)
  }

  emitter.on('foo', addTwoNumbers)
  emitter.emit('foo', 2, 5)
  // > "Сумма: 7"

  console.log('--- Тест 2: Несколько слушателей на одно событие ---')
  emitter.on('foo', (a: number, b: number) => console.log(`Произведение: ${a * b}`))
  emitter.emit('foo', 4, 5)
  // > "Сумма: 9"
  // > "Произведение: 20"

  console.log('--- Тест 3: off() убирает конкретного слушателя ---')
  emitter.off('foo', addTwoNumbers)
  emitter.emit('foo', -3, 9)
  // > "Произведение: -27"   (addTwoNumbers больше не вызывается)

  console.log('--- Тест 4: emit() возвращает true/false ---')
  const e2 = new EventEmitter()
  console.log(e2.emit('nope')) // false — слушателей нет
  e2.on('bar', () => {})
  console.log(e2.emit('bar')) // true

  console.log('--- Тест 5: Дубликаты listener и одиночный off() ---')
  const calls: string[] = []
  const dup = () => calls.push('called')
  const e3 = new EventEmitter()
  e3.on('double', dup)
  e3.on('double', dup)
  e3.emit('double')
  console.log(calls.length) // 2 — вызван дважды (две отдельные регистрации)
  e3.off('double', dup)
  calls.length = 0
  e3.emit('double')
  console.log(calls.length) // 1 — осталась одна регистрация

  console.log('--- Тест 6: Изоляция между разными экземплярами ---')
  const e4 = new EventEmitter()
  const e5 = new EventEmitter()
  e4.on('shared', () => console.log('e4 услышал событие'))
  e5.emit('shared') // false — у e5 нет своих слушателей на 'shared'

  console.log('--- Тест 7: Чейнинг on/off ---')
  const e6 = new EventEmitter()
  const noop = () => {}
  e6.on('a', noop).on('b', noop).off('a', noop)
  console.log('OK — чейнинг работает')

  console.log('--- Тест 8: off() на несуществующем событии не падает ---')
  const e7 = new EventEmitter()
  e7.off('ghost', () => {})
  console.log('OK — не упало')

  console.log('--- Тест 9: eventName как встроенное имя объекта (toString) ---')
  const e8 = new EventEmitter()
  e8.on('toString', () => console.log('вызван кастомный toString-листенер'))
  console.log(e8.emit('toString')) // true — Object.create(null) не даёт коллизии

  console.log('\n--- Тест 10: ПОДРОБНАЯ ТРАССИРОВКА (EventEmitterTraced) ---')
  const traced = new EventEmitterTraced()
  function onFoo(a: number, b: number) {
    console.log(`  Сумма: ${a + b}`)
  }
  traced.on('foo', onFoo)
  traced.emit('foo', 2, 5)
  traced.off('foo', onFoo)
  traced.emit('foo', 2, 5)

  // Пример применения в реальном проекте (шина тост-уведомлений).
  realWorldExample()
}

runTests()

// =================================================================
// РЕШЕНИЕ 1: Throttle — leading edge (вызов немедленно, блокировка на wait мс)
// =================================================================

// ThrottleFunction<T> — вспомогательный тип: функция с произвольными аргументами T
// T extends any[] — T это tuple аргументов, например [string, number]
// (this: any, ...args: T) => any — функция может быть вызвана с любым this и аргументами T
type ThrottleFunction<T extends any[]> = (this: any, ...args: T) => any

// <T extends any[]> — generic по tuple аргументов (не по самой функции как в debounce)
// Возвращаем функцию с той же сигнатурой аргументов T
export function throttle<T extends any[]>(
  func: ThrottleFunction<T>, // конкретный тип переданной функции
  wait: number,
): ThrottleFunction<T> {
  // shouldThrottle — булев флаг-замок:
  // false = окно открыто, можно вызывать func
  // true  = окно заблокировано, вызовы игнорируются
  let shouldThrottle = false

  // Обёртка — обычная function (НЕ стрелка): this определяется в момент вызова
  return function (this: any, ...args: T) {
    if (shouldThrottle) {
      return // окно заблокировано — просто игнорируем вызов, ничего не планируем
    }

    shouldThrottle = true // закрываем окно — следующие вызовы будут проигнорированы
    setTimeout(function () {
      shouldThrottle = false // через wait мс открываем окно снова
    }, wait)

    func.apply(this, args) // вызываем func НЕМЕДЛЕННО с правильным this и аргументами
  }
}

export default function throttle1<T extends any[]>(func: ThrottleFunction<T>, wait: number): ThrottleFunction<T> {
  let shouldThrottle = false

  return function (...args) {
    if (shouldThrottle) {
      return
    }

    shouldThrottle = true
    setTimeout(function () {
      shouldThrottle = false
    }, wait)

    func.apply(this, args)
  }
}

// =================================================================
// РЕШЕНИЕ 2: То же самое с более явными комментариями о this
// (стрелка в setTimeout — this не нужен внутри, меняем только флаг)
// =================================================================
export function throttleV2<T extends any[]>(func: ThrottleFunction<T>, wait: number): ThrottleFunction<T> {
  let shouldThrottle = false

  return function (this: any, ...args: T) {
    if (shouldThrottle) {
      return
    }

    shouldThrottle = true
    setTimeout(() => {
      // стрелка здесь безопасна: внутри только shouldThrottle = false
      shouldThrottle = false // this не используется — стрелка vs function не имеет значения
    }, wait)

    func.apply(this, args) // this из обёртки передаём через apply
  }
}

// =================================================================
// Отличие от Debounce — ключевое сравнение
// =================================================================

// Debounce:  func вызывается ПОСЛЕ паузы — откладывает каждый вызов
// Throttle:  func вызывается НЕМЕДЛЕННО — блокирует следующие на wait мс

// Debounce — лифт: ждёт пока все войдут, потом закрывает двери
// Throttle — турникет: пропускает, потом блокирует на N секунд

// Debounce хранит: timeoutID (сбрасывает при каждом вызове)
// Throttle хранит: shouldThrottle (булев флаг, не сбрасывается при вызовах)

// =================================================================
// РЕШЕНИЕ 1: обычная function + сохраняем this в переменную context
// =================================================================

// T extends (...args: any[]) => any — T должен быть функцией,
// иначе Parameters<T> не скомпилируется
function debounceV1<T extends (...args: any[]) => any>(
  func: T, // T — конкретный тип переданной функции, TS выведет его автоматически
  wait: number = 0,
): (...args: Parameters<T>) => void {
  // Parameters<T> — извлекает аргументы T как tuple: (q: string, n: number) => [string, number]
  // Возвращаем функцию с той же сигнатурой что и оригинал — TS будет проверять типы на вызове

  // ReturnType<typeof setTimeout> — кросс-платформенный тип ID таймера
  // (number в браузере, NodeJS.Timeout в Node — typeof берёт тип функции, ReturnType вытаскивает результат)
  let timeoutID: ReturnType<typeof setTimeout> | null = null
  // null — нет активного таймера; один ID на всё замыкание — каждый вызов видит один и тот же

  // this: any — фиктивный параметр, не реальный аргумент (в JS его нет)
  // говорит TS: функция может быть вызвана с любым this, иначе strict-режим запретит его использование
  return function (this: any, ...args: Parameters<T>) {
    const context = this // сохраняем this ДО входа в setTimeout — внутри обычной function он потеряется

    // null ?? undefined — clearTimeout принимает number | undefined, но не null
    // ?? заменяет null на undefined, числа пропускает как есть
    clearTimeout(timeoutID ?? undefined) // отменяем предыдущий таймер — сбрасываем отсчёт

    timeoutID = setTimeout(function () {
      // обычная function — this здесь был бы globalThis/undefined
      timeoutID = null // таймер отработал — сигнал что нет активного ожидания
      func.apply(context, args) // вызываем func с сохранённым context и последними args
    }, wait)
  }
}

function debounce1<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 0,
): (...args: Parameters<T>) => void {
  let timeoutID: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: any[]) {
    const context = this
    clearTimeout(timeoutID ?? undefined)

    timeoutID = setTimeout(function () {
      timeoutID = null
      func.apply(context, args)
    }, wait)
  }
}

function debounce2<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 0,
): (...args: Parameters<T>) => void {
  let timeoutID: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Array<any>) {
    clearTimeout(timeoutID ?? undefined)

    timeoutID = setTimeout(() => {
      timeoutID = null
      func.apply(this, args)
    }, wait)
  }
}

// =================================================================
// РЕШЕНИЕ 2: обычная function + стрелочная функция внутри setTimeout
// =================================================================
function debounceV2<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 0,
): (...args: Parameters<T>) => void {
  let timeoutID: ReturnType<typeof setTimeout> | null = null

  // Обёртка — обычная function (НЕ стрелка): this определяется в момент вызова снаружи
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutID ?? undefined) // отменяем предыдущий таймер — сбрасываем отсчёт

    timeoutID = setTimeout(() => {
      // стрелка не имеет своего this — захватывает его лексически из function выше
      timeoutID = null // таймер отработал — сбрасываем ID
      func.apply(this, args) // this здесь == this обёртки (захвачен стрелкой), args — из последнего вызова
    }, wait)
  }
}

// =================================================================
// РЕШЕНИЕ 3: стрелочная функция + стрелочная функция внутри setTimeout
// =================================================================
const debounce3 = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = 0,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  // Arrow function does not have a `this` parameter
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId ?? undefined)

    timeoutId = setTimeout(() => {
      timeoutId = null
      func.apply(this, args)
    }, wait)
  }
}

type AnyFunction = (this: any, ...args: any[]) => any;

function debounce4<T extends AnyFunction>(
  func: T,
  wait: number = 0,
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void {
  let timeoutID: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeoutID ?? undefined);

    timeoutID = setTimeout(() => {
      timeoutID = null; 
      func.apply(this, args);
    }, wait);
  };
}

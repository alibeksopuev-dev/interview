export {}

declare global {
  interface Array<T> {
    // 1. Сигнатура для Type Guard (сужение типов)
    myFilter<S extends T>(
      callbackFn: (value: T, index: number, array: Array<T>) => value is S,
      thisArg?: any,
    ): Array<S>

    // 2. Стандартная сигнатура для обычных предикатов
    myFilter(
      callbackFn: (value: T, index: number, array: Array<T>) => unknown,
      thisArg?: any,
    ): Array<T>
  }
}

Array.prototype.myFilter = function <T>(
  this: T[],
  callbackFn: (value: T, index: number, array: T[]) => unknown,
  thisArg?: any,
): any[] {
  const arrayLength = this.length
  const array: T[] = []

  for (let index = 0; index < arrayLength; index++) {
    if (
      Object.hasOwn(this, index) &&
      callbackFn.call(thisArg, this[index], index, this)
    ) {
      array.push(this[index])
    }
  }

  return array
}

// ── Тесты ──────────────────────────────────────────────────────────────────

// Базовая фильтрация: только четные числа
const evens = [1, 2, 3, 4, 5].myFilter(x => x % 2 === 0)
console.log(evens) // [2, 4]

// Фильтрация строк по длине
const longStrings = ['apple', 'cat', 'banana'].myFilter(x => x.length > 3)
console.log(longStrings) // ['apple', 'banana']

// Использование thisArg
const boundObject = { threshold: 3 }
const greaterThanThreshold = [1, 2, 3, 4, 5].myFilter(function (
  this: typeof boundObject,
  x,
) {
  return x > this.threshold
}, boundObject)
console.log(greaterThanThreshold) // [4, 5]

// Разреженный массив: пустые ячейки (holes) игнорируются
const sparseArray = [1, , 3, 4]
const filteredSparse = sparseArray.myFilter(x => typeof x === 'number' && x % 2 !== 0)
console.log(filteredSparse) // [1, 3]
console.log(0 in filteredSparse) // true
console.log(1 in filteredSparse) // true (результирующий массив плотный, "дыра" отфильтрована/пропущена)

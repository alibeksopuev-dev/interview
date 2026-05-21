const binarySearch = (arr: number[], target: number) => {
  let leftIndex = 0
  let rightIndex = arr.length - 1

  while (leftIndex <= rightIndex) {
    let midIndex = leftIndex + Math.floor((rightIndex - leftIndex) / 2)
    let midElement = arr[midIndex]

    if (target === midElement) {
      return midElement
    } else if (target > midElement) {
      leftIndex = midIndex + 1
    } else if (target < midElement) {
      rightIndex = midIndex - 1
    }
  }

  return -1
}

/**
 * Преобразует массив чисел в строку, сворачивая последовательные числа в диапазоны
 * @param {number[]} arr - исходный массив чисел
 * @returns {string} - строка с диапазонами (например, "1-2,4,7-9")
 * Пример исходного массива: [7, 1, 4, 2, 9, 8]
 */
export function compressRanges(arr: number[]): string {
  if (arr.length === 0) return ''

  arr.sort((a, b) => a - b)

  let result = [String(arr[0])]

  let isInterval = false

  for (let i = 1; i <= arr.length; i++) {
    const prevNumber = arr[i - 1]
    const currentNumber = arr[i]

    if (currentNumber - prevNumber === 1) {
      isInterval = true
      continue
    }

    if (isInterval) {
      result[result.length - 1] += `-${prevNumber}`
      isInterval = false
    }

    if (currentNumber !== undefined) {
      result.push(String(currentNumber))
    }
  }

  return result.join(',')
}

/**
 * Находит индекс первого уникального (неповторяющегося) символа в строке.
 * Если таких символов нет — возвращает -1.
 *
 * @param {string} str - входная строка для поиска
 * @returns {number} - индекс первого уникального символа, или -1
 *
 * @example
 * findFirstUniqueCharIndex('leetcode'); // 0  → 'l'
 * findFirstUniqueCharIndex('loveleet'); // 1  → 'o'
 * findFirstUniqueCharIndex('aabb');     // -1 → уникальных нет
 */
const findFirstUniqueCharIndex = (str: string): number => {
  const charMap = new Map<string, number>()

  for (const char of str) {
    const currentCount = charMap.get(char) ?? 0
    charMap.set(char, currentCount + 1)
  }

  for (let i = 0; i < str.length; i++) {
    if (charMap.get(str[i]) === 1) {
      return i
    }
  }

  return -1
}

/**
 * Объединяет пересекающиеся интервалы
 * @param {number[][]} intervals - двумерный массив интервалов для слияния (например, [[1,3], [2,6]])
 * @returns {number[][]} - массив объединенных интервалов (результат: [[1,6]])
 */
export function mergeIntervals(intervals: number[][]): number[][] {
  if (intervals.length < 2) {
    return intervals
  }
  intervals.sort((a, b) => a[0] - b[0])
  const result = [intervals[0]]
  for (const interval of intervals) {
    let recent = result[result.length - 1]

    if (recent[1] >= interval[0]) {
      recent[1] = Math.max(recent[1], interval[1])
    } else {
      result.push(interval)
    }
  }

  return result
}

export function insertIntervalBinary(intervals: number[][], newInterval: number[]): number[][] {
  let leftIndex = 0
  let rightIndex = intervals.length - 1
  const target = newInterval[0]

  while (leftIndex <= rightIndex) {
    let midIndex = leftIndex + Math.floor((rightIndex - leftIndex) / 2)
    let midElement = intervals[midIndex]
    if (target > midElement[0]) {
      leftIndex = midIndex + 1
    } else if (target < midElement[0]) {
      rightIndex = midIndex - 1
    }
  }

  intervals.splice(leftIndex, 0, newInterval)
  const result: number[][] = [intervals[0]]
  for (const interval of intervals) {
    let recent = result[result.length - 1]

    if (recent[1] >= interval[0]) {
      recent[1] = Math.max(recent[1], interval[1])
    } else {
      result.push(interval)
    }
  }

  return result
}

function curry(func: Function): Function {
  return function curried(this: any, ...args: any[]): any {
    if (args.length >= func.length) {
      return func.apply(this, args)
    }

    return (arg: any) =>
      arg === undefined ? curried.apply(this, args) : curried.apply(this, [...args, arg])

    // bind - более гибкий вариант. Позволяет передавать аргументы любыми пачками: curried(1, 2)(3) или curried(1)(2, 3).
    // return curried.bind(this, ...args)
  }
}

const sum = (a: number, b: number, c: number) => a + b + c
const curriedSum = curry(sum)
console.log(curriedSum(1)(2)(3)) // 6

const person = {
  name: 'Alibek',
  greet(phrase: string, punctuation: string) {
    return `${phrase}, ${this.name}${punctuation}`
  },
}
const curriedGreet = curry(person.greet)
// Важно вызвать с правильным контекстом
const helloAlibek = curriedGreet.call(person, 'Hello')
console.log(helloAlibek('!')) // "Hello, Alibek!"

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = 0,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId ?? undefined)

    timeoutId = setTimeout(() => {
      timeoutId = null
      func.apply(this, args)
    }, wait)
  }
}

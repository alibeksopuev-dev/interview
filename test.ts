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
export function compressRanges(arr: number[]): string {}

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
const findFirstUniqueCharIndex = (str: string): number => {}

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
  const result: number[][] = []

  return result
}

function curry(func: Function): Function {
  return function curried(this: any, ...args: any[]): any {
    if (args.length >= func.length) {
      return func.apply(this, args)
    }

    return (arg: any) => (arg === undefined ? curried.apply(this, args) : curried.apply(this, [...args, arg]))

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

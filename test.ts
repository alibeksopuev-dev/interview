const binarySearch = (arr: number[], target: number) => {
    let leftIndex = 0;
    let rightIndex = arr.length - 1;

    while(leftIndex <= rightIndex) {
        const midIndex = leftIndex + Math.floor((rightIndex - leftIndex) / 2)
        const midElement = arr[midIndex]

        if (midElement === target){
            return midIndex
        }

        if (target > midElement){
            leftIndex = midIndex + 1
        } else {
            rightIndex = midIndex - 1
        }
    }

    return -1
 }

 /**
 * Преобразует массив чисел в строку, сворачивая последовательные числа в диапазоны
 * @param {number[]} arr - исходный массив чисел
 * @returns {string} - строка с диапазонами (например, "1-2,4,7-9")
 */
export function compressRanges(arr: number[]): string {
    const sortedArr = [...arr].sort((a, b) => a - b)

    if (!sortedArr.length) {
        return '';
    }

    const result: string[] = [String(sortedArr[0])]

    let isInterval = false

    for(let i = 1; i <= sortedArr.length; i++){
        const prev = sortedArr[i -1]
        const current = sortedArr[i]

        if (current !== undefined && current - prev === 1){
            isInterval = true
            continue
        }

        if (isInterval) {
            result[result.length - 1] += `-${prev}`
            isInterval = false
        }

        if (current !== undefined){
            result.push(String(current))
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
    const charFrequencyMap: Map<string, number> = new Map<string, number>()

    for (const char of str){
       const currentFrequency = charFrequencyMap.get(char) ?? 0
       charFrequencyMap.set(char, currentFrequency + 1)
    }

    for(let charIndex = 0; charIndex < str.length; charIndex++){
        const char = str[charIndex]
        if (charFrequencyMap.get(char) === 1){
            return charIndex
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
        return intervals;
    }

    const sortedIntervals = [...intervals].sort((a, b) => a[0] - b[0])

    const result = [sortedIntervals[0]]

    for (const interval of sortedIntervals) {
        const recent = result[result.length - 1]

        if (recent[1] >= interval[0]){
            recent[1] = Math.max(recent[1], interval[1])
        } else {
            result.push(interval)
        }
    }

    return result
}

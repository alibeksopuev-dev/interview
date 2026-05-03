"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertIntervalBinary = exports.mergeIntervals = exports.compressRanges = void 0;
const binarySearch = (arr, target) => {
    let leftIndex = 0;
    let rightIndex = arr.length - 1;
    while (leftIndex < rightIndex) {
        const midIndex = leftIndex + Math.floor((rightIndex - leftIndex) / 2);
        const midElement = arr[midIndex];
        if (target === midElement) {
            return midIndex;
        }
        else if (target < midElement) {
            rightIndex = midIndex - 1;
        }
        else {
            leftIndex = midIndex + 1;
        }
    }
    return -1;
};
/**
 * Преобразует массив чисел в строку, сворачивая последовательные числа в диапазоны
 * @param {number[]} arr - исходный массив чисел
 * @returns {string} - строка с диапазонами (например, "1-2,4,7-9")
 * Пример исходного массива: [7, 1, 4, 2, 9, 8]
 */
function compressRanges(arr) {
    arr.sort((a, b) => a - b);
    if (arr.length === 0)
        return '';
    let isInterval = false;
    const result = [String(arr[0])];
    for (let i = 1; i <= arr.length; i++) {
        let prevNumber = arr[i - 1];
        let currentNumber = arr[i];
        if (currentNumber !== undefined && currentNumber - prevNumber === 1) {
            isInterval = true;
            continue;
        }
        if (isInterval) {
            result[result.length - 1] += `-${prevNumber}`;
            isInterval = false;
        }
        if (currentNumber !== undefined) {
            result.push(String(currentNumber));
        }
    }
    return result.join(',');
}
exports.compressRanges = compressRanges;
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
const findFirstUniqueCharIndex = (str) => {
    const charFrequencyMap = new Map();
    for (const char of str) {
        const currentCount = charFrequencyMap.get(char) ?? 0;
        charFrequencyMap.set(char, currentCount + 1);
    }
    for (let i = 0; i < str.length; i++) {
        if (charFrequencyMap.get(str[i]) === 1) {
            return i;
        }
    }
    return -1;
};
/**
 * Объединяет пересекающиеся интервалы
 * @param {number[][]} intervals - двумерный массив интервалов для слияния (например, [[1,3], [2,6]])
 * @returns {number[][]} - массив объединенных интервалов (результат: [[1,6]])
 */
function mergeIntervals(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    if (intervals.length < 2) {
        return intervals;
    }
    const result = [intervals[0]];
    for (const interval of intervals) {
        const recent = result[result.length - 1];
        if (recent[1] >= interval[0]) {
            recent[1] = Math.max(recent[1], interval[1]);
        }
        else {
            result.push(interval);
        }
    }
    return result;
}
exports.mergeIntervals = mergeIntervals;
function insertIntervalBinary(intervals, newInterval) {
    const result = [];
    return result;
}
exports.insertIntervalBinary = insertIntervalBinary;
function curry(func) {
    return function curried(...args) {
        if (args.length >= func.length) {
            return func.apply(this, args);
        }
        return (arg) => (arg === undefined ? curried.apply(this, args) : curried.apply(this, [...args, arg]));
        // bind - более гибкий вариант. Позволяет передавать аргументы любыми пачками: curried(1, 2)(3) или curried(1)(2, 3).
        // return curried.bind(this, ...args)
    };
}
const sum = (a, b, c) => a + b + c;
const curriedSum = curry(sum);
console.log(curriedSum(1)(2)(3)); // 6
const person = {
    name: 'Alibek',
    greet(phrase, punctuation) {
        return `${phrase}, ${this.name}${punctuation}`;
    },
};
const curriedGreet = curry(person.greet);
// Важно вызвать с правильным контекстом
const helloAlibek = curriedGreet.call(person, 'Hello');
console.log(helloAlibek('!')); // "Hello, Alibek!"

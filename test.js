"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = exports.debounce = exports.insertIntervalBinary = exports.mergeIntervals = exports.compressRanges = void 0;
const binarySearch = (arr, target) => {
    let leftIndex = 0;
    let rightIndex = arr.length - 1;
    while (leftIndex <= rightIndex) {
        let midIndex = leftIndex + Math.floor((rightIndex - leftIndex) / 2);
        let midElement = arr[midIndex];
        if (target === midElement) {
            return midElement;
        }
        else if (target > midElement) {
            leftIndex = midIndex + 1;
        }
        else if (target < midElement) {
            rightIndex = midIndex - 1;
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
    if (arr.length === 0)
        return '';
    arr.sort((a, b) => a - b);
    let result = [String(arr[0])];
    let isInterval = false;
    for (let i = 1; i <= arr.length; i++) {
        const prevNumber = arr[i - 1];
        const currentNumber = arr[i];
        if (currentNumber - prevNumber === 1) {
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
    const charMap = new Map();
    for (const char of str) {
        const currentCount = charMap.get(char) ?? 0;
        charMap.set(char, currentCount + 1);
    }
    for (let i = 0; i < str.length; i++) {
        if (charMap.get(str[i]) === 1) {
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
    if (intervals.length < 2) {
        return intervals;
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const result = [intervals[0]];
    for (const interval of intervals) {
        let recent = result[result.length - 1];
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
    let leftIndex = 0;
    let rightIndex = intervals.length - 1;
    const target = newInterval[0];
    while (leftIndex <= rightIndex) {
        let midIndex = leftIndex + Math.floor((rightIndex - leftIndex) / 2);
        let midElement = intervals[midIndex];
        if (target > midElement[0]) {
            leftIndex = midIndex + 1;
        }
        else if (target < midElement[0]) {
            rightIndex = midIndex - 1;
        }
    }
    intervals.splice(leftIndex, 0, newInterval);
    const result = [intervals[0]];
    for (const interval of intervals) {
        let recent = result[result.length - 1];
        if (recent[1] >= interval[0]) {
            recent[1] = Math.max(recent[1], interval[1]);
        }
        else {
            result.push(interval);
        }
    }
    return result;
}
exports.insertIntervalBinary = insertIntervalBinary;
function curry(func) {
    return function curried(...args) {
        if (args.length >= func.length) {
            return func.apply(this, args);
        }
        return (arg) => arg === undefined ? func.apply(this, args) : func.apply(this, [...args, arg]);
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
const debounce = (func, wait = 0) => {
    let timeoutId = null;
    return function (...args) {
        clearTimeout(timeoutId ?? undefined);
        timeoutId = setTimeout(() => {
            timeoutId = null;
            func.apply(this, args);
        }, wait);
    };
};
exports.debounce = debounce;
async function fetchUsers(query, limit) {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users?name=${query}&_limit=${limit}`);
    if (!res.ok)
        throw new Error('Failed to fetch users');
    return res.json();
}
const debouncedFetch = (0, exports.debounce)(fetchUsers, 1000);
debouncedFetch('alibek', 10);
const throttle = (func, wait) => {
    let isLocked = false;
    return function (...args) {
        if (isLocked) {
            return;
        }
        isLocked = true;
        setTimeout(() => {
            isLocked = false;
        }, wait);
        func.apply(this, args);
    };
};
exports.throttle = throttle;

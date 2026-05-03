"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.binarySearch = void 0;
/**
 * Выполняет бинарный поиск значения в отсортированном массиве.
 * Возвращает индекс найденного элемента или -1, если элемент отсутствует.
 *
 * ⚠️  ВАЖНО: массив должен быть отсортирован по возрастанию.
 *
 * @param {number[]} arr    - отсортированный массив чисел
 * @param {number}   target - искомое значение
 * @returns {number}        - индекс элемента или -1
 *
 * @example
 * binarySearch([1, 3, 5, 7, 9, 11, 13], 7);  // 3
 * binarySearch([1, 3, 5, 7, 9, 11, 13], 6);  // -1
 * binarySearch([2, 4, 6, 8, 10], 10);         // 4
 * binarySearch([], 5);                         // -1
 */
const binarySearch = (arr, target) => {
    let leftIndex = 0;
    let rightIndex = arr.length - 1;
    // ── Сужаем диапазон поиска вдвое на каждой итерации ──────────────────────
    while (leftIndex <= rightIndex) {
        // Берём средний индекс диапазона (без риска переполнения)
        const midIndex = leftIndex + Math.floor((rightIndex - leftIndex) / 2);
        const midElement = arr[midIndex];
        if (midElement === target) {
            // 🎯 Нашли!
            return midIndex;
        }
        if (midElement < target) {
            // Цель правее — отбрасываем левую половину
            leftIndex = midIndex + 1;
        }
        else {
            // Цель левее — отбрасываем правую половину
            rightIndex = midIndex - 1;
        }
    }
    // Диапазон схлопнулся — элемент не найден
    return -1;
};
exports.binarySearch = binarySearch;
// ── Тесты ──────────────────────────────────────────────────────────────────
console.log(binarySearch([1, 3, 5, 7, 9, 11, 13], 7)); // 3
console.log(binarySearch([1, 3, 5, 7, 9, 11, 13], 6)); // -1
console.log(binarySearch([2, 4, 6, 8, 10], 10)); // 4
console.log(binarySearch([42], 42)); // 0
console.log(binarySearch([], 5)); // -1
console.log(binarySearch([1, 3, 5, 7, 9, 11, 13], 1)); // 0  (левый край)
console.log(binarySearch([1, 3, 5, 7, 9, 11, 13], 13)); // 6  (правый край)

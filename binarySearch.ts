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
const binarySearch = (arr: number[], target: number): number => {
    let left = 0;
    let right = arr.length - 1;

    // ── Сужаем диапазон поиска вдвое на каждой итерации ──────────────────────
    while (left <= right) {
        // Берём средний индекс диапазона (без риска переполнения)
        const mid = left + Math.floor((right - left) / 2);
        const midValue = arr[mid];

        if (midValue === target) {
            // 🎯 Нашли!
            return mid;
        }

        if (midValue < target) {
            // Цель правее — отбрасываем левую половину
            left = mid + 1;
        } else {
            // Цель левее — отбрасываем правую половину
            right = mid - 1;
        }
    }

    // Диапазон схлопнулся — элемент не найден
    return -1;
};

// ── Тесты ──────────────────────────────────────────────────────────────────
console.log(binarySearch([1, 3, 5, 7, 9, 11, 13], 7));   // 3
console.log(binarySearch([1, 3, 5, 7, 9, 11, 13], 6));   // -1
console.log(binarySearch([2, 4, 6, 8, 10], 10));          // 4
console.log(binarySearch([42], 42));                       // 0
console.log(binarySearch([], 5));                          // -1
console.log(binarySearch([1, 3, 5, 7, 9, 11, 13], 1));   // 0  (левый край)
console.log(binarySearch([1, 3, 5, 7, 9, 11, 13], 13));  // 6  (правый край)

export { binarySearch };
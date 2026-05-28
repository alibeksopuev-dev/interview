"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasDuplicates = void 0;
/**
 * Определяет, содержит ли массив дубликаты.
 * Возвращает true, если хотя бы одно значение встречается в массиве дважды.
 * Если все элементы уникальны, возвращает false.
 *
 * @param {number[]} numbers - входной массив чисел для проверки
 * @returns {boolean} - true, если найден дубликат
 *
 * @example
 * hasDuplicates([1, 2, 3, 1]); // true
 * hasDuplicates([1, 2, 3, 4]); // false
 * hasDuplicates([1, 1, 1, 3, 3, 4, 3, 2, 4, 2]); // true
 */
const hasDuplicates = (numbers) => {
    // Создаем Set для хранения уже встреченных уникальных элементов
    const seen = new Set();
    // Получаем размер входного массива для будущего цикла
    const n = numbers.length;
    // ── Проход по массиву ──────────────────────────────────────────────────────
    for (let i = 0; i < n; i++) {
        // Пытаемся найти текущий элемент в сете
        // Если элемент уже существует, значит мы нашли дубликат
        if (seen.has(numbers[i])) {
            return true; // Найден дубликат, возвращаем true
        }
        seen.add(numbers[i]); // Добавляем элемент для будущих проверок
    }
    // Если весь массив пройден и ничего не найдено, дубликатов нет
    return false;
};
exports.hasDuplicates = hasDuplicates;
// ── Тесты ──────────────────────────────────────────────────────────────────
console.log(hasDuplicates([1, 2, 3, 1])); // true
console.log(hasDuplicates([1, 2, 3, 4])); // false
console.log(hasDuplicates([1, 1, 1, 3, 3, 4, 3, 2, 4, 2])); // true

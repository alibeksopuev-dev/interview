"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameLetterIgnoreCase = exports.isLetter = exports.isPalindrome = void 0;
/**
 * Проверяет, является ли символ буквой (латинской или юникодной).
 * Символ считается буквой, если его нижний и верхний регистры различаются.
 *
 * @param {string} char - символ для проверки
 * @returns {boolean} - true, если символ является буквой
 */
const isLetter = (char) => {
    return char.toLowerCase() !== char.toUpperCase();
};
exports.isLetter = isLetter;
/**
 * Сравнивает два символа без учёта регистра.
 *
 * @param {string} charA - первый символ
 * @param {string} charB - второй символ
 * @returns {boolean} - true, если символы совпадают (без учёта регистра)
 */
const isSameLetterIgnoreCase = (charA, charB) => {
    return charA.toLowerCase() === charB.toLowerCase();
};
exports.isSameLetterIgnoreCase = isSameLetterIgnoreCase;
/**
 * Определяет, является ли строка палиндромом с учётом только букв, игнорируя регистр.
 * Небуквенные символы (цифры, пробелы, знаки препинания) пропускаются.
 *
 * @param {string} str - входная строка для проверки
 * @returns {boolean} - true, если строка является палиндромом
 *
 * @example
 * isPalindrome('A man a plan a canal Panama'); // true
 * isPalindrome('race a car');                  // false
 * isPalindrome('Was it a car or a cat I saw'); // true
 * isPalindrome('hello');                        // false
 */
const isPalindrome = (str) => {
    let leftPointer = 0;
    let rightPointer = str.length - 1;
    // ── Движение двух указателей навстречу друг другу ────────────────────────
    while (leftPointer < rightPointer) {
        const leftChar = str[leftPointer];
        const rightChar = str[rightPointer];
        // Пропускаем небуквенные символы слева
        if (!isLetter(leftChar)) {
            leftPointer += 1;
            continue;
        }
        // Пропускаем небуквенные символы справа
        if (!isLetter(rightChar)) {
            rightPointer -= 1;
            continue;
        }
        // Если буквы не совпадают — строка не палиндром
        if (!isSameLetterIgnoreCase(leftChar, rightChar)) {
            return false;
        }
        // Буквы совпали — сдвигаем оба указателя
        leftPointer += 1;
        rightPointer -= 1;
    }
    return true;
};
exports.isPalindrome = isPalindrome;
// ── Тесты ──────────────────────────────────────────────────────────────────
console.log(isPalindrome('A man a plan a canal Panama')); // true
console.log(isPalindrome('race a car')); // false
console.log(isPalindrome('Was it a car or a cat I saw')); // true
console.log(isPalindrome('hello')); // false

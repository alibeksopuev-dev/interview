"use strict";
/**
 * Каррирование (Currying) — это техника преобразования функции с несколькими аргументами
 * в последовательность функций, каждая из которых принимает один аргумент.
 *
 * ⚠️ EDGE CASES (Граничные случаи):
 * - Вызов без аргументов: должен возвращать ту же функцию (или результат, если arity 0).
 * - Функции, использующие `this`: обертка должна корректно пробрасывать контекст.
 * - Пустые вызовы `curried()`: сохраняют цепочку без добавления аргументов.
 *
 * @param {Function} func - Исходная функция, которую нужно каррировать.
 * @returns {Function}     - Каррированная версия функции.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.curryWithBind = exports.curry = void 0;
/**
 * Вариант 1: Замыкание (Closure-based) — Рекомендуемый вариант для понимания.
 * Он "накапливает" аргументы.
 * Накопить аргументы — значит бережно сохранять в замыкании (массив `args`) каждый
 * переданный аргумент от первого до последнего вызова (складывать "в корзину"),
 * пока их количество не достигнет арности (длины) исходной функции.
 */
function curry(func) {
    return function curried(...args) {
        // Шаг 1: Базовый случай (условие выхода)
        // Проверяем: корзина полна? (достигли мы нужного количества аргументов?)
        // func.length возвращает количество ожидаемых аргументов (арность).
        if (args.length >= func.length) {
            // Корзина полна! Вываливаем все аргументы в оригинальную функцию.
            return func.apply(this, args);
        }
        // Шаг 2: Рекурсивный шаг
        // Иначе (аргументов мало) возвращаем новую функцию, которая ждет следующий аргумент.
        return (arg) => arg === undefined
            ? // Пустой вызов (без аргументов) позволяет сохранить цепочку и текущие аргументы
                curried.apply(this, args)
            : // Иначе вызываем curried рекурсивно, добавляя новый аргумент в конец массива
                curried.apply(this, [...args, arg]);
    };
}
exports.curry = curry;
const sum = (a, b, c) => a + b + c;
const curriedSum = curry(sum);
console.log(curriedSum(1)(2)(3)); // 6
console.log(curriedSum(1)(2)(3)); // 6
// Тест на сохранение контекста (this)
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
/**
 * Вариант 2: Использование bind().
 * Это "продвинутый" вариант. Он более гибкий, так как:
 * 1. Позволяет передавать аргументы любыми пачками: curried(1, 2)(3) или curried(1)(2, 3).
 * 2. Метод bind() автоматически создает новую функцию, "вшивая" в неё текущий контекст и аргументы.
 */
function curryWithBind(func) {
    return function curried(...args) {
        if (args.length >= func.length) {
            return func.apply(this, args);
        }
        // bind(this, ...args) создает новую функцию с предустановленным контекстом и аргументами.
        // При каждом следующем вызове новые аргументы будут просто добавляться к уже "вшитым".
        return curried.bind(this, ...args);
    };
}
exports.curryWithBind = curryWithBind;
// ── Тесты ──────────────────────────────────────────────────────────────────
const sumWithBind = curryWithBind(sum);
console.log('--- Curry with Bind Tests ---');
// bind-версия позволяет передавать по несколько аргументов
console.log(sumWithBind(1, 2)(3)); // 6

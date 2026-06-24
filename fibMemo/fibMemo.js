"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fibMemo = void 0;
/**
 * Функция вычисления n-го числа Фибоначчи с использованием мемоизации (кэширования).
 * Временная сложность: O(n) благодаря кэшированию промежуточных вычислений.
 * Пространственная сложность: O(n) для стека вызовов и объекта memo.
 */
function fibMemo(n, memo = {}) {
    if (n <= 1) {
        return n;
    }
    if (memo[n] !== undefined) {
        return memo[n];
    }
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    return memo[n];
}
exports.fibMemo = fibMemo;

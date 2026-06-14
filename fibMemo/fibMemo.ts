/**
 * Функция вычисления n-го числа Фибоначчи с использованием мемоизации (кэширования).
 * Временная сложность: O(n) благодаря кэшированию промежуточных вычислений.
 * Пространственная сложность: O(n) для стека вызовов и объекта memo.
 */
export function fibMemo(n: number, memo: Record<number, number> = {}): number {
  if (n <= 1) {
    return n;
  }
  if (memo[n] !== undefined) {
    return memo[n];
  }
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}

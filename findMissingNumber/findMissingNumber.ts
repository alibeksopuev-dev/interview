// ════════════════════════════════════════════════════════════════════════════
// Задача: Найти пропущенное число в последовательности от 0 до n
// LeetCode #268 — Missing Number
// ════════════════════════════════════════════════════════════════════════════

// ── Подход 1: Сортировка (Brute Force) ──────────────────────────────────────
//
// Идея: отсортировать массив, затем пройти по нему и найти индекс,
// в котором значение не совпадает с ожидаемым.
//
// Сложность:
//   Время  — O(n log n): доминирует сортировка
//   Память — O(1):       сортировка in-place, доп. структур нет

export function findMissingNumberSorting(numbers: number[]): number {
  // Шаг 1: Сортируем массив по возрастанию
  // Пример: [3, 0, 1] → [0, 1, 3]
  numbers.sort((a, b) => a - b);

  // Шаг 2: Линейный проход — ищем позицию, где numbers[i] !== i
  for (let i = 0; i < numbers.length; i++) {
    // Если элемент не равен своему индексу — этот индекс и есть пропуск
    if (numbers[i] !== i) {
      return i;
    }
  }

  // Шаг 3: Если все элементы на месте, пропущен последний — n
  // Пример: [0, 1, 2] → отсутствует 3 (= numbers.length)
  return numbers.length;
}

// ── Подход 2: Математическое свойство суммы (Optimal) ──────────────────────
//
// Идея: сумма чисел от 0 до n = n*(n+1)/2 (формула Гаусса).
// Разность ожидаемой суммы и фактической суммы элементов — пропущенное число.
//
// Сложность:
//   Время  — O(n): два линейных прохода по массиву
//   Память — O(1): используем только переменные-счётчики

export default function findMissingNumberInSequence(numbers: number[]): number {
  // n — количество элементов в массиве (длина полной последовательности = n+1)
  const n = numbers.length;

  // Шаг 1: Вычисляем ожидаемую сумму чисел от 0 до n включительно
  // Можно использовать формулу Гаусса: n*(n+1)/2 — тогда O(1) по времени,
  // но здесь оставляем цикл для наглядности (как в условии задачи)
  let expectedSum = 0;
  for (let i = 0; i <= n; i++) {
    expectedSum += i;
  }

  // Шаг 2: Вычисляем фактическую сумму элементов массива
  let actualSum = 0;
  for (const num of numbers) {
    actualSum += num;
  }

  // Шаг 3: Пропущенное число = разность сумм
  // expectedSum содержит все числа от 0 до n,
  // actualSum содержит все те же числа кроме одного пропущенного
  return expectedSum - actualSum;
}

// ── Бонус: через формулу Гаусса (O(1) по памяти И времени) ─────────────────
//
// Вместо цикла для expectedSum используем n*(n+1)/2 напрямую.
// Это истинно O(n) время (только один проход для actualSum) и O(1) память.

export function findMissingNumberGauss(numbers: number[]): number {
  const n = numbers.length;

  // Формула Гаусса: сумма 0+1+2+...+n
  const expectedSum = (n * (n + 1)) / 2;

  // Фактическая сумма элементов массива
  const actualSum = numbers.reduce((sum, num) => sum + num, 0);

  return expectedSum - actualSum;
}

// ── Тесты ──────────────────────────────────────────────────────────────────
console.log('--- Сортировка ---');
console.log(findMissingNumberSorting([3, 0, 1]));    // 2
console.log(findMissingNumberSorting([0, 1]));        // 2
console.log(findMissingNumberSorting([9,6,4,2,3,5,7,0,1])); // 8

console.log('--- Математика (цикл) ---');
console.log(findMissingNumberInSequence([3, 0, 1]));    // 2
console.log(findMissingNumberInSequence([0, 1]));        // 2
console.log(findMissingNumberInSequence([9,6,4,2,3,5,7,0,1])); // 8

console.log('--- Формула Гаусса ---');
console.log(findMissingNumberGauss([3, 0, 1]));    // 2
console.log(findMissingNumberGauss([0, 1]));        // 2
console.log(findMissingNumberGauss([9,6,4,2,3,5,7,0,1])); // 8

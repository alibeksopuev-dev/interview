/**
 * Находит индекс первого уникального (неповторяющегося) символа в строке.
 * Если таких символов нет — возвращает -1.
 *
 * @param {string} str - входная строка для поиска
 * @returns {number} - индекс первого уникального символа, или -1
 *
 * @example
 * firstUniqueCharIndex('leetcode'); // 0  → 'l'
 * firstUniqueCharIndex('loveleet'); // 2  → 'v'
 * firstUniqueCharIndex('aabb');     // -1 → уникальных нет
 */
const firstUniqueCharIndex = (str: string): number => {
  // Счётчик вхождений: символ → количество его появлений в строке
  const charFrequencyMap = new Map<string, number>();

  // ── Проход 1: подсчёт частоты каждого символа ──────────────────────────
  for (const char of str) {
    // Если символ уже встречался — увеличиваем счётчик,
    // иначе — инициализируем его значением 1
    const currentCount = charFrequencyMap.get(char) ?? 0;
    charFrequencyMap.set(char, currentCount + 1);
  }

  // ── Проход 2: поиск первого символа с частотой 1 ────────────────────────
  for (let charIndex = 0; charIndex < str.length; charIndex++) {
    const char = str[charIndex];

    // Если символ встречается ровно один раз — он уникальный
    if (charFrequencyMap.get(char) === 1) {
      return charIndex; // возвращаем его позицию
    }
  }

  // Уникальных символов не найдено
  return -1;
};

// ── Тесты ──────────────────────────────────────────────────────────────────
console.log(firstUniqueCharIndex('leetcode')); // 0  → 'l'
console.log(firstUniqueCharIndex('loveleet')); // 2  → 'v'
console.log(firstUniqueCharIndex('aabb'));     // -1 → нет уникального

export { firstUniqueCharIndex };

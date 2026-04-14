/**
 * Проверяет правильность последовательности скобок в строке
 * @param {string} bracketString - строка со скобками для проверки
 * @returns {boolean} - true если последовательность правильная, false если нет
 */
function isBalancedBrackets(bracketString: string): boolean {
    // Стек для хранения открывающих скобок
    const openBracketsStack: string[] = [];

    // Маппинг закрывающих скобок на соответствующие открывающие (O(1) поиск)
    const bracketPairs: { [key: string]: string } = {
        ')': '(',
        '}': '{',
        ']': '['
    };

    // Проходим по каждому символу строки
    for (const currentBracket of bracketString) {

        if (isClosingBracket(currentBracket)) {
            // Получаем ожидаемую открывающую скобку
            const matchingOpenBracket = bracketPairs[currentBracket];
            // Извлекаем верхний элемент стека (или '#' если стек пуст)
            const lastOpenBracket = openBracketsStack.length ? openBracketsStack.pop() : '#';

            // Если скобки не совпадают — последовательность неверная
            if (matchingOpenBracket !== lastOpenBracket) {
                return false;
            }
        } else {
            // Открывающая скобка — кладём в стек
            openBracketsStack.push(currentBracket);
        }
    }

    // Все открывающие скобки должны быть закрыты
    return openBracketsStack.length === 0;
}

/**
 * Проверяет, является ли символ закрывающей скобкой (O(1) через Set)
 * @param {string} bracket - символ для проверки
 * @returns {boolean}
 */
function isClosingBracket(bracket: string): boolean {
    const closingBrackets = new Set([')', '}', ']']);
    return closingBrackets.has(bracket);
}

/**`'([)]'` — ожидаемый результат: `false`**

| Шаг | Символ | Действие | Стек | Результат |
|---|---|---|---|---|
| 1 | `(` | открывающая → в стек | `['(']` | — |
| 2 | `[` | открывающая → в стек | `['(', '[']` | — |
| 3 | `)` | закрывающая → `matchingOpenBracket = '('`, `lastOpenBracket = pop() = '['` → `'(' !== '['` | `['(']` | ❌ `false` |

Стоп — дальше не идём, сразу возвращаем `false`.

Скобки перекрёстные: открыли `(`, потом `[`, но закрыли `)` раньше `]` — нарушен порядок.

---

**`'{[[]{}]}()()'` — ожидаемый результат: `true`**

| Шаг | Символ | Действие | Стек |
|---|---|---|---|
| 1 | `{` | открывающая → в стек | `['{']` |
| 2 | `[` | открывающая → в стек | `['{', '[']` |
| 3 | `[` | открывающая → в стек | `['{', '[', '[']` |
| 4 | `]` | закрывающая → `matching = '['`, `last = pop() = '['` → `'[' === '['` ✓ | `['{', '[']` |
| 5 | `{` | открывающая → в стек | `['{', '[', '{']` |
| 6 | `}` | закрывающая → `matching = '{'`, `last = pop() = '{'` → `'{' === '{'` ✓ | `['{', '[']` |
| 7 | `]` | закрывающая → `matching = '['`, `last = pop() = '['` → `'[' === '['` ✓ | `['{']` |
| 8 | `}` | закрывающая → `matching = '{'`, `last = pop() = '{'` → `'{' === '{'` ✓ | `[]` |
| 9 | `(` | открывающая → в стек | `['(']` |
| 10 | `)` | закрывающая → `matching = '('`, `last = pop() = '('` → `'(' === '('` ✓ | `[]` |
| 11 | `(` | открывающая → в стек | `['(']` |
| 12 | `)` | закрывающая → `matching = '('`, `last = pop() = '('` → `'(' === '('` ✓ | `[]` |

Стек пуст → `stack.length === 0` → возвращаем ✅ `true`
*/

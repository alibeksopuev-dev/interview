import type { CaseStudy } from './types'

// ─── Factorial (наивная рекурсия) ─────────────────────────────────

const factorialCase: CaseStudy = {
  id: 'factorial',
  topic: 'Рекурсия',
  title: 'Факториал — знакомство с рекурсией',
  complexity: 'O(n) время / O(n) память (стек)',
  about:
    'n! = n × (n-1) × ... × 1. Классический пример рекурсии: функция вызывает САМУ СЕБЯ с меньшим аргументом, пока не дойдёт до базового случая (n=0 или 1).',
  whenToUse:
    'Любая задача, которую можно разбить на «такую же задачу меньшего размера + одно действие». Это и есть суть рекурсии.',
  analogy:
    'Представь матрёшку. Чтобы её посчитать, ты открываешь её, считаешь внутреннюю матрёшку (это та же самая задача, но меньше!), и прибавляешь 1. Базовый случай — самая маленькая матрёшка.',
  code: [
    'function factorial(n) {',
    '  if (n <= 1) return 1;        // базовый случай',
    '  return n * factorial(n - 1); // рекурсивный случай',
    '}',
    '',
    'factorial(4); // → 24',
  ],
  steps: [
    {
      line: 6,
      action: 'Вызов factorial(4). Создаётся первый кадр на call stack.',
      scene: {
        callStack: { items: [{ value: 'factorial(4)', state: 'stacked' }], label: 'call stack' },
        vars: { n: 4 },
      },
      ops: 1,
      hint: 'Каждый рекурсивный вызов = новый кадр в стеке вызовов.',
    },
    {
      line: 3,
      action: '4 > 1 → не базовый случай. Нужно посчитать 4 * factorial(3). Сначала зовём factorial(3).',
      scene: {
        callStack: {
          items: [
            { value: 'factorial(4): ждёт', state: 'idle' },
            { value: 'factorial(3)', state: 'stacked' },
          ],
        },
        vars: { n: 3, 'waiting': '4 × ?' },
      },
      ops: 2,
    },
    {
      line: 3,
      action: 'factorial(3) тоже не базовый. Зовёт factorial(2).',
      scene: {
        callStack: {
          items: [
            { value: 'factorial(4): ждёт', state: 'idle' },
            { value: 'factorial(3): ждёт', state: 'idle' },
            { value: 'factorial(2)', state: 'stacked' },
          ],
        },
        vars: { n: 2 },
      },
      ops: 3,
    },
    {
      line: 3,
      action: 'factorial(2) зовёт factorial(1). Стек уже в 4 уровня глубиной!',
      scene: {
        callStack: {
          items: [
            { value: 'factorial(4): ждёт' },
            { value: 'factorial(3): ждёт' },
            { value: 'factorial(2): ждёт' },
            { value: 'factorial(1)', state: 'stacked' },
          ],
        },
        vars: { n: 1 },
      },
      ops: 4,
      hint: 'Глубина стека = n. Для n=100000 это переполнение стека!',
    },
    {
      line: 2,
      action: '🎯 БАЗОВЫЙ случай: n=1, возвращаем 1. Кадр factorial(1) снимается со стека.',
      scene: {
        callStack: {
          items: [
            { value: 'factorial(4): ждёт' },
            { value: 'factorial(3): ждёт' },
            { value: 'factorial(2): ждёт', state: 'stacked' },
          ],
        },
        vars: { 'returned': 1 },
      },
      ops: 5,
      hint: 'Без базового случая рекурсия будет бесконечной → крах.',
    },
    {
      line: 3,
      action: 'factorial(2): получил 1 из глубины. Возвращает 2 × 1 = 2.',
      scene: {
        callStack: {
          items: [
            { value: 'factorial(4): ждёт' },
            { value: 'factorial(3): ждёт', state: 'stacked' },
          ],
        },
        vars: { 'returned': 2 },
      },
      ops: 6,
    },
    {
      line: 3,
      action: 'factorial(3) получил 2. Возвращает 3 × 2 = 6.',
      scene: {
        callStack: { items: [{ value: 'factorial(4): ждёт', state: 'stacked' }] },
        vars: { 'returned': 6 },
      },
      ops: 7,
    },
    {
      line: 3,
      action: 'factorial(4) получил 6. Возвращает 4 × 6 = 24. Стек пуст. Готово!',
      scene: {
        callStack: { items: [] },
        vars: { 'returned': 24 },
        secondaryArray: { cells: [{ value: 24, state: 'matched' }], label: 'результат' },
      },
      ops: 8,
      hint: 'Рекурсия = «развернуться вглубь до базы, потом свернуть обратно с результатами».',
    },
  ],
  pitfalls: [
    'Забыть базовый случай → бесконечная рекурсия → RangeError: Maximum call stack size exceeded.',
    'Глубокая рекурсия (n > ~10000) переполнит стек. Решение — переписать в цикл (итеративно).',
    'Каждый кадр стека занимает память. Поэтому O(n) рекурсия по факту хуже, чем O(n) цикл (по памяти).',
  ],
}

// ─── Fibonacci: naive vs memoized ─────────────────────────────────

const fibCase: CaseStudy = {
  id: 'fibonacci',
  topic: 'Рекурсия',
  title: 'Фибоначчи: наивная рекурсия vs мемоизация',
  complexity: 'Наивная: O(2ⁿ) / Memo: O(n)',
  about:
    'F(n) = F(n-1) + F(n-2). Самый известный пример КАТАСТРОФЫ наивной рекурсии: одни и те же подзадачи считаются снова и снова. Мемоизация (кеш) превращает O(2ⁿ) в O(n).',
  whenToUse:
    'Это шаблон Dynamic Programming. Любая задача, где результат подзадачи нужен много раз — кэшируй её.',
  analogy:
    'Наивная: ты каждое утро заново вычисляешь, сколько 2+2 (как будто впервые). Мемо: ты записал ответ на стикер и просто смотришь в него.',
  code: [
    '// 🐌 Наивная — O(2ⁿ)',
    'function fib(n) {',
    '  if (n <= 1) return n;',
    '  return fib(n - 1) + fib(n - 2);',
    '}',
    '',
    '// 🚀 Мемоизация — O(n)',
    'function fibMemo(n, memo = {}) {',
    '  if (n <= 1) return n;',
    '  if (memo[n]) return memo[n];      // ← кэш!',
    '  memo[n] = fibMemo(n-1) + fibMemo(n-2);',
    '  return memo[n];',
    '}',
  ],
  steps: [
    {
      line: 2,
      action: 'Считаем fib(5) наивно. Дерево вызовов будет огромным — посмотрим, почему.',
      scene: {
        tree: {
          id: 'fib5',
          value: 'fib(5)',
          state: 'active',
          children: [
            { id: '5l', value: 'fib(4)', state: 'idle' },
            { id: '5r', value: 'fib(3)', state: 'idle' },
          ],
        },
        vars: { n: 5 },
      },
      ops: 1,
      hint: 'fib(5) = fib(4) + fib(3). Но fib(4) внутри тоже зовёт fib(3) и fib(2)!',
    },
    {
      line: 4,
      action: 'Дерево раскрывается. Видишь, как fib(3) ВЫЧИСЛЯЕТСЯ ДВАЖДЫ? А fib(2) — три раза.',
      scene: {
        tree: {
          id: 'fib5',
          value: 'fib(5)',
          state: 'active',
          children: [
            {
              id: '5l',
              value: 'fib(4)',
              state: 'compared',
              children: [
                {
                  id: '4l',
                  value: 'fib(3)',
                  state: 'compared',
                  children: [
                    { id: '4ll', value: 'fib(2)', state: 'compared' },
                    { id: '4lr', value: 'fib(1)', state: 'matched' },
                  ],
                },
                { id: '4r', value: 'fib(2)', state: 'compared' },
              ],
            },
            {
              id: '5r',
              value: 'fib(3)',
              state: 'compared',
              children: [
                { id: '3rl', value: 'fib(2)', state: 'compared' },
                { id: '3rr', value: 'fib(1)', state: 'matched' },
              ],
            },
          ],
        },
        vars: { 'fib(3)': '2 раза', 'fib(2)': '3 раза' },
      },
      ops: 15,
      hint: 'Это и есть O(2ⁿ): каждый узел порождает 2 вызова. Дерево удваивается на каждом уровне.',
    },
    {
      line: 10,
      action: 'Теперь смотрим мемоизацию. Первый вызов fibMemo(5). memo пустой.',
      scene: {
        map: { entries: [], label: 'memo (кэш)' },
        callStack: { items: [{ value: 'fibMemo(5)', state: 'stacked' }] },
        vars: { n: 5 },
      },
      ops: 1,
    },
    {
      line: 12,
      action: 'Считаем fibMemo(4)+fibMemo(3). Идём вглубь: fibMemo(4) → fibMemo(3) → fibMemo(2) → fibMemo(1)=1.',
      scene: {
        map: {
          entries: [
            { key: 2, value: 1, state: 'merged' },
            { key: 3, value: 2, state: 'merged' },
            { key: 4, value: 3, state: 'merged' },
          ],
          label: 'memo',
        },
        callStack: { items: [{ value: 'fibMemo(5): ждёт fibMemo(3)', state: 'stacked' }] },
        vars: { 'computed': 'fib(2)=1, fib(3)=2, fib(4)=3' },
      },
      ops: 5,
      hint: 'Каждое значение мы посчитали РОВНО ОДИН РАЗ и положили в memo.',
    },
    {
      line: 11,
      action: 'Теперь зовём fibMemo(3). 3 уже в memo! Возвращаем 2 МГНОВЕННО без рекурсии.',
      scene: {
        map: {
          entries: [
            { key: 2, value: 1 },
            { key: 3, value: 2, state: 'matched' },
            { key: 4, value: 3 },
          ],
          label: 'memo',
        },
        callStack: { items: [{ value: 'fibMemo(5)', state: 'stacked' }] },
        vars: { 'cache hit': 'memo[3] = 2' },
      },
      ops: 6,
      hint: 'Вот в этом и магия! Вместо повторного дерева вызовов — один lookup за O(1).',
    },
    {
      line: 13,
      action: 'memo[5] = 3 + 2 = 5. Возвращаем.',
      scene: {
        map: {
          entries: [
            { key: 2, value: 1 },
            { key: 3, value: 2 },
            { key: 4, value: 3 },
            { key: 5, value: 5, state: 'matched' },
          ],
          label: 'memo',
        },
        callStack: { items: [] },
        vars: { 'returned': 5 },
      },
      ops: 7,
      hint: 'Итог: 7 операций вместо 15. Для fib(50): 50 вместо 1 квадриллиона!',
    },
  ],
  pitfalls: [
    'Наивный fib(50) на современном CPU считается несколько МИНУТ. fib(100) — годами. Кэш обязателен!',
    'memo нужно передавать как параметр или хранить в замыкании. Не объявляй его внутри функции — каждый вызов сбросит кэш.',
    'Это паттерн «Динамическое программирование». Есть top-down (рекурсия + memo) и bottom-up (цикл).',
  ],
}

export const RECURSION_CASES: CaseStudy[] = [factorialCase, fibCase]

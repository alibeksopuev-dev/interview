import type { CaseStudy } from './types'

// ─── Balanced brackets (stack) ────────────────────────────────────

const bracketsCase: CaseStudy = {
  id: 'brackets',
  topic: 'Стек & Очередь',
  title: 'Сбалансированные скобки',
  complexity: 'O(n) время / O(n) память',
  about:
    'Дана строка из ( ) [ ] { }. Проверить, правильно ли расставлены скобки: каждая открытая закрывается СВОЕЙ парой и в ПРАВИЛЬНОМ порядке.',
  whenToUse:
    'Парсинг кода, JSON, математических выражений. Любая задача типа «последнее открытое должно закрыться первым» — это LIFO = стек.',
  analogy:
    'Стопка тарелок: ты кладёшь и снимаешь только с ВЕРХА. Когда ты видишь «(» — кладёшь её. Когда видишь «)» — снимаешь верхнюю и проверяешь, что это «(».',
  code: [
    'function isBalanced(s) {',
    '  const stack = [];',
    '  const pairs = { ")": "(", "]": "[", "}": "{" };',
    '  for (const ch of s) {',
    '    if ("([{".includes(ch)) {',
    '      stack.push(ch);',
    '    } else {',
    '      if (stack.pop() !== pairs[ch]) return false;',
    '    }',
    '  }',
    '  return stack.length === 0;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Дано: "({[]})". Проверим.',
      scene: {
        array: { cells: '({[]})'.split('').map(v => ({ value: v, state: 'idle' })) },
        stack: { items: [], label: 'стек' },
      },
      ops: 0,
    },
    {
      line: 6,
      action: 'ch = "(". Открывающая → push в стек.',
      scene: {
        array: { cells: '({[]})'.split('').map((v, i) => ({ value: v, state: i === 0 ? 'compared' : 'idle' })) },
        stack: { items: [{ value: '(', state: 'stacked' }] },
      },
      ops: 1,
    },
    {
      line: 6,
      action: 'ch = "{". Открывающая → push.',
      scene: {
        array: {
          cells: '({[]})'.split('').map((v, i) => ({
            value: v,
            state: i === 1 ? 'compared' : i === 0 ? 'discarded' : 'idle',
          })),
        },
        stack: {
          items: [
            { value: '(', state: 'idle' },
            { value: '{', state: 'stacked' },
          ],
        },
      },
      ops: 2,
      hint: '«{» легла поверх «(». Это LIFO — Last In, First Out.',
    },
    {
      line: 6,
      action: 'ch = "[". Открывающая → push.',
      scene: {
        array: {
          cells: '({[]})'.split('').map((v, i) => ({
            value: v,
            state: i === 2 ? 'compared' : i < 2 ? 'discarded' : 'idle',
          })),
        },
        stack: {
          items: [
            { value: '(' },
            { value: '{' },
            { value: '[', state: 'stacked' },
          ],
        },
      },
      ops: 3,
    },
    {
      line: 8,
      action: 'ch = "]". Закрывающая. Снимаем с вершины: «[». Совпало с pairs["]"] = «[»! Идём дальше.',
      scene: {
        array: {
          cells: '({[]})'.split('').map((v, i) => ({
            value: v,
            state: i === 3 ? 'matched' : i === 2 ? 'matched' : i < 2 ? 'discarded' : 'idle',
          })),
        },
        stack: { items: [{ value: '(' }, { value: '{', state: 'stacked' }] },
        vars: { popped: '[', expected: '[' },
      },
      ops: 5,
      hint: 'Если бы pop вернул другой символ — сразу return false.',
    },
    {
      line: 8,
      action: 'ch = "}". pop = «{». Совпало.',
      scene: {
        array: {
          cells: '({[]})'.split('').map((v, i) => ({
            value: v,
            state: i === 4 ? 'matched' : i === 3 || i === 2 ? 'matched' : i < 2 ? 'discarded' : 'idle',
          })),
        },
        stack: { items: [{ value: '(', state: 'stacked' }] },
      },
      ops: 6,
    },
    {
      line: 8,
      action: 'ch = ")". pop = «(». Совпало.',
      scene: {
        array: { cells: '({[]})'.split('').map(v => ({ value: v, state: 'matched' })) },
        stack: { items: [] },
      },
      ops: 7,
    },
    {
      line: 11,
      action: 'Стек пуст → все скобки закрыты. Возвращаем true.',
      scene: {
        array: { cells: '({[]})'.split('').map(v => ({ value: v, state: 'matched' })) },
        stack: { items: [] },
        vars: { 'return': 'true' },
      },
      ops: 7,
      hint: 'Если бы строка закончилась, а стек не пустой — есть незакрытые скобки → false.',
    },
  ],
  pitfalls: [
    'Проверка `stack.pop() !== pairs[ch]` — pop с пустого стека вернёт undefined, что НЕ равно открывающей → корректно вернёт false. Но это полагается на знание языка.',
    'Не путай pop() (LIFO) и shift() (FIFO). Для скобок нужен именно LIFO.',
    'Не забудь финальную проверку `stack.length === 0` — без неё «(((» вернёт true.',
  ],
  source: 'isBalancedBrackets/isBalancedBrackets_BigO.md',
}

// ─── Linked list reverse ──────────────────────────────────────────

const linkedListReverseCase: CaseStudy = {
  id: 'list-reverse',
  topic: 'Связный список',
  title: 'Разворот связного списка',
  complexity: 'O(n) время / O(1) память',
  about:
    'Связный список — это «цепочка», где каждый узел знает только СЛЕДУЮЩЕГО. Чтобы развернуть, нужно у каждого узла перенаправить указатель next назад. Хитрость — три указателя.',
  whenToUse:
    'Любая операция со связным списком в одном проходе. Это самая частая задача про связные списки на собеседованиях.',
  analogy:
    'Цепочка людей, держащих за руки впередистоящего. Чтобы развернуть — каждый по очереди перехватывает руку человека ПОЗАДИ. Нужно сначала запомнить, кого ты держал спереди, иначе потеряешь цепочку.',
  code: [
    'function reverse(head) {',
    '  let prev = null;',
    '  let cur = head;',
    '  while (cur !== null) {',
    '    const next = cur.next;  // 1. запомнили следующего',
    '    cur.next = prev;        // 2. развернули указатель',
    '    prev = cur;             // 3. сдвинули prev',
    '    cur = next;             // 4. сдвинули cur',
    '  }',
    '  return prev;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Дано: 1 → 2 → 3 → 4 → null. Нужно получить 4 → 3 → 2 → 1.',
      scene: {
        list: {
          nodes: [
            { value: 1, label: 'head' },
            { value: 2 },
            { value: 3 },
            { value: 4 },
          ],
          label: 'до',
        },
      },
      ops: 0,
    },
    {
      line: 3,
      action: 'Стартуем: prev = null, cur = head (узел 1).',
      scene: {
        list: {
          nodes: [
            { value: 1, label: 'cur', state: 'active' },
            { value: 2 },
            { value: 3 },
            { value: 4 },
          ],
        },
        vars: { prev: 'null', cur: '1' },
      },
      ops: 1,
    },
    {
      line: 5,
      action: 'next = cur.next = узел 2. Запомнили, кто идёт следом — иначе потеряем!',
      scene: {
        list: {
          nodes: [
            { value: 1, label: 'cur', state: 'compared' },
            { value: 2, label: 'next', state: 'window' },
            { value: 3 },
            { value: 4 },
          ],
        },
        vars: { prev: 'null', cur: '1', next: '2' },
      },
      ops: 2,
      hint: 'Если не сохранить next — мы перепишем cur.next и потеряем доступ к остатку списка.',
    },
    {
      line: 6,
      action: 'cur.next = prev = null. Узел 1 теперь указывает «назад» (на null).',
      scene: {
        list: {
          nodes: [
            { value: 1, label: 'cur ↛null', state: 'matched' },
            { value: 2, label: 'next', state: 'window' },
            { value: 3 },
            { value: 4 },
          ],
        },
        vars: { '1.next': 'null' },
      },
      ops: 3,
    },
    {
      line: 7,
      action: 'Сдвигаем: prev = cur = 1, cur = next = 2.',
      scene: {
        list: {
          nodes: [
            { value: 1, label: 'prev', state: 'visited' },
            { value: 2, label: 'cur', state: 'active' },
            { value: 3 },
            { value: 4 },
          ],
        },
        vars: { prev: '1', cur: '2' },
      },
      ops: 5,
    },
    {
      line: 5,
      action: 'Повторяем: next=3. cur.next = prev = 1 → теперь 2→1.',
      scene: {
        list: {
          nodes: [
            { value: 1, label: 'prev', state: 'visited' },
            { value: 2, label: 'cur ↛1', state: 'matched' },
            { value: 3, label: 'next', state: 'window' },
            { value: 4 },
          ],
        },
        vars: { 'после шага': '2 → 1, prev=2, cur=3' },
      },
      ops: 8,
    },
    {
      line: 5,
      action: 'Продолжаем: 3 разворачивается на 2, потом 4 разворачивается на 3.',
      scene: {
        list: {
          nodes: [
            { value: 1, state: 'visited' },
            { value: 2, state: 'visited' },
            { value: 3, state: 'visited' },
            { value: 4, label: 'prev', state: 'visited' },
          ],
        },
        vars: { prev: '4', cur: 'null' },
      },
      ops: 13,
    },
    {
      line: 11,
      action: 'cur стал null → выход из цикла. Возвращаем prev = 4. Это новый head.',
      scene: {
        list: {
          nodes: [
            { value: 4, label: 'new head', state: 'matched' },
            { value: 3, state: 'matched' },
            { value: 2, state: 'matched' },
            { value: 1, state: 'matched' },
          ],
          label: 'после',
        },
        vars: { 'return': 'prev = 4' },
      },
      ops: 13,
      hint: 'Один проход, никаких массивов или рекурсии. O(n) время, O(1) память — идеал.',
    },
  ],
  pitfalls: [
    'Забыть сохранить next ДО перезаписи cur.next — самая частая ошибка. Цепочка потеряется.',
    'Порядок 4-х строк ВАЖЕН: next → cur.next → prev → cur. Поменяешь местами — баг.',
    'Альтернатива через рекурсию красивая, но O(n) памяти на стек. Итеративно — O(1).',
  ],
}

// ─── findMissingNumber (math) ─────────────────────────────────────

const findMissingCase: CaseStudy = {
  id: 'find-missing',
  topic: 'Стек & Очередь',
  title: 'Найти пропущенное число (мат. трюк)',
  complexity: 'O(n) время / O(1) память',
  about:
    'Дан массив n чисел из 0..n с одним пропуском. Найти пропущенное число. Магия: сумма всех чисел от 0 до n известна по формуле = n×(n+1)/2. Вычитаем сумму массива → получаем пропуск.',
  whenToUse:
    'Любая задача, где можно использовать ИНВАРИАНТ — заранее известное свойство (сумма, XOR, произведение) для одного прохода с O(1) памятью.',
  analogy:
    'У тебя есть полный список приглашённых на свадьбу. Все пришли, кроме одного. Чтобы найти кто, ты НЕ перебираешь имена. Ты считаешь общую сумму подарков и вычитаешь её из ожидаемой суммы.',
  code: [
    'function findMissing(arr) {',
    '  const n = arr.length;',
    '  const expectedSum = n * (n + 1) / 2;',
    '  let actualSum = 0;',
    '  for (const x of arr) actualSum += x;',
    '  return expectedSum - actualSum;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Дано: [3, 0, 1]. Числа должны быть 0..3, но одно пропущено. Какое?',
      scene: {
        array: { cells: [3, 0, 1].map(v => ({ value: v, state: 'idle' })), label: 'arr' },
      },
      ops: 0,
    },
    {
      line: 3,
      action: 'n = 3. expectedSum = 3 × 4 / 2 = 6. Это сумма 0+1+2+3.',
      scene: {
        array: { cells: [3, 0, 1].map(v => ({ value: v, state: 'idle' })) },
        vars: { n: 3, expectedSum: 6 },
      },
      ops: 1,
      hint: 'Формула суммы арифметической прогрессии — твой лучший друг для таких задач.',
    },
    {
      line: 5,
      action: 'Идём по массиву и складываем. 3+0+1 = 4.',
      scene: {
        array: { cells: [3, 0, 1].map(v => ({ value: v, state: 'compared' })) },
        vars: { actualSum: 4 },
      },
      ops: 4,
    },
    {
      line: 6,
      action: 'Пропущенное = 6 - 4 = 2. Возвращаем 2.',
      scene: {
        array: { cells: [3, 0, 1].map(v => ({ value: v, state: 'discarded' })) },
        secondaryArray: { cells: [{ value: 2, state: 'matched' }], label: 'missing' },
        vars: { 'return': 2 },
      },
      ops: 5,
      hint: 'O(n) один проход, O(1) память. Альтернатива через Set дала бы O(n) памяти.',
    },
  ],
  pitfalls: [
    'Watch out for overflow: для больших n сумма может переполнить int в других языках. В JS Number.MAX_SAFE_INTEGER ≈ 9×10¹⁵ — обычно хватает.',
    'Альтернатива через XOR (a^b^a = b) ещё круче: работает даже на не-арифметических данных. Тот же O(n)/O(1).',
    'Решение через сортировку — O(n log n). Хуже. Через Set — O(n)/O(n). Тоже хуже по памяти.',
  ],
  source: 'findMissingNumber/',
}

export const OTHER_CASES: CaseStudy[] = [bracketsCase, linkedListReverseCase, findMissingCase]

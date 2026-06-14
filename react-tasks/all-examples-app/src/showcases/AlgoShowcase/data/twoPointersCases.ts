import type { CaseStudy, ArrayCell } from './types'

// Helper: tag array cells with states from a description map
const tag = (arr: (number | string)[], states: Record<number, ArrayCell['state']>, labels: Record<number, string> = {}): ArrayCell[] =>
  arr.map((v, i) => ({ value: v, state: states[i] ?? 'idle', label: labels[i] }))

// ─── Palindrome check (two pointers) ──────────────────────────────

const palindromeCase: CaseStudy = {
  id: 'palindrome',
  topic: 'Два указателя',
  title: 'Проверка палиндрома',
  complexity: 'O(n) время / O(1) память',
  about:
    'Палиндром — это слово, читающееся одинаково в обе стороны: «топот», «racecar», «level». Сравним символы парами: первый с последним, второй с предпоследним, и т.д.',
  whenToUse:
    'Любая задача типа «сравнить элементы с разных концов»: разворот строки, проверка симметрии, поиск пары sum=target в отсортированном массиве.',
  analogy:
    'Представь, как два человека идут навстречу друг другу по аллее. Один с начала, второй с конца. Они проверяют — совпадают ли наряды на каждой паре деревьев, мимо которых проходят.',
  code: [
    'function isPalindrome(s) {',
    '  let left = 0;',
    '  let right = s.length - 1;',
    '  while (left < right) {',
    '    if (s[left] !== s[right]) return false;',
    '    left++;',
    '    right--;',
    '  }',
    '  return true;',
    '}',
    '',
    'isPalindrome("racecar"); // → true',
  ],
  steps: [
    {
      line: 12,
      action: 'Дано: "racecar". Проверим, палиндром ли это.',
      scene: {
        array: { cells: tag(['r', 'a', 'c', 'e', 'c', 'a', 'r'], {}), label: 'строка' },
        vars: { input: 'racecar' },
      },
      ops: 0,
    },
    {
      line: 3,
      action: 'Ставим левый указатель в начало (i=0), правый — в конец (i=6).',
      scene: {
        array: {
          cells: tag(['r', 'a', 'c', 'e', 'c', 'a', 'r'], { 0: 'window', 6: 'window' }, { 0: 'L', 6: 'R' }),
        },
        vars: { L: 0, R: 6 },
      },
      ops: 1,
    },
    {
      line: 5,
      action: 'Сравниваем s[0]=r и s[6]=r. Совпадают! Сдвигаем указатели навстречу.',
      scene: {
        array: {
          cells: tag(['r', 'a', 'c', 'e', 'c', 'a', 'r'], { 0: 'matched', 6: 'matched' }, { 0: 'L', 6: 'R' }),
        },
        vars: { L: 0, R: 6, 's[L]': 'r', 's[R]': 'r' },
      },
      ops: 2,
    },
    {
      line: 5,
      action: 'L=1, R=5. s[1]=a, s[5]=a. Совпадают.',
      scene: {
        array: {
          cells: tag(
            ['r', 'a', 'c', 'e', 'c', 'a', 'r'],
            { 0: 'discarded', 6: 'discarded', 1: 'matched', 5: 'matched' },
            { 1: 'L', 5: 'R' }
          ),
        },
        vars: { L: 1, R: 5, 's[L]': 'a', 's[R]': 'a' },
      },
      ops: 4,
    },
    {
      line: 5,
      action: 'L=2, R=4. s[2]=c, s[4]=c. Совпадают.',
      scene: {
        array: {
          cells: tag(
            ['r', 'a', 'c', 'e', 'c', 'a', 'r'],
            { 0: 'discarded', 1: 'discarded', 5: 'discarded', 6: 'discarded', 2: 'matched', 4: 'matched' },
            { 2: 'L', 4: 'R' }
          ),
        },
        vars: { L: 2, R: 4 },
      },
      ops: 6,
    },
    {
      line: 4,
      action: 'L=3, R=3 → L < R уже не выполняется. Указатели сошлись в центре.',
      scene: {
        array: {
          cells: tag(
            ['r', 'a', 'c', 'e', 'c', 'a', 'r'],
            {
              0: 'discarded',
              1: 'discarded',
              2: 'discarded',
              4: 'discarded',
              5: 'discarded',
              6: 'discarded',
              3: 'matched',
            },
            { 3: 'L=R' }
          ),
        },
        vars: { L: 3, R: 3 },
      },
      ops: 7,
      hint: 'Мы прошли только ПОЛОВИНУ массива — это O(n/2) = O(n).',
    },
    {
      line: 9,
      action: 'Все пары совпали. Возвращаем true. Памяти потратили — 2 переменные. O(1)!',
      scene: {
        array: {
          cells: ['r', 'a', 'c', 'e', 'c', 'a', 'r'].map(v => ({ value: v, state: 'matched' })),
        },
        vars: { 'return': 'true' },
      },
      ops: 7,
      hint: 'Два указателя — мощная техника: один проход + константная память.',
    },
  ],
  pitfalls: [
    'Условие `while (left < right)`, а НЕ `<=`. Иначе на нечётной длине сравним центр с собой (бесполезно).',
    'Для реальных строк может понадобиться нормализация: lowercase, удалить пробелы и знаки препинания.',
    'Не путать с разворотом строки через split.reverse.join — это O(n) памяти. Two pointers — O(1).',
  ],
  source: 'isPalindrome/isPalindrome_BigO.md',
}

// ─── Sliding window: max sum of subarray of size k ────────────────

const slidingWindowCase: CaseStudy = {
  id: 'sliding-window',
  topic: 'Два указателя',
  title: 'Скользящее окно — макс. сумма k подряд',
  complexity: 'O(n) время / O(1) память',
  about:
    'Дано: массив и число k. Найти максимальную сумму k идущих подряд элементов. Наивно — O(n·k), но скользящее окно даёт O(n).',
  whenToUse:
    'Задачи на «найти лучший подмассив фиксированной/переменной длины»: max сумма за день, самая длинная подстрока без повторов, и т.д.',
  analogy:
    'Представь автобус с k местами, который едет по очереди мест. На каждой остановке один пассажир выходит (слева), один заходит (справа). Ты не считаешь всех каждый раз — просто корректируешь сумму.',
  code: [
    'function maxSumK(arr, k) {',
    '  let sum = 0;',
    '  for (let i = 0; i < k; i++) sum += arr[i]; // первое окно',
    '  let maxSum = sum;',
    '  for (let i = k; i < arr.length; i++) {',
    '    sum += arr[i] - arr[i - k];  // +новый, -старый',
    '    maxSum = Math.max(maxSum, sum);',
    '  }',
    '  return maxSum;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Дано: [2, 1, 5, 1, 3, 2], k = 3. Ищем макс. сумму 3 подряд идущих.',
      scene: {
        array: { cells: tag([2, 1, 5, 1, 3, 2], {}), label: 'массив' },
        vars: { k: 3 },
      },
      ops: 0,
    },
    {
      line: 3,
      action: 'Считаем первое окно: индексы 0..2. sum = 2+1+5 = 8.',
      scene: {
        array: {
          cells: tag([2, 1, 5, 1, 3, 2], { 0: 'window', 1: 'window', 2: 'window' }),
        },
        vars: { sum: 8, maxSum: 8 },
      },
      ops: 3,
    },
    {
      line: 6,
      action: 'Сдвигаем окно вправо: добавляем arr[3]=1, вычитаем arr[0]=2. sum = 8 + 1 - 2 = 7.',
      scene: {
        array: {
          cells: tag(
            [2, 1, 5, 1, 3, 2],
            { 0: 'discarded', 1: 'window', 2: 'window', 3: 'window' },
            { 3: '+', 0: '−' }
          ),
        },
        vars: { sum: 7, maxSum: 8 },
      },
      ops: 5,
      hint: 'НЕ считаем заново! Корректируем: +arr[i] − arr[i-k]. Это и есть «скольжение».',
    },
    {
      line: 6,
      action: 'Окно [2..4]: +arr[4]=3, −arr[1]=1. sum = 7 + 3 - 1 = 9. Новый максимум!',
      scene: {
        array: {
          cells: tag(
            [2, 1, 5, 1, 3, 2],
            { 0: 'discarded', 1: 'discarded', 2: 'window', 3: 'window', 4: 'window' },
            { 4: '+', 1: '−' }
          ),
        },
        vars: { sum: 9, maxSum: 9 },
      },
      ops: 7,
    },
    {
      line: 6,
      action: 'Окно [3..5]: +arr[5]=2, −arr[2]=5. sum = 9 + 2 - 5 = 6.',
      scene: {
        array: {
          cells: tag(
            [2, 1, 5, 1, 3, 2],
            { 0: 'discarded', 1: 'discarded', 2: 'discarded', 3: 'window', 4: 'window', 5: 'window' },
            { 5: '+', 2: '−' }
          ),
        },
        vars: { sum: 6, maxSum: 9 },
      },
      ops: 9,
    },
    {
      line: 10,
      action: 'Дошли до конца. Возвращаем maxSum = 9 (это сумма [5,1,3]).',
      scene: {
        array: {
          cells: tag([2, 1, 5, 1, 3, 2], { 2: 'matched', 3: 'matched', 4: 'matched' }),
        },
        vars: { 'return': 9 },
      },
      ops: 9,
      hint: 'Каждый элемент мы трогаем 2 раза (+ и −). Это 2n = O(n). Наивный был бы k·n = O(n·k).',
    },
  ],
  pitfalls: [
    'Не считай окно заново на каждом шаге — это убьёт всё преимущество техники.',
    'Скользящее окно работает, только если элементы НЕОТРИЦАТЕЛЬНЫЕ (для max суммы). Иначе нужны другие подходы.',
    'Различай fixed window (размер k фиксирован) и variable window (растягивается/сжимается по условию).',
  ],
}

// ─── maxProductSubArray (двойной проход с max/min) ────────────────

const maxProductCase: CaseStudy = {
  id: 'max-product',
  topic: 'Два указателя',
  title: 'Максимальное произведение подмассива',
  complexity: 'O(n) время / O(1) память',
  about:
    'Найти подмассив с максимальным произведением. Хитрость: отрицательное умножить на отрицательное = положительное. Поэтому надо хранить И максимум, И минимум.',
  whenToUse:
    'Когда «минимум на одном шаге» может стать «максимумом на следующем». Учебный пример того, как один проход решает задачу, кажущуюся O(n²).',
  analogy:
    'Гонка между двумя игроками: один копит «максимум», другой — «минимум». Если внезапно умножим на −1, они меняются ролями. Поэтому надо следить за обоими.',
  code: [
    'function maxProduct(arr) {',
    '  let maxProd = arr[0];',
    '  let minProd = arr[0];',
    '  let result = arr[0];',
    '  for (let i = 1; i < arr.length; i++) {',
    '    const cur = arr[i];',
    '    if (cur < 0) [maxProd, minProd] = [minProd, maxProd]; // своп!',
    '    maxProd = Math.max(cur, maxProd * cur);',
    '    minProd = Math.min(cur, minProd * cur);',
    '    result = Math.max(result, maxProd);',
    '  }',
    '  return result;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Дано: [2, 3, -2, 4]. Найдём подмассив с макс произведением.',
      scene: {
        array: { cells: tag([2, 3, -2, 4], {}), label: 'массив' },
      },
      ops: 0,
      hint: 'Если бы все числа были положительными — задача была бы тривиальной. Но из-за минусов надо хитрить.',
    },
    {
      line: 4,
      action: 'Стартуем: max=min=result=2.',
      scene: {
        array: { cells: tag([2, 3, -2, 4], { 0: 'active' }) },
        vars: { max: 2, min: 2, result: 2 },
      },
      ops: 1,
    },
    {
      line: 8,
      action: 'i=1, cur=3. cur > 0, своп не нужен. max = Math.max(3, 2×3=6) = 6.',
      scene: {
        array: { cells: tag([2, 3, -2, 4], { 0: 'discarded', 1: 'compared' }) },
        vars: { max: 6, min: 3, result: 6 },
      },
      ops: 2,
    },
    {
      line: 7,
      action: 'i=2, cur=−2. ОТРИЦАТЕЛЬНОЕ → свопаем max ↔ min. Теперь max=3, min=6.',
      scene: {
        array: { cells: tag([2, 3, -2, 4], { 0: 'discarded', 1: 'discarded', 2: 'compared' }) },
        vars: { 'после свопа': 'max=3, min=6', cur: -2 },
      },
      ops: 3,
      hint: 'Минимум 6 × (-2) = -12 даст БОЛЬШИЙ по модулю отрицательный. А если потом ещё минус — он станет огромным плюсом!',
    },
    {
      line: 8,
      action: 'max = Math.max(-2, 3×(-2)=-6) = -2. min = Math.min(-2, 6×(-2)=-12) = -12.',
      scene: {
        array: { cells: tag([2, 3, -2, 4], { 0: 'discarded', 1: 'discarded', 2: 'compared' }) },
        vars: { max: -2, min: -12, result: 6 },
      },
      ops: 5,
    },
    {
      line: 8,
      action: 'i=3, cur=4. Cur > 0. max = Math.max(4, -2×4=-8) = 4. min = Math.min(4, -12×4=-48) = -48.',
      scene: {
        array: { cells: tag([2, 3, -2, 4], { 0: 'discarded', 1: 'discarded', 2: 'discarded', 3: 'compared' }) },
        vars: { max: 4, min: -48, result: 6 },
      },
      ops: 7,
    },
    {
      line: 12,
      action: 'Конец. result = 6 (подмассив [2, 3]).',
      scene: {
        array: { cells: tag([2, 3, -2, 4], { 0: 'matched', 1: 'matched' }) },
        vars: { 'return': 6 },
      },
      ops: 7,
      hint: 'O(n) один проход. Наивно через два цикла было бы O(n²). Хитрость с min — типичный приём.',
    },
  ],
  pitfalls: [
    'Не забыть про min — без него тест с двумя минусами провалится.',
    'Своп max ↔ min именно ПЕРЕД пересчётом, а не после.',
    'Math.max(cur, max*cur) — это «начать новое окно от текущего», если предыдущее произведение испортилось.',
  ],
  source: 'maxProductSubArray/maxProductSubArray_BigO.md',
}

export const TWO_POINTERS_CASES: CaseStudy[] = [palindromeCase, slidingWindowCase, maxProductCase]

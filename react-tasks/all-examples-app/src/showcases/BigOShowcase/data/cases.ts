// ─── types ─────────────────────────────────────────────────────────────────

export type Complexity = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2ⁿ)'

export interface ArrayCell {
  value: number | string
  state?: 'idle' | 'active' | 'compared' | 'discarded' | 'matched' | 'merged' | 'window'
  label?: string // optional small label under the cell (e.g. "L", "mid", "R")
}

export interface Step {
  // Active code line (1-based) to highlight
  line: number
  // Plain-russian explanation of what is happening on this step
  action: string
  // Visual array state (cells with optional state coloring)
  array: ArrayCell[]
  // Optional secondary array (for example "result" buffer)
  secondary?: ArrayCell[]
  secondaryLabel?: string
  // Free-form variables to display (e.g. { L: 0, R: 6, mid: 3 })
  vars?: Record<string, string | number>
  // Cumulative number of "elementary" operations performed by the end of this step
  ops: number
  // Lesson / hint: what we should NOTICE on this step about Big O
  hint?: string
}

export interface CaseStudy {
  id: string
  title: string
  badge: Complexity
  // Plain-russian description of what the algorithm does
  about: string
  // Big-picture intuition: why this complexity?
  intuition: string
  // Real-life analogy ("книга в библиотеке")
  analogy: string
  // The code shown on the left, line-by-line (1-based numbering)
  code: string[]
  // Operation counter formula label (e.g. "log₂(n) ≈ 3")
  opsFormula: (n: number) => string
  // Size n used in the trace
  n: number
  // Step-by-step trace
  steps: Step[]
  // Pitfalls / common mistakes (in Russian)
  pitfalls: string[]
  // Source reference doc inside the repo (relative path)
  source: string
}

// ─── 1. O(1) — Доступ по индексу ──────────────────────────────────────────

const constantTimeCase: CaseStudy = {
  id: 'access',
  title: 'Доступ по индексу',
  badge: 'O(1)',
  about:
    'Самая простая операция: взять элемент массива по известному индексу. Не важно, какой длины массив — мы сразу прыгаем в нужную ячейку памяти.',
  intuition:
    'Массив в памяти лежит сплошным куском. Зная адрес начала и размер одного элемента, движок мгновенно вычисляет: «нужный элемент = начало + i × размер». Это одна арифметическая операция.',
  analogy:
    'Представь шкаф с пронумерованными ящиками. Тебе говорят: «открой ящик №7». Ты сразу подходишь к седьмому ящику. Не важно, у тебя их 10 или 10 000 — это один шаг.',
  code: [
    'function getThird(arr) {',
    '  return arr[2];',
    '}',
    '',
    'const numbers = [10, 20, 30, 40, 50, 60, 70];',
    'getThird(numbers); // → 30',
  ],
  opsFormula: () => '1 операция (всегда)',
  n: 7,
  steps: [
    {
      line: 5,
      action: 'Массив создан в памяти. Каждая ячейка лежит подряд. Размер не имеет значения.',
      array: [10, 20, 30, 40, 50, 60, 70].map(v => ({ value: v, state: 'idle' })),
      ops: 0,
      hint: 'Размер n = 7. Но обрати внимание — мы вообще не будем по нему ходить.',
    },
    {
      line: 2,
      action: 'Движок вычисляет адрес: «начало массива + 2 × 8 байт». Это одна операция арифметики.',
      array: [10, 20, 30, 40, 50, 60, 70].map((v, i) => ({
        value: v,
        state: i === 2 ? 'active' : 'idle',
      })),
      vars: { i: 2, 'addr(i)': '0xBASE + 16' },
      ops: 1,
      hint: 'Одна операция — вне зависимости от того, сколько элементов вокруг.',
    },
    {
      line: 2,
      action: 'Возвращаем значение из ячейки. Готово!',
      array: [10, 20, 30, 40, 50, 60, 70].map((v, i) => ({
        value: v,
        state: i === 2 ? 'matched' : 'idle',
      })),
      vars: { 'return': 30 },
      ops: 1,
      hint: 'Итог: 1 операция и для n=7, и для n=7 000 000. Это и есть O(1).',
    },
  ],
  pitfalls: [
    'Поиск в массиве (arr.indexOf, arr.find) — это уже НЕ O(1), а O(n): движок вынужден перебрать все элементы.',
    'А вот чтение свойства объекта (obj.name) или Map.get(key) — тоже O(1) в среднем, потому что под капотом хэш-таблица.',
  ],
  source: 'docs/BigO_CheatSheet.md',
}

// ─── 2. O(log n) — Бинарный поиск ─────────────────────────────────────────

const binarySearchCase: CaseStudy = {
  id: 'binarySearch',
  title: 'Бинарный поиск',
  badge: 'O(log n)',
  about:
    'Поиск элемента в ОТСОРТИРОВАННОМ массиве методом «делим пополам». На каждом шаге выбрасываем половину оставшихся данных.',
  intuition:
    'Если каждый шаг режет массив пополам, то для миллиона элементов нужно ~20 делений (потому что 2²⁰ ≈ миллион). Это и есть log₂(n).',
  analogy:
    'Угадай число от 1 до 1000. Ты не называешь «1, 2, 3…» — ты говоришь «500?». Тебе отвечают «больше». Тогда «750?». «Меньше». «625?»… Максимум 10 вопросов. Это логарифм.',
  code: [
    'function binarySearch(arr, target) {',
    '  let L = 0;',
    '  let R = arr.length - 1;',
    '  while (L <= R) {',
    '    const mid = Math.floor((L + R) / 2);',
    '    if (arr[mid] === target) return mid;',
    '    if (arr[mid] < target) L = mid + 1;',
    '    else R = mid - 1;',
    '  }',
    '  return -1;',
    '}',
  ],
  opsFormula: n => `log₂(${n}) ≈ ${Math.ceil(Math.log2(n))}`,
  n: 7,
  steps: [
    {
      line: 1,
      action: 'Дано: массив [1,3,5,7,9,11,13] и цель target=11. Массив УЖЕ отсортирован — это обязательное условие.',
      array: [1, 3, 5, 7, 9, 11, 13].map(v => ({ value: v, state: 'idle' })),
      vars: { target: 11 },
      ops: 0,
      hint: 'Без сортировки этот алгоритм не работает — мы не знали бы, в какую сторону прыгать.',
    },
    {
      line: 3,
      action: 'Ставим границы поиска: L=0 (левый край), R=6 (правый край). Между ними будем искать.',
      array: [1, 3, 5, 7, 9, 11, 13].map((v, i) => ({
        value: v,
        state: i === 0 || i === 6 ? 'window' : 'idle',
        label: i === 0 ? 'L' : i === 6 ? 'R' : undefined,
      })),
      vars: { L: 0, R: 6, target: 11 },
      ops: 1,
      hint: 'Окно поиска = 7 элементов.',
    },
    {
      line: 5,
      action: 'Шаг 1. Берём середину: mid = (0+6)/2 = 3. Смотрим arr[3] = 7.',
      array: [1, 3, 5, 7, 9, 11, 13].map((v, i) => ({
        value: v,
        state: i === 3 ? 'compared' : i === 0 || i === 6 ? 'window' : 'idle',
        label: i === 0 ? 'L' : i === 6 ? 'R' : i === 3 ? 'mid' : undefined,
      })),
      vars: { L: 0, R: 6, mid: 3, 'arr[mid]': 7, target: 11 },
      ops: 2,
      hint: '7 ≠ 11. Сравним: 7 < 11, значит цель ПРАВЕЕ.',
    },
    {
      line: 7,
      action: 'Левую половину (индексы 0..3) выбрасываем НАВСЕГДА. Сдвигаем L = 4.',
      array: [1, 3, 5, 7, 9, 11, 13].map((v, i) => ({
        value: v,
        state: i <= 3 ? 'discarded' : i === 4 || i === 6 ? 'window' : 'idle',
        label: i === 4 ? 'L' : i === 6 ? 'R' : undefined,
      })),
      vars: { L: 4, R: 6, target: 11 },
      ops: 3,
      hint: 'Окно поиска ужалось с 7 до 3 элементов. Это и есть «деление пополам».',
    },
    {
      line: 5,
      action: 'Шаг 2. mid = (4+6)/2 = 5. Смотрим arr[5] = 11.',
      array: [1, 3, 5, 7, 9, 11, 13].map((v, i) => ({
        value: v,
        state: i <= 3 ? 'discarded' : i === 5 ? 'compared' : i === 4 || i === 6 ? 'window' : 'idle',
        label: i === 4 ? 'L' : i === 6 ? 'R' : i === 5 ? 'mid' : undefined,
      })),
      vars: { L: 4, R: 6, mid: 5, 'arr[mid]': 11, target: 11 },
      ops: 4,
      hint: '11 === 11 ✅ Нашли!',
    },
    {
      line: 6,
      action: 'Возвращаем индекс 5. Всего сделали 2 итерации цикла из возможных 7 при линейном поиске.',
      array: [1, 3, 5, 7, 9, 11, 13].map((v, i) => ({
        value: v,
        state: i === 5 ? 'matched' : 'idle',
      })),
      vars: { 'return': 5 },
      ops: 4,
      hint: 'Для n=7 нужно ⌈log₂(7)⌉ = 3 шага макс. Для n=1 000 000 — всего 20 шагов!',
    },
  ],
  pitfalls: [
    'Массив ДОЛЖЕН быть отсортирован. Иначе алгоритм врёт без предупреждения.',
    'Запись mid = L + Math.floor((R - L) / 2) безопаснее, чем (L + R)/2 — защищает от переполнения в языках с фиксированным int.',
    'L <= R, а не L < R. Иначе пропустишь случай, когда искомый элемент = arr[L].',
  ],
  source: 'binarySearch/binarySearch.md',
}

// ─── 3. O(n) — Линейный поиск / sum ───────────────────────────────────────

const linearCase: CaseStudy = {
  id: 'linear',
  title: 'Линейный поиск максимума',
  badge: 'O(n)',
  about:
    'Чтобы найти максимум в массиве, нужно посмотреть на КАЖДЫЙ элемент хотя бы один раз. Меньше — никак.',
  intuition:
    'Если массив не отсортирован, то любой элемент может оказаться максимальным. Пока ты не проверил последний, ты не можешь дать ответ. Поэтому время растёт ровно пропорционально n.',
  analogy:
    'Тебе дали колоду карт и просят найти самую старшую. У тебя нет другого способа, кроме как перебрать их по одной. 10 карт — 10 взглядов. 1000 карт — 1000 взглядов.',
  code: [
    'function findMax(arr) {',
    '  let max = arr[0];',
    '  for (let i = 1; i < arr.length; i++) {',
    '    if (arr[i] > max) max = arr[i];',
    '  }',
    '  return max;',
    '}',
  ],
  opsFormula: n => `n = ${n} → ~${n} сравнений`,
  n: 6,
  steps: [
    {
      line: 1,
      action: 'Дано: массив [3, 7, 2, 8, 5, 1]. Нужно найти максимум.',
      array: [3, 7, 2, 8, 5, 1].map(v => ({ value: v, state: 'idle' })),
      ops: 0,
      hint: 'Массив не отсортирован — мы не можем «угадать» где максимум.',
    },
    {
      line: 2,
      action: 'Берём первый элемент как стартовый максимум: max = 3.',
      array: [3, 7, 2, 8, 5, 1].map((v, i) => ({
        value: v,
        state: i === 0 ? 'active' : 'idle',
      })),
      vars: { i: 0, max: 3 },
      ops: 1,
    },
    {
      line: 4,
      action: 'i=1: arr[1]=7. 7 > 3? Да. Обновляем max = 7.',
      array: [3, 7, 2, 8, 5, 1].map((v, i) => ({
        value: v,
        state: i === 1 ? 'compared' : i === 0 ? 'discarded' : 'idle',
      })),
      vars: { i: 1, 'arr[i]': 7, max: 7 },
      ops: 2,
    },
    {
      line: 4,
      action: 'i=2: arr[2]=2. 2 > 7? Нет. max остаётся 7.',
      array: [3, 7, 2, 8, 5, 1].map((v, i) => ({
        value: v,
        state: i === 2 ? 'compared' : i <= 1 ? 'discarded' : 'idle',
      })),
      vars: { i: 2, 'arr[i]': 2, max: 7 },
      ops: 3,
    },
    {
      line: 4,
      action: 'i=3: arr[3]=8. 8 > 7? Да. Обновляем max = 8.',
      array: [3, 7, 2, 8, 5, 1].map((v, i) => ({
        value: v,
        state: i === 3 ? 'matched' : i <= 2 ? 'discarded' : 'idle',
      })),
      vars: { i: 3, 'arr[i]': 8, max: 8 },
      ops: 4,
    },
    {
      line: 4,
      action: 'i=4: arr[4]=5. 5 > 8? Нет.',
      array: [3, 7, 2, 8, 5, 1].map((v, i) => ({
        value: v,
        state: i === 4 ? 'compared' : i === 3 ? 'matched' : i <= 2 ? 'discarded' : 'idle',
      })),
      vars: { i: 4, 'arr[i]': 5, max: 8 },
      ops: 5,
    },
    {
      line: 4,
      action: 'i=5: arr[5]=1. 1 > 8? Нет. Цикл закончен.',
      array: [3, 7, 2, 8, 5, 1].map((v, i) => ({
        value: v,
        state: i === 5 ? 'compared' : i === 3 ? 'matched' : 'discarded',
      })),
      vars: { i: 5, 'arr[i]': 1, max: 8 },
      ops: 6,
      hint: 'Мы прошли РОВНО n раз. Не больше, не меньше.',
    },
    {
      line: 6,
      action: 'Возвращаем max = 8. Итого: n операций.',
      array: [3, 7, 2, 8, 5, 1].map((v, i) => ({
        value: v,
        state: i === 3 ? 'matched' : 'idle',
      })),
      vars: { 'return': 8 },
      ops: 6,
      hint: 'Время растёт линейно: удвоишь массив — удвоится время. Это O(n).',
    },
  ],
  pitfalls: [
    '.map(), .filter(), .forEach(), .reduce() — все это под капотом обычные циклы → O(n).',
    'Несколько последовательных циклов (две штуки for) — это O(2n), но в Big O константы отбрасываются: остаётся O(n).',
    'А вот цикл ВНУТРИ цикла — это уже O(n²), смотри следующий пример.',
  ],
  source: 'docs/BigO_CheatSheet.md',
}

// ─── 4. O(n log n) — mergeIntervals ───────────────────────────────────────

const nLogNCase: CaseStudy = {
  id: 'mergeIntervals',
  title: 'Слияние интервалов',
  badge: 'O(n log n)',
  about:
    'Берём массив отрезков и склеиваем пересекающиеся. Хитрость: СНАЧАЛА сортируем по началу — это даёт нам гарантию, что достаточно одного линейного прохода.',
  intuition:
    'Сортировка стоит O(n log n) — это «потолок» сложности. Сам проход после сортировки — O(n). Сумма: O(n log n) + O(n) = O(n log n) (берём максимум).',
  analogy:
    'Представь группу опоздавших, которые пришли на встречу в разное время. Сначала ты выстраиваешь их по времени прихода (это сортировка). Потом одним проходом склеиваешь тех, кто пересекался по присутствию.',
  code: [
    'function mergeIntervals(intervals) {',
    '  intervals.sort((a, b) => a[0] - b[0]); // O(n log n)',
    '  const result = [intervals[0]];',
    '  for (const interval of intervals) {     // O(n)',
    '    const recent = result[result.length - 1];',
    '    if (recent[1] >= interval[0]) {',
    '      recent[1] = Math.max(recent[1], interval[1]);',
    '    } else {',
    '      result.push(interval);',
    '    }',
    '  }',
    '  return result;',
    '}',
  ],
  opsFormula: n => `${n}·log₂(${n}) ≈ ${Math.ceil(n * Math.log2(n))}`,
  n: 4,
  steps: [
    {
      line: 1,
      action: 'Дано: [[1,3], [8,10], [2,6], [9,12]]. Интервалы вперемешку.',
      array: [
        { value: '[1,3]', state: 'idle' },
        { value: '[8,10]', state: 'idle' },
        { value: '[2,6]', state: 'idle' },
        { value: '[9,12]', state: 'idle' },
      ],
      ops: 0,
      hint: 'Без сортировки нам пришлось бы сравнивать каждый с каждым → O(n²).',
    },
    {
      line: 2,
      action: 'Сортировка по началу интервала. Это O(n log n) — самая тяжёлая часть алгоритма.',
      array: [
        { value: '[1,3]', state: 'active' },
        { value: '[2,6]', state: 'active' },
        { value: '[8,10]', state: 'active' },
        { value: '[9,12]', state: 'active' },
      ],
      vars: { 'sort cost': 'O(n log n)' },
      ops: 8,
      hint: 'array.sort() в V8 — это Timsort. Под капотом ~n·log(n) сравнений.',
    },
    {
      line: 3,
      action: 'Кладём первый интервал в result.',
      array: [
        { value: '[1,3]', state: 'compared' },
        { value: '[2,6]', state: 'idle' },
        { value: '[8,10]', state: 'idle' },
        { value: '[9,12]', state: 'idle' },
      ],
      secondary: [{ value: '[1,3]', state: 'merged' }],
      secondaryLabel: 'result',
      ops: 9,
    },
    {
      line: 6,
      action: 'Смотрим [2,6]. recent=[1,3]. 3 >= 2 → пересечение! Расширяем конец: max(3,6)=6.',
      array: [
        { value: '[1,3]', state: 'discarded' },
        { value: '[2,6]', state: 'compared' },
        { value: '[8,10]', state: 'idle' },
        { value: '[9,12]', state: 'idle' },
      ],
      secondary: [{ value: '[1,6]', state: 'merged' }],
      secondaryLabel: 'result',
      vars: { recent: '[1,6]' },
      ops: 10,
    },
    {
      line: 9,
      action: 'Смотрим [8,10]. recent=[1,6]. 6 >= 8? Нет. Разрыв! Добавляем как новый.',
      array: [
        { value: '[1,3]', state: 'discarded' },
        { value: '[2,6]', state: 'discarded' },
        { value: '[8,10]', state: 'compared' },
        { value: '[9,12]', state: 'idle' },
      ],
      secondary: [
        { value: '[1,6]', state: 'idle' },
        { value: '[8,10]', state: 'merged' },
      ],
      secondaryLabel: 'result',
      ops: 11,
    },
    {
      line: 6,
      action: 'Смотрим [9,12]. recent=[8,10]. 10 >= 9 → пересечение! Расширяем: max(10,12)=12.',
      array: [
        { value: '[1,3]', state: 'discarded' },
        { value: '[2,6]', state: 'discarded' },
        { value: '[8,10]', state: 'discarded' },
        { value: '[9,12]', state: 'compared' },
      ],
      secondary: [
        { value: '[1,6]', state: 'idle' },
        { value: '[8,12]', state: 'merged' },
      ],
      secondaryLabel: 'result',
      vars: { recent: '[8,12]' },
      ops: 12,
    },
    {
      line: 12,
      action: 'Возвращаем результат. Цикл — O(n). Но сортировка дороже → итог O(n log n).',
      array: [
        { value: '[1,3]', state: 'idle' },
        { value: '[2,6]', state: 'idle' },
        { value: '[8,10]', state: 'idle' },
        { value: '[9,12]', state: 'idle' },
      ],
      secondary: [
        { value: '[1,6]', state: 'matched' },
        { value: '[8,12]', state: 'matched' },
      ],
      secondaryLabel: 'result',
      ops: 12,
      hint: 'Правило: суммарная сложность = МАКСИМАЛЬНАЯ. O(n log n) + O(n) = O(n log n).',
    },
  ],
  pitfalls: [
    'Забыть сортировку. Тогда нужно сравнивать каждый с каждым → O(n²).',
    'Использовать .sort() без compare-функции. Без неё .sort() сортирует как СТРОКИ: 10 < 2 → бага.',
    'Сложность алгоритма = сложность САМОЙ дорогой операции. Не складываем — берём максимум.',
  ],
  source: 'mergeIntervals/mergeIntervals_BigO.md',
}

// ─── 5. O(n) — insertInterval ─────────────────────────────────────────────

const insertIntervalCase: CaseStudy = {
  id: 'insertInterval',
  title: 'Вставка интервала',
  badge: 'O(n)',
  about:
    'Уже отсортированный массив интервалов + один новый интервал. Нужно вставить новый и слить пересечения. Хитрость: НЕ сортируем заново — массив уже отсортирован!',
  intuition:
    'Так как массив отсортирован, нам достаточно одного прохода: сначала всё, что ДО нового интервала, потом сливаем пересечения, потом всё ПОСЛЕ. Это чистый O(n).',
  analogy:
    'Ты — секретарь, у тебя расписание встреч на завтра по порядку. Поступает новая встреча. Тебе не нужно переписывать всё расписание — ты пробегаешься один раз и находишь куда вписать.',
  code: [
    'function insert(intervals, newI) {',
    '  const res = [], n = intervals.length;',
    '  let i = 0;',
    '  while (i < n && intervals[i][1] < newI[0]) {',
    '    res.push(intervals[i++]);',
    '  }',
    '  while (i < n && newI[1] >= intervals[i][0]) {',
    '    newI[0] = Math.min(newI[0], intervals[i][0]);',
    '    newI[1] = Math.max(newI[1], intervals[i][1]);',
    '    i++;',
    '  }',
    '  res.push(newI);',
    '  while (i < n) res.push(intervals[i++]);',
    '  return res;',
    '}',
  ],
  opsFormula: n => `n = ${n} → ~${n} операций`,
  n: 5,
  steps: [
    {
      line: 1,
      action: 'Дано: [[1,2], [3,5], [6,7], [8,10], [12,16]], новый = [4,8].',
      array: [
        { value: '[1,2]', state: 'idle' },
        { value: '[3,5]', state: 'idle' },
        { value: '[6,7]', state: 'idle' },
        { value: '[8,10]', state: 'idle' },
        { value: '[12,16]', state: 'idle' },
      ],
      vars: { newI: '[4,8]' },
      ops: 0,
      hint: 'Заметь: массив УЖЕ отсортирован. Сортировка не нужна!',
    },
    {
      line: 4,
      action: 'Фаза 1. [1,2]: конец 2 < 4 (старт нового). Не пересекается → копируем как есть.',
      array: [
        { value: '[1,2]', state: 'matched' },
        { value: '[3,5]', state: 'idle' },
        { value: '[6,7]', state: 'idle' },
        { value: '[8,10]', state: 'idle' },
        { value: '[12,16]', state: 'idle' },
      ],
      secondary: [{ value: '[1,2]', state: 'merged' }],
      secondaryLabel: 'res',
      vars: { i: 1, newI: '[4,8]' },
      ops: 1,
    },
    {
      line: 7,
      action: 'Фаза 2. [3,5]: 8 >= 3 → пересечение. Расширяем: newI=[min(4,3), max(8,5)] = [3,8].',
      array: [
        { value: '[1,2]', state: 'discarded' },
        { value: '[3,5]', state: 'compared' },
        { value: '[6,7]', state: 'idle' },
        { value: '[8,10]', state: 'idle' },
        { value: '[12,16]', state: 'idle' },
      ],
      secondary: [{ value: '[1,2]', state: 'idle' }],
      secondaryLabel: 'res',
      vars: { i: 2, newI: '[3,8]' },
      ops: 2,
    },
    {
      line: 7,
      action: 'Фаза 2. [6,7]: 8 >= 6 → пересечение. newI=[min(3,6), max(8,7)] = [3,8] (без изменений).',
      array: [
        { value: '[1,2]', state: 'discarded' },
        { value: '[3,5]', state: 'discarded' },
        { value: '[6,7]', state: 'compared' },
        { value: '[8,10]', state: 'idle' },
        { value: '[12,16]', state: 'idle' },
      ],
      secondary: [{ value: '[1,2]', state: 'idle' }],
      secondaryLabel: 'res',
      vars: { i: 3, newI: '[3,8]' },
      ops: 3,
    },
    {
      line: 7,
      action: 'Фаза 2. [8,10]: 8 >= 8 → пересечение. newI=[3, max(8,10)] = [3,10].',
      array: [
        { value: '[1,2]', state: 'discarded' },
        { value: '[3,5]', state: 'discarded' },
        { value: '[6,7]', state: 'discarded' },
        { value: '[8,10]', state: 'compared' },
        { value: '[12,16]', state: 'idle' },
      ],
      secondary: [{ value: '[1,2]', state: 'idle' }],
      secondaryLabel: 'res',
      vars: { i: 4, newI: '[3,10]' },
      ops: 4,
    },
    {
      line: 12,
      action: '[12,16]: 10 >= 12? Нет. Выход из Фазы 2. Кладём накопленный newI = [3,10] в результат.',
      array: [
        { value: '[1,2]', state: 'discarded' },
        { value: '[3,5]', state: 'discarded' },
        { value: '[6,7]', state: 'discarded' },
        { value: '[8,10]', state: 'discarded' },
        { value: '[12,16]', state: 'compared' },
      ],
      secondary: [
        { value: '[1,2]', state: 'idle' },
        { value: '[3,10]', state: 'merged' },
      ],
      secondaryLabel: 'res',
      vars: { i: 4, newI: '[3,10]' },
      ops: 5,
    },
    {
      line: 13,
      action: 'Фаза 3. Всё что осталось — копируем как есть. [12,16] идёт в результат.',
      array: [
        { value: '[1,2]', state: 'discarded' },
        { value: '[3,5]', state: 'discarded' },
        { value: '[6,7]', state: 'discarded' },
        { value: '[8,10]', state: 'discarded' },
        { value: '[12,16]', state: 'matched' },
      ],
      secondary: [
        { value: '[1,2]', state: 'idle' },
        { value: '[3,10]', state: 'idle' },
        { value: '[12,16]', state: 'merged' },
      ],
      secondaryLabel: 'res',
      ops: 6,
      hint: 'Каждый элемент обработан РОВНО один раз. Это O(n).',
    },
    {
      line: 14,
      action: 'Готово! [[1,2], [3,10], [12,16]]. Всего ~n операций.',
      array: [
        { value: '[1,2]', state: 'idle' },
        { value: '[3,5]', state: 'idle' },
        { value: '[6,7]', state: 'idle' },
        { value: '[8,10]', state: 'idle' },
        { value: '[12,16]', state: 'idle' },
      ],
      secondary: [
        { value: '[1,2]', state: 'matched' },
        { value: '[3,10]', state: 'matched' },
        { value: '[12,16]', state: 'matched' },
      ],
      secondaryLabel: 'res',
      ops: 6,
      hint: 'Сравни с mergeIntervals: O(n log n). Здесь O(n) — потому что массив уже отсортирован.',
    },
  ],
  pitfalls: [
    'Соблазн сделать .sort() в начале — НЕ НАДО. Это превратит O(n) в O(n log n).',
    'Альтернатива через binarySearch + splice — выглядит круто, но splice сам по себе O(n) → ничего не выигрываем.',
    'Три ПОСЛЕДОВАТЕЛЬНЫХ while — это всё равно O(n), а не O(3n). Константы в Big O игнорируются.',
  ],
  source: 'insertInterval/insertInterval_BigO.md',
}

// ─── 6. O(n log n) — compressRanges ───────────────────────────────────────

const compressCase: CaseStudy = {
  id: 'compressRanges',
  title: 'Сжатие диапазонов',
  badge: 'O(n log n)',
  about:
    '[7, 1, 4, 2, 9, 8] → "1-2,4,7-9". Берём числа, сортируем, склеиваем подряд идущие в диапазон.',
  intuition:
    'Сортировка O(n log n) — самая тяжёлая часть. Сам проход после сортировки — O(n). Итог: O(n log n).',
  analogy:
    'Тебе высыпали на стол пронумерованные карты в случайном порядке: 7, 1, 4, 2, 9, 8. Ты сначала кладёшь их по порядку (1, 2, 4, 7, 8, 9), а потом одним проходом отмечаешь группы: «1-2», «4», «7-9».',
  code: [
    'function compressRanges(arr) {',
    '  const sorted = [...arr].sort((a,b) => a-b); // O(n log n)',
    '  const result = [String(sorted[0])];',
    '  let isInterval = false;',
    '  for (let i = 1; i <= sorted.length; i++) {  // O(n)',
    '    const prev = sorted[i-1], cur = sorted[i];',
    '    if (cur !== undefined && cur - prev === 1) {',
    '      isInterval = true; continue;',
    '    }',
    '    if (isInterval) {',
    '      result[result.length-1] += `-${prev}`;',
    '      isInterval = false;',
    '    }',
    '    if (cur !== undefined) result.push(String(cur));',
    '  }',
    '  return result.join(",");',
    '}',
  ],
  opsFormula: n => `${n}·log₂(${n}) + ${n} ≈ ${Math.ceil(n * Math.log2(n)) + n}`,
  n: 6,
  steps: [
    {
      line: 1,
      action: 'Дано: [7, 1, 4, 2, 9, 8]. Числа вразброс.',
      array: [7, 1, 4, 2, 9, 8].map(v => ({ value: v, state: 'idle' })),
      ops: 0,
      hint: 'Без сортировки невозможно понять, какие числа идут «подряд».',
    },
    {
      line: 2,
      action: 'Сортируем копию: [1, 2, 4, 7, 8, 9]. Это O(n log n).',
      array: [1, 2, 4, 7, 8, 9].map(v => ({ value: v, state: 'active' })),
      ops: 16,
      hint: 'Спред [...arr] — это копия (O(n)), чтобы не мутировать оригинал.',
    },
    {
      line: 3,
      action: 'Кладём первый элемент 1 в result.',
      array: [1, 2, 4, 7, 8, 9].map((v, i) => ({
        value: v,
        state: i === 0 ? 'compared' : 'idle',
      })),
      secondary: [{ value: '"1"', state: 'merged' }],
      secondaryLabel: 'result',
      ops: 17,
    },
    {
      line: 7,
      action: 'i=1: prev=1, cur=2. 2-1=1 → подряд. isInterval = true. Идём дальше.',
      array: [1, 2, 4, 7, 8, 9].map((v, i) => ({
        value: v,
        state: i === 1 ? 'compared' : i === 0 ? 'discarded' : 'idle',
      })),
      secondary: [{ value: '"1"', state: 'idle' }],
      secondaryLabel: 'result',
      vars: { isInterval: 'true' },
      ops: 18,
    },
    {
      line: 10,
      action: 'i=2: prev=2, cur=4. 4-2=2 ≠ 1 → разрыв. isInterval=true → закрываем: "1" → "1-2".',
      array: [1, 2, 4, 7, 8, 9].map((v, i) => ({
        value: v,
        state: i === 2 ? 'compared' : i <= 1 ? 'discarded' : 'idle',
      })),
      secondary: [{ value: '"1-2"', state: 'merged' }],
      secondaryLabel: 'result',
      vars: { isInterval: 'false' },
      ops: 19,
    },
    {
      line: 14,
      action: 'Кладём 4 как одиночное число.',
      array: [1, 2, 4, 7, 8, 9].map((v, i) => ({
        value: v,
        state: i === 2 ? 'matched' : i <= 1 ? 'discarded' : 'idle',
      })),
      secondary: [
        { value: '"1-2"', state: 'idle' },
        { value: '"4"', state: 'merged' },
      ],
      secondaryLabel: 'result',
      ops: 20,
    },
    {
      line: 7,
      action: 'i=3: prev=4, cur=7. 7-4=3 → разрыв. isInterval=false. Кладём 7.',
      array: [1, 2, 4, 7, 8, 9].map((v, i) => ({
        value: v,
        state: i === 3 ? 'compared' : i <= 2 ? 'discarded' : 'idle',
      })),
      secondary: [
        { value: '"1-2"', state: 'idle' },
        { value: '"4"', state: 'idle' },
        { value: '"7"', state: 'merged' },
      ],
      secondaryLabel: 'result',
      ops: 21,
    },
    {
      line: 7,
      action: 'i=4 и i=5: 8-7=1 и 9-8=1 → подряд. isInterval=true.',
      array: [1, 2, 4, 7, 8, 9].map((v, i) => ({
        value: v,
        state: i >= 4 ? 'compared' : 'discarded',
      })),
      secondary: [
        { value: '"1-2"', state: 'idle' },
        { value: '"4"', state: 'idle' },
        { value: '"7"', state: 'idle' },
      ],
      secondaryLabel: 'result',
      vars: { isInterval: 'true' },
      ops: 22,
    },
    {
      line: 10,
      action: 'i=6: cur=undefined → ВЫХОД. isInterval=true → закрываем: "7" → "7-9".',
      array: [1, 2, 4, 7, 8, 9].map(v => ({ value: v, state: 'discarded' })),
      secondary: [
        { value: '"1-2"', state: 'idle' },
        { value: '"4"', state: 'idle' },
        { value: '"7-9"', state: 'merged' },
      ],
      secondaryLabel: 'result',
      ops: 23,
      hint: 'Хитрость: цикл идёт i <= length, а не i < length. На последней итерации cur=undefined корректно закрывает последний интервал.',
    },
    {
      line: 17,
      action: 'result.join(",") = "1-2,4,7-9". Готово!',
      array: [1, 2, 4, 7, 8, 9].map(v => ({ value: v, state: 'idle' })),
      secondary: [
        { value: '"1-2,4,7-9"', state: 'matched' },
      ],
      secondaryLabel: 'output',
      ops: 23,
      hint: 'Сортировка (O(n log n)) доминирует над проходом (O(n)). Итог: O(n log n).',
    },
  ],
  pitfalls: [
    'Без `[...arr]` сортировка мутирует исходный массив — это побочный эффект, который ломает вызывающий код.',
    '.sort((a,b)=>a-b) обязательна для чисел. Без неё JS сортирует как строки: [10, 2] → [10, 2] (а не [2, 10]).',
    'Цикл i <= length с проверкой undefined — это идиома, чтобы корректно закрыть последний интервал.',
  ],
  source: 'compressRanges/compressRanges_BigO.md',
}

// ─── 7. O(n²) — Bubble Sort (наивный) ─────────────────────────────────────

const quadraticCase: CaseStudy = {
  id: 'bubble',
  title: 'Пузырьковая сортировка',
  badge: 'O(n²)',
  about:
    'Самый наглядный пример «плохого» алгоритма. Два вложенных цикла: каждый элемент сравнивается с каждым. Время растёт как n × n.',
  intuition:
    'Цикл n итераций, внутри ещё один цикл n итераций → n × n = n² операций. Удвоишь данные — время вырастет в 4 раза. Для n=10000 это уже 100 млн операций.',
  analogy:
    'В комнате 10 человек, и каждый должен пожать руку каждому. 10×10=100 рукопожатий. Если придёт 1000 человек — будет уже миллион. Это «каждый с каждым».',
  code: [
    'function bubbleSort(arr) {',
    '  for (let i = 0; i < arr.length; i++) {',
    '    for (let j = 0; j < arr.length - 1; j++) {',
    '      if (arr[j] > arr[j+1]) {',
    '        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];',
    '      }',
    '    }',
    '  }',
    '  return arr;',
    '}',
  ],
  opsFormula: n => `${n}² = ${n * n} сравнений`,
  n: 4,
  steps: [
    {
      line: 1,
      action: 'Дано: [4, 1, 3, 2]. Сортируем «пузырьком».',
      array: [4, 1, 3, 2].map(v => ({ value: v, state: 'idle' })),
      ops: 0,
      hint: 'Идея: на каждом проходе самый большой элемент «всплывает» в конец.',
    },
    {
      line: 4,
      action: 'i=0, j=0. Сравнить arr[0]=4 и arr[1]=1. 4 > 1 → меняем.',
      array: [
        { value: 4, state: 'compared' },
        { value: 1, state: 'compared' },
        { value: 3, state: 'idle' },
        { value: 2, state: 'idle' },
      ],
      vars: { i: 0, j: 0 },
      ops: 1,
    },
    {
      line: 5,
      action: 'После свопа: [1, 4, 3, 2]. j=1: 4 > 3 → меняем.',
      array: [
        { value: 1, state: 'idle' },
        { value: 4, state: 'compared' },
        { value: 3, state: 'compared' },
        { value: 2, state: 'idle' },
      ],
      vars: { i: 0, j: 1 },
      ops: 2,
    },
    {
      line: 5,
      action: '[1, 3, 4, 2]. j=2: 4 > 2 → меняем. [1, 3, 2, 4]. 4 всплыл в конец!',
      array: [
        { value: 1, state: 'idle' },
        { value: 3, state: 'idle' },
        { value: 2, state: 'compared' },
        { value: 4, state: 'matched' },
      ],
      vars: { i: 0, j: 2 },
      ops: 3,
    },
    {
      line: 2,
      action: 'i=1. Внутренний цикл снова с j=0. Сравниваем 1 и 3 — ok. 3 и 2 → меняем.',
      array: [
        { value: 1, state: 'idle' },
        { value: 3, state: 'compared' },
        { value: 2, state: 'compared' },
        { value: 4, state: 'matched' },
      ],
      vars: { i: 1, j: 1 },
      ops: 5,
    },
    {
      line: 5,
      action: '[1, 2, 3, 4]. j=2: 3 и 4 — ok. Конец прохода i=1.',
      array: [
        { value: 1, state: 'idle' },
        { value: 2, state: 'idle' },
        { value: 3, state: 'matched' },
        { value: 4, state: 'matched' },
      ],
      vars: { i: 1, j: 2 },
      ops: 6,
    },
    {
      line: 2,
      action: 'i=2, i=3: проверяем ещё n раз для надёжности (всего n² = 16 операций).',
      array: [
        { value: 1, state: 'matched' },
        { value: 2, state: 'matched' },
        { value: 3, state: 'matched' },
        { value: 4, state: 'matched' },
      ],
      vars: { i: 3, j: 2 },
      ops: 12,
      hint: 'Для n=4 → ~16 операций. Для n=100 → 10 000. Для n=10000 → 100 000 000!',
    },
  ],
  pitfalls: [
    'Никогда не используй пузырьковую сортировку в проде. Встроенный array.sort() работает за O(n log n).',
    'Два вложенных цикла — это ВСЕГДА O(n²), даже если внутренний начинается не с 0 (это лишь меняет константу).',
    'O(n²) хорошо работает только на ОЧЕНЬ малых n (до ~100). На 1000+ элементах уже заметно тормозит.',
  ],
  source: 'docs/BigO_CheatSheet.md',
}

// ─── EXPORT ALL CASES ─────────────────────────────────────────────────────

export const CASES: CaseStudy[] = [
  constantTimeCase,
  binarySearchCase,
  linearCase,
  nLogNCase,
  insertIntervalCase,
  compressCase,
  quadraticCase,
]

// ─── Complexity comparison data (for chart) ───────────────────────────────

export const COMPLEXITY_INFO: Record<
  Complexity,
  { color: string; description: string; verdict: string; emoji: string }
> = {
  'O(1)': {
    color: '#10b981',
    description: 'Константное время. Не зависит от размера данных.',
    verdict: '🏆 Идеально',
    emoji: '⚡',
  },
  'O(log n)': {
    color: '#06b6d4',
    description: 'Делим данные пополам на каждом шаге. Очень быстро даже на миллиардах.',
    verdict: '✅ Отлично',
    emoji: '🚀',
  },
  'O(n)': {
    color: '#3b82f6',
    description: 'Линейный проход. Удвоишь данные — удвоится время.',
    verdict: '👍 Нормально',
    emoji: '📈',
  },
  'O(n log n)': {
    color: '#8b5cf6',
    description: 'Стандарт для сортировок. Чуть медленнее линейного, но всё ещё хорошо.',
    verdict: '👌 Хорошо',
    emoji: '🏃',
  },
  'O(n²)': {
    color: '#f59e0b',
    description: 'Каждый с каждым. На 1000+ элементов уже тормозит.',
    verdict: '⚠️ Плохо',
    emoji: '🐢',
  },
  'O(2ⁿ)': {
    color: '#ef4444',
    description: 'Экспоненциальный взрыв. Вешает компьютер на n=30.',
    verdict: '❌ Караул',
    emoji: '🐌',
  },
}

import type { CaseStudy, ArrayCell } from './types'

const tag = (arr: (number | string)[], states: Record<number, ArrayCell['state']> = {}): ArrayCell[] =>
  arr.map((v, i) => ({ value: v, state: states[i] ?? 'idle' }))

// ─── Two Sum ──────────────────────────────────────────────────────

const twoSumCase: CaseStudy = {
  id: 'two-sum',
  topic: 'Хэш-таблицы',
  title: 'Two Sum — найти пару с заданной суммой',
  complexity: 'O(n) время / O(n) память',
  about:
    'Дано: массив и target. Найти ДВА индекса, сумма которых = target. Наивно через два цикла — O(n²). С хэш-таблицей — O(n).',
  whenToUse:
    'Любой раз, когда тебя тянет писать «for внутри for» — подумай, не сохранить ли что-то в хэш-таблицу. Хэш-лукап = O(1).',
  analogy:
    'Ты ищешь пару носков в куче. Наивно — берёшь каждый и сравниваешь со всеми. Умно — раскладываешь по цветам в ячейки (хэш) и сразу видишь пару.',
  code: [
    'function twoSum(arr, target) {',
    '  const seen = new Map(); // value → index',
    '  for (let i = 0; i < arr.length; i++) {',
    '    const need = target - arr[i];',
    '    if (seen.has(need)) {',
    '      return [seen.get(need), i];',
    '    }',
    '    seen.set(arr[i], i);',
    '  }',
    '  return [];',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Дано: arr=[2,7,11,15], target=9.',
      scene: {
        array: { cells: tag([2, 7, 11, 15]) },
        map: { entries: [], label: 'seen (хэш-таблица)' },
        vars: { target: 9 },
      },
      ops: 0,
    },
    {
      line: 4,
      action: 'i=0, arr[i]=2. Что мы ИЩЕМ? need = 9 - 2 = 7. Есть 7 в seen? Нет.',
      scene: {
        array: { cells: tag([2, 7, 11, 15], { 0: 'compared' }) },
        map: { entries: [] },
        vars: { i: 0, 'arr[i]': 2, need: 7 },
      },
      ops: 1,
    },
    {
      line: 8,
      action: 'Кладём 2 → 0 в seen. То есть: «если кто-то ищет 2 — пусть знает, что 2 на индексе 0».',
      scene: {
        array: { cells: tag([2, 7, 11, 15], { 0: 'discarded' }) },
        map: { entries: [{ key: 2, value: 0, state: 'merged' }] },
        vars: { i: 0 },
      },
      ops: 2,
    },
    {
      line: 4,
      action: 'i=1, arr[i]=7. need = 9 - 7 = 2. Есть 2 в seen? ДА!',
      scene: {
        array: { cells: tag([2, 7, 11, 15], { 0: 'discarded', 1: 'compared' }) },
        map: { entries: [{ key: 2, value: 0, state: 'matched' }] },
        vars: { i: 1, 'arr[i]': 7, need: 2 },
      },
      ops: 3,
      hint: 'seen.has(2) — это O(1) благодаря хэш-таблице. Не надо сканировать весь массив!',
    },
    {
      line: 6,
      action: 'Возвращаем [seen.get(2), i] = [0, 1]. Готово!',
      scene: {
        array: { cells: tag([2, 7, 11, 15], { 0: 'matched', 1: 'matched' }) },
        map: { entries: [{ key: 2, value: 0, state: 'matched' }] },
        vars: { 'return': '[0, 1]' },
      },
      ops: 3,
      hint: 'Итого 3 операции вместо n² = 16 наивно. На больших данных разница катастрофическая.',
    },
  ],
  pitfalls: [
    'Хэш кладёт ЗНАЧЕНИЕ → ИНДЕКС, а не наоборот. Это позволяет вернуть нужные индексы.',
    'Если в массиве могут быть дубликаты с target = 2*x, надо проверять seen до того, как добавишь текущий элемент.',
    'Map vs Object: Map предсказуемо O(1), у Object есть нюансы с прототипами. Для алгоритмов — лучше Map.',
  ],
  source: 'algo: hashmap',
}

// ─── hasDuplicates with Set ───────────────────────────────────────

const hasDuplicatesCase: CaseStudy = {
  id: 'has-duplicates',
  topic: 'Хэш-таблицы',
  title: 'Есть ли в массиве дубликаты?',
  complexity: 'O(n) время / O(n) память',
  about:
    'Простейшая задача, где Set спасает от O(n²). Идём по массиву, кладём элемент в Set. Если он уже там — нашли дубликат.',
  whenToUse:
    'Дедупликация, проверка уникальности, отслеживание «уже видели/нет». Set — самая частая структура в интервью.',
  analogy:
    'Ты раздаёшь бейджи на конференции. На столе — коробка имён. Подходит человек: смотришь, есть ли его имя. Если есть — он уже регистрировался (дубликат).',
  code: [
    'function hasDuplicates(arr) {',
    '  const seen = new Set();',
    '  for (const item of arr) {',
    '    if (seen.has(item)) return true;',
    '    seen.add(item);',
    '  }',
    '  return false;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Дано: [3, 1, 4, 1, 5]. Есть ли повторы?',
      scene: {
        array: { cells: tag([3, 1, 4, 1, 5]) },
        map: { entries: [], label: 'seen (Set)' },
      },
      ops: 0,
    },
    {
      line: 4,
      action: 'i=0: 3. has(3)? Нет. Кладём 3 в Set.',
      scene: {
        array: { cells: tag([3, 1, 4, 1, 5], { 0: 'compared' }) },
        map: { entries: [{ key: 3, value: '✓', state: 'merged' }] },
      },
      ops: 1,
    },
    {
      line: 4,
      action: 'i=1: 1. has(1)? Нет. Кладём 1.',
      scene: {
        array: { cells: tag([3, 1, 4, 1, 5], { 0: 'discarded', 1: 'compared' }) },
        map: {
          entries: [
            { key: 3, value: '✓' },
            { key: 1, value: '✓', state: 'merged' },
          ],
        },
      },
      ops: 2,
    },
    {
      line: 4,
      action: 'i=2: 4. has(4)? Нет. Кладём 4.',
      scene: {
        array: { cells: tag([3, 1, 4, 1, 5], { 0: 'discarded', 1: 'discarded', 2: 'compared' }) },
        map: {
          entries: [
            { key: 3, value: '✓' },
            { key: 1, value: '✓' },
            { key: 4, value: '✓', state: 'merged' },
          ],
        },
      },
      ops: 3,
    },
    {
      line: 4,
      action: 'i=3: 1. has(1)? ДА! Возвращаем true.',
      scene: {
        array: { cells: tag([3, 1, 4, 1, 5], { 1: 'matched', 3: 'matched' }) },
        map: {
          entries: [
            { key: 3, value: '✓' },
            { key: 1, value: '✓', state: 'matched' },
            { key: 4, value: '✓' },
          ],
        },
        vars: { 'return': 'true' },
      },
      ops: 4,
      hint: 'Заметь — мы остановились на 4-м элементе, не дойдя до конца. Это и есть «ранний выход».',
    },
  ],
  pitfalls: [
    'Наивный подход через .indexOf внутри цикла даёт O(n²). На массиве в миллион элементов это секунды.',
    'Set.has() — O(1) в среднем, но O(n) в худшем случае (коллизии). Для криптографии важно, для интервью — нет.',
    'Альтернатива: new Set(arr).size !== arr.length. Короче, но создаёт весь Set даже когда дубликат на 2-й позиции.',
  ],
  source: 'hasDuplicates/hasDuplicates_BigO.md',
}

// ─── First Unique Char ────────────────────────────────────────────

const firstUniqueCharCase: CaseStudy = {
  id: 'first-unique-char',
  topic: 'Хэш-таблицы',
  title: 'Первый уникальный символ',
  complexity: 'O(n) время / O(k) память',
  about:
    'Дана строка. Найти индекс ПЕРВОГО символа, который встречается ровно один раз. Решение в два прохода через хэш-таблицу частот.',
  whenToUse:
    'Любая задача типа «найди X с условием на общее количество»: первая повторяющаяся буква, самая частая, наименее частая.',
  analogy:
    'Ты идёшь по очереди в раздевалке и хочешь найти первый ярлык с уникальным номером. Сначала пробегаешь и считаешь каждый номер. Потом второй раз — берёшь первый с count=1.',
  code: [
    'function firstUniqueChar(s) {',
    '  const count = new Map();',
    '  for (const ch of s) {       // проход 1: считаем',
    '    count.set(ch, (count.get(ch) ?? 0) + 1);',
    '  }',
    '  for (let i = 0; i < s.length; i++) {',
    '    if (count.get(s[i]) === 1) return i;',
    '  }',
    '  return -1;',
    '}',
  ],
  steps: [
    {
      line: 1,
      action: 'Дано: "leetcode". Ищем первый символ с count=1.',
      scene: {
        array: { cells: 'leetcode'.split('').map(v => ({ value: v, state: 'idle' })) },
        map: { entries: [], label: 'count' },
      },
      ops: 0,
    },
    {
      line: 3,
      action: 'Проход 1. Идём по строке и считаем каждую букву.',
      scene: {
        array: { cells: 'leetcode'.split('').map(v => ({ value: v, state: 'compared' })) },
        map: {
          entries: [
            { key: 'l', value: 1 },
            { key: 'e', value: 3 },
            { key: 't', value: 1 },
            { key: 'c', value: 1 },
            { key: 'o', value: 1 },
            { key: 'd', value: 1 },
          ],
          label: 'count',
        },
      },
      ops: 8,
      hint: '1 проход = O(n). Размер map — не больше алфавита (например, 26 для англ.). Это O(1) если рассматривать алфавит фикс.',
    },
    {
      line: 6,
      action: 'Проход 2. i=0: s[0]=l. count[l]=1 → НАШЛИ! Возвращаем 0.',
      scene: {
        array: {
          cells: 'leetcode'.split('').map((v, i) => ({
            value: v,
            state: i === 0 ? 'matched' : 'discarded',
          })),
        },
        map: {
          entries: [
            { key: 'l', value: 1, state: 'matched' },
            { key: 'e', value: 3 },
            { key: 't', value: 1 },
            { key: 'c', value: 1 },
            { key: 'o', value: 1 },
            { key: 'd', value: 1 },
          ],
        },
        vars: { 'return': 0 },
      },
      ops: 9,
      hint: 'Два прохода — это всё равно O(2n) = O(n). Константы в Big O отбрасываются.',
    },
  ],
  pitfalls: [
    'Соблазн обойтись одним проходом — не получится: на момент первой буквы мы не знаем, повторится ли она дальше.',
    '`count.get(ch) ?? 0` — короткая идиома вместо has/get. Если значения могут быть 0, используй ?? а не ||.',
    'Для ASCII можно заменить Map на массив [26] — это быстрее на практике, но Big O тот же.',
  ],
  source: 'firstUniqChar/',
}

export const HASHMAP_CASES: CaseStudy[] = [twoSumCase, hasDuplicatesCase, firstUniqueCharCase]

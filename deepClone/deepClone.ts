/**
 * Создаёт глубокую копию (deep clone) значения.
 *
 * @param {T} value - значение для клонирования
 * @returns {T} - абсолютно новая независимая копия
 */
export default function deepClone<T>(value: T): T {
    // 1. БАЗОВЫЙ СЛУЧАЙ (Base Case): Примитивы и null
    // Примитивы (числа, строки, boolean, undefined) в JS иммутабельны.
    // Мы можем просто вернуть их как есть. null тоже отсекается здесь.
    if (typeof value !== 'object' || value === null) {
        return value;
    }

    // 2. ОБРАБОТКА МАССИВОВ
    // Если это массив, клонируем его поэлементно.
    if (Array.isArray(value)) {
        // value.map() создаёт новый массив в памяти и прогоняет каждый элемент 
        // через рекурсивный вызов deepClone().
        return value.map((item) => deepClone(item)) as T;

        // ПРИМЕЧАНИЕ ПО ПРОИЗВОДИТЕЛЬНОСТИ:
        // map() красивый и лаконичный, но если нужен максимальный перформанс 
        // на огромных массивах, лучше написать старый добрый for-цикл:
        // const arrClone = new Array(value.length);
        // for (let i = 0; i < value.length; i++) arrClone[i] = deepClone(value[i]);
        // return arrClone as T;
    }

    // 3. ОБРАБОТКА ОБЪЕКТОВ (Plain Objects)
    // Создаём новый, полностью пустой объект в памяти.
    const clone = {} as Record<string, unknown>;

    // Object.keys() собирает ТОЛЬКО собственные ключи объекта (direct properties).
    // Он игнорирует унаследованные из прототипа свойства, что нам и нужно.
    const keys = Object.keys(value as Record<string, unknown>);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        // Рекурсивно клонируем каждое свойство и записываем в НОВЫЙ объект
        clone[key] = deepClone((value as Record<string, unknown>)[key]);
    }

    return clone as T;
}

// ============================================================================
// ❌ АЛЬТЕРНАТИВНЫЕ ВАРИАНТЫ 
// ============================================================================

// --- Вариант 1: JSON.parse (Самый ленивый и опасный) ---
// const clone = JSON.parse(JSON.stringify(value));
// МИНУСЫ:
// - Бесследно удаляет ключи со значением undefined, функции и Symbol.
// - Объекты Date превращает в строку, а NaN и Infinity превращает в null.
// - Очень медленно работает на больших объектах из-за парсинга строк.

// --- Вариант 2: Object.fromEntries (Короткий, но прожорливый) ---
// return Object.fromEntries(
//   Object.entries(value).map(([key, val]) => [key, deepClone(val)])
// ) as T;
// МИНУСЫ:
// - Object.entries() создаёт лишние массивы пар [key, value] на каждом уровне вложенности.
// - Сильно нагружает Garbage Collector (сборщик мусора), как и в задаче deepEqual. 
// - Наш цикл с Object.keys() работает намного чище по памяти.


// ============================================================================
// 🚀 ПРОДВИНУТЫЙ ВАРИАНТ: Deep Clone II (С поддержкой спец-объектов и циклов)
// ============================================================================
function isPrimitiveTypeOrFunction(value: unknown): boolean {
    return typeof value !== 'object' || typeof value === 'function' || value === null;
}

function getExactType(value: unknown): string {
    const type = typeof value;
    if (type !== 'object') return type;
    // Вытаскиваем точный тег (например, 'Array', 'Date') через .slice(8, -1)
    // "[object Date]" -> "Date"
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepCloneAdvanced<T>(value: T, cache = new Map<any, any>()): T {
    if (isPrimitiveTypeOrFunction(value)) return value;

    const type = getExactType(value);

    // 1. Индивидуальный подход к спец-объектам
    if (type === 'set') {
        const cloned = new Set();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (value as Set<any>).forEach(item => cloned.add(deepCloneAdvanced(item, cache)));
        return cloned as T;
    }
    if (type === 'map') {
        const cloned = new Map();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (value as Map<any, any>).forEach((val, key) => cloned.set(key, deepCloneAdvanced(val, cache)));
        return cloned as T;
    }
    if (type === 'array') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (value as Array<any>).map(item => deepCloneAdvanced(item, cache)) as T;
    }
    if (type === 'date') return new Date(value as unknown as Date) as T;
    if (type === 'regexp') return new RegExp(value as unknown as RegExp) as T;

    // 2. ЗАЩИТА ОТ БЕСКОНЕЧНЫХ ЦИКЛОВ (Circular References)
    // Представьте, что вы копируете книгу, где на 10-й странице написано "см. страницу 10".
    // Без кэша вы будете бесконечно перелистывать на 10-ю страницу.
    // Кэш — это блокнот, где вы записываете: "Оригинал А уже копируется в Лист №1".
    // Если мы снова видим Оригинал А, мы просто даём ссылку на Лист №1.
    if (cache.has(value)) {
        return cache.get(value);
    }

    // 3. СОХРАНЕНИЕ ПРОТОТИПОВ
    // Создаём новый объект, унаследованный от того же прототипа, что и оригинал
    // eslint-disable-next-line @typescript-eslint/ban-types
    const cloned = Object.create(Object.getPrototypeOf(value as Object));

    // Сразу заносим в кэш ДО обхода детей, чтобы избежать бесконечного цикла
    cache.set(value, cloned);

    // 4. КОПИРОВАНИЕ SYMBOLS И NON-ENUMERABLE СВОЙСТВ
    // Reflect.ownKeys видит абсолютно все ключи (включая Symbol и скрытые)
    // eslint-disable-next-line @typescript-eslint/ban-types
    for (const key of Reflect.ownKeys(value as Object)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = (value as any)[key];
        cloned[key] = isPrimitiveTypeOrFunction(item) ? item : deepCloneAdvanced(item, cache);
    }

    return cloned;
}

/**
 * ТРАССИРОВКА РАБОТЫ КЭША (Пошагово):
 *
 * const a = { name: 'A' };
 * const b = { name: 'B' };
 * a.link = b;
 * b.link = a; // Цикл!
 *
 * 1. Вызов deepClone(a):
 *    - Кэш пуст.
 *    - Создаём клон_А.
 *    - Записываем в кэш: [Объект 'a' -> клон_А].
 *    - Идём по свойствам 'a'. Видим 'link' (это объект 'b').
 *    - Вызываем deepClone(b).
 *
 * 2. Вызов deepClone(b):
 *    - 'b' нет в кэше.
 *    - Создаём клон_Б.
 *    - Записываем в кэш: [Объект 'b' -> клон_Б].
 *    - Идём по свойствам 'b'. Видим 'link' (это объект 'a').
 *    - Вызываем deepClone(a).
 *
 * 3. Повторный вызов deepClone(a):
 *    - ПРОВЕРКА: 'a' есть в кэше? ДА!
 *    - Возвращаем из кэша уже созданный клон_А.
 *
 * 4. Завершение deepClone(b):
 *    - Получили клон_А для свойства 'link'.
 *    - Возвращаем готовый клон_Б.
 *
 * 5. Завершение deepClone(a):
 *    - Получили клон_Б для свойства 'link'.
 *    - Возвращаем готовый клон_А.
 *
 * ИТОГ: Рекурсия остановилась, объекты ссылаются друг на друга правильно.
 */


// ── Тесты ──────────────────────────────────────────────────────────────────
const obj1 = { user: { role: 'admin' } };
const clonedObj1 = deepClone(obj1);

clonedObj1.user.role = 'guest';
console.log('--- Test 1 ---');
console.log('Clone:', clonedObj1.user.role); // 'guest'
console.log('Original:', obj1.user.role);    // 'admin' (оригинал не изменился)

const obj2 = { foo: [{ bar: 'baz' }] };
const clonedObj2 = deepClone(obj2);

obj2.foo[0].bar = 'bax';
console.log('--- Test 2 ---');
console.log('Original modified:', obj2.foo[0].bar); // 'bax'
console.log('Clone remains:', clonedObj2.foo[0].bar); // 'baz' (копия не пострадала)

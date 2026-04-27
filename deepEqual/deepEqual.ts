/**
 * Выполняет глубокое сравнение двух значений.
 * Возвращает true, если значения равны, и false в противном случае.
 *
 * ⚠️ EDGE CASES (Граничные случаи):
 * - Сравнивает `null`, объекты (Objects) и массивы (Arrays).
 * - Учитывает равенство +0 и -0 (они считаются НЕ равными).
 * - Корректно сравнивает NaN (NaN === NaN).
 * - ❌ Циклические объекты (circular references) не обрабатываются и вызовут переполнение стека (Stack Overflow).
 * - ❌ Дескрипторы свойств (Property descriptors) не учитываются при сравнении.
 * - ❌ Неперечисляемые свойства (Non-enumerable) и ключи-символы (Symbol-keyed) не сравниваются.
 *
 * @param {unknown} valueA - первое значение
 * @param {unknown} valueB - второе значение
 * @returns {boolean}      - результат сравнения
 *
 * @example
 * deepEqual('foo', 'foo'); // true
 * deepEqual({ id: 1 }, { id: 1 }); // true
 * deepEqual([1, 2, 3], [1, 2, 3]); // true
 * deepEqual([{ id: '1' }], [{ id: '2' }]); // false
 */
const deepEqual = (valueA: unknown, valueB: unknown): boolean => {
    // 1. БАЗОВЫЙ СЛУЧАЙ (Base Case): Проверка примитивов и одинаковых ссылок.
    // Если значения абсолютно идентичны (включая ссылки на один и тот же объект), мы сразу возвращаем true.
    // Object.is идеально подходит:
    // - Он корректно сравнивает NaN: Object.is(NaN, NaN) честно вернёт true.
    // - Различает +0 и -0: Object.is(+0, -0) вернёт false.
    // Это наш "ранний выход", избавляющий от рекурсии, если значения равны или ссылки совпадают.
    if (Object.is(valueA, valueB)) {
        return true;
    }

    // 2. ПРОВЕРКА ТИПОВ: Убеждаемся, что мы имеем дело с итерируемыми контейнерами.
    // На этом этапе значения всё ещё могут быть разными примитивами (например, 5 и 10 пройдут проверку выше).
    // Мы подготавливаем флаги: проверяем, являются ли значения оба объектами или оба массивами.
    // Object.prototype.toString.call — самый надёжный способ проверки на plain object (отсекает null, Date и т.д.).
    const bothObjects =
        Object.prototype.toString.call(valueA) === '[object Object]' &&
        Object.prototype.toString.call(valueB) === '[object Object]';
    const bothArrays = Array.isArray(valueA) && Array.isArray(valueB);

    // 3. ОТСЕЧЕНИЕ НЕСОВМЕСТИМОСТЕЙ:
    // На этом этапе значения всё ещё могут быть примитивами разных типов.
    // Но если бы у них было одинаковое значение, мы бы вышли на проверке Object.is().
    // Таким образом, если они оба не являются объектами или оба не массивами
    // (например: строка и число, объект и null), то они совершенно точно не равны.
    // условие буквально переводится так: "Если это НЕ два объекта И это НЕ два массива — 
    // значит, сравнивать тут больше нечего, они точно разные".
    if (!bothObjects && !bothArrays) {
        return false;
    }

    // Приводим к типу Record, чтобы TypeScript разрешил доступ по ключам/индексам строк.
    const comparableA = valueA as Record<string, unknown>;
    const comparableB = valueB as Record<string, unknown>;

    // 4. СРАВНЕНИЕ ДЛИНЫ:
    // Object.keys работает как для объектов (возвращает ключи), так и для массивов (возвращает индексы).
    // Если количество свойств не совпадает, то массивы/объекты точно не равны.
    if (Object.keys(comparableA).length !== Object.keys(comparableB).length) {
        return false;
    }

    // 5. РЕКУРСИВНЫЙ ОБХОД (Recursive Step):
    // Проходимся по всем перечисляемым ключам (или индексам) в первом объекте.
    for (const key in comparableA) {
        // Мы рекурсивно вызываем deepEqual для значений по текущему ключу.
        // Если хотя бы одно вложенное значение отличается, прерываем цикл (ранний выход).
        // Примечание: если key есть в A, но нет в B, comparableB[key] даст undefined.
        // Затем Object.is() на следующем уровне рекурсии вернет false.
        if (!deepEqual(comparableA[key], comparableB[key])) {
            return false;
        }
    }

    // 6. Если мы прошли все проверки и цикл завершился — массивы/объекты полностью равны.
    return true;
};

// ── Тесты ──────────────────────────────────────────────────────────────────
console.log(deepEqual('foo', 'foo'));                         // true
console.log(deepEqual({ id: 1 }, { id: 1 }));                 // true
console.log(deepEqual([1, 2, 3], [1, 2, 3]));                 // true
console.log(deepEqual([{ id: '1' }], [{ id: '2' }]));         // false
console.log(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }));       // true
console.log(deepEqual(null, null));                           // true
console.log(deepEqual(NaN, NaN));                             // true

export { deepEqual };

// ============================================================================
// ❌ АЛЬТЕРНАТИВНЫЙ (ХУДШИЙ) ВАРИАНТ: Approach 1 (Сначала объекты)
// ============================================================================
// Это классическое решение, которое часто пишут на собеседованиях первым.
// Но оно имеет фатальные проблемы с производительностью по сравнению с основным!

function shouldDeepCompare(type: string): boolean {
    return type === '[object Object]' || type === '[object Array]';
}

function getType(value: unknown): string {
    return Object.prototype.toString.call(value);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deepEqualApproach1 = (valueA: unknown, valueB: unknown): boolean => {
    const typeA = getType(valueA);
    const typeB = getType(valueB);

    // ПРОБЛЕМА 1: Мы сразу проваливаемся в рекурсию, даже если valueA === valueB.
    // Вызов deepEqualApproach1(hugeObj, hugeObj) приведёт к полному O(N) обходу 
    // огромного объекта, хотя мог бы вернуть true за O(1).
    if (typeA === typeB && shouldDeepCompare(typeA) && shouldDeepCompare(typeB)) {
        
        // ПРОБЛЕМА 2: Object.entries на глубоких уровнях вложенности создаёт
        // огромное количество мусорных массивов массивов [[k, v], [k, v]].
        // Это заставляет Garbage Collector (сборщик мусора) работать на износ.
        const entriesA = Object.entries(valueA as Record<string, unknown>);
        const entriesB = Object.entries(valueB as Record<string, unknown>);

        if (entriesA.length !== entriesB.length) {
            return false;
        }

        // Мы используем .every(), чтобы проверить каждую пару [ключ, значение] из первого объекта.
        // Если хотя бы одна проверка провалится, .every() сразу остановится и вернёт false.
        return entriesA.every(
            ([key, value]) =>
                // Условие 1: Существует ли вообще такой ключ во втором объекте?
                Object.hasOwn(valueB as Record<string, unknown>, key) &&
                // Условие 2: Если существует, равны ли их вложенные значения (рекурсия)?
                deepEqualApproach1(value, (valueB as Record<string, unknown>)[key])
        );
    }

    // fallback: проверка примитивов (и одинаковых ссылок) находится 
    // ТОЛЬКО В САМОМ КОНЦЕ.
    return Object.is(valueA, valueB);
};


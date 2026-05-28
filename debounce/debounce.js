"use strict";
// =================================================================
// РЕШЕНИЕ 1: обычная function + сохраняем this в переменную context
// =================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce3 = exports.debounceV2 = exports.debounce2 = exports.debounce1 = exports.debounceV1 = void 0;
// T extends (...args: any[]) => any — T должен быть функцией,
// иначе Parameters<T> не скомпилируется
function debounceV1(func, // T — конкретный тип переданной функции, TS выведет его автоматически
wait = 0) {
    // Parameters<T> — извлекает аргументы T как tuple: (q: string, n: number) => [string, number]
    // Возвращаем функцию с той же сигнатурой что и оригинал — TS будет проверять типы на вызове
    // ReturnType<typeof setTimeout> — кросс-платформенный тип ID таймера
    // (number в браузере, NodeJS.Timeout в Node — typeof берёт тип функции, ReturnType вытаскивает результат)
    let timeoutID = null;
    // null — нет активного таймера; один ID на всё замыкание — каждый вызов видит один и тот же
    // this: any — фиктивный параметр, не реальный аргумент (в JS его нет)
    // говорит TS: функция может быть вызвана с любым this, иначе strict-режим запретит его использование
    return function (...args) {
        const context = this; // сохраняем this ДО входа в setTimeout — внутри обычной function он потеряется
        // null ?? undefined — clearTimeout принимает number | undefined, но не null
        // ?? заменяет null на undefined, числа пропускает как есть
        clearTimeout(timeoutID ?? undefined); // отменяем предыдущий таймер — сбрасываем отсчёт
        timeoutID = setTimeout(function () {
            // обычная function — this здесь был бы globalThis/undefined
            timeoutID = null; // таймер отработал — сигнал что нет активного ожидания
            func.apply(context, args); // вызываем func с сохранённым context и последними args
        }, wait);
    };
}
exports.debounceV1 = debounceV1;
function debounce1(func, wait = 0) {
    let timeoutID = null;
    return function (...args) {
        const context = this;
        clearTimeout(timeoutID ?? undefined);
        timeoutID = setTimeout(function () {
            timeoutID = null;
            func.apply(context, args);
        }, wait);
    };
}
exports.debounce1 = debounce1;
function debounce2(func, wait = 0) {
    let timeoutID = null;
    return function (...args) {
        clearTimeout(timeoutID ?? undefined);
        timeoutID = setTimeout(() => {
            timeoutID = null;
            func.apply(this, args);
        }, wait);
    };
}
exports.debounce2 = debounce2;
// =================================================================
// РЕШЕНИЕ 2: обычная function + стрелочная функция внутри setTimeout
// =================================================================
function debounceV2(func, wait = 0) {
    let timeoutID = null;
    // Обёртка — обычная function (НЕ стрелка): this определяется в момент вызова снаружи
    return function (...args) {
        clearTimeout(timeoutID ?? undefined); // отменяем предыдущий таймер — сбрасываем отсчёт
        timeoutID = setTimeout(() => {
            // стрелка не имеет своего this — захватывает его лексически из function выше
            timeoutID = null; // таймер отработал — сбрасываем ID
            func.apply(this, args); // this здесь == this обёртки (захвачен стрелкой), args — из последнего вызова
        }, wait);
    };
}
exports.debounceV2 = debounceV2;
// =================================================================
// РЕШЕНИЕ 3: стрелочная функция + стрелочная функция внутри setTimeout
// =================================================================
const debounce3 = (func, wait = 0) => {
    let timeoutId = null;
    // Arrow function does not have a `this` parameter
    return function (...args) {
        clearTimeout(timeoutId ?? undefined);
        timeoutId = setTimeout(() => {
            timeoutId = null;
            func.apply(this, args);
        }, wait);
    };
};
exports.debounce3 = debounce3;

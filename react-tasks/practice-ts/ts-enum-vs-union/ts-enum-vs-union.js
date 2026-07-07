"use strict";
// Задача: замени enum на union строковых литералов так, чтобы:
// 1) статус передавался обычной строкой ('idle'), а не Status.Idle;
// 2) тип не генерировал рантайм-код (никакого JS-объекта для типа статусов);
// 3) был способ перебрать все значения статусов в рантайме (STATUSES).
//
// Открой этот файл в IDE, исправь реализацию ниже и запусти файл,
// чтобы проверить тесты в конце.
Object.defineProperty(exports, "__esModule", { value: true });
// источник истины для перебора значений + тип, выведенный из него
const STATUSES = ['idle', 'loading', 'success', 'error'];
function getBadgeLabel(status) {
    switch (status) {
        case 'idle':
            return 'Ожидание';
        case 'loading':
            return 'Загрузка';
        case 'success':
            return 'Готово';
        case 'error':
            return 'Ошибка';
    }
}
function badgeClassName(status) {
    return `badge badge--${status}`;
}
// ── Демонстрация ──────────────────────────────────────────────────────────
console.log(getBadgeLabel('idle')); // обычная строка, без импорта enum
console.log(getBadgeLabel('success'));
console.log(badgeClassName('error'));
console.log(STATUSES); // ['idle', 'loading', 'success', 'error']
// Раскомментируй — должна быть ошибка компиляции (статус не из union):
// getBadgeLabel('unknown')
// ── Тесты ──────────────────────────────────────────────────────────────────
function assertEqual(actual, expected, label) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`);
}
assertEqual(getBadgeLabel('idle'), 'Ожидание', 'getBadgeLabel принимает обычную строку "idle" (а не Status.Idle)');
assertEqual(STATUSES, ['idle', 'loading', 'success', 'error'], 'STATUSES содержит все ожидаемые значения в правильном порядке');
assertEqual(getBadgeLabel('loading'), 'Загрузка', 'getBadgeLabel возвращает корректную строку для "loading"');
assertEqual(getBadgeLabel('success'), 'Готово', 'getBadgeLabel возвращает корректную строку для "success"');
assertEqual(getBadgeLabel('error'), 'Ошибка', 'getBadgeLabel возвращает корректную строку для "error"');
assertEqual(badgeClassName('idle'), 'badge badge--idle', 'badgeClassName строит className из обычной строки статуса');

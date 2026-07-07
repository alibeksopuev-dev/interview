"use strict";
// Задача: убери ложную гарантию "ключ есть" из словаря.
// 1) Замени индексную сигнатуру на Record<string, User | undefined>;
// 2) getName должен возвращать string | undefined, а не падать
//    в рантайме на несуществующем ключе.
//
// Открой этот файл в IDE, исправь реализацию ниже и запусти файл,
// чтобы проверить тесты в конце.
Object.defineProperty(exports, "__esModule", { value: true });
function getName(map, id) {
    const user = map[id];
    if (!user)
        return undefined; // сужение убирает undefined
    return user.name;
}
// альтернатива через optional chaining
function getName2(map, id) {
    return map[id]?.name;
}
// ── Демонстрация ──────────────────────────────────────────────────────────
const map = { '1': { id: '1', name: 'Ann' } };
console.log(getName(map, '1')); // 'Ann'
console.log(getName(map, 'missing')); // undefined, без падения
console.log(getName2(map, '1')); // 'Ann'
// ── Тесты ──────────────────────────────────────────────────────────────────
function assertEqual(actual, expected, label) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`);
}
assertEqual(getName({ '1': { id: '1', name: 'Ann' } }, '1'), 'Ann', 'getName возвращает имя для существующего ключа');
assertEqual(getName({ '1': { id: '1', name: 'Ann' } }, 'missing'), undefined, 'getName возвращает undefined для несуществующего ключа без падения');
assertEqual(getName({ '1': { id: '1', name: 'Ann' }, '2': { id: '2', name: 'Bob' } }, '2'), 'Bob', 'getName работает с несколькими ключами в словаре');
assertEqual(getName({}, 'any'), undefined, 'getName возвращает undefined для пустого словаря');
assertEqual(getName2({ '1': { id: '1', name: 'Ann' } }, '1'), 'Ann', 'getName2 (optional chaining) возвращает имя для существующего ключа');
assertEqual(getName2({ '1': { id: '1', name: 'Ann' } }, 'missing'), undefined, 'getName2 (optional chaining) возвращает undefined для несуществующего ключа');

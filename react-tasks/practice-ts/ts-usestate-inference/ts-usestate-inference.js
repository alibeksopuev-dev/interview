"use strict";
// Задача: createState — упрощённая имитация useState (чистый TS, без React).
// Сейчас initial не типизирован дженериком, поэтому при пустом массиве / null
// TS выводит never[] / null — в state нельзя положить ничего осмысленного.
//
// Открой этот файл в IDE, исправь реализацию ниже (добавь generic <T>)
// и запусти файл, чтобы проверить тесты в конце.
Object.defineProperty(exports, "__esModule", { value: true });
function createState(initial) {
    let value = initial;
    const get = () => value;
    const set = (v) => {
        value = v;
    };
    return { get, set };
}
// ── Демонстрация ──────────────────────────────────────────────────────────
const usersState = createState([]);
const selectedState = createState(null);
usersState.set([{ id: '1', name: 'Ann' }]);
console.log(usersState.get()); // [{ id: '1', name: 'Ann' }]
selectedState.set({ id: '1', name: 'Ann' });
console.log(selectedState.get()); // { id: '1', name: 'Ann' }
selectedState.set(null);
console.log(selectedState.get()); // null
// ── Тесты ──────────────────────────────────────────────────────────────────
function assertEqual(actual, expected, label) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`);
}
assertEqual(createState([]).get(), [], 'createState<User[]>([]) изначально возвращает пустой массив');
const usersTest = createState([]);
usersTest.set([{ id: '1', name: 'Ann' }]);
assertEqual(usersTest.get(), [{ id: '1', name: 'Ann' }], 'set/get корректно работают с массивом User');
const selectedTest = createState(null);
selectedTest.set({ id: '2', name: 'Bob' });
assertEqual(selectedTest.get(), { id: '2', name: 'Bob' }, 'set/get корректно работают с User | null');
assertEqual(createState(null).get(), null, 'начальное значение null допустимо для User | null');

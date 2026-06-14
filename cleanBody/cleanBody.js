"use strict";
// =================================================================
// РЕШЕНИЕ 1: базовая реализация — фильтр + преобразование числел
// =================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanBodyV3 = exports.cleanBodyV2 = exports.cleanBodyV1 = void 0;
function cleanBodyV1(data) {
    return Object.fromEntries(Object.entries(data)
        .filter(([, v]) => v !== '' && !(Array.isArray(v) && v.length === 0))
        .map(([k, v]) => [k, typeof v === 'number' ? String(v) : v]));
}
exports.cleanBodyV1 = cleanBodyV1;
// =================================================================
// РЕШЕНИЕ 2: явные переменные — тот же результат, читаемее
// =================================================================
function cleanBodyV2(data) {
    const entries = Object.entries(data);
    const filtered = entries.filter(([, value]) => {
        const isEmptyString = value === '';
        const isEmptyArray = Array.isArray(value) && value.length === 0;
        return !isEmptyString && !isEmptyArray;
    });
    const mapped = filtered.map(([key, value]) => {
        const converted = typeof value === 'number' ? String(value) : value;
        return [key, converted];
    });
    return Object.fromEntries(mapped);
}
exports.cleanBodyV2 = cleanBodyV2;
// =================================================================
// РЕШЕНИЕ 3: reduce — один проход, без промежуточных массивов
// =================================================================
function cleanBodyV3(data) {
    return Object.entries(data).reduce((acc, [key, value]) => {
        if (value === '' || (Array.isArray(value) && value.length === 0)) {
            return acc; // пропускаем — не добавляем в аккумулятор
        }
        acc[key] = typeof value === 'number' ? String(value) : value;
        return acc;
    }, {});
}
exports.cleanBodyV3 = cleanBodyV3;
// =================================================================
// ТЕСТЫ
// =================================================================
const input = {
    name: 'Alice',
    age: 30,
    email: '',
    tags: [],
    tags2: ['a', 'b'],
    score: 0,
    active: true, // boolean — не трогаем
};
console.log('V1:', cleanBodyV1(input));
console.log('V2:', cleanBodyV2(input));
console.log('V3:', cleanBodyV3(input));
// Ожидаемый вывод:
// {
//   name: 'Alice',
//   age: '30',
//   tags2: ['a', 'b'],
//   score: '0',
//   active: true,
// }

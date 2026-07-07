"use strict";
// Задача: сделай так, чтобы isCircle сужал тип Shape после if.
// Подсказка: возвращаемый тип isCircle должен быть type predicate
// (s is ...), а не boolean.
//
// Открой этот файл в IDE, исправь реализацию ниже и запусти файл,
// чтобы проверить тесты в конце.
Object.defineProperty(exports, "__esModule", { value: true });
function isCircle(s) {
    return s.kind === 'circle';
}
function area(s) {
    if (isCircle(s)) {
        return Math.PI * s.radius ** 2; // s сужен до circle
    }
    return s.side ** 2; // s сужен до square
}
// ── Демонстрация ──────────────────────────────────────────────────────────
console.log(area({ kind: 'circle', radius: 2 })); // ~12.566
console.log(area({ kind: 'square', side: 3 })); // 9
// ── Тесты ──────────────────────────────────────────────────────────────────
function assertEqual(actual, expected, label) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`);
}
assertEqual(area({ kind: 'circle', radius: 2 }), Math.PI * 4, 'area считает площадь круга через Math.PI * radius ** 2');
assertEqual(area({ kind: 'square', side: 3 }), 9, 'area считает площадь квадрата через side ** 2');
assertEqual(area({ kind: 'circle', radius: 1 }), Math.PI, 'area корректно работает с радиусом 1');
assertEqual(area({ kind: 'square', side: 5 }), 25, 'area корректно работает со стороной 5');

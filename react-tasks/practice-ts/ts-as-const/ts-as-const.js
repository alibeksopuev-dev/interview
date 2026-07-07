"use strict";
// Задача: зафиксируй литеральные типы конфига через as const, чтобы
// config.variant/config.size подходили под union-параметры applyButtonConfig.
//
// Открой этот файл в IDE, исправь реализацию ниже и запусти файл,
// чтобы проверить тесты в конце.
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    variant: 'primary',
    size: 'lg',
};
// config.variant: 'primary', config.size: 'lg'
function applyButtonConfig(props) {
    return `${props.variant}-${props.size}`;
}
const ROUTES = ['/home', '/about'];
function isValidRoute(r) {
    return ROUTES.includes(r);
}
// ── Демонстрация ──────────────────────────────────────────────────────────
console.log(applyButtonConfig({ variant: config.variant, size: config.size })); // 'primary-lg'
console.log(isValidRoute('/home')); // true
console.log(isValidRoute('/missing')); // false
// Раскомментируй — должна быть ошибка компиляции (variant не входит в union):
// applyButtonConfig({ variant: 'danger', size: 'lg' })
// ── Тесты ──────────────────────────────────────────────────────────────────
function assertEqual(actual, expected, label) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`);
}
assertEqual(applyButtonConfig({ variant: config.variant, size: config.size }), 'primary-lg', 'applyButtonConfig с config.variant/config.size после as const даёт ожидаемую строку');
assertEqual(applyButtonConfig({ variant: 'ghost', size: 'sm' }), 'ghost-sm', 'applyButtonConfig работает с другой комбинацией литералов');
assertEqual(isValidRoute('/about'), true, 'isValidRoute находит существующий маршрут из ROUTES as const');
assertEqual(isValidRoute('/missing'), false, 'isValidRoute отклоняет маршрут, которого нет в ROUTES');

"use strict";
// Задача: пропсы кнопки разрешают невозможные комбинации —
// href и onClick оба опциональны, можно передать оба или ни одного.
// Перепиши тип так, чтобы это была либо ссылка, либо кнопка:
// 1) если href — то onClick запрещён (never), external опционален;
// 2) если onClick — то href и external запрещены (never).
//
// Открой этот файл в IDE, исправь реализацию ниже и запусти файл,
// чтобы проверить тесты в конце.
Object.defineProperty(exports, "__esModule", { value: true });
function renderButton(props) {
    if ('href' in props) {
        return {
            tag: 'a',
            label: props.label,
            href: props.href,
            target: props.external ? '_blank' : undefined,
        };
    }
    return {
        tag: 'button',
        label: props.label,
        onClick: props.onClick,
    };
}
// ── Демонстрация ──────────────────────────────────────────────────────────
console.log(renderButton({ label: 'Открыть', href: '/page', external: true }));
console.log(renderButton({ label: 'Сохранить', onClick: () => console.log('click') }));
// Раскомментируй — должна быть ошибка компиляции (невозможная комбинация):
// renderButton({ label: 'x' })
// renderButton({ label: 'x', href: '/a', onClick: () => {} })
// ── Тесты ──────────────────────────────────────────────────────────────────
function assertEqual(actual, expected, label) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`);
}
assertEqual(renderButton({ label: 'Открыть', href: '/page', external: true }), { tag: 'a', label: 'Открыть', href: '/page', target: '_blank' }, 'рендер ссылки с external=true даёт target=_blank');
assertEqual(renderButton({ label: 'Открыть', href: '/page' }), { tag: 'a', label: 'Открыть', href: '/page', target: undefined }, 'рендер ссылки без external оставляет target undefined');
const onClick = () => { };
assertEqual(renderButton({ label: 'Сохранить', onClick }), { tag: 'button', label: 'Сохранить', onClick }, 'рендер кнопки даёт tag button и тот же onClick');

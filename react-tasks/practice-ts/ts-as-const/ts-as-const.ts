// Задача: зафиксируй литеральные типы конфига через as const, чтобы
// config.variant/config.size подходили под union-параметры applyButtonConfig.
//
// Открой этот файл в IDE, исправь реализацию ниже и запусти файл,
// чтобы проверить тесты в конце.

const config = {
  variant: 'primary',
  size: 'lg',
} as const
// config.variant: 'primary', config.size: 'lg'

function applyButtonConfig(props: { variant: 'primary' | 'ghost'; size: 'sm' | 'lg' }): string {
  return `${props.variant}-${props.size}`
}

const ROUTES = ['/home', '/about'] as const
type Route = (typeof ROUTES)[number] // '/home' | '/about'

function isValidRoute(r: string): r is Route {
  return (ROUTES as readonly string[]).includes(r)
}

// ── Демонстрация ──────────────────────────────────────────────────────────

console.log(applyButtonConfig({ variant: config.variant, size: config.size })) // 'primary-lg'
console.log(isValidRoute('/home')) // true
console.log(isValidRoute('/missing')) // false

// Раскомментируй — должна быть ошибка компиляции (variant не входит в union):
// applyButtonConfig({ variant: 'danger', size: 'lg' })

// ── Тесты ──────────────────────────────────────────────────────────────────

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? '✓' : '✕'} ${label}`, ok ? '' : `(получено: ${JSON.stringify(actual)}, ожидалось: ${JSON.stringify(expected)})`)
}

assertEqual(
  applyButtonConfig({ variant: config.variant, size: config.size }),
  'primary-lg',
  'applyButtonConfig с config.variant/config.size после as const даёт ожидаемую строку',
)
assertEqual(
  applyButtonConfig({ variant: 'ghost', size: 'sm' }),
  'ghost-sm',
  'applyButtonConfig работает с другой комбинацией литералов',
)
assertEqual(isValidRoute('/about'), true, 'isValidRoute находит существующий маршрут из ROUTES as const')
assertEqual(isValidRoute('/missing'), false, 'isValidRoute отклоняет маршрут, которого нет в ROUTES')

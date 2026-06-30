# Фиксация литеральных типов через `as const`

## Условие задачи

Дан конфиг-объект:

```typescript
const config = {
  variant: 'primary',
  size: 'lg',
}

function applyButtonConfig(props: { variant: 'primary' | 'ghost'; size: 'sm' | 'lg' }): string {
  return `${props.variant}-${props.size}`
}

// ошибка компиляции: string не присваивается 'primary' | 'ghost'
applyButtonConfig({ variant: config.variant, size: config.size })
```

Разберись, почему TS не пропускает `config.variant`/`config.size` в `applyButtonConfig`, и исправь так, чтобы:
- `config.variant` имел тип `'primary'`, а не `string`;
- `config.size` имел тип `'lg'`, а не `string`;
- из массива маршрутов выводился union-тип через `(typeof arr)[number]`.

---

## Решение

```typescript
const config = {
  variant: 'primary',
  size: 'lg',
} as const
// config.variant: 'primary', config.size: 'lg'

function applyButtonConfig(props: { variant: 'primary' | 'ghost'; size: 'sm' | 'lg' }): string {
  return `${props.variant}-${props.size}`
}

applyButtonConfig({ variant: config.variant, size: config.size }) // ✅

const ROUTES = ['/home', '/about'] as const
type Route = (typeof ROUTES)[number] // '/home' | '/about'

function isValidRoute(r: string): r is Route {
  return (ROUTES as readonly string[]).includes(r)
}
```

---

## Ключевые детали

### 1. Widening — почему `'primary'` становится `string`

Без `as const` TS применяет к литералам в обычных `let`/`const`-инициализаторах объектов **widening**: строковый литерал `'primary'` расширяется до общего типа `string`, числовой литерал `1` — до `number`. Это сделано для удобства: предполагается, что переменная может позже получить *любое* значение того же базового типа.

```typescript
const a = 'primary' // тип: string (не 'primary')
let b = 'primary'   // тип: string
```

Для `const a = 'primary'` без объекта TS на самом деле выводит литеральный тип `'primary'`, но **внутри объекта** поведение другое — свойства объекта расширяются до базового типа, потому что объект мутабелен по умолчанию (`config.variant = 'ghost'` — валидно), и компилятор не может гарантировать, что значение останется именно `'primary'`.

### 2. `as const` — глубокий readonly + точные литералы

`as const`:
- делает все свойства объекта (рекурсивно) `readonly`;
- сохраняет литеральные типы вместо расширения до `string`/`number`/`boolean`;
- для массивов превращает `T[]` в readonly tuple с точными элементами.

```typescript
const config = { variant: 'primary', size: 'lg' } as const
// тип: { readonly variant: 'primary'; readonly size: 'lg' }
```

Теперь `config.variant` — это именно `'primary'`, что подходит под union `'primary' | 'ghost'`.

### 3. `(typeof arr)[number]` — union из массива-константы

```typescript
const ROUTES = ['/home', '/about'] as const
// тип ROUTES: readonly ['/home', '/about']

type Route = (typeof ROUTES)[number]
// '/home' | '/about'
```

Без `as const` тип `ROUTES` был бы `string[]`, и `(typeof ROUTES)[number]` дал бы просто `string` — без `as const` пользы от индексного доступа нет.

### 4. Почему readonly помогает компилятору, а не только защищает от мутаций

`readonly` сам по себе не выводит литеральные типы — это делает `as const`. Но readonly-эффект полезен отдельно: попытка `config.variant = 'ghost'` после `as const` — ошибка компиляции, что предотвращает случайные мутации конфигов, которые должны быть неизменными.

---

## Частые вопросы

### Чем `as const` отличается от явной аннотации типа?

```typescript
const config: { variant: 'primary'; size: 'lg' } = { variant: 'primary', size: 'lg' }
```

Это тоже работает, но дублирует структуру вручную и не даёт `readonly`. `as const` короче и не требует повторного описания формы объекта — TS выводит литеральный тип сам.

### Можно ли применить `as const` к части объекта?

Да, точечно:

```typescript
const config = {
  variant: 'primary' as const,
  size: 'lg',
}
// variant: 'primary', size: string
```

Так можно зафиксировать только нужные поля.

### `as const` влияет на рантайм?

Нет. Это чисто типовая аннотация — после компиляции в JS `as const` исчезает, рантайм-поведение не меняется. Влияет только на то, что видит компилятор.

### Что если массив должен оставаться мутабельным?

Тогда `as const` не подходит — он делает массив `readonly`. Нужен компромисс: либо мутабельный массив с widened-типом элементов, либо `as const` + копирование (`[...ROUTES]`) там, где нужна мутация.

---

## Сложность алгоритма

- **Временная сложность**: $O(1)$ — `as const` влияет только на этапе типизации, не порождает рантайм-вычислений.
- **Пространственная сложность**: $O(1)$.

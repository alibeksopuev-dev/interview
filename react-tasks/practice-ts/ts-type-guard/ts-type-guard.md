# Type guard для discriminated union: почему boolean не сужает тип

## Условие задачи

Дан union `Shape` и функция-проверка варианта:

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }

function isCircle(s: Shape): boolean {
  return s.kind === 'circle'
}

function area(s: Shape) {
  if (isCircle(s)) {
    return Math.PI * s.radius ** 2 // ошибка: radius нет на square
  }
  return s.side ** 2
}
```

Код не компилируется: внутри `if (isCircle(s))` TypeScript всё ещё считает `s` типом `Shape`, а не сузил его до `{ kind: 'circle'; radius: number }`. Почему — и как это исправить?

---

## Решение

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }

function isCircle(s: Shape): s is Extract<Shape, { kind: 'circle' }> {
  return s.kind === 'circle'
}

function area(s: Shape) {
  if (isCircle(s)) {
    return Math.PI * s.radius ** 2 // s сужен до circle ✅
  }
  return s.side ** 2 // s сужен до square ✅
}
```

---

## Ключевые детали

### 1. Тип возврата — это просто `boolean`

`boolean` — это просто `true | false`. Он не несёт никакой информации о том, *что именно* проверила функция. Компилятор видит вызов `isCircle(s)`, видит, что он вернул `boolean`, и больше ничего не может из этого вывести про тип `s`. Поэтому внутри `if` тип `s` остаётся как был — `Shape`.

### 2. `s is Type` — type predicate

Синтаксис `arg is Type` в позиции возвращаемого типа — это **user-defined type guard**. Он говорит компилятору: "если эта функция вернула `true`, то `arg` имеет тип `Type` в той ветке, где вызов был успешен". Тело функции при этом остаётся обычным — никакого специального рантайм-механизма, это чисто информация для типчекера.

```typescript
function isCircle(s: Shape): s is Extract<Shape, { kind: 'circle' }> {
  return s.kind === 'circle'
}
```

После `if (isCircle(s))` TS использует этот предикат и сужает `s` до `Extract<Shape, { kind: 'circle' }>`, то есть до `{ kind: 'circle'; radius: number }`. В `else`-ветке (или после `return`) тип сужается до оставшихся вариантов union — `{ kind: 'square'; side: number }`.

### 3. `Extract<Shape, { kind: 'circle' }>` вместо ручного объекта

`Extract<T, U>` берёт из union `T` только те члены, которые совместимы с `U`. Это удобнее, чем писать тип вручную (`{ kind: 'circle'; radius: number }`), потому что:
- не нужно дублировать форму типа — он один раз описан в `Shape`;
- если `Shape` изменится (добавится поле к `circle`), предикат не разойдётся с реальным типом.

### 4. Альтернатива — сужение по дискриминанту без guard-функции

Для discriminated union (есть общее поле-литерал, здесь `kind`) часто проще сделать проверку прямо в `if`, без отдельной функции:

```typescript
function area(s: Shape) {
  if (s.kind === 'circle') {
    return Math.PI * s.radius ** 2
  }
  return s.side ** 2
}
```

TypeScript умеет сужать union по сравнению дискриминанта с литералом автоматически, без всякого `is`. Отдельный type guard нужен в первую очередь тогда, когда логика проверки сложнее одного сравнения (например, проверка нескольких полей, instanceof-цепочка, валидация значения из внешнего источника) и её хочется вынести в переиспользуемую функцию.

---

## Частые вопросы

### Чем type predicate отличается от обычной проверки во время рантайма?

Ничем во время выполнения — рантайм-логика та же (`s.kind === 'circle'`). `s is Type` влияет только на то, что видит **компилятор** в местах вызова этой функции. Если тело функции лжёт (например, всегда возвращает `true`), TS поверит предикату и тип будет сужен некорректно — никакой проверки соответствия предиката и реальной логики компилятор не делает.

### Можно ли использовать type predicate с произвольным условием, а не только с дискриминантом?

Да. Типичный пример — `instanceof`-проверки или валидация неизвестных данных:

```typescript
function isString(x: unknown): x is string {
  return typeof x === 'string'
}
```

### Что если функция принимает не union, а просто широкий тип (`unknown`, `any`)?

Это самый частый случай для type guard — сужение `unknown` до конкретного типа после валидации (парсинг JSON, проверка формы объекта и т.п.). Здесь автоматическое сужение по дискриминанту не работает, потому что у `unknown` нет полей вообще — и без явного type predicate TS не даст использовать значение как нужный тип.

---

## Сложность алгоритма

- **Временная сложность**: $O(1)$ — обычное сравнение поля.
- **Пространственная сложность**: $O(1)$.

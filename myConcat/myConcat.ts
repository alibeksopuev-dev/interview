export {}

declare global {
  interface Array<T> {
    myConcat<U>(...items: Array<U | U[] | U[][]>): Array<T | U>
  }
}

Array.prototype.myConcat = function <T>(this: T[], ...items: any[]): any[] {
  // Поверхностная копия получателя (this) — база результата.
  // Спред сохраняет разреженность: дыры остаются дырами.
  const newArray = [...this]

  for (let i = 0; i < items.length; i++) {
    if (Array.isArray(items[i])) {
      // Массив «раскрывается» ровно на один уровень
      newArray.push(...items[i])
    } else {
      // Не-массив добавляется как одно значение
      newArray.push(items[i])
    }
  }

  return newArray
}

// ── Тесты ──────────────────────────────────────────────────────────────────

// 1. Базовый случай: массив + примитивы
console.log('base:', [1, 2].myConcat(3, 4)) // [1, 2, 3, 4]

// 2. Аргумент-массив раскрывается на один уровень
console.log('flatOneLevel:', [1, 2].myConcat([3, 4])) // [1, 2, 3, 4]

// 3. Вложенный массив НЕ раскрывается глубже одного уровня
console.log('nested:', [1, 2].myConcat(3, [4, 5], [[6]])) // [1, 2, 3, 4, 5, [6]]

// 4. Без аргументов — поверхностная копия получателя
const source = [1, 2]
const copy = source.myConcat()
console.log('shallowCopy:', copy, copy !== source) // [1, 2] true

// 5. Получатель не мутируется
const original = [1, 2]
original.myConcat(3)
console.log('noMutation:', original) // [1, 2]

// 6. Копия поверхностная: вложенные объекты остаются по ссылке
const obj = { a: 1 }
const withObj = [obj].myConcat()
console.log('shallow:', withObj[0] === obj) // true

// 7. Пустой массив как аргумент ничего не добавляет
console.log('emptyArg:', [1].myConcat([], [2])) // [1, 2]

// 8. Разреженность получателя сохраняется
console.log('sparse:', ([1, , 3] as number[]).myConcat(4)) // [1, <1 empty item>, 3, 4]

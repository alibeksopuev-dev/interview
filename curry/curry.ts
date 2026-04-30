/**
 * Каррирование (Currying) — это техника преобразования функции с несколькими аргументами
 * в последовательность функций, каждая из которых принимает один аргумент.
 *
 * ⚠️ EDGE CASES (Граничные случаи):
 * - Вызов без аргументов: должен возвращать ту же функцию (или результат, если arity 0).
 * - Функции, использующие `this`: обертка должна корректно пробрасывать контекст.
 * - Пустые вызовы `curried()`: сохраняют цепочку без добавления аргументов.
 *
 * @param {Function} func - Исходная функция, которую нужно каррировать.
 * @returns {Function}     - Каррированная версия функции.
 */

/**
 * Вариант 1: Замыкание (Closure-based) — Рекомендуемый вариант для понимания.
 * Он накапливает аргументы, пока их количество не достигнет арности (длины) исходной функции.
 */
function curry(func: Function): Function {
  return function curried(this: any, ...args: any[]): any {
    // Если накоплено достаточно аргументов, вызываем оригинал.
    // func.length возвращает количество ожидаемых аргументов (арность).
    if (args.length >= func.length) {
      return func.apply(this, args);
    }

    // Иначе возвращаем новую функцию, которая ждет следующий аргумент.
    return (arg: any) =>
      arg === undefined
        ? // Пустой вызов позволяет сохранить контекст и текущие аргументы.
          curried.apply(this, args)
        : curried.apply(this, [...args, arg]);
  };
}

const sum = (a: number, b: number, c: number) => a + b + c;
const curriedSum = curry(sum);
console.log(curriedSum(1)(2)(3)); // 6
console.log(curriedSum(1)(2)(3)); // 6

/**
 * Вариант 2: Использование bind().
 * Более гибкая версия, так как bind() автоматически сохраняет контекст и аргументы.
 * Также позволяет передавать несколько аргументов за один раз.
 */
function curryWithBind(func: Function): Function {
  return function curried(this: any, ...args: any[]): any {
    if (args.length >= func.length) {
      return func.apply(this, args);
    }

    // bind(this, ...args) создает новую функцию с предустановленным контекстом и аргументами.
    return curried.bind(this, ...args);
  };
}

// ── Тесты ──────────────────────────────────────────────────────────────────

const sumWithBind = curryWithBind(sum);
console.log('--- Curry with Bind Tests ---');
// bind-версия позволяет передавать по несколько аргументов
// @ts-ignore
console.log(sumWithBind(1, 2)(3)); // 6

// Тест на сохранение контекста (this)
const person = {
  name: 'Alibek',
  greet(phrase: string, punctuation: string) {
    return `${phrase}, ${this.name}${punctuation}`;
  }
};

const curriedGreet = curry(person.greet);
// Важно вызвать с правильным контекстом
const helloAlibek = curriedGreet.call(person, 'Hello');
console.log(helloAlibek('!')); // "Hello, Alibek!"

export { curry, curryWithBind };

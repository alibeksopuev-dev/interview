# Проверка типов: `typeof` против `Object.prototype.toString.call`

В JavaScript существует несколько способов узнать, что за значение перед нами. Два самых популярных — это оператор `typeof` и метод `Object.prototype.toString.call()`. Они решают разные задачи: один быстрый, а другой — точный.

---

## 1. Оператор `typeof` (Быстрый фильтр)

`typeof` — это встроенный оператор, который возвращает строку с типом значения. Он работает молниеносно, потому что это низкоуровневая операция движка.

### Когда использовать:
Когда нужно быстро отделить **примитивы** от объектов.

```javascript
typeof "Hello"    // 'string'
typeof 42         // 'number'
typeof true       // 'boolean'
typeof undefined  // 'undefined'
typeof Symbol()   // 'symbol'
typeof bigint     // 'bigint'
typeof function(){} // 'function' (единственный "объект", который typeof выделяет)
```

### Главная проблема (Киллер-фича или Баг?):
1. **`typeof null === 'object'`** — Самый известный баг JS. Если вы хотите проверить, является ли значение объектом, проверки `typeof val === 'object'` недостаточно, нужно всегда добавлять `&& val !== null`.
2. **`typeof [] === 'object'`** — Он не умеет отличать массивы от обычных объектов.
3. **`typeof new Date() === 'object'`** — Для него все встроенные объекты (Date, Map, Set, RegExp) — это просто `'object'`.

---

## 2. `Object.prototype.toString.call()` (Микроскоп)

Этот метод возвращает так называемый "тег типа" в формате `[object ИмяТипа]`. Он лезет во внутреннее свойство объекта `[[Class]]`.

### Когда использовать:
Когда нужна **абсолютная точность**. Например, в функциях глубокого клонирования (`deepClone`) или глубокого сравнения (`deepEqual`), чтобы отличить обычный объект от массива или даты.

```javascript
const toString = Object.prototype.toString;

toString.call({})             // '[object Object]'
toString.call([])             // '[object Array]'
toString.call(new Date())     // '[object Date]'
toString.call(new Map())      // '[object Map]'
toString.call(new Set())      // '[object Set]'
toString.call(/regex/)        // '[object RegExp]'
toString.call(null)           // '[object Null]' (исправляет баг typeof!)
toString.call(undefined)      // '[object Undefined]'

// 💡 ЛАЙФХАК: Как легко вырезать название типа без регулярки?
// Используйте .slice(8, -1), потому что префикс "[object " - это ровно 8 символов.
const getType = (v) => Object.prototype.toString.call(v).slice(8, -1);
getType([]) // "Array"
```

---

## 📋 Итоговое сравнение

| Характеристика | `typeof` | `Object.prototype.toString.call()` |
| :--- | :--- | :--- |
| **Скорость** | Очень высокая | Ниже (вызов метода + создание строки) |
| **Точность** | Низкая (видит только примитивы) | Очень высокая (видит конкретный класс) |
| **Баг с `null`** | Да (`'object'`) | Нет (`'[object Null]'`) |
| **Массивы** | Видит как `'object'` | Видит как `'object Array'` |
| **Спец-объекты** | Видит как `'object'` | Видит `Date`, `Map`, `RegExp` и т.д. |

---

## 💡 Практический совет

В реальных проектах (и на собеседованиях) часто комбинируют оба подхода для оптимальной производительности:

```javascript
function isPlainObject(value) {
  // 1. Сначала быстрая проверка: если это не объект в принципе или null - выходим сразу
  if (typeof value !== 'object' || value === null) return false;

  // 2. Если прошли первый фильтр, проверяем точно: не массив ли это, не дата ли это?
  return Object.prototype.toString.call(value) === '[object Object]';
}
```

Этот паттерн позволяет не нагружать систему вызовами `toString.call()` для простых строк или чисел, но при этом гарантирует точность для сложных структур данных.

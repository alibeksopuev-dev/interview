# TypeScript: Оператор `typeof` (TS vs JS)

Оператор `typeof` в TypeScript — это "двойной агент". Он ведет себя по-разному в зависимости от того, в каком контексте вы его используете.

---

## 1. JavaScript `typeof` (Runtime / Время выполнения)

Это стандартный оператор JavaScript, который вы используете в логике приложения (внутри функций, условий и т.д.).

*   **Результат:** Всегда возвращает **строку** (строковый литерал).
*   **Где работает:** В браузере или Node.js во время работы программы.
*   **Пример:**
    ```javascript
    const value = "Hello";
    if (typeof value === "string") {
      console.log("Это строка");
    }
    ```

---

## 2. TypeScript `typeof` (Type Context / Время компиляции)

Этот оператор используется в "мире типов". Он позволяет извлечь тип из уже существующей переменной или объекта.

*   **Результат:** Возвращает **тип TypeScript** (структуру, интерфейс).
*   **Где работает:** Только во время компиляции. В итоговый JS-файл этот код не попадает.
*   **Где используется:** После ключевых слов `type`, `interface` или после двоеточия `:`.

### Пример:
```typescript
const config = {
  api: "https://api.example.com",
  timeout: 5000
};

// Извлекаем структуру объекта в тип
type AppConfig = typeof config;

/* 
Тип AppConfig будет выглядеть так:
{
  api: string;
  timeout: number;
}
*/
```

---

## 3. В чем ключевая разница?

| Характеристика | JS `typeof` | TS `typeof` |
| :--- | :--- | :--- |
| **Что возвращает** | **Строку** (`"string"`, `"object"`) | **Тип** (структуру данных) |
| **Цель** | Проверка типа в коде (логика) | Описание типа на основе значения (DRY) |
| **Контекст** | Значения (Values) | Типы (Types) |
| **Пример использования** | `if (typeof x === 'number')` | `type T = typeof x` |

---

---

## 4. Комбинация: `keyof typeof`

Это мощная связка, которая позволяет получить **объединение (Union) ключей** объекта, имея только сам объект (а не его тип).

### Как это работает:
1.  **`typeof obj`**: Сначала превращает объект-переменную в тип TypeScript.
2.  **`keyof`**: Берет этот тип и вытаскивает из него все названия полей (ключи).

### Пример:
```typescript
const theme = {
  primary: "#007bff",
  secondary: "#6c757d",
  danger: "#dc3545"
};

// Если мы хотим получить тип: "primary" | "secondary" | "danger"
type ThemeColor = keyof typeof theme;

function applyColor(color: ThemeColor) {
  console.log(`Applying ${theme[color]}`);
}

applyColor("primary"); // ✅ Работает
applyColor("green");   // ❌ Ошибка: "green" не входит в ThemeColor
```

---

## 5. Итог: `[number]` vs `keyof typeof`

Часто путают, что использовать. Всё зависит от того, что перед вами: **Массив** или **Объект**.

| Задача | Инструмент | Пример |
| :--- | :--- | :--- |
| Получить **значения** из массива | `(typeof arr)[number]` | `type V = (typeof ["a", "b"] as const)[number]` (=> `"a" \| "b"`) |
| Получить **ключи** объекта | `keyof typeof obj` | `type K = keyof typeof { a: 1 }` (=> `"a"`) |
| Получить **значения** объекта | `(typeof obj)[keyof typeof obj]` | `type V = (typeof { a: 1 } as const)["a"]` (редкий случай) |

---

## 6. Когда нужен `as const`?

Частый вопрос: нужно ли всегда писать `as const` при использовании `typeof`?

### ❌ Можно НЕ писать (для ключей объекта)
Для получения **ключей** (`keyof`) через `keyof typeof` префикс `as const` не обязателен. TypeScript и так видит структуру объекта и знает названия его полей.

```typescript
const theme = { primary: "blue" };
type Keys = keyof typeof theme; // "primary" (уже литерал)
```

### ✅ ОБЯЗАТЕЛЬНО писать (для значений и массивов)
Если ваша цель — получить **конкретные значения** как типы-литералы, без `as const` не обойтись.

1.  **Для получения значений объекта:**
    ```typescript
    const theme = { primary: "#007bff" };
    type Color = (typeof theme)['primary']; // string (слишком широко)

    const themeConst = { primary: "#007bff" } as const;
    type ColorConst = (typeof themeConst)['primary']; // "#007bff" (точно!)
    ```

2.  **Для массивов (превращение в Union):**
    Без `as const` массив — это просто `string[]`.
    ```typescript
    const roles = ["admin", "user"] as const;
    type Role = (typeof roles)[number]; // "admin" | "user"
    ```

**Правило большого пальца:** Если вы хотите, чтобы данные стали «источником правды» для типов (Single Source of Truth), всегда добавляйте `as const`.

---

## 💡 Почему это важно для интервью?

Часто просят объяснить, как работает этот код:
```typescript
const colors = ["red", "blue"] as const;
type Color = (typeof colors)[number];
```

**Ответ:**
1.  Здесь `typeof` — это **TypeScript-оператор**. Он берет константный массив `colors` и превращает его в тип-кортеж (tuple).
2.  Благодаря `as const`, значения становятся литералами (`"red"`, `"blue"`), а не просто `string`.
3.  Индексация `[number]` вытаскивает все возможные значения из этого типа-массива в объединение (Union).

**Итог:** Мы получили тип `Color = "red" | "blue"` без дублирования слов "red" и "blue".

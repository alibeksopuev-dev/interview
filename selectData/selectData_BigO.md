# Разбор алгоритма selectData и Big O

---

## Что такое selectData?

**selectData** — функция фильтрации и агрегации набора тренировочных сессий.

Принимает массив сессий и объект опций. Возвращает новый массив сессий, не мутируя входные данные.

**Аналогия из жизни:** Запрос к базе данных с `WHERE`, `GROUP BY` и `ORDER BY` одновременно — но реализованный вручную на JavaScript, без SQL-движка.

---

## Структура данных

```ts
type Session = {
  user: number       // ID пользователя
  duration: number   // продолжительность в минутах
  equipment: Array<string>  // отсортированный массив, только 5 видов
}

type Options = {
  user?: number          // фильтр по конкретному пользователю
  minDuration?: number   // минимальная продолжительность (включительно)
  equipment?: Array<string>  // хотя бы один из перечисленных типов
  merge?: boolean        // объединить сессии одного пользователя
}
```

---

## Ключевые концепции

| Концепция | Роль в selectData |
| --- | --- |
| **`Array.slice().reverse()`** | Клонирует и переворачивает массив без мутации оригинала |
| **`Map<userId, session>`** | Отслеживает уже встреченного пользователя за `O(1)` |
| **`Set<string>` для equipment** | `O(1)` проверка наличия и `O(1)` добавление при дедупликации |
| **`setHasOverlap`** | Пересечение двух Set за `O(min(|A|, |B|))` вместо `O(n*m)` |
| **Double reverse trick** | Сохраняет правило «мёрдженная строка занимает место **последнего** вхождения» |

---

## Алгоритм в двух фазах

### Фаза 1 — Построение рабочего списка (с учётом `merge`)

```
sessions → .slice().reverse()
              ↓
     для каждой сессии (в reversed-порядке):
         merge ON + пользователь уже встречался?
           → обновить существующий клон (duration += ..., equipment.add(...))
         иначе:
           → клонировать сессию (equipment: new Set(...))
           → если merge ON, записать в Map<userId, клон>
           → добавить в sessionsProcessed
              ↓
     sessionsProcessed.reverse()   ← восстанавливаем порядок
```

### Фаза 2 — Фильтрация

```
для каждой сессии в sessionsProcessed:
    user != null → проверяем session.user
    equipment.size > 0 → setHasOverlap(...)
    minDuration != null → session.duration >= minDuration
    все условия выполнены → конвертируем Set → sorted Array → results.push
```

---

## Double Reverse Trick — подробный разбор

Задача: при `merge: true` мёрдженная строка должна **занять место последнего вхождения** пользователя в оригинальном массиве.

```
Оригинал (индексы 0..6):
  i=0  user=8
  i=1  user=7   ← первое вхождение user 7
  i=2  user=1
  i=3  user=7   ← второе вхождение user 7
  i=4  user=7   ← ПОСЛЕДНЕЕ вхождение user 7 — здесь должна быть мёрдженная строка
  i=5  user=2
  i=6  user=2
```

**Шаг 1 — reverse:**
```
  i=0  user=2   ← бывший i=6
  i=1  user=2   ← бывший i=5
  i=2  user=7   ← бывший i=4  (теперь ПЕРВОЕ вхождение user 7 в reversed-виде)
  i=3  user=7
  i=4  user=7
  i=5  user=1
  i=6  user=8
```

**Шаг 2 — обход reversed массива:**
- `user=2` (i=0): первый раз → клонируем, добавляем в sessionsProcessed[0], Map[2]=клон
- `user=2` (i=1): Map[2] есть → обновляем клон (duration+= , equipment.add)
- `user=7` (i=2): первый раз → клонируем, добавляем в sessionsProcessed[1], Map[7]=клон
- `user=7` (i=3): Map[7] есть → обновляем клон
- `user=7` (i=4): Map[7] есть → обновляем клон
- `user=1` (i=5): первый раз → клонируем, sessionsProcessed[2]
- `user=8` (i=6): первый раз → клонируем, sessionsProcessed[3]

**sessionsProcessed перед финальным reverse:** `[user2, user7, user1, user8]`

**Шаг 3 — reverse обратно:** `[user8, user7, user1, user2]`

Итог: `user7` стоит на месте бывшего `i=4` (последнее вхождение в оригинале). ✅

---

## TypeScript-типизация

### Generics и вспомогательная функция

```ts
function setHasOverlap<T>(setA: Set<T>, setB: Set<T>): boolean
```

- `<T>` — дженерик, чтобы функция работала с `Set<string>`, `Set<number>` и любым другим типом.
- Параметры типизированы через `Set<T>`, а не `Set<any>` — TypeScript проверит совместимость типов на вызове.

### Внутреннее представление vs публичный контракт

```ts
// Внутренний рабочий тип (equipment как Set — для O(1) операций)
const sessionsProcessed: Array<{
  user: number
  duration: number
  equipment: Set<string>   // ← Set
}> = []

// Публичный тип возврата (equipment как Array — как в оригинале)
type Session = { user: number; duration: number; equipment: Array<string> }  // ← Array
```

Конвертация происходит только на выходе:
```ts
equipment: Array.from(session.equipment).sort()
```

Это **type-boundary pattern**: внутри алгоритма оптимальное представление, снаружи — публичный контракт.

### Опциональные опции и `?? null` guard

```ts
options?.user != null && options.user !== session.user
```

- `?.user` — optional chaining: если `options` не передан, возвращает `undefined`, не выбрасывает ошибку.
- `!= null` — проверяет одновременно `null` и `undefined` (loose equality), не исключает `0`.
  - Важно: если написать `!options?.user`, то `user: 0` ошибочно засчитается как «не задан».

---

## Разбор кода с комментариями

```ts
export default function selectData(sessions: Array<Session>, options?: Options): Array<Session> {
  // ┌─ ФАЗА 1: клонируем и переворачиваем, не мутируя оригинал
  const reversedSessions = sessions.slice().reverse()

  // Map для O(1) поиска уже встреченного пользователя при merge
  const sessionsForUser = new Map<number, { user: number; duration: number; equipment: Set<string> }>()

  const sessionsProcessed: Array<{ user: number; duration: number; equipment: Set<string> }> = []

  reversedSessions.forEach(session => {
    if (options?.merge && sessionsForUser.has(session.user)) {
      // Пользователь уже есть — обновляем мёрдженный объект
      const userSession = sessionsForUser.get(session.user)!
      userSession.duration += session.duration
      session.equipment.forEach(e => userSession.equipment.add(e))  // Set автоматически дедуплицирует
    } else {
      const clonedSession = {
        ...session,
        equipment: new Set(session.equipment),  // new Set = клон, не мутируем оригинал
      }

      if (options?.merge) {
        sessionsForUser.set(session.user, clonedSession)  // регистрируем первое вхождение
      }

      sessionsProcessed.push(clonedSession)
    }
  })

  sessionsProcessed.reverse()  // восстанавливаем порядок после reversed-обхода
  // └─ конец ФАЗЫ 1

  // ┌─ ФАЗА 2: фильтрация
  // Создаём Set один раз до цикла — O(k) вместо пересоздания O(k) на каждую сессию
  const optionEquipments = new Set(options?.equipment)
  const results: Array<Session> = []

  sessionsProcessed.forEach(session => {
    if (
      (options?.user != null && options.user !== session.user) ||      // фильтр по юзеру
      (optionEquipments.size > 0 && !setHasOverlap(optionEquipments, session.equipment)) ||  // фильтр по оборудованию
      (options?.minDuration != null && options.minDuration > session.duration)  // фильтр по длительности
    ) {
      return  // short-circuit: пропускаем сессию при первом же несовпадении
    }

    results.push({
      ...session,
      equipment: Array.from(session.equipment).sort(),  // Set → отсортированный Array
    })
  })

  return results
  // └─ конец ФАЗЫ 2
}
```

---

## Пошаговая трассировка примеров

### Данные

```ts
const sessions = [
  { user: 8, duration: 50,  equipment: ['bench'] },
  { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
  { user: 1, duration: 10,  equipment: ['barbell'] },
  { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
  { user: 7, duration: 200, equipment: ['bike'] },
  { user: 2, duration: 200, equipment: ['treadmill'] },
  { user: 2, duration: 200, equipment: ['bike'] },
]
```

---

### `selectData(sessions)` — без опций

Нет фильтров, нет мержа → возвращает все 7 сессий как есть.

```
[
  { user: 8, duration: 50,  equipment: ['bench'] },
  { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
  { user: 1, duration: 10,  equipment: ['barbell'] },
  { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
  { user: 7, duration: 200, equipment: ['bike'] },
  { user: 2, duration: 200, equipment: ['treadmill'] },
  { user: 2, duration: 200, equipment: ['bike'] },
]
```

---

### `selectData(sessions, { user: 2 })` — фильтр по пользователю

Оставляем только сессии где `user === 2`:

```
[
  { user: 2, duration: 200, equipment: ['treadmill'] },
  { user: 2, duration: 200, equipment: ['bike'] },
]
```

---

### `selectData(sessions, { minDuration: 200 })` — фильтр по длительности

Оставляем сессии где `duration >= 200`:

```
[
  { user: 7, duration: 200, equipment: ['bike'] },
  { user: 2, duration: 200, equipment: ['treadmill'] },
  { user: 2, duration: 200, equipment: ['bike'] },
]
```

---

### `selectData(sessions, { equipment: ['bike', 'dumbbell'] })` — фильтр по оборудованию

Оставляем сессии, где используется хотя бы один из: `['bike', 'dumbbell']`.

```
optionEquipments = Set{'bike', 'dumbbell'}

user=7, eq=['dumbbell','kettlebell'] → overlap (dumbbell) ✅
user=7, eq=['bike','kettlebell']     → overlap (bike) ✅
user=7, eq=['bike']                  → overlap (bike) ✅
user=2, eq=['bike']                  → overlap (bike) ✅

Результат:
[
  { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
  { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
  { user: 7, duration: 200, equipment: ['bike'] },
  { user: 2, duration: 200, equipment: ['bike'] },
]
```

---

### `selectData(sessions, { merge: true })` — мёрдж

**Reversed массив:**
```
user=2 (bike), user=2 (treadmill), user=7 (bike),
user=7 (bike+kettlebell), user=1, user=7 (dumbbell+kettlebell), user=8
```

**Обход:**
| i | user | действие |
|---|------|---------|
| 0 | 2 | первый раз → клон, Map[2]=клон, sessionsProcessed=[user2] |
| 1 | 2 | Map[2] есть → duration+=200, equipment.add('treadmill') |
| 2 | 7 | первый раз → клон, Map[7]=клон, sessionsProcessed=[user2, user7] |
| 3 | 7 | Map[7] есть → duration+=100, equipment.add('bike','kettlebell') |
| 4 | 1 | первый раз → клон, sessionsProcessed=[user2, user7, user1] |
| 5 | 7 | Map[7] есть → duration+=150, equipment.add('dumbbell','kettlebell') |
| 6 | 8 | первый раз → клон, sessionsProcessed=[user2, user7, user1, user8] |

**После reverse:** `[user8, user7, user1, user2]`

```
[
  { user: 8, duration: 50,  equipment: ['bench'] },
  { user: 7, duration: 450, equipment: ['bike', 'dumbbell', 'kettlebell'] },
  { user: 1, duration: 10,  equipment: ['barbell'] },
  { user: 2, duration: 400, equipment: ['bike', 'treadmill'] },
]
```

User 7 стоит на позиции своего **последнего** оригинального вхождения (i=4). ✅

---

### `selectData(sessions, { merge: true, minDuration: 400 })` — мёрдж + фильтр

Берём мёрдженный результат выше, оставляем только `duration >= 400`:

```
user=8:  50  < 400 ❌
user=7: 450 >= 400 ✅
user=1:  10  < 400 ❌
user=2: 400 >= 400 ✅

[
  { user: 7, duration: 450, equipment: ['bike', 'dumbbell', 'kettlebell'] },
  { user: 2, duration: 400, equipment: ['bike', 'treadmill'] },
]
```

---

## Big O

### n = количество сессий, k = количество типов equipment в опции

### Временная сложность

| Фаза | Операция | Сложность |
| --- | --- | --- |
| Реверс входного массива | `slice().reverse()` | `O(n)` |
| Обход reversed массива | forEach × n | `O(n)` |
| `Map.has` / `Map.get` / `Map.set` | на каждую сессию | `O(1)` |
| `Set.add` при мёрдже equipment | до 5 элементов | `O(1)` |
| Финальный reverse | `sessionsProcessed.reverse()` | `O(n)` |
| Создание `optionEquipments` Set | из k элементов | `O(k)` |
| Фильтрация | forEach × n | `O(n)` |
| `setHasOverlap` | min(k, 5) итераций | `O(1)` (т.к. max 5 типов) |
| `Array.from(set).sort()` | 5 элементов | `O(1)` |
| **Итого** | | **`O(n)`** |

### Пространственная сложность

| Структура | Размер |
| --- | --- |
| `reversedSessions` | `O(n)` — клон входного массива |
| `sessionsForUser` Map | `O(u)` — u уникальных пользователей, u ≤ n |
| `sessionsProcessed` | `O(n)` без мержа, `O(u)` с мержем |
| `results` | `O(n)` в худшем случае |
| **Итого** | **`O(n)`** |

---

## Типичные ошибки

| Ошибка | Что сломается |
| --- | --- |
| **Мутировать `session.equipment` напрямую** | Входные данные изменятся, последующие вызовы дадут неправильный результат |
| **Не делать reverse перед обходом** | Мёрдженная строка окажется на месте первого, а не последнего вхождения |
| **Использовать `includes()` вместо `Set`** | `O(n*m)` вместо `O(n)` для equipment-фильтра |
| **Проверять `!options?.equipment` вместо `size > 0`** | Пустой массив `[]` ошибочно активирует фильтр |
| **Проверять `!options?.user` вместо `!= null`** | `user: 0` засчитается как «не задан» |
| **Не клонировать equipment при push в results** | Set мутируется позже — результаты изменятся непредсказуемо |

---

## Подробный разбор типичных ошибок

### 1. Мутация входных данных

```ts
// ❌ Неправильно: мутируем equipment оригинальной сессии
const clonedSession = {
  ...session,
  equipment: session.equipment, // ← это ссылка, не копия
}
clonedSession.equipment.push('bike') // мутирует оригинал!

// ✅ Правильно: создаём новый Set из существующих значений
equipment: new Set(session.equipment) // независимая копия
```

---

### 2. Неправильная проверка `user: 0`

```ts
// ❌ Неправильно: user=0 воспринимается как «не задан»
if (!options?.user) { /* всегда выполнится при user=0 */ }

// ✅ Правильно: отличаем 0 от undefined/null
if (options?.user != null) { /* только если явно передан */ }
```

---

### 3. Фильтр по пустому equipment

```ts
// ❌ Неправильно: пустой массив [] фильтрует всё
const optionEquipments = new Set(options?.equipment)
if (!setHasOverlap(optionEquipments, session.equipment)) return // Set пустой → overlap=false → всё отфильтруется!

// ✅ Правильно: проверяем size перед вызовом overlap
if (optionEquipments.size > 0 && !setHasOverlap(optionEquipments, session.equipment)) return
```

---

## Где применяется этот паттерн

| Сценарий | Аналог |
| --- | --- |
| Фильтрация списков продуктов (e-commerce) | `selectData` с несколькими опциями |
| Агрегация событий аналитики по пользователю | `merge: true` |
| Дедупликация тегов/категорий | `Set` для equipment |
| Клиентский `GROUP BY` без SQL | double-reverse trick |

# Разбор алгоритма mergeData и Big O

---

## Что такое mergeData?

**mergeData** — функция агрегации тренировочных сессий: объединяет все сессии одного пользователя в один объект (запись), сохраняя позицию **первого** вхождения.

**Аналогия из жизни:** `GROUP BY user` в SQL — но с сохранением исходного порядка записей и без движка базы данных.

### Что значит «сохраняя позицию первого вхождения»?

Это означает, что при объединении нескольких сессий одного и того же пользователя итоговый (агрегированный) объект должен оказаться в результирующем массиве на той позиции, на которой находилась **самая первая** сессия этого пользователя в исходном массиве. 

Относительный порядок уникальных пользователей в результате будет в точности соответствовать порядку их первого появления в исходных данных.

#### Пример наглядно:
Предположим, на вход поступает следующий массив сессий:
1. `{ user: 8, ... }` — **первое появление** пользователя **8** (он становится 1-м среди уникальных).
2. `{ user: 7, ... }` — **первое появление** пользователя **7** (он становится 2-м).
3. `{ user: 1, ... }` — **первое появление** пользователя **1** (он становится 3-м).
4. `{ user: 7, ... }` — повторная сессия пользователя 7.
5. `{ user: 7, ... }` — повторная сессия пользователя 7.
6. `{ user: 2, ... }` — **первое появление** пользователя **2** (он становится 4-м).
7. `{ user: 2, ... }` — повторная сессия пользователя 2.

*   **Сохранение первого вхождения (наш случай):**  
    Порядок уникальных пользователей в итоговом результате строится строго по их первому появлению:  
    `[User 8, User 7, User 1, User 2]`
*   **Сохранение последнего вхождения (как в `selectData({ merge: true })`):**  
    Порядок строится по последней сессии каждого пользователя (последняя сессия `8` — на шаге 1, `1` — на шаге 3, `7` — на шаге 5, `2` — на шаге 7):  
    `[User 8, User 1, User 7, User 2]`

**Отличие от `selectData({ merge: true })`:**

| | mergeData | selectData({ merge: true }) |
| --- | --- | --- |
| Позиция объединенного объекта | **Первое** вхождение пользователя | **Последнее** вхождение пользователя |
| Алгоритм | Прямой обход, один проход | Double reverse trick |
| Фильтрация | Нет | Есть (user, minDuration, equipment) |

---

## Ключевые концепции

| Концепция | Роль в mergeData |
| --- | --- |
| **`Map<userId, mergedRow>`** | `O(1)` доступ к мёрдженному объекту при повторном вхождении |
| **Map insertion order** | `Map` по спецификации JS (ES2015+) итерируется в порядке первой вставки ключа → `Map.values()` уже в нужном порядке, отдельный `results[]` не нужен |
| **`Set<string>` для equipment** | `O(1)` добавление с автоматической дедупликацией |
| **`Array.sort()` в конце** | Конвертация `Set → Array` и сортировка — один раз на пользователя, не на каждое вхождение |

---

## Алгоритм — один проход слева направо

```
для каждой сессии в sessions:
    Map[user] существует?
      ДА → достаём userSession (O(1))
           userSession.duration += session.duration
           для каждого equipment → userSession.equipment.add(eq)
      НЕТ → клонируем сессию (equipment: new Set(...))
             Map[user] = клон   ← место = первое вхождение (Map хранит insertion order)

// Map.values() итерируется в порядке первой вставки — отдельный results[] не нужен
return Array.from(sessionsForUser.values()).map(session => ({
  ...session,
  equipment: Array.from(session.equipment).sort()
}))
```

---

## Почему Map.values() достаточно — insertion order

Спецификация ECMAScript (ES2015+) гарантирует: `Map` итерируется в порядке **первой вставки** каждого ключа. Повторный `set()` с тем же ключом **не меняет его позицию** в порядке итерации — только обновляет значение.

```ts
const map = new Map<number, string>()
map.set(7, 'first')
map.set(1, 'second')
map.set(7, 'updated')  // позиция ключа 7 НЕ изменилась

Array.from(map.values()) // → ['updated', 'second']
//                                ↑ ключ 7 всё ещё первый
```

Значит `Array.from(sessionsForUser.values())` даёт объекты сессий в порядке первого вхождения каждого пользователя — именно то, что требует задача. Отдельный `results[]` был бы дублированием того, что Map уже делает бесплатно.

```
sessionsForUser после обхода всех 7 сессий:

  Map {
    8 → { user: 8, duration: 50,  equipment: Set{bench} }       ← вставлен при i=0
    7 → { user: 7, duration: 450, equipment: Set{dumbbell,...} } ← вставлен при i=1
    1 → { user: 1, duration: 10,  equipment: Set{barbell} }      ← вставлен при i=2
    2 → { user: 2, duration: 400, equipment: Set{treadmill,...} } ← вставлен при i=5
  }

Array.from(sessionsForUser.values())
// → [user8, user7, user1, user2]  — порядок первых вхождений ✅
```

---

## Рефакторинг: от двух структур к одной

### Было — shared reference trick

Первая версия держала два синхронизированных контейнера:

```ts
const results = []          // для порядка (insertion order вручную)
const sessionsForUser = new Map() // для O(1) доступа по userId

// При первом вхождении:
sessionsForUser.set(session.user, clonedSession)
results.push(clonedSession) // оба указывают на один объект
```

Идея: `Map` и `results[]` хранят **одну ссылку** на объект — обновление через `Map` автоматически отражалось в `results[]`. Это работает, но `results[]` избыточен.

### Стало — Map insertion order

`Map` по спецификации ES2015+ сам хранит insertion order. Повторный `set()` с тем же ключом **не меняет позицию** ключа — только обновляет значение:

```ts
const map = new Map()
map.set(7, 'first')
map.set(1, 'second')
map.set(7, 'updated')       // ← позиция ключа 7 не изменилась

Array.from(map.values())    // → ['updated', 'second']
```

Значит `results[]` дублировал то, что `Map` уже делает бесплатно. Финальная версия:

```ts
// Map.values() даёт значения в порядке первой вставки — results[] не нужен
return Array.from(sessionsForUser.values()).map(...)
```

---

## Разбор кода с комментариями

```ts
export default function mergeData(sessions: Array<Session>): Array<Session> {
  // Map сохраняет порядок первой вставки по спецификации ES2015+:
  // Map.values() итерируется в порядке первого появления каждого userId
  const sessionsForUser = new Map<
    number,
    { user: number; duration: number; equipment: Set<string> }
  >()

  sessions.forEach(session => {
    if (sessionsForUser.has(session.user)) {
      // O(1): получаем мёрдженный объект по userId
      const userSession = sessionsForUser.get(session.user)!
      userSession.duration += session.duration
      session.equipment.forEach(eq => userSession.equipment.add(eq))
      // ↑ Set.add игнорирует дублирующиеся значения автоматически
    } else {
      // Первое вхождение: клонируем и регистрируем в Map
      // Позиция в Map фиксируется здесь навсегда (insertion order)
      sessionsForUser.set(session.user, {
        ...session,
        equipment: new Set(session.equipment), // не мутируем входные данные
      })
    }
  })

  // Map.values() в порядке первой вставки → конвертируем Set в отсортированный Array
  return Array.from(sessionsForUser.values()).map(session => ({
    ...session,
    equipment: Array.from(session.equipment).sort(),
  }))
}
```

---

## Пошаговая трассировка

### Данные

```ts
const sessions = [
  { user: 8, duration: 50,  equipment: ['bench'] },           // i=0
  { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] }, // i=1
  { user: 1, duration: 10,  equipment: ['barbell'] },          // i=2
  { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] }, // i=3
  { user: 7, duration: 200, equipment: ['bike'] },             // i=4
  { user: 2, duration: 200, equipment: ['treadmill'] },        // i=5
  { user: 2, duration: 200, equipment: ['bike'] },             // i=6
]
```

### Обход

| i | user | Map[user] есть? | Действие | results после | Map после |
|---|------|----------------|---------|--------------|----------|
| 0 | 8 | нет | клон → results[0], Map[8]=клон | [{u8, 50, {bench}}] | {8→[0]} |
| 1 | 7 | нет | клон → results[1], Map[7]=клон | [..., {u7, 150, {dumbbell,kettlebell}}] | {8→[0], 7→[1]} |
| 2 | 1 | нет | клон → results[2], Map[1]=клон | [..., {u1, 10, {barbell}}] | {..., 1→[2]} |
| 3 | 7 | **да** | userSession=Map[7]; duration+=100; eq.add(bike,kettlebell) | results[1].duration=250, eq={dumbbell,kettlebell,bike} | без изменений |
| 4 | 7 | **да** | duration+=200; eq.add(bike) | results[1].duration=450, eq={dumbbell,kettlebell,bike} | без изменений |
| 5 | 2 | нет | клон → results[3], Map[2]=клон | [..., {u2, 200, {treadmill}}] | {..., 2→[3]} |
| 6 | 2 | **да** | duration+=200; eq.add(bike) | results[3].duration=400, eq={treadmill,bike} | без изменений |

### Финальный results (до map)

```
[
  { user: 8, duration: 50,  equipment: Set{'bench'} },
  { user: 7, duration: 450, equipment: Set{'dumbbell','kettlebell','bike'} },
  { user: 1, duration: 10,  equipment: Set{'barbell'} },
  { user: 2, duration: 400, equipment: Set{'treadmill','bike'} },
]
```

### После `.map(session => ({ equipment: Array.from(session.equipment).sort() }))`

```ts
[
  { user: 8, duration: 50,  equipment: ['bench'] },
  { user: 7, duration: 450, equipment: ['bike', 'dumbbell', 'kettlebell'] },
  { user: 1, duration: 10,  equipment: ['barbell'] },
  { user: 2, duration: 400, equipment: ['bike', 'treadmill'] },
]
```

User 7 стоит на позиции **первого** вхождения (i=1). ✅
User 2 стоит на позиции **первого** вхождения (i=5 → results[3]). ✅

---

## Сравнение с selectData({ merge: true }) — Double Reverse Trick

| Аспект | mergeData | selectData({ merge: true }) |
| --- | --- | --- |
| **Позиция объекта в результате** | Первое вхождение | Последнее вхождение |
| **Проходов по массиву** | 1 | 3 (reverse + forEach + reverse) |
| **Дополнительная память** | Map + results | Map + sessionsProcessed |
| **Сложность** | `O(n)` | `O(n)` |
| **Трюк** | Shared reference | Double reverse |

**Почему для «последнего вхождения» нужен double reverse, а для «первого» — нет?**

При прямом обходе первое вхождение всегда известно сразу — мы просто добавляем в `results`. Последнее вхождение заранее неизвестно: нельзя знать, будет ли ещё следующая запись для этого пользователя. Решение — перевернуть массив, чтобы «последнее» стало «первым», а затем вернуть порядок обратно.

---

## Big O

### n = количество сессий, e = количество equipment (≤ 5)

### Временная сложность

| Операция | Количество | Сложность на шаг | Итого |
| --- | --- | --- | --- |
| `Map.has` / `Map.get` / `Map.set` | n | `O(1)` | `O(n)` |
| `Set.add` для equipment | n × e | `O(1)` | `O(n)` |
| `results.push` | u ≤ n | `O(1)` | `O(u)` |
| Финальный `.map` | u | `O(e log e)` = `O(1)` | `O(u)` |
| **Итого** | | | **`O(n)`** |

### Пространственная сложность

| Структура | Размер |
| --- | --- |
| `sessionsForUser` Map | `O(u)` — u уникальных пользователей |
| `results` | `O(u)` — по одной записи на пользователя |
| Итоговый массив | `O(u)` |
| **Итого** | **`O(u)`** ≤ `O(n)` |

> `O(u)` лучше `O(n)` когда много повторяющихся пользователей (u << n).

---

## Типичные ошибки

| Ошибка | Что сломается |
| --- | --- |
| **Мутировать `session.equipment` напрямую** | Входные данные изменятся; повторный вызов даст неправильный результат |
| **Использовать массив вместо Set для equipment** | Дублирующиеся значения не удалятся; нужен ручной `filter` + `includes` = `O(n²)` |
| **Искать пользователя в `results.find()`** | `O(u)` на каждую сессию → `O(n*u)` вместо `O(n)` |
| **Сортировать equipment при каждом `add`** | Лишние сортировки; достаточно один раз в финальном `.map` |
| **Не клонировать сессию при первом вхождении** | Мутация объектов из входного массива |

---

## Подробный разбор типичных ошибок

### 1. Поиск через `results.find` вместо Map

```ts
// ❌ O(n * u) — квадратичная сложность
sessions.forEach(session => {
  const existing = results.find(r => r.user === session.user) // O(u) на каждую сессию
  if (existing) {
    existing.duration += session.duration
  } else {
    results.push({ ...session })
  }
})

// ✅ O(n) — Map даёт O(1) поиск
sessionsForUser.has(session.user) // O(1)
sessionsForUser.get(session.user) // O(1)
```

---

### 2. Не клонировать equipment

```ts
// ❌ Мутируем входной объект
const clonedSession = {
  ...session,
  equipment: session.equipment, // ← это ссылка на оригинальный массив
}
clonedSession.equipment.push('bike') // мутирует sessions[i].equipment!

// ✅ Новый Set — независимая копия
equipment: new Set(session.equipment)
```

---

### 3. Массив вместо Set для дедупликации

```ts
// ❌ O(n) на каждый add — дубликаты не убираются автоматически
const equipment: Array<string> = [...session.equipment]
newEquipment.forEach(eq => {
  if (!equipment.includes(eq)) equipment.push(eq) // includes = O(n)
})

// ✅ Set.add — O(1), дедупликация встроена
const equipment = new Set(session.equipment)
newEquipment.forEach(eq => equipment.add(eq)) // автоматически пропустит дубликат
```

---

## Сравнение трех решений: какое из них оптимальное?

| Метрика | `mergeData` (Использование Map) | `mergeDataOld` (Map + results) | `mergeDataMine` (Double Reverse) |
| :--- | :--- | :--- | :--- |
| **Временная сложность** | $O(N \cdot E + U \cdot E \log E)$ | $O(N \cdot E + U \cdot E \log E)$ | $O(N \cdot E + U \cdot E \log E)$ |
| **Дополнительная память** | $O(U \cdot E)$ (только уникальные юзеры) | $O(U \cdot E)$ (карта + массив результатов) | $O(N + U \cdot E)$ (из-за `slice().reverse()`) |
| **Лишние аллокации** | Минимальные | Средние (дублирует ссылки в массив) | **Максимальные** (создает копию всего входного массива) |
| **Порядок вывода** | По **первому** вхождению юзера | По **первому** вхождению юзера | По **последнему** вхождению юзера |

*где $N$ — количество сессий, $U$ — количество уникальных пользователей ($U \le N$), $E$ — среднее количество оборудования.*

### Подробный анализ решений

#### 1. `mergeData` (Оптимальное решение для порядка по первому вхождению 🏆)
* **Плюсы**:
  * Не тратит память на создание промежуточного массива результатов.
  * Использует стандартное поведение `Map` в JS/TS: итерация по `Map.prototype.values()` гарантированно возвращает элементы в порядке их первой вставки (появилось в ES2015+).
  * Не копирует и не разворачивает исходный массив сессий.

#### 2. `mergeDataOld`
* **Минусы**: Хуже первого варианта, так как хранит ссылки на одни и те же объекты одновременно и в `Map` (`sessionsForUser`), и в массиве `results`. Это избыточно, так как `Map` в JS уже сам по себе упорядочен.

#### 3. `mergeDataMine`
* **Минусы**: Самый тяжелый по памяти. `sessions.slice().reverse()` создает в куче (heap) копию всего входного массива. Если входных сессий будет 100 000, этот шаг выделит много лишней памяти и нагрузит сборщик мусора (Garbage Collector).
* **Когда оно нужно**: Только если бизнес-логика строго требует сортировать результат по **последнему** вхождению пользователя (порядок `8, 1, 7, 2` вместо `8, 7, 1, 2`).

### Оптимизация `mergeDataMine` (порядок по последнему вхождению)
Если вам нужно сохранить логику `mergeDataMine` (порядок по последнему вхождению), вы можете заменить `slice().reverse()` на обычный цикл с конца массива. Это сэкономит $O(N)$ памяти:

```typescript
function mergeDataMineOptimal(sessions: Array<Session>): Array<Session> {
  const sessionsForUser = new Map<number, SessionWithSet>();
  const sessionsProcessed: Array<SessionWithSet> = [];

  // Итерируемся с конца без копирования массива
  for (let i = sessions.length - 1; i >= 0; i--) {
    const session = sessions[i];
    if (sessionsForUser.has(session.user)) {
      const userSession = sessionsForUser.get(session.user)!;
      userSession.duration += session.duration;
      session.equipment.forEach((eq) => userSession.equipment.add(eq));
    } else {
      const clonedSession: SessionWithSet = {
        ...session,
        equipment: new Set(session.equipment),
      };
      sessionsForUser.set(session.user, clonedSession);
      sessionsProcessed.push(clonedSession);
    }
  }

  // Разворачиваем только уникальных пользователей (их намного меньше, чем N)
  return sessionsProcessed.reverse().map((session) => ({
    ...session,
    equipment: Array.from(session.equipment).sort(),
  }));
}
```

---

## По первому вхождению юзера или по последнему вхождению юзера — в чем разница?

Разница заключается в том, **какое место (индекс) в результирующем массиве займет объединенная сессия пользователя**, если у него было несколько сессий в исходных данных.

### Наглядный пример на данных:

```typescript
const SESSIONS = [
  { user: 8, ... }, // Индекс 0
  { user: 7, ... }, // Индекс 1 (Первое появление 7)
  { user: 1, ... }, // Индекс 2 (Первое и последнее появление 1)
  { user: 7, ... }, // Индекс 3
  { user: 7, ... }, // Индекс 4 (Последнее появление 7)
  { user: 2, ... }, // Индекс 5 (Первое появление 2)
  { user: 2, ... }, // Индекс 6 (Последнее появление 2)
]
```

### 1. По первому вхождению (First Occurrence)
Объединенный результат пользователя встает на то место, где этот пользователь **впервые встретился** в списке.

* Сначала появился `8` (индекс 0)
* Затем появился `7` (индекс 1)
* Затем появился `1` (индекс 2)
* Затем появился `2` (индекс 5)

**Итоговый порядок пользователей:** `[8, 7, 1, 2]`

### 2. По последнему вхождению (Last Occurrence)
Объединенный результат пользователя встает на то место, где этот пользователь **встретился в последний раз** в списке.

Давайте найдем последние индексы для каждого:
* Последнее появление `8` — на индексе **0**
* Последнее появление `1` — на индексе **2**
* Последнее появление `7` — на индексе **4**
* Последнее появление `2` — на индексе **6**

Сортируем пользователей по возрастанию этих последних индексов ($0 < 2 < 4 < 6$):
1. Сначала идет `8` (последний индекс 0)
2. Затем идет `1` (последний индекс 2)
3. Затем идет `7` (последний индекс 4)
4. В конце идет `2` (последний индекс 6)

**Итоговый порядок пользователей:** `[8, 1, 7, 2]`

### В чем разница для логики?
* Пользователь `7` переместился со 2-го места на 3-е, потому что его более поздние сессии «перетянули» объединенный результат ближе к концу списка.
* Обычно в требованиях задач указывается, какой именно порядок ожидается. Если жесткого требования нет, то вариант **по первому вхождению** (`[8, 7, 1, 2]`) является более интуитивным для большинства разработчиков и реализуется эффективнее (без необходимости переворачивать массивы).


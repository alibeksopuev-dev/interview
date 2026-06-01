# Разбор алгоритма mergeData и Big O

---

## Что такое mergeData?

**mergeData** — функция агрегации тренировочных сессий: объединяет все сессии одного пользователя в одну строку, сохраняя позицию **первого** вхождения.

**Аналогия из жизни:** `GROUP BY user` в SQL — но с сохранением порядка строк и без движка базы данных.

**Отличие от `selectData({ merge: true })`:**

| | mergeData | selectData({ merge: true }) |
| --- | --- | --- |
| Позиция мёрдженной строки | **Первое** вхождение пользователя | **Последнее** вхождение пользователя |
| Алгоритм | Прямой обход, один проход | Double reverse trick |
| Фильтрация | Нет | Есть (user, minDuration, equipment) |

---

## Ключевые концепции

| Концепция | Роль в mergeData |
| --- | --- |
| **`Map<userId, mergedRow>`** | Хранит ссылку на объект в `results` — `O(1)` доступ при повторном вхождении |
| **Shared reference** | Map и `results` ссылаются на **один и тот же** объект → обновление Map = обновление `results` |
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
             Map[user] = клон
             results.push(клон)   ← место = первое вхождение

return results.map(session => ({
  ...session,
  equipment: Array.from(session.equipment).sort()
}))
```

---

## Почему Shared Reference работает

```ts
const clonedSession = {
  ...session,
  equipment: new Set(session.equipment),
}

sessionsForUser.set(session.user, clonedSession) // ← Map хранит ссылку
results.push(clonedSession)                       // ← results хранит ту же ссылку
```

```
           память
           ┌──────────────────────────────┐
           │  { user: 7, duration: 150,   │
           │    equipment: Set{...} }     │
           └──────────────┬───────────────┘
                          │
          ┌───────────────┴──────────────┐
          ↓                              ↓
  Map[7] = (ссылка)          results[1] = (та же ссылка)
```

Когда позже встречаем `user=7` снова:
```ts
const userSession = sessionsForUser.get(session.user)! // та же ссылка
userSession.duration += session.duration               // обновляем объект
// results[1].duration автоматически обновился — это один объект!
```

Никакого поиска по `results` не нужно — `Map` играет роль индекса.

---

## Разбор кода с комментариями

```ts
export default function mergeData(sessions: Array<Session>): Array<Session> {
  // Внутреннее представление: equipment как Set (O(1) add, авто-дедупликация)
  const results: Array<{
    user: number
    duration: number
    equipment: Set<string>
  }> = []

  // userId → ссылка на тот же объект, что лежит в results[i]
  const sessionsForUser = new Map<
    number,
    { user: number; duration: number; equipment: Set<string> }
  >()

  sessions.forEach(session => {
    if (sessionsForUser.has(session.user)) {
      // O(1): получаем мёрдженный объект по userId
      const userSession = sessionsForUser.get(session.user)!
      userSession.duration += session.duration              // суммируем duration
      session.equipment.forEach(eq => userSession.equipment.add(eq)) // union equipment
      // ↑ Set.add игнорирует дублирующиеся значения автоматически
    } else {
      const clonedSession = {
        ...session,
        equipment: new Set(session.equipment), // ← не мутируем входной массив
      }
      sessionsForUser.set(session.user, clonedSession) // регистрируем в индексе
      results.push(clonedSession)                       // фиксируем позицию (первое вхождение)
    }
  })

  // Конвертируем Set → отсортированный Array (публичный контракт функции)
  return results.map(session => ({
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
| **Позиция строки** | Первое вхождение | Последнее вхождение |
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
| `results` | `O(u)` — по одной строке на пользователя |
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

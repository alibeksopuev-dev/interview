# Data Table — Конспект задачи

**Источник:** greatfrontend.com | Сложность: Medium | ~20 мин

## Задача

Дан список пользователей. Нужно построить таблицу с пагинацией.

---

## Требования

### Таблица
- Колонки: **Id, Name, Age, Occupation**
- Каждая строка — один пользователь

### Пагинация
- Кнопки **Prev** / **Next** для навигации
- Отображать **текущую страницу** и **общее кол-во страниц**
- Таблица обновляется динамически при смене страницы
- Выбор кол-ва записей на странице: **5, 10, 20**

---

## Состояние (State)

Нужно только **два** состояния:
- `currentPage` — текущая страница (начинается с 1)
- `pageSize` — кол-во строк на странице

`totalPages` — **вычисляемое** значение, не нужно в state:
```ts
const totalPages = Math.ceil(users.length / pageSize)
```

---

## Ключевая функция: `paginateUsers`

```ts
function paginateUsers(users, page, pageSize) {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  return users.slice(startIndex, endIndex)
}
```

- `startIndex` = `(page - 1) * pageSize`
- `endIndex` = `startIndex + pageSize` (slice не выйдет за границы)

---

## UX-улучшения

1. При смене `pageSize` — сбросить `currentPage` на 1 (иначе страница может выйти за пределы)
2. Кнопка **Prev** отключена когда `currentPage === 1`
3. Кнопка **Next** отключена когда `currentPage === totalPages`

---

## Шаги реализации

- [ ] Шаг 1 — добавить `useState` для `currentPage` и `pageSize`
- [ ] Шаг 2 — реализовать `paginateUsers`, вычислить `totalPages`
- [ ] Шаг 3 — рендерить только `pageUsers` (результат paginateUsers)
- [ ] Шаг 4 — добавить кнопки Prev / Next с обработчиками
- [ ] Шаг 5 — добавить `<select>` для pageSize, сбрасывать страницу на 1
- [ ] Шаг 6 — дизейблить кнопки на граничных страницах

---

## Тест-кейсы

| Что тестируем | Ожидание |
|---|---|
| Отображаются колонки Id, Name, Age, Occupation | Да |
| Каждая строка — один пользователь | Да |
| Клик Next — таблица обновляется | Да |
| Клик Prev — таблица обновляется | Да |
| Отображается "Page X of Y" | Да |
| Prev задизейблен на странице 1 | Да |
| Next задизейблен на последней странице | Да |
| Смена pageSize обновляет таблицу и сбрасывает страницу | Да |

---

## Файловая структура

```
data-table/
├── src/
│   ├── data/
│   │   └── users.ts        # данные
│   ├── DataTable.tsx       # основной компонент (реализуешь здесь)
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

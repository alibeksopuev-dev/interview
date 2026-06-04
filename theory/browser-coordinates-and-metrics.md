# Координаты и метрики элементов в браузере

> **Тема:** Полная карта систем координат, геометрических метрик элементов и практических паттернов их применения в браузере.

---

## Оглавление

1. [Системы координат в браузере](#1-системы-координат-в-браузере)
2. [Метрики мыши и событий](#2-метрики-мыши-и-событий)
3. [Метрики элементов DOM](#3-метрики-элементов-dom)
4. [getBoundingClientRect — главный инструмент геометрии](#4-getboundingclientrect--главный-инструмент-геометрии)
5. [Метрики окна и документа](#5-метрики-окна-и-документа)
6. [IntersectionObserver и ResizeObserver](#6-intersectionobserver-и-resizeobserver)
7. [Сравнительная таблица всех метрик](#7-сравнительная-таблица-всех-метрик)
8. [Практические задачи](#8-практические-задачи)
9. [Типичные ловушки](#9-типичные-ловушки)

---

## 1. Системы координат в браузере

В браузере существуют **три независимые системы координат**. Путаница между ними — источник большинства багов с позиционированием.

```
┌──────────────────────────────────────────────┐
│  DOCUMENT (0,0) — левый верхний угол документа│
│  ↕  scrollY                                   │
├──────────────────────────────────────────────┤  ← верхний край viewport
│                                              │
│  VIEWPORT (0,0) — левый верхний угол экрана  │
│                                              │
│    ┌──────────────────┐                      │
│    │  ELEMENT (0,0)   │                      │
│    │  (локальные коорд│                      │
│    │   внутри элемента│                      │
│    └──────────────────┘                      │
│                                              │
└──────────────────────────────────────────────┘  ← нижний край viewport
│  (скрытая часть документа)                   │
```

### 1.1 Координаты документа (Document Coordinates)

**Начало отсчёта:** левый верхний угол всего HTML-документа.  
**Не зависят от прокрутки** — точка (0,0) всегда в начале документа, даже если вы прокрутили страницу.

```js
// Как получить координаты элемента в системе документа:
const rect = element.getBoundingClientRect();
const docX = rect.left + window.scrollX;
const docY = rect.top + window.scrollY;
```

### 1.2 Координаты viewport (Viewport / Client Coordinates)

**Начало отсчёта:** левый верхний угол видимой области браузера (то, что вы видите прямо сейчас).  
**Зависят от прокрутки** — при скролле вниз элементы уходят выше и их `clientY` уменьшается.

```js
// Мышиные события дают координаты viewport по умолчанию:
element.addEventListener('mousemove', (e) => {
    const x = e.clientX; // от левого края видимой области
    const y = e.clientY; // от верхнего края видимой области
});
```

### 1.3 Локальные координаты элемента (Element-Local Coordinates)

**Начало отсчёта:** левый верхний угол самого элемента.  
Используются, когда нужно знать положение курсора **внутри** конкретного элемента.

```js
element.addEventListener('mousemove', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Вычитаем отступ элемента от края экрана:
    const localX = e.clientX - rect.left; // позиция внутри элемента по X
    const localY = e.clientY - rect.top;  // позиция внутри элемента по Y
});
```

### 1.4 Координаты экрана (Screen Coordinates)

**Начало отсчёта:** левый верхний угол физического монитора.  
Используются редко — только при работе с несколькими мониторами или нативными окнами.

```js
element.addEventListener('click', (e) => {
    console.log(e.screenX, e.screenY); // от угла монитора
});
```

---

## 2. Метрики мыши и событий

### 2.1 Полная таблица координат мышиного события

| Свойство | Система координат | Описание | Учитывает скролл |
|----------|-------------------|----------|------------------|
| `e.clientX / clientY` | Viewport | От края видимой области | ❌ |
| `e.pageX / pageY` | Document | От начала документа | ✅ |
| `e.screenX / screenY` | Screen | От угла физического монитора | N/A |
| `e.offsetX / offsetY` | Element | От края элемента-источника события | ❌ |
| `e.movementX / movementY` | Relative | Разница с предыдущей позицией | N/A |

### 2.2 Детальный разбор каждого свойства

#### `e.clientX / e.clientY` — самые используемые

```js
document.addEventListener('mousemove', (e) => {
    // При курсоре в левом верхнем углу экрана: clientX = 0, clientY = 0
    // При прокрутке страницы clientX/Y НЕ меняются —
    // они всегда относительно видимого экрана
    console.log(`Cursor at viewport: (${e.clientX}, ${e.clientY})`);
});
```

**Применение:** `getBoundingClientRect()` + `clientX/Y` — стандартный паттерн для локальных координат.

#### `e.pageX / e.pageY` — включают прокрутку

```js
// pageX = clientX + window.scrollX
// pageY = clientY + window.scrollY
document.addEventListener('click', (e) => {
    // Ставим маркер на точку в документе (не уедет при скролле)
    marker.style.left = e.pageX + 'px';
    marker.style.top  = e.pageY + 'px';
});
```

**Применение:** Абсолютное позиционирование элементов в документе (не в viewport).

#### `e.offsetX / e.offsetY` — ловушка!

```js
// offsetX — от padding-box элемента, на котором произошло событие
// ВНИМАНИЕ: если у элемента есть дочерние узлы, событие может
// сработать на дочернем, и offsetX будет относительно него, а не родителя!

element.addEventListener('mousemove', (e) => {
    // Если мышь над дочерним <span>, offsetX будет от <span>, а не от element!
    console.log(e.offsetX, e.offsetY); // ненадёжно при наличии детей
});

// Безопасная альтернатива — через getBoundingClientRect:
element.addEventListener('mousemove', (e) => {
    const rect = element.getBoundingClientRect();
    const safeX = e.clientX - rect.left;
    const safeY = e.clientY - rect.top;
});
```

#### `e.movementX / e.movementY` — дельта движения

```js
// Разница между текущей и предыдущей позицией курсора
// Идеально для drag-and-drop и управления камерой (Pointer Lock API)
document.addEventListener('mousemove', (e) => {
    console.log(`Moved by: (${e.movementX}, ${e.movementY})`);
});
```

---

## 3. Метрики элементов DOM

Каждый элемент несёт несколько геометрических свойств. Их легко перепутать.

```
┌─────────────────────────────────────────────────────┐
│                   margin                            │
│   ┌─────────────────────────────────────────────┐   │
│   │               border                        │   │
│   │   ┌─────────────────────────────────────┐   │   │
│   │   │            padding                  │   │   │
│   │   │   ┌─────────────────────────────┐   │   │   │
│   │   │   │        content              │   │   │   │
│   │   │   │                             │   │   │   │
│   │   │   └─────────────────────────────┘   │   │   │
│   │   │                                     │   │   │
│   │   └─────────────────────────────────────┘   │   │
│   │          ↑ clientWidth/clientHeight          │   │
│   └─────────────────────────────────────────────┘   │
│         ↑ offsetWidth/offsetHeight                  │
└─────────────────────────────────────────────────────┘
         ↑ scrollWidth/scrollHeight (если есть overflow)
```

### 3.1 `offsetWidth` / `offsetHeight`

**Что включает:** content + padding + border (без margin и скроллбара).  
**Тип:** `number` (целые пиксели, округлено браузером).

```js
const el = document.getElementById('box');
console.log(el.offsetWidth);  // например, 320
console.log(el.offsetHeight); // например, 200

// CSS: width: 300px; padding: 10px; border: 1px solid black;
// offsetWidth = 300 + 10*2 + 1*2 = 322
// (если box-sizing: content-box)
```

### 3.2 `clientWidth` / `clientHeight`

**Что включает:** content + padding (без border, без скроллбара).  
**Применение:** Реальная видимая область элемента для вёрстки.

```js
const el = document.getElementById('scrollable');
// clientWidth НЕ включает ширину скроллбара (≈17px)
// Это именно то пространство, в котором можно рисовать контент
console.log(el.clientWidth);  // ширина без скроллбара
console.log(el.clientHeight); // высота без скроллбара
```

**Важный случай — `document.documentElement.clientWidth`:**
```js
// Ширина viewport БЕЗ учёта скроллбара — самый надёжный способ!
const viewportWidth  = document.documentElement.clientWidth;
const viewportHeight = document.documentElement.clientHeight;
// В отличие от window.innerWidth, не включает ширину скроллбара
```

### 3.3 `scrollWidth` / `scrollHeight`

**Что включает:** всё содержимое, включая скрытое за пределами overflow.  
**Применение:** Определить реальный размер прокручиваемого содержимого.

```js
const el = document.getElementById('container');
// Если контент шире/выше видимой области:
console.log(el.scrollWidth);  // полная ширина содержимого
console.log(el.scrollHeight); // полная высота содержимого

// Проверка: есть ли горизонтальный скроллбар?
const hasHScroll = el.scrollWidth > el.clientWidth;
```

### 3.4 `scrollLeft` / `scrollTop`

**Что это:** текущая позиция прокрутки элемента (сколько пикселей прокручено).  
**Доступны на чтение и запись!**

```js
const container = document.getElementById('scrollable');

// Читаем текущую позицию:
console.log(container.scrollTop);  // пикселей прокручено вертикально
console.log(container.scrollLeft); // пикселей прокручено горизонтально

// Прокручиваем программно:
container.scrollTop = 200;  // прокрутить к 200px от верха
container.scrollLeft = 0;

// Плавная прокрутка:
container.scrollTo({ top: 200, behavior: 'smooth' });
```

### 3.5 `offsetTop` / `offsetLeft`

**Что это:** расстояние от элемента до его `offsetParent` (ближайший позиционированный предок).  
**Ловушка:** Не относительно документа или viewport! Относительно `offsetParent`.

```js
const el = document.getElementById('nested');
// offsetParent — ближайший предок с position: relative/absolute/fixed/sticky
console.log(el.offsetTop);  // пикселей от offsetParent
console.log(el.offsetLeft); // пикселей от offsetParent

// Чтобы получить позицию относительно документа, нужно итерировать:
function getOffsetFromDocument(el) {
    let top = 0, left = 0;
    while (el) {
        top  += el.offsetTop;
        left += el.offsetLeft;
        el    = el.offsetParent;
    }
    return { top, left };
}
// Лучше: используйте getBoundingClientRect() + scrollY/scrollX
```

---

## 4. `getBoundingClientRect` — главный инструмент геометрии

```js
const rect = element.getBoundingClientRect();
```

Возвращает объект `DOMRect` с **координатами в системе viewport** (с учётом трансформаций CSS!):

```
                left        right
                  │           │
      top ────────┼───────────┼────
                  │           │
                  │  element  │
                  │           │
   bottom ────────┼───────────┼────
                  │           │
                 width = right - left
                 height = bottom - top
                 x = left (псевдоним)
                 y = top  (псевдоним)
```

| Свойство | Описание |
|----------|----------|
| `rect.left` | Расстояние от левого края viewport до левого края элемента |
| `rect.top` | Расстояние от верхнего края viewport до верхнего края элемента |
| `rect.right` | Расстояние от левого края viewport до правого края элемента |
| `rect.bottom` | Расстояние от верхнего края viewport до нижнего края элемента |
| `rect.width` | Ширина элемента (с border, с трансформациями) |
| `rect.height` | Высота элемента (с border, с трансформациями) |
| `rect.x` | Псевдоним для `rect.left` |
| `rect.y` | Псевдоним для `rect.top` |

### 4.1 Особенности, которые нужно знать

**Учитывает CSS-трансформации** (`scale`, `rotate`, `translate`):
```js
// Если элемент масштабирован через transform: scale(2),
// getBoundingClientRect вернёт РЕАЛЬНЫЙ размер на экране, а не CSS-размер
element.style.transform = 'scale(2)';
const rect = element.getBoundingClientRect();
// rect.width = cssWidth * 2 — реальный размер!
```

**Значения могут быть дробными** (на Retina-дисплеях):
```js
const rect = element.getBoundingClientRect();
console.log(rect.top); // например: 100.5 (не всегда целое!)
```

**Производительность:** Вызов `getBoundingClientRect()` вызывает **Forced Layout Reflow** — браузер обязан пересчитать все стили и макет. Не вызывайте в цикле без необходимости.

```js
// ❌ Плохо: каждый вызов вызывает reflow
items.forEach(item => {
    const rect = item.getBoundingClientRect();
    console.log(rect.top);
});

// ✅ Хорошо: сохраняем один раз или используем IntersectionObserver
const rects = items.map(item => item.getBoundingClientRect());
rects.forEach(rect => console.log(rect.top));
```

---

## 5. Метрики окна и документа

### 5.1 Размеры окна браузера

| Свойство | Включает скроллбар | Описание |
|----------|--------------------|----------|
| `window.innerWidth` | ✅ | Ширина viewport включая скроллбар |
| `window.innerHeight` | ✅ | Высота viewport включая скроллбар |
| `document.documentElement.clientWidth` | ❌ | Ширина viewport без скроллбара |
| `document.documentElement.clientHeight` | ❌ | Высота viewport без скроллбара |
| `window.outerWidth` | N/A | Ширина всего окна браузера (с панелями) |
| `window.outerHeight` | N/A | Высота всего окна браузера (с панелями) |
| `screen.width` | N/A | Ширина физического монитора |
| `screen.height` | N/A | Высота физического монитора |

```js
// Правильный способ получить размер viewport для вёрстки:
const width  = document.documentElement.clientWidth;  // без скроллбара
const height = document.documentElement.clientHeight;

// Для медиа-запросов в JS (как CSS) — с учётом скроллбара:
const innerWidth  = window.innerWidth;
const innerHeight = window.innerHeight;
```

### 5.2 Прокрутка окна

```js
// Текущая позиция прокрутки страницы:
const scrolledX = window.scrollX; // (псевдоним: window.pageXOffset)
const scrolledY = window.scrollY; // (псевдоним: window.pageYOffset)

// Программная прокрутка:
window.scrollTo({ top: 0, behavior: 'smooth' });   // к верху
window.scrollBy({ top: 100, behavior: 'smooth' });  // относительно текущей позиции
window.scrollTo(0, 500);                             // к 500px от верха (старый синтаксис)
```

### 5.3 Полная высота документа

```js
// Полная высота документа (включая скрытое за скроллом):
const docHeight = document.documentElement.scrollHeight;

// Или более надёжный вариант (на случай противоречий браузеров):
const fullDocHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
);
```

---

## 6. IntersectionObserver и ResizeObserver

### 6.1 IntersectionObserver — видим ли элемент?

Вместо постоянного опроса `getBoundingClientRect()` в scroll-событии.

```js
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            // entry.isIntersecting — виден ли элемент
            // entry.intersectionRatio — доля видимой части (0.0 — 1.0)
            // entry.boundingClientRect — геометрия элемента
            // entry.intersectionRect — видимая часть элемента
            // entry.rootBounds — геометрия viewport (или root)
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    },
    {
        root: null,       // null = viewport
        rootMargin: '0px', // отступ от root (как CSS margin)
        threshold: [0, 0.5, 1.0] // срабатывает при 0%, 50%, 100% видимости
    }
);

observer.observe(document.getElementById('target'));
observer.disconnect(); // остановить наблюдение
```

**Когда использовать:**
- Lazy loading изображений
- Анимации при появлении в viewport
- Infinite scroll (наблюдаем за sentinel-элементом внизу)
- Аналитика — реальное время просмотра блока

### 6.2 ResizeObserver — изменился ли размер?

Вместо `window.resize` — наблюдаем за конкретными элементами.

```js
const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach(entry => {
        // entry.contentRect — прямоугольник контента (без border, padding)
        const { width, height } = entry.contentRect;

        // entry.borderBoxSize — с border и padding (массив в новом API)
        const borderWidth  = entry.borderBoxSize[0].inlineSize;
        const borderHeight = entry.borderBoxSize[0].blockSize;

        console.log(`Element resized: ${width}x${height}`);
    });
});

resizeObserver.observe(document.getElementById('resizable'));
resizeObserver.unobserve(element); // остановить для конкретного элемента
resizeObserver.disconnect();       // остановить все
```

---

## 7. Сравнительная таблица всех метрик

### Метрики элемента

| Метрика | Включает padding | Включает border | Включает scrollbar | Включает overflow | Дробные |
|---------|:---:|:---:|:---:|:---:|:---:|
| `clientWidth/Height` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `offsetWidth/Height` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `scrollWidth/Height` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `getBoundingClientRect().width` | ✅ | ✅ | ❌ | ❌ | ✅ |

### Координаты мышиного события

| Метрика | Относительно | Учитывает прокрутку | Учитывает трансформации |
|---------|:---:|:---:|:---:|
| `e.clientX/Y` | Viewport | ❌ | N/A |
| `e.pageX/Y` | Document | ✅ | N/A |
| `e.screenX/Y` | Монитор | N/A | N/A |
| `e.offsetX/Y` | Элемент-источник | ❌ | ✅ |
| `e.movementX/Y` | Предыдущая позиция | N/A | N/A |

---

## 8. Практические задачи

### Задача 1: Индикатор прогресса прокрутки страницы

**Условие:** Показать полосу прогресса, отражающую, насколько пользователь прокрутил страницу.

```js
function createScrollProgress() {
    const progressBar = document.getElementById('progress');

    function updateProgress() {
        const scrollTop  = window.scrollY;
        const docHeight  = document.documentElement.scrollHeight;
        const winHeight  = window.innerHeight;

        // Максимально возможный скролл = полная высота минус высота экрана
        const maxScroll  = docHeight - winHeight;

        // Процент прокрутки от 0 до 100
        const percent    = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

        progressBar.style.width = `${Math.min(percent, 100)}%`;
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress(); // инициализация
}
```

**Почему `docHeight - winHeight`?**  
Пользователь не может прокрутить так, чтобы нижний край документа ушёл выше нижнего края экрана. Последняя возможная позиция `scrollY` равна `scrollHeight - innerHeight`.

---

### Задача 2: Тултип, следующий за курсором мыши

**Условие:** Показывать тултип рядом с курсором, но не выходить за пределы экрана.

```js
function createTooltip(containerEl, tooltipEl) {
    const OFFSET = 12; // отступ тултипа от курсора

    containerEl.addEventListener('mousemove', (e) => {
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;

        let x = e.clientX + OFFSET;
        let y = e.clientY + OFFSET;

        // Не выходим за правый край:
        if (x + tooltipRect.width > viewW) {
            x = e.clientX - tooltipRect.width - OFFSET;
        }

        // Не выходим за нижний край:
        if (y + tooltipRect.height > viewH) {
            y = e.clientY - tooltipRect.height - OFFSET;
        }

        // Позиционируем через fixed (в системе viewport):
        tooltipEl.style.left = `${x}px`;
        tooltipEl.style.top  = `${y}px`;
    });
}
```

---

### Задача 3: Кастомный drag-and-drop без библиотек

**Условие:** Реализовать перетаскивание элемента мышью.

#### Вариант A — наивный (mouse events, "дельта-подход")

```js
function makeDraggable(el) {
    let isDragging = false;
    let startX, startY, initLeft, initTop;

    el.addEventListener('mousedown', (e) => {
        isDragging = true;

        // Запоминаем стартовую позицию курсора (viewport)
        startX = e.clientX;
        startY = e.clientY;

        // Запоминаем начальное положение элемента
        initLeft = el.offsetLeft;
        initTop  = el.offsetTop;

        e.preventDefault(); // блокируем выделение текста
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Дельта — насколько сдвинулась мышь
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Применяем дельту к начальной позиции элемента
        el.style.left = `${initLeft + dx}px`;
        el.style.top  = `${initTop  + dy}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}
```

**Минусы наивного подхода:**

- Слушатели на `document` живут даже после конца drag → надо аккуратно add/remove.
- Не работает на touch-устройствах (нужен отдельный `touchstart/move/end`).
- Если курсор уйдёт за пределы окна / в iframe — `mouseup` может не прийти, и элемент "залипнет".
- `offsetLeft` НЕ учитывает CSS `transform` родителя.

#### Вариант B — Pointer Events + Pointer Capture (production-ready)

`Pointer Events` — единый API для мыши, тача и стилуса. `setPointerCapture` гарантирует, что все события до `pointerup` прилетят на исходный элемент, даже если курсор покинул его область.

```js
function makeDraggablePointer(el, stage) {
    let dragOffset = { dx: 0, dy: 0 };
    let activeId = null;

    el.addEventListener('pointerdown', (e) => {
        const rect = el.getBoundingClientRect();
        // Смещение точки клика относительно левого верхнего угла элемента.
        // Без этого блок "телепортируется" углом к курсору.
        dragOffset = {
            dx: e.clientX - rect.left,
            dy: e.clientY - rect.top,
        };
        activeId = e.pointerId;
        el.setPointerCapture(e.pointerId); // ловим все последующие события
    });

    el.addEventListener('pointermove', (e) => {
        if (e.pointerId !== activeId) return;

        // Переводим координаты курсора (viewport) в систему stage.
        const stageRect = stage.getBoundingClientRect();
        let x = e.clientX - stageRect.left - dragOffset.dx;
        let y = e.clientY - stageRect.top  - dragOffset.dy;

        // Clamp в границы stage.
        x = Math.max(0, Math.min(stageRect.width  - el.offsetWidth,  x));
        y = Math.max(0, Math.min(stageRect.height - el.offsetHeight, y));

        el.style.left = `${x}px`;
        el.style.top  = `${y}px`;
    });

    el.addEventListener('pointerup', (e) => {
        if (e.pointerId === activeId) {
            el.releasePointerCapture(e.pointerId);
            activeId = null;
        }
    });
}
```

**Почему именно так:**

| Деталь | Зачем нужна |
|---|---|
| `pointerdown/move/up` | Универсально: мышь, palec, stylus. Один обработчик вместо трёх пар. |
| `setPointerCapture` | События доходят даже если курсор ушёл за границы / окно / iframe. Решает баг "drag залипает". |
| `getBoundingClientRect` для смещения | Учитывает scroll, `transform`, `position: fixed` родителей. `offsetLeft` — не учитывает. |
| `touch-action: none` в CSS | Отключает встроенный gesture браузера (скролл/zoom), иначе на тач-устройстве будут конфликты. |
| Clamp в `pointermove` | Не даёт элементу улететь за пределы stage. |
| Сохранение `pointerId` | Защищает от мульти-тача: только "наш" палец двигает элемент. |

**Важно про CSS `touch-action`:**

```css
.drag-item { touch-action: none; }
/* Без этого pointermove на тач-устройстве конкурирует со скроллом страницы
   и срабатывает невпопад (или вообще не срабатывает). */
```

#### Drag with HTML5 Drag API (`draggable="true"`) — когда использовать

```html
<div draggable="true">Drag me</div>
```

```js
el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', 'payload');
    e.dataTransfer.effectAllowed = 'move';
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); // ОБЯЗАТЕЛЬНО, иначе drop не сработает
});

dropZone.addEventListener('drop', (e) => {
    const data = e.dataTransfer.getData('text/plain');
});
```

- ✅ Когда нужно **перетаскивать между окнами / приложениями** (например, файлы из ОС).
- ✅ Когда нужны нативные **drag images** браузера.
- ❌ Когда нужен полный контроль над визуалом (анимации, springs, snap) — берите Pointer Events.
- ❌ HTML5 Drag API очень капризный: `dragover.preventDefault()` обязателен, нет `dragmove`, плохо работает на мобильных.

**Правило выбора:** на интервью почти всегда ждут **Pointer Events + capture**. HTML5 Drag API упоминают только в контексте drop из ОС.

---

### Задача 4: Определить, виден ли элемент в viewport (без IntersectionObserver)

**Условие:** Проверить, находится ли элемент в зоне видимости пользователя.

```js
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();

    return (
        rect.top    >= 0 &&
        rect.left   >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right  <= (window.innerWidth  || document.documentElement.clientWidth)
    );
}

// Проверка частичной видимости (хотя бы часть элемента видна):
function isPartiallyVisible(el) {
    const rect = el.getBoundingClientRect();
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    const viewW = window.innerWidth  || document.documentElement.clientWidth;

    return (
        rect.bottom > 0 &&    // нижний край ниже верха viewport
        rect.right  > 0 &&    // правый край правее левого края viewport
        rect.top    < viewH && // верхний край выше низа viewport
        rect.left   < viewW   // левый край левее правого края viewport
    );
}
```

---

### Задача 5: Sticky-элемент с кастомной логикой (липкий заголовок)

**Условие:** Добавить элементу класс `stuck` при его "прилипании" к верху страницы.

```js
// Используем IntersectionObserver с rootMargin трюком:
function observeStickyHeader(headerEl) {
    // Создаём sentinel-элемент выше заголовка
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    headerEl.parentNode.insertBefore(sentinel, headerEl);

    const observer = new IntersectionObserver(
        ([entry]) => {
            // Когда sentinel выходит за верхний край viewport —
            // заголовок "прилип"
            headerEl.classList.toggle('stuck', !entry.isIntersecting);
        },
        { threshold: [1] } // срабатывает при полном выходе
    );

    observer.observe(sentinel);
}
```

---

### Задача 6: Параллакс-эффект на основе позиции мыши

**Условие:** Элемент должен двигаться в зависимости от положения курсора в контейнере, создавая эффект глубины.

```js
function initParallax(containerEl, layerEls) {
    containerEl.addEventListener('mousemove', (e) => {
        const rect = containerEl.getBoundingClientRect();

        // Нормализуем координаты от -1 до +1:
        // 0 — центр контейнера, -1 — левый/верхний край, +1 — правый/нижний
        const normalX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        const normalY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;

        layerEls.forEach((layer, index) => {
            // Каждый слой двигается на разную величину (глубина)
            const depth  = (index + 1) * 0.5; // множитель глубины
            const moveX  = normalX * depth * 20; // максимум 20px
            const moveY  = normalY * depth * 20;

            layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });
}
```

---

### Задача 7: Виртуальный список (Virtual Scroll) — найти видимые элементы

**Условие:** Для 10 000 элементов списка определить, какие из них видны в viewport, чтобы рендерить только их.

```js
class VirtualList {
    constructor(containerEl, itemHeight, totalCount, renderItem) {
        this.container  = containerEl;
        this.itemHeight = itemHeight;
        this.total      = totalCount;
        this.render     = renderItem;

        this.container.addEventListener('scroll', () => this.update());
        this.update();
    }

    update() {
        const scrollTop     = this.container.scrollTop;
        const clientHeight  = this.container.clientHeight;

        // Индекс первого видимого элемента:
        const startIndex = Math.floor(scrollTop / this.itemHeight);

        // Индекс последнего видимого (с буфером +3):
        const endIndex = Math.min(
            Math.ceil((scrollTop + clientHeight) / this.itemHeight) + 3,
            this.total - 1
        );

        // Общая высота списка для корректной полосы прокрутки:
        this.container.style.height = `${this.total * this.itemHeight}px`;

        // Рендерим только видимые элементы:
        this.render(startIndex, endIndex, startIndex * this.itemHeight);
    }
}
```

---

### Задача 8: Выровнять dropdown-меню так, чтобы не выходил за экран

**Условие:** Дропдаун должен открываться снизу кнопки, но если места нет — открываться сверху.

```js
function positionDropdown(buttonEl, dropdownEl) {
    const btnRect   = buttonEl.getBoundingClientRect();
    const dropRect  = dropdownEl.getBoundingClientRect();
    const viewH     = window.innerHeight;
    const viewW     = window.innerWidth;

    const spaceBelow = viewH - btnRect.bottom;
    const spaceAbove = btnRect.top;

    // Открываем снизу, если места достаточно, иначе — сверху
    if (spaceBelow >= dropRect.height || spaceBelow >= spaceAbove) {
        dropdownEl.style.top  = `${btnRect.bottom + window.scrollY}px`;
    } else {
        dropdownEl.style.top  = `${btnRect.top - dropRect.height + window.scrollY}px`;
    }

    // Горизонтальное выравнивание — не выходим за правый край:
    let left = btnRect.left + window.scrollX;
    if (left + dropRect.width > viewW) {
        left = btnRect.right - dropRect.width + window.scrollX;
    }
    dropdownEl.style.left = `${left}px`;
}
```

---

### Задача 9: Умный tooltip с auto-flip (top → bottom → left → right)

**Условие:** Tooltip по умолчанию открывается **над** триггером. Если сверху не хватает места — вниз. Если и снизу не помещается — вбок. По горизонтали — clamp к viewport.

```js
function placeTooltip(triggerEl, tooltipEl) {
    const rect = triggerEl.getBoundingClientRect();
    const ttRect = tooltipEl.getBoundingClientRect();
    const GAP = 8;
    const VW = window.innerWidth;
    const VH = window.innerHeight;

    let placement = 'top';
    let x = rect.left + rect.width / 2 - ttRect.width / 2;
    let y = rect.top - ttRect.height - GAP;

    // 1. Не помещаемся сверху — вниз
    if (y < 0) {
        placement = 'bottom';
        y = rect.bottom + GAP;
    }

    // 2. И вниз не помещаемся — вбок
    if (placement === 'bottom' && y + ttRect.height > VH) {
        const hasRight = rect.right + ttRect.width + GAP < VW;
        placement = hasRight ? 'right' : 'left';
        y = rect.top + rect.height / 2 - ttRect.height / 2;
        x = hasRight ? rect.right + GAP : rect.left - ttRect.width - GAP;
    }

    // 3. Финальный clamp по обеим осям
    x = Math.max(GAP, Math.min(VW - ttRect.width  - GAP, x));
    y = Math.max(GAP, Math.min(VH - ttRect.height - GAP, y));

    // 4. Применяем (position: fixed → координаты viewport)
    tooltipEl.style.position = 'fixed';
    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top  = `${y}px`;
    tooltipEl.dataset.placement = placement; // для стрелочки в CSS
}
```

**Ключевые моменты:**

- **`position: fixed`** — координаты задаются в системе viewport, точно как у `getBoundingClientRect().top/left`. Не нужно прибавлять `scrollY/X`.
- **Порядок проверок (top → bottom → side)** — стандартная стратегия flip. Floating UI / Popper делают то же самое, просто с конфигом приоритетов.
- **Размер tooltip известен заранее?** Если нет — отрендери его невидимо (`visibility: hidden`), измерь `getBoundingClientRect`, потом покажи. Двухпроходный рендер.
- **Стрелочка** — позиционируется по `placement` через `data-placement` атрибут и CSS селекторы.

**На интервью спросят:** "А что если родитель имеет `transform`?" → `position: fixed` будет позиционироваться относительно этого родителя, а не viewport (это особенность спецификации). Решение — портал в `body` через `createPortal` (React) или `appendChild(document.body, tooltipEl)`.

---

## 9. Типичные ловушки

### Ловушка 1: `offsetX/offsetY` с дочерними элементами

```js
// ❌ Проблема: если el содержит <span>, событие может сработать на <span>
// и offsetX будет относительно <span>, а не el
el.addEventListener('mousemove', (e) => {
    console.log(e.offsetX); // ненадёжно!
});

// ✅ Решение: всегда использовать getBoundingClientRect
el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
});
```

### Ловушка 2: `getBoundingClientRect` вызывает Forced Reflow

```js
// ❌ Вызываем в цикле — каждый вызов принудительный reflow!
for (const item of items) {
    const rect = item.getBoundingClientRect();
    item.style.height = rect.width + 'px'; // чтение + запись = death
}

// ✅ Сначала все чтения, потом все записи (батчинг):
const rects = items.map(item => item.getBoundingClientRect()); // все чтения
items.forEach((item, i) => {
    item.style.height = rects[i].width + 'px'; // все записи
});
```

### Ловушка 3: `window.scrollY` vs `document.documentElement.scrollTop`

```js
// Оба дают позицию прокрутки страницы, но есть нюанс:
// window.scrollY — только чтение (read-only)
// document.documentElement.scrollTop — можно записывать (устаревший паттерн)

// ✅ Для чтения: window.scrollY (или window.pageYOffset для совместимости)
const scroll = window.scrollY;

// ✅ Для записи (скролл страницы):
window.scrollTo(0, 500); // предпочтительный способ
```

### Ловушка 4: `clientWidth` для `document.body` vs `documentElement`

```js
// document.body.clientWidth может не совпадать с шириной viewport!
// Это ширина body-элемента, который может быть уже/шире viewport.

// ✅ Надёжный способ для ширины viewport:
const vw = document.documentElement.clientWidth; // viewport без скроллбара
```

### Ловушка 5: Забыть про CSS `transform` при расчёте позиции

```js
// Если элемент имеет transform: translate(100px, 0)
// getBoundingClientRect() вернёт ТРАНСФОРМИРОВАННЫЕ координаты ✅
// offsetLeft/offsetTop вернут НЕтрансформированные (исходные) ❌

// Всегда используйте getBoundingClientRect() для реальных визуальных координат
```

### Ловушка 6: `passive: true` для scroll и touch событий

```js
// Без passive браузер ждёт выполнения обработчика перед прокруткой (задержка!)
window.addEventListener('scroll', handler); // ❌ возможна задержка

// ✅ Указываем, что не будем вызывать preventDefault() — браузер не ждёт:
window.addEventListener('scroll', handler, { passive: true });
window.addEventListener('touchmove', handler, { passive: true });
```

### Ловушка 7: Drag не работает на touch-устройстве (забыли `touch-action`)

```css
/* Без этого CSS pointermove на тач-устройстве конкурирует со скроллом */
.draggable { touch-action: none; }
```

```js
// + pointer events вместо mouse events
el.addEventListener('pointerdown', start);
// (touchstart на iOS требует passive: false для preventDefault)
```

Симптом: на десктопе работает, на телефоне курсор "скачет" или ничего не происходит. Причина: браузер интерпретирует жест как scroll/zoom и отменяет `pointermove`.

### Ловушка 8: `position: fixed` неожиданно позиционируется относительно `transform`-родителя

```css
.parent { transform: translate(0, 0); }  /* создаёт containing block */
.child  { position: fixed; top: 0; left: 0; }  /* НЕ относительно viewport! */
```

Любой `transform`, `filter`, `perspective`, `will-change: transform` на родителе превращает его в **containing block** для `position: fixed` потомков. Это одна из самых неочевидных проблем при позиционировании popover'ов и tooltip'ов.

**Решение:** портал tooltip'а в `document.body` (React: `createPortal`).

### Ловушка 9: Курсор "телепортируется" в угол при drag-старте

```js
// ❌ Без учёта смещения клика — элемент прыгает левым верхом к курсору
el.style.left = e.clientX + 'px';

// ✅ Запомнили offset на pointerdown, вычитаем в pointermove
const rect = el.getBoundingClientRect();
const dx = e.clientX - rect.left;
const dy = e.clientY - rect.top;
// ...later:
el.style.left = (e.clientX - dx) + 'px';
el.style.top  = (e.clientY - dy) + 'px';
```

Самый частый баг в собственном drag&drop. На интервью спросят: "Что не так с этим кодом?" — ответ: не учтена точка клика внутри элемента.

---

## Итоговая шпаргалка

```
Что нужно узнать?                    Что использовать?
─────────────────────────────────────────────────────────────────────
Позиция курсора относит. экрана    → e.clientX, e.clientY
Позиция курсора относит. документа → e.pageX, e.pageY
Позиция курсора внутри элемента    → e.clientX - rect.left (getBCR)
Насколько прокручена страница       → window.scrollY, window.scrollX
Размер viewport (без скроллбара)   → document.documentElement.clientWidth/H
Размер viewport (со скроллбаром)   → window.innerWidth, window.innerHeight
Полная высота документа            → document.documentElement.scrollHeight
Размер элемента с border           → el.offsetWidth, el.offsetHeight
Размер элемента без border         → el.clientWidth, el.clientHeight
Полный размер контента в элементе  → el.scrollWidth, el.scrollHeight
Позиция прокрутки элемента         → el.scrollTop, el.scrollLeft
Геометрия элемента на экране       → el.getBoundingClientRect()
Виден ли элемент в viewport        → IntersectionObserver (или getBCR)
Изменился ли размер элемента       → ResizeObserver
```

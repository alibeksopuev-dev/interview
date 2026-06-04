import { useState, useEffect, useRef } from 'react'

// ─── types ─────────────────────────────────────────────────────────────────

interface WebApiItem {
  name: string
  detail?: string
}

interface Step {
  line: number
  action: string
  stack: string[]
  microtasks: string[]
  macrotasks: string[]
  webApis: WebApiItem[]
  console: string[]
  phase: 'stack' | 'microtasks' | 'rendering' | 'macrotasks' | 'idle'
  phaseText: string
}

interface CaseStudy {
  id: string
  title: string
  badge: string
  code: string[]
  steps: Step[]
}

// ─── data structures ───────────────────────────────────────────────────────

const CASES: CaseStudy[] = [
  {
    id: 'classic',
    title: 'Классика: setTimeout vs Promise',
    badge: 'Собеседование',
    code: [
      "console.log('Start');",
      '',
      'setTimeout(() => {',
      "  console.log('Timeout');",
      '}, 0);',
      '',
      'Promise.resolve()',
      '  .then(() => {',
      "    console.log('Promise');",
      '  });',
      '',
      "console.log('End');",
    ],
    steps: [
      {
        line: 1,
        action: 'Инициализация программы. Глобальный контекст выполнения помещается в Call Stack.',
        stack: ['global'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 1,
        action:
          "Выполняется синхронный вызов console.log('Start'). Строка сразу выводится в консоль.",
        stack: ['global', "console.log('Start')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 3,
        action: 'Вызывается setTimeout с задержкой 0мс. Задача регистрируется в Web API браузера.',
        stack: ['global', 'setTimeout(...)'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (0ms)', detail: 'active' }],
        console: ['Start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 7,
        action:
          'Таймер 0мс мгновенно завершается в Web API. Браузер переносит колбэк таймера в конец очереди макрозадач (Macrotask Queue).',
        stack: ['global'],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['Start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 7,
        action:
          'Создается успешно выполненный (resolved) Promise. Метод .then() регистрирует обработчик.',
        stack: ['global', 'Promise.resolve().then(...)'],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['Start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 8,
        action:
          'Колбэк промиса помещается в очередь микрозадач (Microtask Queue) с наивысшим приоритетом выполнения.',
        stack: ['global'],
        microtasks: ['cb: Promise'],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['Start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 12,
        action: "Выполняется синхронный вызов console.log('End'). Строка выводится в консоль.",
        stack: ['global', "console.log('End')"],
        microtasks: ['cb: Promise'],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['Start', 'End'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 12,
        action:
          'Синхронный код завершен. Глобальный контекст удаляется из Call Stack. Стек вызовов пуст.',
        stack: [],
        microtasks: ['cb: Promise'],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['Start', 'End'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 8,
        action:
          'Event Loop видит непустую очередь микрозадач и извлекает первую микрозадачу (колбэк Promise) в Call Stack.',
        stack: ['cb: Promise'],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['Start', 'End'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 9,
        action: "Выполняется console.log('Promise') внутри микрозадачи.",
        stack: ['cb: Promise', "console.log('Promise')"],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['Start', 'End', 'Promise'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 10,
        action:
          'Колбэк Promise завершен и удаляется из Call Stack. Очередь микрозадач теперь пуста.',
        stack: [],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['Start', 'End', 'Promise'],
        phase: 'rendering',
        phaseText: 'Рендеринг (пропуск)',
      },
      {
        line: 3,
        action:
          'Event Loop переходит к очереди макрозадач. Извлекается ровно ОДНА макрозадача (колбэк setTimeout) в Call Stack.',
        stack: ['cb: setTimeout'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End', 'Promise'],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 4,
        action: "Выполняется console.log('Timeout') внутри макрозадачи.",
        stack: ['cb: setTimeout', "console.log('Timeout')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End', 'Promise', 'Timeout'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 5,
        action:
          'Колбэк таймера удаляется из Call Stack. Очереди пусты. Event Loop переходит в режим ожидания (Idle).',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End', 'Promise', 'Timeout'],
        phase: 'idle',
        phaseText: 'Ожидание событий',
      },
    ],
  },
  {
    id: 'interviewTest',
    title: 'Тест на интервью (Приоритеты)',
    badge: 'Собеседование',
    code: [
      "console.log('1: Sync start');",
      '',
      'setTimeout(() => {',
      "  console.log('2: setTimeout (macrotask)');",
      '}, 0);',
      '',
      'Promise.resolve().then(() => {',
      "  console.log('3: Promise 1 (microtask)');",
      '}).then(() => {',
      "  console.log('4: Promise 2 (microtask)');",
      '});',
      '',
      'queueMicrotask(() => {',
      "  console.log('5: queueMicrotask (microtask)');",
      '});',
      '',
      'requestAnimationFrame(() => {',
      "  console.log('6: rAF (animation)');",
      '});',
      '',
      "console.log('7: Sync end');",
    ],
    steps: [
      {
        line: 1,
        action: 'Инициализация программы. Запуск глобального контекста.',
        stack: ['global'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 1,
        action: "Выполняется синхронный console.log('1: Sync start').",
        stack: ['global', "console.log('1: Sync start')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['1: Sync start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 3,
        action: 'setTimeout регистрирует таймер 0мс в Web API.',
        stack: ['global', 'setTimeout(...)'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (0ms)', detail: 'active' }],
        console: ['1: Sync start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 7,
        action:
          'Таймер завершается, перенося колбэк таймера в очередь макрозадач. Вызывается Promise.resolve().then(...).',
        stack: ['global'],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['1: Sync start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 7,
        action: 'Promise разрешается, планируя первый обработчик Promise 1 в очередь микрозадач.',
        stack: ['global', 'Promise.resolve().then(...)'],
        microtasks: ['cb: Promise 1'],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['1: Sync start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 13,
        action: 'queueMicrotask вызывает добавление колбэка напрямую в очередь микрозадач.',
        stack: ['global', 'queueMicrotask(...)'],
        microtasks: ['cb: Promise 1', 'cb: queueMicrotask'],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['1: Sync start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 17,
        action:
          'requestAnimationFrame регистрирует анимационный колбэк в Web API перед обновлением экрана.',
        stack: ['global', 'requestAnimationFrame(...)'],
        microtasks: ['cb: Promise 1', 'cb: queueMicrotask'],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['1: Sync start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 21,
        action: "Выполняется синхронный console.log('7: Sync end').",
        stack: ['global', "console.log('7: Sync end')"],
        microtasks: ['cb: Promise 1', 'cb: queueMicrotask'],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['1: Sync start', '7: Sync end'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 21,
        action:
          'Синхронный код завершен. Global контекст удален. Стек вызовов пуст. Event Loop проверяет микрозадачи.',
        stack: [],
        microtasks: ['cb: Promise 1', 'cb: queueMicrotask'],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['1: Sync start', '7: Sync end'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 7,
        action: 'Первая микрозадача (cb: Promise 1) извлекается в Call Stack.',
        stack: ['cb: Promise 1'],
        microtasks: ['cb: queueMicrotask'],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['1: Sync start', '7: Sync end'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 8,
        action: "Выполняется console.log('3: Promise 1 (microtask)').",
        stack: ['cb: Promise 1', "console.log('3: Promise 1...')"],
        microtasks: ['cb: queueMicrotask'],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['1: Sync start', '7: Sync end', '3: Promise 1 (microtask)'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 9,
        action:
          'Колбэк Promise 1 завершается, возвращая новый промис. Это автоматически регистрирует чейнинг .then() (Promise 2) в конец очереди микрозадач!',
        stack: [],
        microtasks: ['cb: queueMicrotask', 'cb: Promise 2'],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['1: Sync start', '7: Sync end', '3: Promise 1 (microtask)'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 13,
        action: 'Следующая микрозадача (cb: queueMicrotask) извлекается в Call Stack.',
        stack: ['cb: queueMicrotask'],
        microtasks: ['cb: Promise 2'],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['1: Sync start', '7: Sync end', '3: Promise 1 (microtask)'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 14,
        action: "Выполняется console.log('5: queueMicrotask (microtask)').",
        stack: ['cb: queueMicrotask', "console.log('5: queueMicrotask...')"],
        microtasks: ['cb: Promise 2'],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
        ],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 15,
        action:
          'Колбэк queueMicrotask завершен. Движок продолжает очищать микрозадачи в том же тике до полного опустошения.',
        stack: [],
        microtasks: ['cb: Promise 2'],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
        ],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 9,
        action: 'Извлекается микрозадача Promise 2 (созданная чейнингом .then).',
        stack: ['cb: Promise 2'],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
        ],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 10,
        action: "Выполняется console.log('4: Promise 2 (microtask)').",
        stack: ['cb: Promise 2', "console.log('4: Promise 2...')"],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
          '4: Promise 2 (microtask)',
        ],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 11,
        action:
          'Микрозадачи полностью очищены. Подходит время отрисовки кадра. Event Loop переходит к Rendering Pipeline.',
        stack: [],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
          '4: Promise 2 (microtask)',
        ],
        phase: 'rendering',
        phaseText: 'Конвейер рендеринга',
      },
      {
        line: 17,
        action: 'Извлекается и выполняется колбэк requestAnimationFrame.',
        stack: ['cb: rAF'],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
          '4: Promise 2 (microtask)',
        ],
        phase: 'rendering',
        phaseText: 'Конвейер рендеринга',
      },
      {
        line: 18,
        action: "Выполняется console.log('6: rAF (animation)').",
        stack: ['cb: rAF', "console.log('6: rAF...')"],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
          '4: Promise 2 (microtask)',
          '6: rAF (animation)',
        ],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 19,
        action:
          'Фаза рендеринга завершена. Теперь Event Loop переходит к очереди макрозадач и извлекает setTimeout.',
        stack: [],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
          '4: Promise 2 (microtask)',
          '6: rAF (animation)',
        ],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 3,
        action: 'Колбэк setTimeout извлекается в Call Stack.',
        stack: ['cb: setTimeout'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
          '4: Promise 2 (microtask)',
          '6: rAF (animation)',
        ],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 4,
        action: "Выполняется console.log('2: setTimeout (macrotask)').",
        stack: ['cb: setTimeout', "console.log('2: setTimeout...')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
          '4: Promise 2 (microtask)',
          '6: rAF (animation)',
          '2: setTimeout (macrotask)',
        ],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 5,
        action: 'Все очереди и задачи выполнены. Event Loop переходит в состояние Idle.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [
          '1: Sync start',
          '7: Sync end',
          '3: Promise 1 (microtask)',
          '5: queueMicrotask (microtask)',
          '4: Promise 2 (microtask)',
          '6: rAF (animation)',
          '2: setTimeout (macrotask)',
        ],
        phase: 'idle',
        phaseText: 'Завершено',
      },
    ],
  },
  {
    id: 'network',
    title: 'Сеть: fetch + Promises',
    badge: 'Асинхронность',
    code: [
      "console.log('Start');",
      '',
      "fetch('https://api.com/data')",
      '  .then(res => res.json())',
      '  .then(data => {',
      "    console.log('Data received');",
      '  });',
      '',
      "console.log('End');",
    ],
    steps: [
      {
        line: 1,
        action: 'Инициализация программы. Запуск глобального контекста выполнения.',
        stack: ['global'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 1,
        action: "Выполняется синхронный console.log('Start').",
        stack: ['global', "console.log('Start')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 3,
        action:
          'Вызывается fetch(). Запрос передается в сетевой поток браузера (Web API) для параллельного выполнения.',
        stack: ['global', 'fetch(...)'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'HTTP Request', detail: 'fetching...' }],
        console: ['Start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 9,
        action:
          "Выполняется синхронный console.log('End'). Запрос fetch все еще выполняется параллельно в фоне.",
        stack: ['global', "console.log('End')"],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'HTTP Request', detail: 'fetching...' }],
        console: ['Start', 'End'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 9,
        action:
          'Синхронный код завершен. Global контекст удален. Стек вызовов пуст. Event Loop ожидает сетевого ответа.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'HTTP Request', detail: 'fetching...' }],
        console: ['Start', 'End'],
        phase: 'idle',
        phaseText: 'Ожидание событий',
      },
      {
        line: 3,
        action:
          'Ответ от сервера пришел! Сетевой поток браузера генерирует Network Response событие и помещает его в очередь макрозадач.',
        stack: [],
        microtasks: [],
        macrotasks: ['Network Response'],
        webApis: [],
        console: ['Start', 'End'],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 3,
        action:
          'Event Loop запускает макрозадачу Network Response. Внутренний Promise переводится в состояние fulfilled (разрешен).',
        stack: ['Resolve Network Promise'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End'],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 4,
        action:
          'Разрешение промиса автоматически планирует выполнение первого обработчика `.then(res => res.json())` в очередь микрозадач.',
        stack: [],
        microtasks: ['cb: res => res.json()'],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 4,
        action:
          'Стек свободен. Микрозадача извлекается и запускает `.json()`, который асинхронно парсит тело ответа (также возвращая промис).',
        stack: ['cb: res => res.json()'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 5,
        action:
          'Когда парсинг JSON завершен, промис парсера разрешается и планирует следующий обработчик `.then(data => ...)` в очередь микрозадач.',
        stack: [],
        microtasks: ['cb: data => console.log(...)'],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 5,
        action: 'Event Loop запускает финальную микрозадачу обработки данных.',
        stack: ['cb: data => console.log(...)'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 6,
        action: "Выполняется console.log('Data received') внутри колбэка.",
        stack: ['cb: data => console.log(...)', "console.log('Data received')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End', 'Data received'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 7,
        action: 'Колбэк удаляется из Call Stack. Все очереди пусты. Программа полностью завершена.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Start', 'End', 'Data received'],
        phase: 'idle',
        phaseText: 'Ожидание событий',
      },
    ],
  },
  {
    id: 'raf',
    title: 'Визуализация: rAF vs setTimeout',
    badge: 'Отрисовка кадра',
    code: [
      'setTimeout(() => {',
      "  console.log('Timeout');",
      '}, 0);',
      '',
      'requestAnimationFrame(() => {',
      "  console.log('rAF');",
      '});',
      '',
      "console.log('Sync');",
    ],
    steps: [
      {
        line: 1,
        action: 'Инициализация программы. Запуск глобального контекста.',
        stack: ['global'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 1,
        action: 'setTimeout регистрирует таймер 0мс в Web API.',
        stack: ['global', 'setTimeout(...)'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (0ms)', detail: 'active' }],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 5,
        action:
          'Таймер завершается, и его колбэк помещается в очередь макрозадач. Вызывается requestAnimationFrame.',
        stack: ['global'],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 5,
        action:
          'requestAnimationFrame регистрирует колбэк в Web API для выполнения строго перед следующим рендером кадра.',
        stack: ['global', 'requestAnimationFrame(...)'],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 9,
        action: "Выполняется синхронный console.log('Sync').",
        stack: ['global', "console.log('Sync')"],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['Sync'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 9,
        action: 'Синхронный код завершен. Global контекст удален. Стек вызовов пуст.',
        stack: [],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['Sync'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач (пуста)',
      },
      {
        line: 1,
        action:
          'Очередь микрозадач пуста. Из очереди макрозадач извлекается и запускается setTimeout.',
        stack: ['cb: setTimeout'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['Sync'],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 2,
        action: "Выполняется console.log('Timeout') внутри макрозадачи.",
        stack: ['cb: setTimeout', "console.log('Timeout')"],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['Sync', 'Timeout'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 3,
        action:
          'Колбэк таймера завершен. Стек пуст. Подходит время обновления экрана (кадр ~16.6мс при 60Гц).',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'rAF Callback', detail: 'queued' }],
        console: ['Sync', 'Timeout'],
        phase: 'rendering',
        phaseText: 'Конвейер рендеринга',
      },
      {
        line: 5,
        action:
          'Event Loop входит в фазу Rendering. Извлекается зарегистрированный колбэк requestAnimationFrame.',
        stack: ['cb: rAF'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'Timeout'],
        phase: 'rendering',
        phaseText: 'Конвейер рендеринга',
      },
      {
        line: 6,
        action:
          "Выполняется console.log('rAF') непосредственно перед обновлением пикселей на экране.",
        stack: ['cb: rAF', "console.log('rAF')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'Timeout', 'rAF'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 7,
        action:
          'Колбэк rAF завершен. Браузер производит перерасчет стилей (Style Layout) и перерисовку (Paint) кадра.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'Timeout', 'rAF'],
        phase: 'idle',
        phaseText: 'Ожидание событий',
      },
    ],
  },
  {
    id: 'priorities',
    title: 'Приоритеты: Scheduler.postTask()',
    badge: 'HTML5 Standard',
    code: [
      "scheduler.postTask(() => console.log('Bg'), { priority: 'background' });",
      "scheduler.postTask(() => console.log('Blk'), { priority: 'user-blocking' });",
      "scheduler.postTask(() => console.log('Vis'), { priority: 'user-visible' });",
      '',
      "console.log('Sync');",
    ],
    steps: [
      {
        line: 1,
        action: 'Инициализация программы. Запуск глобального контекста.',
        stack: ['global'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 1,
        action:
          'scheduler.postTask регистрирует задачу низкого приоритета (background) в фоновом пуле.',
        stack: ['global', 'postTask(Bg, background)'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'postTask: background', detail: 'low' }],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 2,
        action:
          'scheduler.postTask регистрирует задачу высокого приоритета (user-blocking) в планировщике браузера.',
        stack: ['global', 'postTask(Blk, user-blocking)'],
        microtasks: [],
        macrotasks: [],
        webApis: [
          { name: 'postTask: background', detail: 'low' },
          { name: 'postTask: user-blocking', detail: 'high' },
        ],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 3,
        action: 'scheduler.postTask регистрирует задачу обычного приоритета (user-visible).',
        stack: ['global', 'postTask(Vis, user-visible)'],
        microtasks: [],
        macrotasks: [],
        webApis: [
          { name: 'postTask: background', detail: 'low' },
          { name: 'postTask: user-blocking', detail: 'high' },
          { name: 'postTask: user-visible', detail: 'med' },
        ],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 3,
        action: 'Браузерный планировщик распределяет задачи по приоритетам в очередь макрозадач.',
        stack: ['global'],
        microtasks: [],
        macrotasks: ['cb: user-blocking', 'cb: user-visible', 'cb: background'],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 5,
        action: "Выполняется синхронный console.log('Sync').",
        stack: ['global', "console.log('Sync')"],
        microtasks: [],
        macrotasks: ['cb: user-blocking', 'cb: user-visible', 'cb: background'],
        webApis: [],
        console: ['Sync'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 5,
        action:
          'Синхронный код завершен. Стек пуст. Браузер оценивает приоритеты задач в очереди макрозадач.',
        stack: [],
        microtasks: [],
        macrotasks: ['cb: user-blocking', 'cb: user-visible', 'cb: background'],
        webApis: [],
        console: ['Sync'],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 2,
        action:
          "Сначала извлекается макрозадача высокого приоритета ('user-blocking'), так как она критична для рендера и UI.",
        stack: ['cb: user-blocking'],
        microtasks: [],
        macrotasks: ['cb: user-visible', 'cb: background'],
        webApis: [],
        console: ['Sync'],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 2,
        action: "Выполняется вывод console.log('Blk').",
        stack: ['cb: user-blocking', "console.log('Blk')"],
        microtasks: [],
        macrotasks: ['cb: user-visible', 'cb: background'],
        webApis: [],
        console: ['Sync', 'Blk'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 3,
        action:
          "Задача завершена. Стек свободен. Планировщик извлекает макрозадачу среднего приоритета ('user-visible').",
        stack: ['cb: user-visible'],
        microtasks: [],
        macrotasks: ['cb: background'],
        webApis: [],
        console: ['Sync', 'Blk'],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 3,
        action: "Выполняется вывод console.log('Vis').",
        stack: ['cb: user-visible', "console.log('Vis')"],
        microtasks: [],
        macrotasks: ['cb: background'],
        webApis: [],
        console: ['Sync', 'Blk', 'Vis'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 1,
        action:
          "Задача завершена. Наконец, извлекается наименее приоритетная задача ('background').",
        stack: ['cb: background'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'Blk', 'Vis'],
        phase: 'macrotasks',
        phaseText: 'Очередь макрозадач',
      },
      {
        line: 1,
        action: "Выполняется вывод console.log('Bg') в периоды простоя (idle) процессора.",
        stack: ['cb: background', "console.log('Bg')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'Blk', 'Vis', 'Bg'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 1,
        action: 'Все задачи выполнены. Планировщик очистил все приоритетные макрозадачи.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'Blk', 'Vis', 'Bg'],
        phase: 'idle',
        phaseText: 'Ожидание событий',
      },
    ],
  },
  {
    id: 'nodejs',
    title: 'Node.js: nextTick + setImmediate',
    badge: 'Node.js / Libuv',
    code: [
      "setTimeout(() => console.log('setTimeout'), 0);",
      "setImmediate(() => console.log('setImmediate'));",
      "process.nextTick(() => console.log('nextTick'));",
      "Promise.resolve().then(() => console.log('Promise'));",
      '',
      "console.log('Sync');",
    ],
    steps: [
      {
        line: 1,
        action: 'Запуск скрипта в рантайме Node.js. Среда Libuv управляет фазами жизненного цикла.',
        stack: ['global'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 1,
        action:
          'setTimeout регистрирует таймер 0мс. Движок сразу считает его завершенным в фоновом режиме.',
        stack: ['global', 'setTimeout(...)'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Libuv Timer 0ms', detail: 'expired' }],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 2,
        action:
          'setImmediate регистрирует колбэк для фазы Check (проверки таймеров немедленного действия).',
        stack: ['global', 'setImmediate(...)'],
        microtasks: [],
        macrotasks: ['cb: setTimeout'],
        webApis: [{ name: 'setImmediate Check', detail: 'waiting' }],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 3,
        action: 'process.nextTick регистрирует колбэк в приоритетной очереди nextTickQueue.',
        stack: ['global', 'process.nextTick(...)'],
        microtasks: [],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [{ name: 'nextTick Queue', detail: '1 item' }],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 4,
        action:
          'Promise.resolve().then(...) регистрирует микрозадачу в стандартной microtaskQueue.',
        stack: ['global', 'Promise.resolve().then(...)'],
        microtasks: ['cb: Promise'],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [{ name: 'nextTick Queue', detail: '1 item' }],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 6,
        action: "Выполняется синхронный console.log('Sync').",
        stack: ['global', "console.log('Sync')"],
        microtasks: ['cb: Promise'],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [{ name: 'nextTick Queue', detail: '1 item' }],
        console: ['Sync'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 6,
        action:
          'Синхронный код завершен. Call Stack пуст. В Node.js приоритет nextTickQueue выше стандартной очереди микрозадач!',
        stack: [],
        microtasks: ['cb: Promise'],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [{ name: 'nextTick Queue', detail: '1 item' }],
        console: ['Sync'],
        phase: 'microtasks',
        phaseText: 'nextTick Queue',
      },
      {
        line: 3,
        action:
          'nextTickQueue очищается немедленно. Извлекается и выполняется колбэк process.nextTick.',
        stack: ['cb: process.nextTick'],
        microtasks: ['cb: Promise'],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [],
        console: ['Sync'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 3,
        action: "Выполняется console.log('nextTick').",
        stack: ['cb: process.nextTick', "console.log('nextTick')"],
        microtasks: ['cb: Promise'],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [],
        console: ['Sync', 'nextTick'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 4,
        action:
          'nextTickQueue очищена. Движок переходит к стандартной очереди микрозадач (Promise).',
        stack: [],
        microtasks: ['cb: Promise'],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [],
        console: ['Sync', 'nextTick'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 4,
        action: 'Извлекается и выполняется микрозадача Promise.',
        stack: ['cb: Promise'],
        microtasks: [],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [],
        console: ['Sync', 'nextTick'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
      },
      {
        line: 4,
        action: "Выполняется console.log('Promise').",
        stack: ['cb: Promise', "console.log('Promise')"],
        microtasks: [],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [],
        console: ['Sync', 'nextTick', 'Promise'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 4,
        action: 'Микрозадачи очищены. Event Loop переходит к первой фазе макрозадач — фазе Timers.',
        stack: [],
        microtasks: [],
        macrotasks: ['cb: setTimeout', 'cb: setImmediate'],
        webApis: [],
        console: ['Sync', 'nextTick', 'Promise'],
        phase: 'macrotasks',
        phaseText: 'Фаза Timers (setTimeout)',
      },
      {
        line: 1,
        action: 'В фазе Timers извлекается завершенный таймер setTimeout.',
        stack: ['cb: setTimeout'],
        microtasks: [],
        macrotasks: ['cb: setImmediate'],
        webApis: [],
        console: ['Sync', 'nextTick', 'Promise'],
        phase: 'macrotasks',
        phaseText: 'Фаза Timers (setTimeout)',
      },
      {
        line: 1,
        action: "Выполняется вывод console.log('setTimeout').",
        stack: ['cb: setTimeout', "console.log('setTimeout')"],
        microtasks: [],
        macrotasks: ['cb: setImmediate'],
        webApis: [],
        console: ['Sync', 'nextTick', 'Promise', 'setTimeout'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 2,
        action:
          'Колбэк таймера удаляется. Event Loop Node.js проходит фазы Pending, Poll и заходит в фазу Check.',
        stack: [],
        microtasks: [],
        macrotasks: ['cb: setImmediate'],
        webApis: [],
        console: ['Sync', 'nextTick', 'Promise', 'setTimeout'],
        phase: 'macrotasks',
        phaseText: 'Фаза Check (setImmediate)',
      },
      {
        line: 2,
        action: 'В фазе Check извлекается и выполняется зарегистрированный колбэк setImmediate.',
        stack: ['cb: setImmediate'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'nextTick', 'Promise', 'setTimeout'],
        phase: 'macrotasks',
        phaseText: 'Фаза Check (setImmediate)',
      },
      {
        line: 2,
        action: "Выполняется console.log('setImmediate').",
        stack: ['cb: setImmediate', "console.log('setImmediate')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'nextTick', 'Promise', 'setTimeout', 'setImmediate'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
      },
      {
        line: 2,
        action: 'Все очереди Node.js пусты. Жизненный цикл процесса Libuv завершен.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'nextTick', 'Promise', 'setTimeout', 'setImmediate'],
        phase: 'idle',
        phaseText: 'Завершено',
      },
    ],
  },
]

// ─── Component ─────────────────────────────────────────────────────────────

export function EventLoopShowcase() {
  const [activeCaseId, setActiveCaseId] = useState<string>('classic')
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playSpeed, setPlaySpeed] = useState<number>(1500) // ms between steps

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeCase = CASES.find(c => c.id === activeCaseId) || CASES[0]
  const stepsCount = activeCase.steps.length
  const currentStep = activeCase.steps[stepIndex] || activeCase.steps[0]

  // Reset steps when case changes
  const handleCaseChange = (caseId: string) => {
    setActiveCaseId(caseId)
    setStepIndex(0)
    setIsPlaying(false)
  }

  const stepForward = () => {
    setStepIndex(prev => (prev < stepsCount - 1 ? prev + 1 : prev))
  }

  const stepBackward = () => {
    setStepIndex(prev => (prev > 0 ? prev - 1 : 0))
  }

  const resetSimulator = () => {
    setStepIndex(0)
    setIsPlaying(false)
  }

  // Handle Autoplay
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStepIndex(prev => {
          if (prev < stepsCount - 1) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, playSpeed)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, playSpeed, stepsCount])

  // Map phases to visual styles on the circle
  const getPhaseClass = () => {
    switch (currentStep.phase) {
      case 'stack':
        return 'phase-stack'
      case 'microtasks':
        return 'phase-microtasks'
      case 'rendering':
        return 'phase-rendering'
      case 'macrotasks':
        return 'phase-macrotasks'
      default:
        return ''
    }
  }

  return (
    <div style={{ padding: '32px 0', maxWidth: 1100 }}>
      {/* Title Header */}
      <div className='el-header'>
        <h1 className='el-title'>Визуальный симулятор Event Loop</h1>
        <p className='el-subtitle'>
          Пошаговое интерактивное обучение циклу событий в браузере и Node.js. Наблюдайте за
          движением задач между Стек-вызовами, очередями микро- и макрозадач в реальном времени.
        </p>
      </div>

      {/* Case Selector Tabs */}
      <div
        className='el-tabs-container'
        style={{ marginBottom: 20 }}
      >
        {CASES.map(c => (
          <button
            key={c.id}
            onClick={() => handleCaseChange(c.id)}
            className={`el-tab-btn ${activeCaseId === c.id ? 'active' : ''}`}
          >
            {c.title}
            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 4,
                background: activeCaseId === c.id ? '#eff6ff' : '#cbd5e1',
                color: activeCaseId === c.id ? '#4f46e5' : '#475569',
              }}
            >
              {c.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Simulator Interactive Grid */}
      <div className='el-sim-grid'>
        {/* LEFT COLUMN: Code view & Controls */}
        <div className='el-left-panel'>
          {/* Current Step Explanation Box */}
          <div className='el-explainer-panel'>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#1d4ed8',
                marginBottom: 4,
              }}
            >
              Шаг {stepIndex + 1} из {stepsCount}: {currentStep.phaseText}
            </div>
            <p className='el-explainer-text'>{currentStep.action}</p>
          </div>

          {/* Code Editor Window */}
          <div className='el-card'>
            <div className='el-card-header'>
              <span className='el-card-title'>Код примера</span>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>JavaScript</span>
            </div>
            <div className='el-code-editor'>
              {activeCase.code.map((lineText, idx) => {
                const isLineActive = currentStep.line === idx + 1
                return (
                  <div
                    key={idx}
                    className={`el-code-line ${isLineActive ? 'active' : ''}`}
                  >
                    <span className='el-code-line-num'>{idx + 1}</span>
                    <span>{lineText || ' '}</span>
                  </div>
                )
              })}
            </div>

            {/* Play/Step Controls */}
            <div className='el-controls'>
              <div className='el-controls-buttons'>
                <button
                  className='el-btn-secondary'
                  onClick={stepBackward}
                  disabled={stepIndex === 0}
                  title='Назад'
                >
                  ◀
                </button>
                <button
                  className='el-btn-primary'
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? '⏸ Пауза' : '▶ Запустить авто'}
                </button>
                <button
                  className='el-btn-secondary'
                  onClick={stepForward}
                  disabled={stepIndex === stepsCount - 1}
                  title='Вперед'
                >
                  ▶
                </button>
                <button
                  className='el-btn-secondary'
                  onClick={resetSimulator}
                  title='Сбросить'
                >
                  🔄
                </button>
              </div>

              {/* Speed Slider */}
              <div className='el-speed-control'>
                <span>Скорость: {Math.round(3000 - playSpeed)}мс</span>
                <input
                  type='range'
                  min='500'
                  max='2500'
                  step='250'
                  value={3000 - playSpeed}
                  onChange={e => setPlaySpeed(3000 - Number(e.target.value))}
                  className='el-slider'
                />
              </div>
            </div>
          </div>

          {/* Console logs output */}
          <div className='el-console'>
            <div className='el-console-header'>
              <span>Лог вывода (Console)</span>
              <button
                onClick={() => setStepIndex(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Clear
              </button>
            </div>
            <div className='el-console-list'>
              {currentStep.console.length === 0 ? (
                <div className='el-console-empty'>В консоли пока нет записей...</div>
              ) : (
                currentStep.console.map((log, idx) => (
                  <div
                    key={idx}
                    className='el-console-line'
                  >
                    &gt; {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Visual Event Loop Architecture */}
        <div className='el-right-panel'>
          {/* Main Loop Diagram */}
          <div className='el-card el-diagram-card'>
            <div
              className='el-card-title'
              style={{ alignSelf: 'flex-start', marginBottom: 12 }}
            >
              Цикл событий (Event Loop)
            </div>
            <div className='el-diagram-container'>
              <div className={`el-diagram-inner ${getPhaseClass()}`}>
                {/* Loop Center status */}
                <div className='el-loop-center'>
                  <span>Текущая фаза:</span>
                  <div className='el-loop-center-phase'>{currentStep.phaseText}</div>
                </div>

                {/* Node 1: Call Stack */}
                <div
                  className={`el-loop-node node-stack ${currentStep.phase === 'stack' ? 'active' : ''}`}
                >
                  CALL STACK
                  <span>Синхронно</span>
                </div>

                {/* Node 2: Microtasks */}
                <div
                  className={`el-loop-node node-micro ${currentStep.phase === 'microtasks' ? 'active' : ''}`}
                >
                  MICRO TASKS
                  <span>Promise / await</span>
                </div>

                {/* Node 3: Rendering */}
                <div
                  className={`el-loop-node node-render ${currentStep.phase === 'rendering' ? 'active' : ''}`}
                >
                  RENDERING
                  <span>rAF / Layout</span>
                </div>

                {/* Node 4: Macrotasks */}
                <div
                  className={`el-loop-node node-macro ${currentStep.phase === 'macrotasks' ? 'active' : ''}`}
                >
                  MACRO TASKS
                  <span>setTimeout / Event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Call Stack vs Web APIs */}
          <div className='el-pools-grid'>
            {/* Call Stack Panel */}
            <div className='el-stack-view'>
              <div className='el-stack-title'>
                <span>Стек вызовов (Call Stack)</span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                  LIFO (Последний вошел - первый вышел)
                </span>
              </div>
              <div className='el-stack-container'>
                {currentStep.stack.length === 0 ? (
                  <div className='el-queue-empty'>Стек пуст (движок спит)</div>
                ) : (
                  currentStep.stack.map((stackItem, idx) => (
                    <div
                      key={idx}
                      className='el-stack-item'
                    >
                      {stackItem}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Web API / Background Tasks */}
            <div className='el-api-view'>
              <div className='el-stack-title'>
                <span>Web APIs & Фоновые потоки</span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                  Параллельное окружение
                </span>
              </div>
              <div className='el-api-container'>
                {currentStep.webApis.length === 0 ? (
                  <div className='el-queue-empty'>Нет фоновых задач</div>
                ) : (
                  currentStep.webApis.map((api, idx) => (
                    <div
                      key={idx}
                      className='el-api-item'
                    >
                      <span>⚙️ {api.name}</span>
                      {api.detail && <span className='el-api-badge'>{api.detail}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Queues Layout (Micro & Macro Side-by-side or stacked) */}
          <div className='el-queues-container'>
            {/* Microtasks Queue */}
            <div className='el-queue-card'>
              <div className='el-queue-header'>
                <h4
                  className='el-queue-title'
                  style={{ color: '#0891b2' }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#06b6d4',
                    }}
                  ></span>
                  Очередь микрозадач (Microtask Queue)
                </h4>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                  FIFO • Приоритетная
                </span>
              </div>
              <div className='el-queue-list'>
                {currentStep.microtasks.length === 0 ? (
                  <div className='el-queue-empty'>Очередь микрозадач пуста</div>
                ) : (
                  currentStep.microtasks.map((task, idx) => (
                    <div
                      key={idx}
                      className='el-queue-item micro'
                    >
                      {task}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Macrotasks Queue */}
            <div className='el-queue-card'>
              <div className='el-queue-header'>
                <h4
                  className='el-queue-title'
                  style={{ color: '#d97706' }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#f59e0b',
                    }}
                  ></span>
                  Очередь макрозадач (Macrotask Queue / Tasks)
                </h4>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                  FIFO • Выполнение по одной
                </span>
              </div>
              <div className='el-queue-list'>
                {currentStep.macrotasks.length === 0 ? (
                  <div className='el-queue-empty'>Очередь макрозадач пуста</div>
                ) : (
                  currentStep.macrotasks.map((task, idx) => (
                    <div
                      key={idx}
                      className='el-queue-item macro'
                    >
                      {task}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Theory Section ─────────────────────────────────────────────────── */}
      <div className='el-theory-section'>
        <h2 className='el-theory-title'>Справочник: Как устроен Event Loop</h2>
        <div className='el-theory-grid'>
          {/* Card 1: Micro vs Macro */}
          <div className='el-theory-card'>
            <h4>Микрозадачи vs Макрозадачи</h4>
            <table className='el-theory-table'>
              <thead>
                <tr>
                  <th>Тип задачи</th>
                  <th>Источники</th>
                  <th>Приоритет</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: '#0891b2', fontWeight: 700 }}>Microtask</td>
                  <td>
                    <code>Promise.then/catch</code>
                    <br />
                    <code>await</code>
                    <br />
                    <code>queueMicrotask</code>
                    <br />
                    <code>MutationObserver</code>
                  </td>
                  <td>
                    <strong>Высочайший.</strong> Очередь очищается полностью после синхронного стека
                    и перед рендером/макрозадачами.
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#d97706', fontWeight: 700 }}>Macrotask</td>
                  <td>
                    <code>setTimeout/Interval</code>
                    <br />
                    Пользовательский ввод (клик, скролл)
                    <br />
                    Сетевые ответы (HTTP)
                    <br />
                    <code>postMessage</code>
                  </td>
                  <td>
                    <strong>Низкий.</strong> За один оборот (тик) Event Loop извлекает **только
                    одну** макрозадачу, после чего сразу очищает микрозадачи.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Card 2: Rendering Pipeline */}
          <div className='el-theory-card'>
            <h4>Конвейер рендеринга (Rendering Pipeline)</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>Частота обновлений:</strong> Рендеринг запускается параллельно с частотой
                экрана (~16.6мс при 60Гц).
              </li>
              <li>
                <strong>Порядок работы:</strong> Перед отрисовкой выполняются колбэки{' '}
                <code>requestAnimationFrame (rAF)</code>. Далее рассчитываются стили, разметка
                (Layout) и происходит покраска (Paint).
              </li>
              <li>
                <strong>Взаимодействие:</strong> Движок браузера может выполнить несколько
                макрозадач подряд без рендеринга, если визуальных изменений не зафиксировано, или
                пропустить рендер.
              </li>
            </ul>
          </div>

          {/* Card 3: Scheduler postTask */}
          <div className='el-theory-card'>
            <h4>Priorities: Scheduler.postTask()</h4>
            <ul className='el-theory-list'>
              <li>
                <code>'user-blocking'</code>: Задачи с наивысшим приоритетом. Блокируют рендеринг,
                необходимы для мгновенной реакции на действия пользователя.
              </li>
              <li>
                <code>'user-visible'</code>: Приоритет по умолчанию. Обычные задачи рендеринга
                интерфейса и работы с данными.
              </li>
              <li>
                <code>'background'</code>: Низкий приоритет. Используется для логов, аналитики и
                некритичной предзагрузки данных.
              </li>
            </ul>
          </div>

          {/* Card 4: Node.js differences */}
          <div className='el-theory-card'>
            <h4>Отличия в Node.js (Libuv)</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>Нет визуализации:</strong> Отсутствует фаза Rendering (rAF, Layout, Paint).
              </li>
              <li>
                <strong>process.nextTick():</strong> Имеет наивысший приоритет. Очередь{' '}
                <code>nextTick</code> очищается до стандартной очереди промисов (Microtasks) сразу
                по освобождению Call Stack.
              </li>
              <li>
                <strong>setImmediate():</strong> Колбэк выполняется в специальной фазе{' '}
                <strong>Check</strong>, которая идет сразу за фазой <strong>Poll</strong> (получение
                сетевых данных и системных колбэков).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

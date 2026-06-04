import { useState, useEffect, useRef } from 'react'

// ─── types ─────────────────────────────────────────────────────────────────

interface WebApiItem {
  name: string
  detail?: string
}

type Phase =
  | 'stack'
  | 'microtasks'
  | 'rendering'
  | 'macrotasks'
  | 'idle'
  | 'react-render'
  | 'react-commit'
  | 'paint'

interface Step {
  line: number
  action: string
  stack: string[]
  microtasks: string[]
  macrotasks: string[]
  webApis: WebApiItem[]
  console: string[]
  phase: Phase
  phaseText: string
  tMs?: number // approximate virtual time in milliseconds for timeline
}

interface CaseStudy {
  id: string
  title: string
  badge: string
  code: string[]
  steps: Step[]
  expectedOutput?: string[] // for Quiz mode
}

// ─── data structures ───────────────────────────────────────────────────────

const CASES: CaseStudy[] = [
  {
    id: 'classic',
    title: 'Классика: setTimeout vs Promise',
    badge: 'Базовое',
    expectedOutput: ['Start', 'End', 'Promise', 'Timeout'],
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
        tMs: 0,
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
        tMs: 0.1,
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
        tMs: 0.2,
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
        tMs: 0.3,
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
        tMs: 0.4,
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
        tMs: 0.5,
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
        tMs: 0.6,
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
        tMs: 0.7,
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
        tMs: 0.8,
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
        tMs: 0.9,
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
        tMs: 1,
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
        tMs: 1.2,
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
        tMs: 1.3,
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
        tMs: 1.5,
      },
    ],
  },
  {
    id: 'asyncAwait',
    title: 'async / await шаг за шагом',
    badge: 'Собеседование',
    expectedOutput: [
      '0: до вызова foo',
      '1: внутри foo до await',
      '2: после вызова foo',
      '3: продолжение foo',
    ],
    code: [
      'async function foo() {',
      "  console.log('1: внутри foo до await');",
      '  await Promise.resolve();',
      "  console.log('3: продолжение foo');",
      '}',
      '',
      "console.log('0: до вызова foo');",
      'foo();',
      "console.log('2: после вызова foo');",
    ],
    steps: [
      {
        line: 7,
        action: 'Запуск скрипта. Функция foo объявлена, но не вызвана.',
        stack: ['global'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0,
      },
      {
        line: 7,
        action: "Выполняется console.log('0: до вызова foo').",
        stack: ['global', "console.log('0')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['0: до вызова foo'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.1,
      },
      {
        line: 8,
        action: 'Вызывается foo(). Создаётся async-контекст, тело foo начинает выполняться.',
        stack: ['global', 'foo()'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['0: до вызова foo'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.2,
      },
      {
        line: 2,
        action: "Внутри foo: выполняется console.log('1: внутри foo до await').",
        stack: ['global', 'foo()', "console.log('1')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['0: до вызова foo', '1: внутри foo до await'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.3,
      },
      {
        line: 3,
        action:
          'Встретился await. Promise.resolve() мгновенно разрешён. Продолжение foo (всё после await) упаковывается как .then() callback и помещается в очередь микрозадач.',
        stack: ['global'],
        microtasks: ['cb: продолжение foo'],
        macrotasks: [],
        webApis: [],
        console: ['0: до вызова foo', '1: внутри foo до await'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.4,
      },
      {
        line: 9,
        action: "Управление вернулось в global. Выполняется console.log('2: после вызова foo').",
        stack: ['global', "console.log('2')"],
        microtasks: ['cb: продолжение foo'],
        macrotasks: [],
        webApis: [],
        console: ['0: до вызова foo', '1: внутри foo до await', '2: после вызова foo'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.5,
      },
      {
        line: 9,
        action: 'Синхронный код завершён. Стек пуст. Event Loop проверяет микрозадачи.',
        stack: [],
        microtasks: ['cb: продолжение foo'],
        macrotasks: [],
        webApis: [],
        console: ['0: до вызова foo', '1: внутри foo до await', '2: после вызова foo'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
        tMs: 0.6,
      },
      {
        line: 3,
        action: 'Извлекается продолжение foo. Восстанавливается её контекст.',
        stack: ['cb: продолжение foo'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['0: до вызова foo', '1: внутри foo до await', '2: после вызова foo'],
        phase: 'microtasks',
        phaseText: 'Очередь микрозадач',
        tMs: 0.7,
      },
      {
        line: 4,
        action: "Выполняется console.log('3: продолжение foo').",
        stack: ['cb: продолжение foo', "console.log('3')"],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [
          '0: до вызова foo',
          '1: внутри foo до await',
          '2: после вызова foo',
          '3: продолжение foo',
        ],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.8,
      },
      {
        line: 5,
        action: 'foo завершена. Все очереди пусты.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [
          '0: до вызова foo',
          '1: внутри foo до await',
          '2: после вызова foo',
          '3: продолжение foo',
        ],
        phase: 'idle',
        phaseText: 'Завершено',
        tMs: 1,
      },
    ],
  },
  {
    id: 'interviewTest',
    title: 'Тест на интервью (Приоритеты)',
    badge: 'Собеседование',
    expectedOutput: [
      '1: Sync start',
      '7: Sync end',
      '3: Promise 1 (microtask)',
      '5: queueMicrotask (microtask)',
      '4: Promise 2 (microtask)',
      '6: rAF (animation)',
      '2: setTimeout (macrotask)',
    ],
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
        tMs: 0,
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
        tMs: 0.1,
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
        tMs: 0.2,
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
        tMs: 0.3,
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
        tMs: 0.4,
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
        tMs: 0.5,
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
        tMs: 0.6,
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
        tMs: 0.7,
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
        tMs: 0.8,
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
        tMs: 0.9,
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
        tMs: 1,
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
        tMs: 1.1,
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
        tMs: 1.2,
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
        tMs: 1.3,
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
        tMs: 1.4,
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
        tMs: 1.5,
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
        tMs: 1.6,
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
        tMs: 16.6,
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
        tMs: 16.7,
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
        tMs: 16.8,
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
        tMs: 17,
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
        tMs: 17.1,
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
        tMs: 17.2,
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
        tMs: 17.5,
      },
    ],
  },
  {
    id: 'reactRender',
    title: 'React 18: render → commit → effects',
    badge: 'React',
    expectedOutput: [
      'render',
      'DOM updated',
      'useLayoutEffect',
      'paint',
      'useEffect',
    ],
    code: [
      'function MyComponent() {',
      "  console.log('render');",
      '',
      '  useLayoutEffect(() => {',
      "    console.log('useLayoutEffect');",
      '  });',
      '',
      '  useEffect(() => {',
      "    console.log('useEffect');",
      '  });',
      '',
      '  return <div>{count}</div>;',
      '}',
    ],
    steps: [
      {
        line: 1,
        action:
          'Пользователь кликнул кнопку → setState вызывает планирование работы в React Scheduler. Внутри Scheduler использует MessageChannel — это макрозадача.',
        stack: ['onClick', 'setState'],
        microtasks: [],
        macrotasks: ['React Scheduler work'],
        webApis: [{ name: 'MessageChannel port', detail: 'Scheduler' }],
        console: [],
        phase: 'macrotasks',
        phaseText: 'React Scheduler планирует работу',
        tMs: 0,
      },
      {
        line: 1,
        action:
          'React Scheduler забирает работу. Начинается RENDER PHASE — может быть прерван в concurrent mode (yield каждые 5мс).',
        stack: ['Scheduler.performWork'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [],
        phase: 'react-render',
        phaseText: 'Render Phase (можно прервать)',
        tMs: 0.5,
      },
      {
        line: 2,
        action:
          "Функция компонента MyComponent выполняется. console.log('render') печатает 'render'. Создаётся новое Fiber-дерево.",
        stack: ['Scheduler.performWork', 'MyComponent()'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['render'],
        phase: 'react-render',
        phaseText: 'Render Phase',
        tMs: 1,
      },
      {
        line: 12,
        action:
          'Reconciliation сравнивает новое и старое Fiber-деревья (diffing). Подготавливает список DOM-изменений.',
        stack: ['Scheduler.performWork', 'reconcile'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['render'],
        phase: 'react-render',
        phaseText: 'Reconciliation',
        tMs: 2,
      },
      {
        line: 1,
        action:
          'Render Phase завершён. Начинается COMMIT PHASE — синхронно, нельзя прервать. React применяет изменения к DOM.',
        stack: ['Scheduler.performWork', 'commitWork'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['render', 'DOM updated'],
        phase: 'react-commit',
        phaseText: 'Commit Phase (синхронно)',
        tMs: 3,
      },
      {
        line: 4,
        action:
          'Сразу после DOM mutations, синхронно ДО paint, React вызывает useLayoutEffect. Здесь можно безопасно измерять DOM.',
        stack: ['Scheduler.performWork', 'commitWork', 'useLayoutEffect cb'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['render', 'DOM updated', 'useLayoutEffect'],
        phase: 'react-commit',
        phaseText: 'useLayoutEffect (sync)',
        tMs: 3.5,
      },
      {
        line: 1,
        action:
          'Commit завершён. Браузер выполняет PAINT — отрисовывает обновлённые пиксели на экране. Пользователь видит новое состояние.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['render', 'DOM updated', 'useLayoutEffect', 'paint'],
        phase: 'paint',
        phaseText: 'Browser Paint',
        tMs: 16.6,
      },
      {
        line: 8,
        action:
          'После paint React планирует useEffect через scheduler. Колбэк попадает в очередь и выполнится асинхронно.',
        stack: [],
        microtasks: [],
        macrotasks: ['cb: useEffect'],
        webApis: [],
        console: ['render', 'DOM updated', 'useLayoutEffect', 'paint'],
        phase: 'macrotasks',
        phaseText: 'useEffect отложен',
        tMs: 16.8,
      },
      {
        line: 9,
        action: "Извлекается колбэк useEffect и выполняется console.log('useEffect').",
        stack: ['cb: useEffect'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['render', 'DOM updated', 'useLayoutEffect', 'paint', 'useEffect'],
        phase: 'macrotasks',
        phaseText: 'useEffect выполняется',
        tMs: 17,
      },
      {
        line: 10,
        action:
          'Цикл рендера React завершён. Запомни: render → commit → useLayoutEffect → paint → useEffect.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['render', 'DOM updated', 'useLayoutEffect', 'paint', 'useEffect'],
        phase: 'idle',
        phaseText: 'Готово',
        tMs: 17.5,
      },
    ],
  },
  {
    id: 'reactBatching',
    title: 'React 18: Automatic Batching',
    badge: 'React',
    expectedOutput: ['handler start', 'handler end', 'render (one batch)'],
    code: [
      'function handleClick() {',
      "  console.log('handler start');",
      '  setTimeout(() => {',
      '    setCount(c => c + 1);',
      "    setName('Alice');",
      "    setActive(true);",
      "    // React 18: все три setState → ОДИН рендер",
      "    // React 17: каждый setState → отдельный рендер (3 шт.)",
      '  }, 0);',
      "  console.log('handler end');",
      '}',
    ],
    steps: [
      {
        line: 2,
        action: 'Пользователь кликнул. Выполняется handleClick синхронно.',
        stack: ['onClick', 'handleClick'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['handler start'],
        phase: 'stack',
        phaseText: 'Синхронный код',
        tMs: 0,
      },
      {
        line: 3,
        action: 'setTimeout регистрирует таймер 0мс в Web API.',
        stack: ['onClick', 'handleClick', 'setTimeout(...)'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (0ms)', detail: 'active' }],
        console: ['handler start'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.1,
      },
      {
        line: 10,
        action: "Выполняется console.log('handler end'). Handler завершается.",
        stack: ['onClick', 'handleClick'],
        microtasks: [],
        macrotasks: ['cb: timer'],
        webApis: [],
        console: ['handler start', 'handler end'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.2,
      },
      {
        line: 3,
        action: 'Event Loop извлекает таймер. Внутри React автоматически batched все setState.',
        stack: ['cb: timer'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['handler start', 'handler end'],
        phase: 'macrotasks',
        phaseText: 'Macrotask: timer callback',
        tMs: 0.5,
      },
      {
        line: 4,
        action: 'setCount(c => c+1) → React помечает компонент как dirty, НО не рендерит сразу.',
        stack: ['cb: timer', 'setCount'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Scheduler queued', detail: '1 update' }],
        console: ['handler start', 'handler end'],
        phase: 'stack',
        phaseText: 'Batching',
        tMs: 0.6,
      },
      {
        line: 5,
        action: "setName('Alice') → React добавляет в тот же batch.",
        stack: ['cb: timer', 'setName'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Scheduler queued', detail: '2 updates' }],
        console: ['handler start', 'handler end'],
        phase: 'stack',
        phaseText: 'Batching',
        tMs: 0.7,
      },
      {
        line: 6,
        action: 'setActive(true) → React добавляет третий апдейт в batch.',
        stack: ['cb: timer', 'setActive'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Scheduler queued', detail: '3 updates' }],
        console: ['handler start', 'handler end'],
        phase: 'stack',
        phaseText: 'Batching',
        tMs: 0.8,
      },
      {
        line: 9,
        action:
          'Timer callback завершён. React планирует ОДНУ работу рендера через MessageChannel (макрозадача).',
        stack: [],
        microtasks: [],
        macrotasks: ['React render work'],
        webApis: [],
        console: ['handler start', 'handler end'],
        phase: 'macrotasks',
        phaseText: 'Scheduler планирует render',
        tMs: 0.9,
      },
      {
        line: 1,
        action: 'React выполняет ОДИН render для всех трёх setState. Это и есть automatic batching.',
        stack: ['Scheduler.performWork'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['handler start', 'handler end', 'render (one batch)'],
        phase: 'react-render',
        phaseText: '1 render для 3 updates',
        tMs: 1.5,
      },
      {
        line: 1,
        action:
          'В React 17 это были бы ТРИ отдельных рендера (поскольку setState внутри setTimeout не батчился). В React 18 — один. Это automatic batching.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['handler start', 'handler end', 'render (one batch)'],
        phase: 'idle',
        phaseText: 'Готово (1 рендер)',
        tMs: 2,
      },
    ],
  },
  {
    id: 'throttle',
    title: 'Throttle: схлопывание событий',
    badge: 'Паттерн',
    expectedOutput: ['fire @0ms', 'fire @120ms'],
    code: [
      'const throttled = throttle(updateUI, 100);',
      '',
      'window.addEventListener(\'scroll\', throttled);',
      '',
      '// События scroll: t=0, 20, 40, 60, 80, 120',
      '// Поток событий "схлопывается" в 2 срабатывания.',
    ],
    steps: [
      {
        line: 5,
        action:
          't=0мс: первое событие scroll. throttled() вызывается. inThrottle=false → выполняется updateUI() синхронно.',
        stack: ['scroll handler', 'throttled', 'updateUI'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['fire @0ms'],
        phase: 'stack',
        phaseText: 'Leading edge',
        tMs: 0,
      },
      {
        line: 1,
        action: 'inThrottle=true. setTimeout(unlock, 100) регистрируется в Web API.',
        stack: ['scroll handler', 'throttled'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (100ms)', detail: 'lock' }],
        console: ['fire @0ms'],
        phase: 'stack',
        phaseText: 'Throttle активен',
        tMs: 0.1,
      },
      {
        line: 5,
        action: 't=20мс: новое событие scroll. throttled() видит inThrottle=true → ИГНОРИРУЕТ.',
        stack: ['scroll handler', 'throttled'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (100ms)', detail: 'осталось 80мс' }],
        console: ['fire @0ms'],
        phase: 'stack',
        phaseText: 'Игнор @20ms',
        tMs: 20,
      },
      {
        line: 5,
        action: 't=40мс: ещё одно событие. Снова игнор.',
        stack: ['scroll handler', 'throttled'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (100ms)', detail: 'осталось 60мс' }],
        console: ['fire @0ms'],
        phase: 'stack',
        phaseText: 'Игнор @40ms',
        tMs: 40,
      },
      {
        line: 5,
        action: 't=60мс: событие — игнор.',
        stack: ['scroll handler', 'throttled'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (100ms)', detail: 'осталось 40мс' }],
        console: ['fire @0ms'],
        phase: 'stack',
        phaseText: 'Игнор @60ms',
        tMs: 60,
      },
      {
        line: 5,
        action: 't=80мс: событие — игнор.',
        stack: ['scroll handler', 'throttled'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (100ms)', detail: 'осталось 20мс' }],
        console: ['fire @0ms'],
        phase: 'stack',
        phaseText: 'Игнор @80ms',
        tMs: 80,
      },
      {
        line: 1,
        action: 't=100мс: таймер истёк. Web API кладёт unlock callback в очередь макрозадач.',
        stack: [],
        microtasks: [],
        macrotasks: ['cb: unlock'],
        webApis: [],
        console: ['fire @0ms'],
        phase: 'macrotasks',
        phaseText: 'Снятие блокировки',
        tMs: 100,
      },
      {
        line: 1,
        action: 'Event Loop извлекает unlock. inThrottle=false. Throttle снова готов сработать.',
        stack: ['cb: unlock'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['fire @0ms'],
        phase: 'macrotasks',
        phaseText: 'inThrottle = false',
        tMs: 100.1,
      },
      {
        line: 5,
        action: 't=120мс: новое событие scroll. inThrottle=false → СРАБАТЫВАЕТ updateUI().',
        stack: ['scroll handler', 'throttled', 'updateUI'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (100ms)', detail: 'новый lock' }],
        console: ['fire @0ms', 'fire @120ms'],
        phase: 'stack',
        phaseText: 'Leading edge #2',
        tMs: 120,
      },
      {
        line: 6,
        action:
          'Итог: из 6 событий выполнилось только 2 (t=0 и t=120). Throttle "схлопывает" поток событий до фиксированной частоты.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'Timer (100ms)', detail: 'активен' }],
        console: ['fire @0ms', 'fire @120ms'],
        phase: 'idle',
        phaseText: 'Готово',
        tMs: 120.5,
      },
    ],
  },
  {
    id: 'useQueryFlow',
    title: 'useQuery: полный круг с React',
    badge: 'React + Network',
    expectedOutput: [
      'render: loading',
      'useEffect: fetch start',
      'response received',
      'setState: data',
      'render: success',
      'paint: data shown',
    ],
    code: [
      'function User() {',
      '  const { data, status } = useQuery(',
      "    () => fetch('/api/user').then(r => r.json()),",
      '    []',
      '  );',
      '',
      "  if (status === 'loading') return <Skeleton/>;",
      '  return <div>{data.name}</div>;',
      '}',
    ],
    steps: [
      {
        line: 1,
        action:
          'Mount: первый рендер компонента. status=loading, data=null. React отрисовывает <Skeleton/>.',
        stack: ['Scheduler', 'User()'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['render: loading'],
        phase: 'react-render',
        phaseText: 'Initial render',
        tMs: 0,
      },
      {
        line: 8,
        action: 'Commit: Skeleton появляется в DOM. Браузер делает paint.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['render: loading'],
        phase: 'paint',
        phaseText: 'Paint: skeleton',
        tMs: 16.6,
      },
      {
        line: 3,
        action:
          'После paint React запускает useEffect внутри useQuery. fetch() передаётся в Web API.',
        stack: ['cb: useEffect'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'HTTP /api/user', detail: 'pending' }],
        console: ['render: loading', 'useEffect: fetch start'],
        phase: 'macrotasks',
        phaseText: 'useEffect fired',
        tMs: 17,
      },
      {
        line: 3,
        action:
          'Стек пуст. Браузер ждёт ответа. Пользователь видит skeleton. Сеть работает параллельно.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'HTTP /api/user', detail: 'pending' }],
        console: ['render: loading', 'useEffect: fetch start'],
        phase: 'idle',
        phaseText: 'Ожидание сети',
        tMs: 50,
      },
      {
        line: 3,
        action:
          't≈200мс: сервер ответил. Network event ставится в очередь макрозадач.',
        stack: [],
        microtasks: [],
        macrotasks: ['Network Response'],
        webApis: [],
        console: ['render: loading', 'useEffect: fetch start', 'response received'],
        phase: 'macrotasks',
        phaseText: 'Network event',
        tMs: 200,
      },
      {
        line: 3,
        action:
          'Network macrotask разрешает fetch promise. .then(r => r.json()) ставится в микрозадачи.',
        stack: ['Network Response'],
        microtasks: ['cb: r.json()'],
        macrotasks: [],
        webApis: [],
        console: ['render: loading', 'useEffect: fetch start', 'response received'],
        phase: 'microtasks',
        phaseText: 'Promise resolved',
        tMs: 200.1,
      },
      {
        line: 4,
        action:
          'JSON-парсинг (тоже async) → ещё одна микрозадача → setState(data). React планирует render через Scheduler.',
        stack: ['cb: json done', 'setState'],
        microtasks: [],
        macrotasks: ['React render work'],
        webApis: [],
        console: [
          'render: loading',
          'useEffect: fetch start',
          'response received',
          'setState: data',
        ],
        phase: 'microtasks',
        phaseText: 'setState вызван',
        tMs: 200.5,
      },
      {
        line: 1,
        action: 'Scheduler выполняет render с новыми данными. status=success.',
        stack: ['Scheduler', 'User()'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [
          'render: loading',
          'useEffect: fetch start',
          'response received',
          'setState: data',
          'render: success',
        ],
        phase: 'react-render',
        phaseText: 'Re-render с данными',
        tMs: 201,
      },
      {
        line: 8,
        action: 'Commit: <div> с данными попадает в DOM. Paint показывает пользователю данные.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [
          'render: loading',
          'useEffect: fetch start',
          'response received',
          'setState: data',
          'render: success',
          'paint: data shown',
        ],
        phase: 'paint',
        phaseText: 'Paint: данные видны',
        tMs: 216.6,
      },
      {
        line: 9,
        action:
          'Полный цикл: render(loading) → paint(skeleton) → fetch → network → microtasks → setState → render(success) → paint(data).',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [
          'render: loading',
          'useEffect: fetch start',
          'response received',
          'setState: data',
          'render: success',
          'paint: data shown',
        ],
        phase: 'idle',
        phaseText: 'Готово',
        tMs: 220,
      },
    ],
  },
  {
    id: 'mutationObserver',
    title: 'MutationObserver: микрозадача',
    badge: 'DOM Observer',
    expectedOutput: [
      'sync: 3 appendChild',
      'microtask: MutationObserver fired ONCE',
      'records: 3 mutations',
    ],
    code: [
      'const target = document.getElementById(\'list\');',
      '',
      'const observer = new MutationObserver(records => {',
      "  console.log('microtask: MutationObserver fired ONCE');",
      "  console.log('records:', records.length, 'mutations');",
      '});',
      '',
      "observer.observe(target, { childList: true });",
      '',
      "console.log('sync: 3 appendChild');",
      'target.appendChild(document.createElement(\'li\'));',
      'target.appendChild(document.createElement(\'li\'));',
      'target.appendChild(document.createElement(\'li\'));',
      '// → колбэк вызовется один раз с 3 records',
    ],
    steps: [
      {
        line: 1,
        action:
          'Найден целевой узел (например, <ul id="list">). Создаётся новый MutationObserver — он ещё не отслеживает изменения.',
        stack: ['global'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: [],
        phase: 'stack',
        phaseText: 'Setup',
        tMs: 0,
      },
      {
        line: 8,
        action:
          'observer.observe(target, { childList: true }) — браузер начинает следить за изменениями детей target. Регистрация в Web API.',
        stack: ['global', 'observer.observe(...)'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'MutationObserver', detail: 'watching #list' }],
        console: [],
        phase: 'stack',
        phaseText: 'Подписка на изменения',
        tMs: 0.1,
      },
      {
        line: 10,
        action: 'Выполняется console.log("sync: 3 appendChild").',
        stack: ['global', "console.log('sync...')"],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'MutationObserver', detail: 'watching #list' }],
        console: ['sync: 3 appendChild'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.2,
      },
      {
        line: 11,
        action:
          'Первый appendChild — DOM меняется. MutationObserver НЕ срабатывает синхронно. Он добавляет запись в свой внутренний список pending records.',
        stack: ['global', 'appendChild()'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'MutationObserver', detail: '1 record pending' }],
        console: ['sync: 3 appendChild'],
        phase: 'stack',
        phaseText: 'DOM mutation #1',
        tMs: 0.3,
      },
      {
        line: 12,
        action: 'Второй appendChild. Ещё одна запись добавляется в pending list.',
        stack: ['global', 'appendChild()'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'MutationObserver', detail: '2 records pending' }],
        console: ['sync: 3 appendChild'],
        phase: 'stack',
        phaseText: 'DOM mutation #2',
        tMs: 0.4,
      },
      {
        line: 13,
        action: 'Третий appendChild. Pending list содержит 3 mutation records.',
        stack: ['global', 'appendChild()'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'MutationObserver', detail: '3 records pending' }],
        console: ['sync: 3 appendChild'],
        phase: 'stack',
        phaseText: 'DOM mutation #3',
        tMs: 0.5,
      },
      {
        line: 14,
        action:
          'Синхронный код завершён. Стек пуст. Браузер планирует ОДНУ микрозадачу для вызова колбэка MutationObserver с накопленными records.',
        stack: [],
        microtasks: ['cb: MutationObserver'],
        macrotasks: [],
        webApis: [{ name: 'MutationObserver', detail: 'flush queued' }],
        console: ['sync: 3 appendChild'],
        phase: 'microtasks',
        phaseText: 'Планирование микрозадачи',
        tMs: 0.6,
      },
      {
        line: 3,
        action:
          'Event Loop извлекает микрозадачу. Колбэк MutationObserver вызывается ОДИН раз с массивом из 3 records.',
        stack: ['cb: MutationObserver'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'MutationObserver', detail: 'watching #list' }],
        console: ['sync: 3 appendChild', 'microtask: MutationObserver fired ONCE'],
        phase: 'microtasks',
        phaseText: 'Колбэк выполняется',
        tMs: 0.7,
      },
      {
        line: 5,
        action: 'Колбэк печатает количество records.',
        stack: ['cb: MutationObserver', 'console.log'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'MutationObserver', detail: 'watching #list' }],
        console: [
          'sync: 3 appendChild',
          'microtask: MutationObserver fired ONCE',
          'records: 3 mutations',
        ],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.8,
      },
      {
        line: 6,
        action:
          'Ключевой вывод: MutationObserver батчит мутации и срабатывает один раз как микрозадача — это эффективнее, чем синхронные DOM events.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'MutationObserver', detail: 'watching #list' }],
        console: [
          'sync: 3 appendChild',
          'microtask: MutationObserver fired ONCE',
          'records: 3 mutations',
        ],
        phase: 'idle',
        phaseText: 'Готово',
        tMs: 1,
      },
    ],
  },
  {
    id: 'starvation',
    title: 'Microtask Starvation (морение)',
    badge: 'Опасность',
    expectedOutput: [
      'micro #1',
      'micro #2',
      'micro #3',
      '... (бесконечно, UI заморожен)',
    ],
    code: [
      'let i = 0;',
      '',
      'function starve() {',
      '  console.log(`micro #${++i}`);',
      '  Promise.resolve().then(starve); // ⚠️',
      '}',
      'starve();',
      '',
      'setTimeout(() => {',
      "  console.log('macro: НИКОГДА не выполнится');",
      '}, 0);',
      '',
      '// rAF и события клика тоже заморожены',
    ],
    steps: [
      {
        line: 7,
        action: 'starve() вызывается. Выводит "micro #1" и планирует следующий starve как микрозадачу.',
        stack: ['global', 'starve()'],
        microtasks: ['cb: starve'],
        macrotasks: [],
        webApis: [],
        console: ['micro #1'],
        phase: 'stack',
        phaseText: 'Первый вызов',
        tMs: 0,
      },
      {
        line: 9,
        action: 'setTimeout регистрируется в Web API → переходит в macrotask queue.',
        stack: ['global'],
        microtasks: ['cb: starve'],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['micro #1'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.1,
      },
      {
        line: 11,
        action: 'Синхронный код завершён. Event Loop проверяет микрозадачи.',
        stack: [],
        microtasks: ['cb: starve'],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['micro #1'],
        phase: 'microtasks',
        phaseText: 'Очистка микрозадач',
        tMs: 0.2,
      },
      {
        line: 4,
        action: 'starve выполняется → "micro #2" → планирует НОВУЮ микрозадачу.',
        stack: ['cb: starve'],
        microtasks: ['cb: starve'],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['micro #1', 'micro #2'],
        phase: 'microtasks',
        phaseText: 'Microtask #2',
        tMs: 0.3,
      },
      {
        line: 4,
        action: 'И снова... микрозадачи добавляются быстрее, чем очищаются.',
        stack: ['cb: starve'],
        microtasks: ['cb: starve'],
        macrotasks: ['cb: setTimeout'],
        webApis: [],
        console: ['micro #1', 'micro #2', 'micro #3'],
        phase: 'microtasks',
        phaseText: 'Microtask #3',
        tMs: 0.4,
      },
      {
        line: 4,
        action:
          '⚠️ Очередь микрозадач НИКОГДА не очищается. Macrotask (setTimeout) НЕ выполнится. Rendering НЕ произойдёт. Клики НЕ обработаются. UI заморожен.',
        stack: ['cb: starve'],
        microtasks: ['cb: starve'],
        macrotasks: ['cb: setTimeout (заблокирован)'],
        webApis: [],
        console: ['micro #1', 'micro #2', 'micro #3', '... (бесконечно, UI заморожен)'],
        phase: 'microtasks',
        phaseText: '❌ Starvation',
        tMs: 0.5,
      },
      {
        line: 13,
        action:
          'УРОК: для длинных задач используй setTimeout(0)/MessageChannel/scheduler.postTask — между макрозадачами браузер успевает отрисовать кадр и обработать ввод.',
        stack: ['cb: starve'],
        microtasks: ['cb: starve'],
        macrotasks: ['cb: setTimeout (заблокирован)'],
        webApis: [],
        console: ['micro #1', 'micro #2', 'micro #3', '... (бесконечно, UI заморожен)'],
        phase: 'microtasks',
        phaseText: 'Вывод',
        tMs: 0.6,
      },
    ],
  },
  {
    id: 'network',
    title: 'Сеть: fetch + Promises',
    badge: 'Асинхронность',
    expectedOutput: ['Start', 'End', 'Data received'],
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
        tMs: 0,
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
        tMs: 0.1,
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
        tMs: 0.2,
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
        tMs: 0.3,
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
        tMs: 0.4,
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
        tMs: 150,
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
        tMs: 150.1,
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
        tMs: 150.2,
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
        tMs: 150.3,
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
        tMs: 150.4,
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
        tMs: 150.5,
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
        tMs: 150.6,
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
        tMs: 151,
      },
    ],
  },
  {
    id: 'raf',
    title: 'Визуализация: rAF vs setTimeout',
    badge: 'Отрисовка кадра',
    expectedOutput: ['Sync', 'Timeout', 'rAF'],
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
        tMs: 0,
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
        tMs: 0.1,
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
        tMs: 0.2,
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
        tMs: 0.3,
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
        tMs: 0.4,
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
        tMs: 0.5,
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
        tMs: 0.6,
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
        tMs: 0.7,
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
        tMs: 16.6,
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
        tMs: 16.7,
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
        tMs: 16.8,
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
        tMs: 17,
      },
    ],
  },
  {
    id: 'priorities',
    title: 'Scheduler.postTask()',
    badge: 'HTML5 Standard',
    expectedOutput: ['Sync', 'Blk', 'Vis', 'Bg'],
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
        tMs: 0,
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
        tMs: 0.1,
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
        tMs: 0.2,
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
        tMs: 0.3,
      },
      {
        line: 5,
        action: "Выполняется синхронный console.log('Sync').",
        stack: ['global', "console.log('Sync')"],
        microtasks: [],
        macrotasks: [],
        webApis: [
          { name: 'postTask: background', detail: 'low' },
          { name: 'postTask: user-blocking', detail: 'high' },
          { name: 'postTask: user-visible', detail: 'med' },
        ],
        console: ['Sync'],
        phase: 'stack',
        phaseText: 'Стек вызовов',
        tMs: 0.4,
      },
      {
        line: 5,
        action:
          'Синхронный код завершен. У postTask свои очереди по приоритетам — планировщик выбирает user-blocking первым.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [
          { name: 'postTask: background', detail: 'low' },
          { name: 'postTask: user-visible', detail: 'med' },
        ],
        console: ['Sync'],
        phase: 'macrotasks',
        phaseText: 'Planner: pick user-blocking',
        tMs: 0.5,
      },
      {
        line: 2,
        action: 'user-blocking → постановка в обычную task queue и немедленное выполнение.',
        stack: ['cb: user-blocking'],
        microtasks: [],
        macrotasks: [],
        webApis: [
          { name: 'postTask: background', detail: 'low' },
          { name: 'postTask: user-visible', detail: 'med' },
        ],
        console: ['Sync', 'Blk'],
        phase: 'macrotasks',
        phaseText: 'user-blocking',
        tMs: 0.6,
      },
      {
        line: 3,
        action: 'Между тиками планировщик выбирает следующий — user-visible.',
        stack: ['cb: user-visible'],
        microtasks: [],
        macrotasks: [],
        webApis: [{ name: 'postTask: background', detail: 'low' }],
        console: ['Sync', 'Blk', 'Vis'],
        phase: 'macrotasks',
        phaseText: 'user-visible',
        tMs: 0.7,
      },
      {
        line: 1,
        action: 'В конце — задачи приоритета background (выполняются в idle-окнах).',
        stack: ['cb: background'],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'Blk', 'Vis', 'Bg'],
        phase: 'macrotasks',
        phaseText: 'background',
        tMs: 0.8,
      },
      {
        line: 1,
        action:
          'Готово. postTask использует ОТДЕЛЬНЫЕ очереди для каждого приоритета — это не обычная macrotask FIFO, а планировщик.',
        stack: [],
        microtasks: [],
        macrotasks: [],
        webApis: [],
        console: ['Sync', 'Blk', 'Vis', 'Bg'],
        phase: 'idle',
        phaseText: 'Готово',
        tMs: 1,
      },
    ],
  },
  {
    id: 'nodejs',
    title: 'Node.js: nextTick + setImmediate',
    badge: 'Node.js / Libuv',
    expectedOutput: ['Sync', 'nextTick', 'Promise', 'setTimeout', 'setImmediate'],
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
        tMs: 0,
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
        tMs: 0.1,
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
        tMs: 0.2,
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
        tMs: 0.3,
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
        tMs: 0.4,
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
        tMs: 0.5,
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
        tMs: 0.6,
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
        tMs: 0.7,
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
        tMs: 0.8,
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
        tMs: 0.9,
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
        tMs: 1,
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
        tMs: 1.1,
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
        tMs: 1.2,
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
        tMs: 1.3,
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
        tMs: 1.4,
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
        tMs: 1.5,
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
        tMs: 1.6,
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
        tMs: 1.7,
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
        tMs: 2,
      },
    ],
  },
]

// ─── Component ─────────────────────────────────────────────────────────────

const PHASE_LABEL: Record<Phase, string> = {
  stack: 'CALL STACK',
  microtasks: 'MICRO',
  rendering: 'RENDER',
  macrotasks: 'MACRO',
  idle: 'IDLE',
  'react-render': 'REACT RENDER',
  'react-commit': 'REACT COMMIT',
  paint: 'PAINT',
}

const PHASE_COLOR: Record<Phase, string> = {
  stack: '#8b5cf6',
  microtasks: '#06b6d4',
  rendering: '#22c55e',
  macrotasks: '#f59e0b',
  idle: '#94a3b8',
  'react-render': '#0ea5e9',
  'react-commit': '#6366f1',
  paint: '#22c55e',
}

// Tooltip content per loop node (выдержки из theory/event_loop.md)
interface TooltipContent {
  title: string
  body: string
  sources: string[]
  priority: string
}

const TOOLTIPS = {
  stack: {
    title: 'Call Stack — Стек вызовов',
    body:
      'Синхронный стек выполнения инструкций (LIFO). JS однопоточен — пока стек не пуст, ни одна другая задача не может начаться. Все вызовы функций, console.log, синхронные операторы — выполняются здесь.',
    sources: ['function call', 'console.log', 'синхронные операторы'],
    priority: 'Высочайший — блокирует всё остальное',
  },
  microtasks: {
    title: 'Microtask Queue — Очередь микрозадач',
    body:
      'Очередь очищается ПОЛНОСТЬЮ (включая микрозадачи, добавленные в процессе очистки) перед тем, как Event Loop перейдет к рендерингу или макрозадаче. Опасность: бесконечный цикл микрозадач заморозит UI (starvation).',
    sources: [
      'Promise.then / catch / finally',
      'await (после первого приостанова)',
      'queueMicrotask(...)',
      'MutationObserver',
    ],
    priority: 'Выше макрозадач и рендера',
  },
  rendering: {
    title: 'Rendering Pipeline — Конвейер рендеринга',
    body:
      'Запускается с частотой экрана (~16.6мс при 60Гц). Порядок: requestAnimationFrame → Recalculate Style → Layout → Paint → Composite. Браузер может пропустить кадр, если визуальных изменений нет, или объединить несколько макрозадач до paint.',
    sources: [
      'requestAnimationFrame (rAF)',
      'ResizeObserver / IntersectionObserver',
      'Style / Layout / Paint',
    ],
    priority: 'По расписанию монитора (60/120 Гц)',
  },
  macrotasks: {
    title: 'Macrotask Queue — Очередь макрозадач (Tasks)',
    body:
      'За один тик Event Loop выполняет РОВНО ОДНУ макрозадачу, после чего сразу очищает очередь микрозадач. Между макрозадачами браузер успевает отрисовать кадр и обработать пользовательский ввод.',
    sources: [
      'setTimeout / setInterval',
      'События ввода (click, scroll, input)',
      'Сетевые ответы (fetch, XHR, WebSocket)',
      'postMessage / MessageChannel',
      'Парсинг HTML',
    ],
    priority: 'Низкий — по одной за тик',
  },
} satisfies Record<string, TooltipContent>

function DiagramNode({
  className,
  label,
  sub,
  tooltip,
}: {
  className: string
  label: string
  sub: string
  tooltip: TooltipContent
}) {
  return (
    <div className={`el-loop-node ${className}`}>
      <span className='el-loop-node-label'>{label}</span>
      <span className='el-loop-node-sub'>{sub}</span>
      <div className='el-tooltip' role='tooltip'>
        <div className='el-tooltip-title'>{tooltip.title}</div>
        <div className='el-tooltip-body'>{tooltip.body}</div>
        <div className='el-tooltip-section'>
          <div className='el-tooltip-section-label'>Источники:</div>
          <ul>
            {tooltip.sources.map(s => (
              <li key={s}>
                <code>{s}</code>
              </li>
            ))}
          </ul>
        </div>
        <div className='el-tooltip-priority'>
          <strong>Приоритет:</strong> {tooltip.priority}
        </div>
      </div>
    </div>
  )
}

export function EventLoopShowcase() {
  const [activeCaseId, setActiveCaseId] = useState<string>('classic')
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playSpeed, setPlaySpeed] = useState<number>(1500)
  const [viewMode, setViewMode] = useState<'step' | 'timeline'>('step')
  const [quizMode, setQuizMode] = useState<boolean>(false)
  const [quizRevealed, setQuizRevealed] = useState<boolean>(false)
  const [quizGuess, setQuizGuess] = useState<string>('')

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeCase = CASES.find(c => c.id === activeCaseId) || CASES[0]
  const stepsCount = activeCase.steps.length
  const currentStep = activeCase.steps[stepIndex] || activeCase.steps[0]

  const handleCaseChange = (caseId: string) => {
    setActiveCaseId(caseId)
    setStepIndex(0)
    setIsPlaying(false)
    setQuizRevealed(false)
    setQuizGuess('')
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
    setQuizRevealed(false)
    setQuizGuess('')
  }

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

  const getPhaseClass = () => {
    switch (currentStep.phase) {
      case 'stack':
        return 'phase-stack'
      case 'microtasks':
        return 'phase-microtasks'
      case 'rendering':
      case 'paint':
        return 'phase-rendering'
      case 'macrotasks':
        return 'phase-macrotasks'
      case 'react-render':
      case 'react-commit':
        return 'phase-microtasks'
      default:
        return ''
    }
  }

  // Hide console output in quiz mode until revealed
  const consoleVisible = !quizMode || quizRevealed
  const displayedConsole = consoleVisible ? currentStep.console : []

  return (
    <div style={{ padding: '32px 0', maxWidth: 1100 }}>
      <div className='el-header'>
        <h1 className='el-title'>Визуальный симулятор Event Loop</h1>
        <p className='el-subtitle'>
          Пошаговое интерактивное обучение циклу событий в браузере, Node.js и React.
          Наблюдай за движением задач между Call Stack, очередями микро- и макрозадач,
          React Scheduler и Rendering Pipeline.
        </p>
      </div>

      {/* Case Selector Tabs */}
      <div className='el-tabs-container' style={{ marginBottom: 16 }}>
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

      {/* Mode toggles */}
      <div className='el-mode-bar'>
        <div className='el-mode-group'>
          <span className='el-mode-label'>Режим:</span>
          <button
            className={`el-mode-btn ${viewMode === 'step' ? 'active' : ''}`}
            onClick={() => setViewMode('step')}
          >
            Пошагово
          </button>
          <button
            className={`el-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </button>
        </div>
        <div className='el-mode-group'>
          <label className='el-quiz-toggle'>
            <input
              type='checkbox'
              checked={quizMode}
              onChange={e => {
                setQuizMode(e.target.checked)
                setQuizRevealed(false)
              }}
            />
            <span>🧠 Quiz: угадай вывод перед просмотром</span>
          </label>
        </div>
      </div>

      {/* Quiz panel */}
      {quizMode && (
        <div className='el-quiz-panel'>
          <div className='el-quiz-title'>Что выведет console для кейса «{activeCase.title}»?</div>
          <textarea
            className='el-quiz-input'
            placeholder='Запиши предполагаемый порядок вывода (каждая строка с новой строки)...'
            value={quizGuess}
            onChange={e => setQuizGuess(e.target.value)}
            disabled={quizRevealed}
            rows={4}
          />
          {!quizRevealed ? (
            <button className='el-btn-primary' onClick={() => setQuizRevealed(true)}>
              Показать ответ
            </button>
          ) : (
            <div className='el-quiz-answer'>
              <div className='el-quiz-answer-title'>Правильный ответ:</div>
              <ol>
                {(activeCase.expectedOutput ?? []).map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Timeline view */}
      {viewMode === 'timeline' && (
        <TimelineView
          steps={activeCase.steps}
          currentIndex={stepIndex}
          onSelect={setStepIndex}
        />
      )}

      {/* Simulator Interactive Grid */}
      <div className='el-sim-grid'>
        {/* LEFT COLUMN */}
        <div className='el-left-panel'>
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
              {currentStep.tMs !== undefined && (
                <span style={{ marginLeft: 8, color: '#64748b' }}>
                  · t ≈ {currentStep.tMs}мс
                </span>
              )}
            </div>
            <p className='el-explainer-text'>{currentStep.action}</p>
          </div>

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

          <div className='el-console'>
            <div className='el-console-header'>
              <span>
                Лог вывода (Console)
                {quizMode && !quizRevealed && (
                  <span style={{ marginLeft: 8, color: '#fbbf24' }}>· скрыто (quiz)</span>
                )}
              </span>
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
              {displayedConsole.length === 0 ? (
                <div className='el-console-empty'>
                  {quizMode && !quizRevealed && currentStep.console.length > 0
                    ? '🧠 Вывод скрыт. Нажми "Показать ответ" в Quiz панели.'
                    : 'В консоли пока нет записей...'}
                </div>
              ) : (
                displayedConsole.map((log, idx) => (
                  <div key={idx} className='el-console-line'>
                    &gt; {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className='el-right-panel'>
          <div className='el-card el-diagram-card'>
            <div
              className='el-card-title'
              style={{ alignSelf: 'flex-start', marginBottom: 12 }}
            >
              Цикл событий (Event Loop)
            </div>
            <div className='el-diagram-container'>
              <div className={`el-diagram-inner ${getPhaseClass()}`}>
                <div className='el-loop-center'>
                  <span>Текущая фаза:</span>
                  <div className='el-loop-center-phase'>{currentStep.phaseText}</div>
                </div>

                <DiagramNode
                  className={`node-stack ${currentStep.phase === 'stack' ? 'active' : ''}`}
                  label='CALL STACK'
                  sub='Синхронно'
                  tooltip={TOOLTIPS.stack}
                />
                <DiagramNode
                  className={`node-micro ${currentStep.phase === 'microtasks' ? 'active' : ''}`}
                  label='MICRO TASKS'
                  sub='Promise / await'
                  tooltip={TOOLTIPS.microtasks}
                />
                <DiagramNode
                  className={`node-render ${
                    currentStep.phase === 'rendering' || currentStep.phase === 'paint'
                      ? 'active'
                      : ''
                  }`}
                  label='RENDERING'
                  sub='rAF / Layout / Paint'
                  tooltip={TOOLTIPS.rendering}
                />
                <DiagramNode
                  className={`node-macro ${currentStep.phase === 'macrotasks' ? 'active' : ''}`}
                  label='MACRO TASKS'
                  sub='setTimeout / Event'
                  tooltip={TOOLTIPS.macrotasks}
                />
              </div>
            </div>

            {(currentStep.phase === 'react-render' || currentStep.phase === 'react-commit') && (
              <div className='el-react-overlay'>
                <span className='el-react-pill'>⚛ React Scheduler работает</span>
                <span className='el-react-sub'>
                  Внутри использует MessageChannel (macrotask), может прерываться каждые ~5мс
                </span>
              </div>
            )}
          </div>

          {activeCaseId === 'useQueryFlow' && (
            <ReactPageDemo step={currentStep} />
          )}
          {activeCaseId === 'reactRender' && (
            <ReactPageDemo step={currentStep} variant='render' />
          )}

          <div className='el-pools-grid'>
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
                    <div key={idx} className='el-stack-item'>
                      {stackItem}
                    </div>
                  ))
                )}
              </div>
            </div>

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
                    <div key={idx} className='el-api-item'>
                      <span>⚙️ {api.name}</span>
                      {api.detail && <span className='el-api-badge'>{api.detail}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className='el-queues-container'>
            <div className='el-queue-card'>
              <div className='el-queue-header'>
                <h4 className='el-queue-title' style={{ color: '#0891b2' }}>
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
                    <div key={idx} className='el-queue-item micro'>
                      {task}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className='el-queue-card'>
              <div className='el-queue-header'>
                <h4 className='el-queue-title' style={{ color: '#d97706' }}>
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
                    <div key={idx} className='el-queue-item macro'>
                      {task}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theory Section */}
      <div className='el-theory-section'>
        <h2 className='el-theory-title'>Справочник: Event Loop, React и асинхронность</h2>
        <div className='el-theory-grid'>
          <div className='el-theory-card'>
            <h4>Микрозадачи vs Макрозадачи</h4>
            <table className='el-theory-table'>
              <thead>
                <tr>
                  <th>Тип</th>
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
                    <strong>Высочайший.</strong> Очередь очищается полностью между макрозадачами.
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#d97706', fontWeight: 700 }}>Macrotask</td>
                  <td>
                    <code>setTimeout/Interval</code>
                    <br />
                    Пользовательский ввод
                    <br />
                    Сетевые ответы (HTTP)
                    <br />
                    <code>postMessage</code> / <code>MessageChannel</code>
                  </td>
                  <td>
                    <strong>Низкий.</strong> За один тик — только ОДНА макрозадача.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className='el-theory-card'>
            <h4>⚛ React 18 жизненный цикл</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>Scheduler:</strong> React использует <code>MessageChannel</code> чтобы планировать работу
                как макрозадачу с возможностью yield (concurrent mode).
              </li>
              <li>
                <strong>Render phase:</strong> вызов компонентов + reconciliation. Прерываема.
              </li>
              <li>
                <strong>Commit phase:</strong> DOM mutations. Синхронно.
              </li>
              <li>
                <strong>useLayoutEffect:</strong> синхронно сразу после commit, ДО paint. Для измерений DOM.
              </li>
              <li>
                <strong>Paint:</strong> браузер рисует пиксели.
              </li>
              <li>
                <strong>useEffect:</strong> асинхронно ПОСЛЕ paint. Для side-effects.
              </li>
              <li>
                <strong>flushSync:</strong> принудительный синхронный render+commit (выход из batching).
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>⚛ Automatic Batching (React 18)</h4>
            <ul className='el-theory-list'>
              <li>
                React 17: <code>setState</code> внутри <code>setTimeout</code>/<code>fetch.then</code>/нативного
                обработчика НЕ батчился → N рендеров на N апдейтов.
              </li>
              <li>
                React 18: <strong>всё</strong> батчится автоматически — один render на любое
                количество <code>setState</code> в пределах одного task'а.
              </li>
              <li>
                <strong>Когда нужен flushSync:</strong> измерить DOM между двумя setState, интегрировать с
                non-React кодом, который ожидает синхронный DOM.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>async / await</h4>
            <ul className='el-theory-list'>
              <li>
                <code>await x</code> = <code>Promise.resolve(x).then(continuation)</code>.
              </li>
              <li>
                Код ДО первого <code>await</code> выполняется <strong>синхронно</strong> вместе с вызовом
                async-функции.
              </li>
              <li>
                Код ПОСЛЕ <code>await</code> — это микрозадача, даже если справа от await не-промис.
              </li>
              <li>
                Каждый <code>await</code> = минимум одна микрозадача (так что 10 await'ов подряд = 10 микрозадач).
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>👁 MutationObserver</h4>
            <ul className='el-theory-list'>
              <li>
                Срабатывает <strong>как микрозадача</strong> после изменения DOM — не синхронно.
              </li>
              <li>
                <strong>Батчит</strong> мутации: 100 appendChild подряд → один вызов колбэка с 100 records.
              </li>
              <li>
                Опции наблюдения: <code>childList</code>, <code>attributes</code>, <code>characterData</code>,{' '}
                <code>subtree</code>, <code>attributeOldValue</code>.
              </li>
              <li>
                Используется React Hot Reload, Material UI Portal, библиотеками для отслеживания
                сторонних DOM-изменений.
              </li>
              <li>
                Не путать с <code>ResizeObserver</code>/<code>IntersectionObserver</code> — те
                выполняются <strong>не как микрозадачи</strong>, а в специальной фазе рендеринга
                между layout и paint.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>🔥 Microtask Starvation</h4>
            <ul className='el-theory-list'>
              <li>
                Микрозадачи очищаются <strong>полностью</strong> перед рендером и макрозадачами.
              </li>
              <li>
                Бесконечный <code>Promise.then(loop)</code> заморозит UI: рендер не произойдёт, клики не обработаются.
              </li>
              <li>
                Для длинных задач используй <code>setTimeout(0)</code>, <code>MessageChannel</code> или{' '}
                <code>scheduler.postTask</code>.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>Throttle / Debounce и Event Loop</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>Throttle:</strong> один вызов сразу (leading) + блокировка на N мс через{' '}
                <code>setTimeout</code> (macrotask).
              </li>
              <li>
                <strong>Debounce:</strong> сброс таймера на каждом событии — вызов произойдёт только
                после паузы.
              </li>
              <li>
                Оба паттерна "схлопывают" поток событий до фиксированной частоты, помогая UI
                оставаться отзывчивым.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>Конвейер рендеринга</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>~16.6мс</strong> на кадр при 60Hz, ~8.3мс при 120Hz.
              </li>
              <li>
                Порядок: микрозадачи → <code>rAF</code> → Style → Layout → Paint → Composite.
              </li>
              <li>
                Браузер может пропустить кадр, если визуальных изменений нет, или объединить несколько
                макрозадач до paint.
              </li>
            </ul>
          </div>

          <div className='el-theory-card'>
            <h4>Отличия в Node.js (Libuv)</h4>
            <ul className='el-theory-list'>
              <li>
                <strong>Нет визуализации:</strong> отсутствуют фазы Rendering / rAF / Paint.
              </li>
              <li>
                <strong>process.nextTick():</strong> приоритет выше стандартной microtask queue.
              </li>
              <li>
                <strong>setImmediate():</strong> выполняется в фазе Check после Poll.
              </li>
              <li>
                Фазы: Timers → Pending → Idle/Prepare → Poll → Check → Close.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Timeline View ─────────────────────────────────────────────────────────

function TimelineView({
  steps,
  currentIndex,
  onSelect,
}: {
  steps: Step[]
  currentIndex: number
  onSelect: (idx: number) => void
}) {
  // Determine timeline bounds
  const times = steps.map(s => s.tMs ?? 0)
  const maxT = Math.max(...times, 1)
  const minT = 0

  // We'll use log-ish scaling for nicer distribution if range is large
  const scale = (t: number) => {
    if (maxT <= 20) return ((t - minT) / (maxT - minT)) * 100
    // Hybrid: emphasize 0-20ms region, then compress
    const earlyMax = 20
    if (t <= earlyMax) return (t / earlyMax) * 50 // first half of bar
    return 50 + ((t - earlyMax) / (maxT - earlyMax)) * 50
  }

  // Frame markers at multiples of 16.6ms within range
  const frameMarkers: number[] = []
  for (let f = 16.6; f <= maxT; f += 16.6) {
    frameMarkers.push(f)
  }

  return (
    <div className='el-timeline'>
      <div className='el-timeline-header'>
        <span className='el-timeline-title'>Timeline (виртуальное время)</span>
        <span className='el-timeline-legend'>
          <span className='el-tm-frame-dot' /> кадр 16.6мс ·{' '}
          <span style={{ color: '#4f46e5' }}>●</span> текущий шаг
        </span>
      </div>

      <div className='el-timeline-bar'>
        {/* Frame markers */}
        {frameMarkers.map((f, i) => (
          <div
            key={`frame-${i}`}
            className='el-timeline-frame'
            style={{ left: `${scale(f)}%` }}
            title={`Кадр ~${f.toFixed(1)}мс`}
          >
            <span>{f.toFixed(0)}мс</span>
          </div>
        ))}

        {/* Step dots */}
        {steps.map((s, i) => {
          const t = s.tMs ?? 0
          const left = scale(t)
          const color = PHASE_COLOR[s.phase]
          const isCurrent = i === currentIndex
          return (
            <button
              key={i}
              className={`el-timeline-dot ${isCurrent ? 'current' : ''}`}
              style={{
                left: `${left}%`,
                background: color,
                boxShadow: isCurrent ? `0 0 0 4px ${color}33` : 'none',
              }}
              onClick={() => onSelect(i)}
              title={`#${i + 1} · t≈${t}мс · ${s.phaseText}`}
            >
              <span className='el-timeline-dot-label'>{PHASE_LABEL[s.phase]}</span>
            </button>
          )
        })}
      </div>

      <div className='el-timeline-axis'>
        <span>0мс</span>
        <span>{(maxT / 2).toFixed(1)}мс</span>
        <span>{maxT.toFixed(1)}мс</span>
      </div>
    </div>
  )
}

// ─── React Page Demo (mini browser preview synced with Event Loop step) ────

function ReactPageDemo({
  step,
  variant = 'fetch',
}: {
  step: Step
  variant?: 'fetch' | 'render'
}) {
  // Derive UI state from the step's phase + console
  const isInitialRender =
    step.phase === 'react-render' && !step.console.includes('paint: skeleton')
  const isCommit = step.phase === 'react-commit'
  const isIdle = step.phase === 'idle'

  // Determine page state based on console history
  const log = step.console
  const skeletonShown = log.includes('render: loading') || isInitialRender
  const skeletonPainted = log.includes('paint: skeleton')
  const fetchStarted = log.includes('useEffect: fetch start')
  const networkReceived = log.includes('response received')
  const stateUpdated = log.includes('setState: data')
  const dataRendered = log.includes('render: success')
  const dataPainted = log.includes('paint: data shown')

  let stage:
    | 'mount'
    | 'render-skeleton'
    | 'commit-skeleton'
    | 'paint-skeleton'
    | 'fetching'
    | 'response'
    | 'updating'
    | 'render-data'
    | 'paint-data'
    | 'done' = 'mount'

  if (variant === 'render') {
    // For React render demo: simpler stages
    if (log.includes('paint')) stage = 'paint-data'
    else if (isCommit) stage = 'commit-skeleton'
    else if (step.phase === 'react-render') stage = 'render-skeleton'
    else if (isIdle) stage = 'done'
  } else {
    if (dataPainted) stage = 'paint-data'
    else if (dataRendered) stage = 'render-data'
    else if (stateUpdated) stage = 'updating'
    else if (networkReceived) stage = 'response'
    else if (fetchStarted) stage = 'fetching'
    else if (skeletonPainted) stage = 'paint-skeleton'
    else if (isCommit) stage = 'commit-skeleton'
    else if (skeletonShown) stage = 'render-skeleton'
  }

  const stageMeta: Record<
    typeof stage,
    { color: string; label: string; hint: string }
  > = {
    mount: { color: '#94a3b8', label: 'Mount', hint: 'React готовится к первому рендеру' },
    'render-skeleton': {
      color: '#0ea5e9',
      label: 'Render',
      hint: 'Компонент вызывается, status=loading',
    },
    'commit-skeleton': {
      color: '#6366f1',
      label: 'Commit',
      hint: 'Skeleton попадает в DOM',
    },
    'paint-skeleton': {
      color: '#22c55e',
      label: 'Paint',
      hint: 'Пользователь видит skeleton',
    },
    fetching: {
      color: '#f59e0b',
      label: 'Fetching',
      hint: 'useEffect → fetch() → ждём сеть',
    },
    response: {
      color: '#ef4444',
      label: 'Response',
      hint: 'Network macrotask: ответ пришёл',
    },
    updating: {
      color: '#a855f7',
      label: 'setState',
      hint: 'Микрозадача → setState → schedule render',
    },
    'render-data': {
      color: '#0ea5e9',
      label: 'Re-render',
      hint: 'React вызывает компонент с новыми данными',
    },
    'paint-data': {
      color: '#22c55e',
      label: 'Paint',
      hint: 'Пользователь видит данные',
    },
    done: { color: '#94a3b8', label: 'Idle', hint: 'Готово' },
  }

  const meta = stageMeta[stage]

  return (
    <div className='el-page-demo'>
      <div className='el-page-demo-header'>
        <span className='el-page-demo-title'>
          🌐 Что видит пользователь на странице
        </span>
        <span
          className='el-page-demo-stage'
          style={{ background: `${meta.color}1a`, color: meta.color, borderColor: meta.color }}
        >
          {meta.label}
        </span>
      </div>

      <div className='el-browser-frame'>
        <div className='el-browser-chrome'>
          <span className='el-browser-dot dot-r' />
          <span className='el-browser-dot dot-y' />
          <span className='el-browser-dot dot-g' />
          <span className='el-browser-url'>https://app.example.com/user</span>
        </div>

        <div className='el-browser-viewport'>
          {/* "Painted" state determines what's actually on screen */}
          {stage === 'mount' && (
            <div className='el-page-empty'>
              <span>пустая страница (рендер ещё не произошёл)</span>
            </div>
          )}

          {(stage === 'render-skeleton' || stage === 'commit-skeleton') && (
            <div className='el-page-buffer'>
              <div className='el-buffer-badge'>В памяти React: skeleton (ещё не paint)</div>
              <PageSkeleton dim />
            </div>
          )}

          {(stage === 'paint-skeleton' ||
            stage === 'fetching' ||
            stage === 'response' ||
            stage === 'updating') && (
            <div className='el-page-painted'>
              <PageSkeleton />
              {stage === 'fetching' && (
                <div className='el-net-bar'>
                  <span className='el-net-spinner' /> GET /api/user — pending...
                </div>
              )}
              {stage === 'response' && (
                <div className='el-net-bar el-net-bar-success'>
                  ✓ GET /api/user — 200 OK
                </div>
              )}
              {stage === 'updating' && (
                <div className='el-net-bar el-net-bar-info'>
                  ⚛ setState(data) → schedule re-render
                </div>
              )}
            </div>
          )}

          {stage === 'render-data' && (
            <div className='el-page-buffer'>
              <div className='el-buffer-badge'>В памяти React: новый DOM (ещё не paint)</div>
              <PageData dim />
            </div>
          )}

          {(stage === 'paint-data' || stage === 'done') && (
            <div className='el-page-painted'>
              <PageData />
            </div>
          )}
        </div>
      </div>

      <div className='el-page-demo-hint'>
        <strong>{meta.label}:</strong> {meta.hint}
      </div>
    </div>
  )
}

function PageSkeleton({ dim = false }: { dim?: boolean }) {
  return (
    <div className={`el-skeleton-card ${dim ? 'dim' : ''}`}>
      <div className='el-sk-avatar' />
      <div className='el-sk-lines'>
        <div className='el-sk-line' style={{ width: '60%' }} />
        <div className='el-sk-line' style={{ width: '80%' }} />
        <div className='el-sk-line' style={{ width: '45%' }} />
      </div>
    </div>
  )
}

function PageData({ dim = false }: { dim?: boolean }) {
  return (
    <div className={`el-data-card ${dim ? 'dim' : ''}`}>
      <div className='el-data-avatar'>👤</div>
      <div className='el-data-info'>
        <div className='el-data-name'>Alibek Sopuev</div>
        <div className='el-data-meta'>Senior Frontend Engineer</div>
        <div className='el-data-meta'>alibeksopuev@gmail.com</div>
      </div>
    </div>
  )
}

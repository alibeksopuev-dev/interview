export type PromiseState = 'pending' | 'fulfilled' | 'rejected' | 'idle'

export interface PromiseItem {
  id: string
  label: string
  delayMs: number
  rejects?: boolean
  value?: string
  error?: string
}

export interface MethodCase {
  id: string
  title: string
  badge: string
  description: string
  tip: string
  code: string[]
  promises: PromiseItem[]
  behavior: string
  implementationCode?: string[]
  complexity?: {
    time: string
    space: string
  }
  resolveRejectConnection?: string
  explanationSteps?: {
    title: string
    text: string
  }[]
}

export const METHOD_CASES: MethodCase[] = [
  {
    id: 'all',
    title: 'Promise.all',
    badge: 'Параллельно',
    description:
      'Ждёт ВСЕ промисы. Если хоть один отклонён — сразу reject. Возвращает массив всех результатов в том же порядке.',
    tip: 'Используй когда все результаты нужны вместе (user + posts + tags одновременно).',
    code: [
      'const [user, posts, tags] = await Promise.all([',
      '  fetchUser(),    // 300мс',
      '  fetchPosts(),   // 500мс',
      '  fetchTags(),    // 200мс',
      '])',
      '// Готово за 500мс, не за 1000мс!',
    ],
    promises: [
      { id: 'p1', label: 'fetchUser()', delayMs: 1200, value: '{ name: "Alibek" }' },
      { id: 'p2', label: 'fetchPosts()', delayMs: 2000, value: '[3 поста]' },
      { id: 'p3', label: 'fetchTags()', delayMs: 800, value: '["js", "ts"]' },
    ],
    behavior: 'all-success',
    complexity: {
      time: 'O(N) — один проход forEach для подписки на каждый промис',
      space: 'O(N) — выделяется массив результатов results фиксированной длины N',
    },
    resolveRejectConnection:
      'Внутри new Promise мы вызываем resolve(results) только когда счётчик unresolved доходит до 0 (все промисы успешно завершились). Если любой из промисов падает, вызывается reject(err), что переводит внешний промис в rejected с первой же ошибкой. Навешенные на внешний промис .then() сработают при resolve(), а .catch() — при reject().',
    implementationCode: [
      'type ReturnValue<T> = { -readonly [P in keyof T]: Awaited<T[P]> };',
      '',
      'export default function promiseAll<T extends readonly unknown[] | []>(',
      '  iterable: T,',
      '): Promise<ReturnValue<T>> {',
      '  return new Promise((resolve, reject) => {',
      '    const results = new Array(iterable.length);',
      '    let unresolved = iterable.length;',
      '',
      '    if (unresolved === 0) {',
      '      resolve(results as ReturnValue<T>);',
      '      return;',
      '    }',
      '',
      '    iterable.forEach(async (item, index) => {',
      '      try {',
      '        const value = await item;',
      '        results[index] = value;',
      '        unresolved -= 1;',
      '',
      '        if (unresolved === 0) {',
      '          resolve(results as ReturnValue<T>);',
      '          }',
      '      } catch (err) {',
      '        reject(err);',
      '      }',
      '    });',
      '  });',
      '}',
    ],
    explanationSteps: [
      {
        title: 'Инициализация',
        text: 'Создаётся внешний промис через new Promise. Инициализируется массив results длиной N и счётчик unresolved равный N.',
      },
      {
        title: 'Запуск параллельного ожидания',
        text: 'Метод forEach проходит по всем переданным элементам и сразу же ожидает их выполнения. Итерация не блокируется, все промисы стартуют одновременно.',
      },
      {
        title: 'Счётчик unresolved и сохранение порядка',
        text: 'При успешном разрешении каждого элемента значение сохраняется под исходным индексом, гарантируя совпадение порядка. unresolved уменьшается на 1.',
      },
      {
        title: 'Финальный resolve или быстрый reject',
        text: 'Когда unresolved равен 0, вызывается внешний resolve(). Если хоть один промис упал в catch — сразу вызывается reject(). Повторные вызовы resolve/reject игнорируются.',
      },
    ],
  },
  {
    id: 'all-fail',
    title: 'Promise.all (ошибка)',
    badge: 'Fail Fast',
    description:
      'Если хотя бы один промис упал — Promise.all немедленно отклоняется. Остальные промисы продолжают работать в фоне, но результаты теряются.',
    tip: 'Это называется "fail-fast" — провал одного убивает всё. Для устойчивости используй allSettled.',
    code: [
      'try {',
      '  const [a, b, c] = await Promise.all([',
      '    fetchA(),  // OK',
      '    fetchB(),  // ОШИБКА через 800мс',
      '    fetchC(),  // OK, но результат потерян',
      '  ])',
      '} catch (err) {',
      '  console.log(err) // "Network Error"',
      '}',
    ],
    promises: [
      { id: 'p1', label: 'fetchA()', delayMs: 1500, value: '"data A"' },
      { id: 'p2', label: 'fetchB()', delayMs: 800, rejects: true, error: 'Network Error' },
      { id: 'p3', label: 'fetchC()', delayMs: 1200, value: '"data C"' },
    ],
    behavior: 'all-fail',
    complexity: {
      time: 'O(N) — подписка на промисы.',
      space: 'O(N) — хранение результатов до первой ошибки.',
    },
    resolveRejectConnection:
      'Первый же возникший reject(err) во внутреннем цикле мгновенно отклоняет весь Promise.all. Любые последующие успешные выполнения resolve() или другие reject() игнорируются, так как состояние промиса уже зафиксировано. Внешние обработчики .catch() сработают незамедлительно.',
    implementationCode: [
      '// Реализация идентична Promise.all. Ключевая особенность — мгновенный вызов reject(err):',
      'iterable.forEach(async (item) => {',
      '  try {',
      '    const value = await item;',
      '    // ...',
      '  } catch (err) {',
      '    reject(err); // Любой первый сбой сразу останавливает успешный исход',
      '  }',
      '})',
    ],
    explanationSteps: [
      {
        title: 'Параллельный старт',
        text: 'Все промисы запускаются одновременно в фоновом режиме.',
      },
      {
        title: 'Первое отклонение (reject)',
        text: 'На 800мс падает fetchB. Внутри срабатывает блок catch, который вызывает reject(err) внешнего промиса.',
      },
      {
        title: 'Игнорирование остальных',
        text: 'На 1200мс и 1500мс завершаются fetchC и fetchA. Но внешний промис уже перешёл в статус rejected, его состояние изменить нельзя.',
      },
    ],
  },
  {
    id: 'allSettled',
    title: 'Promise.allSettled',
    badge: 'Все результаты',
    description:
      'Ждёт ВСЕ промисы, независимо от результата. Никогда не отклоняется. Возвращает массив объектов со статусом каждого промиса.',
    tip: 'Используй когда нужно собрать ВСЕ результаты, даже если часть упала. Например: массовая загрузка файлов.',
    code: [
      'const results = await Promise.allSettled([',
      '  fetchA(),  // OK',
      '  fetchB(),  // ОШИБКА',
      '  fetchC(),  // OK',
      '])',
      '',
      '// results[0] → { status: "fulfilled", value: "A" }',
      '// results[1] → { status: "rejected",  reason: "err" }',
      '// results[2] → { status: "fulfilled", value: "C" }',
    ],
    promises: [
      { id: 'p1', label: 'fetchA()', delayMs: 1200, value: '"data A"' },
      { id: 'p2', label: 'fetchB()', delayMs: 800, rejects: true, error: 'Timeout' },
      { id: 'p3', label: 'fetchC()', delayMs: 1600, value: '"data C"' },
    ],
    behavior: 'allSettled',
    complexity: {
      time: 'O(N) — ожидание всех элементов.',
      space: 'O(N) — массив результатов, содержащий описания статусов.',
    },
    resolveRejectConnection:
      'Функция reject во внешнем new Promise никогда не вызывается. Все исключения перехватываются в блоке catch и превращаются в обычные объекты со свойством status: "rejected". Внешний промис всегда переходит в состояние fulfilled (вызов resolve(results)), что позволяет обрабатывать результаты в секции .then() без риска ухода в .catch().',
    implementationCode: [
      'type SettledResult<T> =',
      '  | { status: "fulfilled"; value: Awaited<T> }',
      '  | { status: "rejected"; reason: any };',
      '',
      'export default function promiseAllSettled<T extends readonly unknown[] | []>(',
      '  iterable: T,',
      '): Promise<{ -readonly [P in keyof T]: SettledResult<T[P]> }> {',
      '  return new Promise((resolve) => {',
      '    const results = new Array(iterable.length);',
      '    let unresolved = iterable.length;',
      '',
      '    if (unresolved === 0) {',
      '      resolve(results as any);',
      '      return;',
      '    }',
      '',
      '    iterable.forEach(async (item, index) => {',
      '      try {',
      '        const value = await item;',
      '        results[index] = { status: "fulfilled", value };',
      '      } catch (reason) {',
      '        results[index] = { status: "rejected", reason };',
      '      } finally {',
      '        unresolved -= 1;',
      '        if (unresolved === 0) {',
      '          resolve(results as any);',
      '        }',
      '      }',
      '    });',
      '  });',
      '}',
    ],
    explanationSteps: [
      {
        title: 'Инициализация',
        text: 'Создаётся внешний промис. reject не объявляется, так как метод никогда не отклоняется.',
      },
      {
        title: 'Безопасный перехват',
        text: 'Каждый элемент ожидает выполнения. Успех записывается как {status: "fulfilled", value}. Сбой перехватывается в catch и записывается как {status: "rejected", reason}.',
      },
      {
        title: 'Финальный сбор',
        text: 'В блоке finally уменьшается unresolved. Когда все элементы обработаны (unresolved === 0), вызывается resolve(results).',
      },
    ],
  },
  {
    id: 'race',
    title: 'Promise.race',
    badge: 'Гонка',
    description:
      'Возвращает результат ПЕРВОГО завершившегося промиса — неважно, выполнен или отклонён. Остальные промисы продолжают работать, но игнорируются.',
    tip: 'Применяй для таймаутов: Promise.race([fetch(...), timeout(5000)]) — что быстрее?',
    code: [
      'const result = await Promise.race([',
      '  fetchData(),         // долго',
      '  timeout(3000),       // 3 секунды',
      '])',
      '// Кто первый — тот и выиграл!',
    ],
    promises: [
      { id: 'p1', label: 'fetchData()', delayMs: 2000, value: '"fresh data"' },
      { id: 'p2', label: 'timeout(1s)', delayMs: 1000, rejects: true, error: 'Timeout!' },
    ],
    behavior: 'race',
    complexity: {
      time: 'O(N) — подписка на все промисы.',
      space: 'O(1) — память под результаты не выделяется.',
    },
    resolveRejectConnection:
      'Кто первый вызовет resolve(result) или reject(err) внутри цикла, тот и определит финальный исход внешнего промиса. После первого вызова состояние фиксируется, и все последующие вызовы resolve/reject от других участников гонки игнорируются.',
    implementationCode: [
      'export default function promiseRace<T extends readonly unknown[] | []>(',
      '  iterable: T,',
      '): Promise<Awaited<T[number]>> {',
      '  return new Promise((resolve, reject) => {',
      '    if (iterable.length === 0) {',
      '      return; // Оставляем в состоянии pending навсегда (как и нативный Promise.race)',
      '    }',
      '',
      '    iterable.forEach(async (item) => {',
      '      try {',
      '        const result = await item;',
      '        resolve(result as Awaited<T[number]>);',
      '      } catch (err) {',
      '        reject(err);',
      '      }',
      '    });',
      '  });',
      '}',
    ],
    explanationSteps: [
      {
        title: 'Запуск гонки',
        text: 'Все промисы запускаются параллельно. Если передан пустой массив, промис зависает в состоянии pending навсевно (поведение JS-спецификации).',
      },
      {
        title: 'Первое событие',
        text: 'Как только один из промисов разрешается или отклоняется, его результат передаётся внешнему resolve() или reject().',
      },
      {
        title: 'Фиксация состояния',
        text: 'Поскольку промисы одноразовые, все последующие результаты просто игнорируются.',
      },
    ],
  },
  {
    id: 'any',
    title: 'Promise.any',
    badge: 'Первый успех',
    description:
      'Возвращает результат ПЕРВОГО успешно выполненного промиса. Ошибки игнорируются. Отклоняется только если ВСЕ промисы провалились (AggregateError).',
    tip: 'Идеально для резервных источников: попробуй сервер A, B, C — возьми ответ самого быстрого живого.',
    code: [
      'const data = await Promise.any([',
      '  fetchFromServerA(),  // ОШИБКА',
      '  fetchFromServerB(),  // OK (медленно)',
      '  fetchFromCache(),    // OK (быстро) ← победитель',
      '])',
      '// Первый успех — данные из кеша',
    ],
    promises: [
      { id: 'p1', label: 'serverA()', delayMs: 600, rejects: true, error: '503 Error' },
      { id: 'p2', label: 'serverB()', delayMs: 1800, value: '"from server B"' },
      { id: 'p3', label: 'cache()', delayMs: 1000, value: '"from cache"' },
    ],
    behavior: 'any',
    complexity: {
      time: 'O(N) — подписка на промисы.',
      space: 'O(N) — для хранения ошибок всех промисов на случай общего сбоя.',
    },
    resolveRejectConnection:
      'Любой первый успешный промис вызывает resolve(value), фиксируя успешное состояние. Внутренний reject вызывается только если счётчик ошибок достигает N. При этом создаётся объект AggregateError, содержащий все накопленные ошибки, и передаётся в reject(new AggregateError(...)). Навешенный .catch() сработает только при тотальном сбое.',
    implementationCode: [
      'export default function promiseAny<T extends readonly unknown[] | []>(',
      '  iterable: T,',
      '): Promise<Awaited<T[number]>> {',
      '  return new Promise((resolve, reject) => {',
      '    let rejectedCount = 0;',
      '    const errors: any[] = [];',
      '',
      '    if (iterable.length === 0) {',
      '      reject(new AggregateError([], "All promises were rejected"));',
      '      return;',
      '    }',
      '',
      '    iterable.forEach(async (item, index) => {',
      '      try {',
      '        const value = await item;',
      '        resolve(value as Awaited<T[number]>);',
      '      } catch (err) {',
      '        errors[index] = err;',
      '        rejectedCount += 1;',
      '        if (rejectedCount === iterable.length) {',
      '          reject(new AggregateError(errors, "All promises were rejected"));',
      '        }',
      '      }',
      '    });',
      '  });',
      '}',
    ],
    explanationSteps: [
      {
        title: 'Инициализация',
        text: 'Создаётся внешний промис, счётчик rejectedCount = 0 и массив ошибок errors.',
      },
      {
        title: 'Игнорирование ошибок',
        text: 'Если промис падает в catch, мы записываем его ошибку в массив по индексу и инкрементируем счётчик.',
      },
      {
        title: 'Быстрый успех или финальный сбой',
        text: 'Первый успешный промис немедленно вызывает resolve(). Если же абсолютно все промисы упали, срабатывает условие rejectedCount === N и вызывается reject() с AggregateError.',
      },
    ],
  },
  {
    id: 'constructor',
    title: 'new Promise()',
    badge: 'Основы',
    description:
      'Ручное создание промиса через конструктор. Внутрь передаётся функция-executor с двумя колбэками: resolve (успех) и reject (ошибка). Executor запускается синхронно.',
    tip: 'Используй когда нужно обернуть callback-based API (setTimeout, XMLHttpRequest, fs.readFile) в промис.',
    code: [
      'const myPromise = new Promise((resolve, reject) => {',
      '  // Этот код выполняется СИНХРОННО прямо сейчас',
      '  ',
      '  setTimeout(() => {',
      '    const success = Math.random() > 0.3',
      '    if (success) {',
      '      resolve("Готово!")',
      '    } else {',
      '      reject("Что-то пошло не так")',
      '    }',
      '  }, 1000)',
      '})',
    ],
    promises: [
      { id: 'p1', label: 'new Promise()', delayMs: 1500, value: '"Готово!"' },
    ],
    behavior: 'constructor',
    complexity: {
      time: 'O(1) — создание экземпляра промиса.',
      space: 'O(1) — выделение памяти под внутреннее состояние.',
    },
    resolveRejectConnection:
      'resolve и reject — это системные функции JavaScript, передаваемые в executor. Вызов resolve(x) переводит состояние из pending в fulfilled и вызывает обработчики .then(). Вызов reject(e) переводит его в rejected и активирует цепочку .catch(). Вызов finally() сработает при любом исходе после очистки текущей микрозадачи.',
    implementationCode: [
      '// Конструктор позволяет вручную управлять жизненным циклом промиса:',
      'const wait = (ms: number) => {',
      '  return new Promise<void>((resolve, reject) => {',
      '    if (ms < 0) return reject(new Error("Некорректное время"));',
      '    setTimeout(() => {',
      '      resolve(); // сигнализирует об успешном завершении',
      '    }, ms);',
      '  });',
      '};',
    ],
    explanationSteps: [
      {
        title: 'Запуск executor-а',
        text: 'Колбэк, переданный в new Promise, выполняется немедленно и синхронно. Асинхронным является только разрешение промиса в будущем.',
      },
      {
        title: 'Связь с методами Promise.resolve / reject',
        text: 'Вызов resolve(val) ведёт себя аналогично Promise.resolve(val) (если val не является промисом). Вызов reject(err) — аналогично Promise.reject(err).',
      },
      {
        title: 'Связь с .then / .catch',
        text: 'Как только вызван один из колбэков, среда выполнения планирует запуск соответствующих методов-слушателей в очереди микрозадач.',
      },
    ],
  },
  {
    id: 'resolve-reject',
    title: 'Promise.resolve / reject',
    badge: 'Утилиты',
    description:
      'Promise.resolve(value) создаёт уже выполненный промис. Promise.reject(reason) — уже отклонённый. Полезны для тестов и для оборачивания готовых значений.',
    tip: 'Promise.resolve() идемпотентен: Promise.resolve(somePromise) вернёт тот же промис без обёртки.',
    code: [
      '// Уже выполненный промис:',
      'const p1 = Promise.resolve(42)',
      'await p1 // → 42 (мгновенно)',
      '',
      '// Уже отклонённый промис:',
      'const p2 = Promise.reject(new Error("fail"))',
      'await p2 // → throws Error("fail")',
      '',
      '// Идемпотентность:',
      'Promise.resolve(p1) === p1 // true (тот же объект)',
    ],
    promises: [
      { id: 'p1', label: 'Promise.resolve(42)', delayMs: 300, value: '42' },
      { id: 'p2', label: 'Promise.reject(err)', delayMs: 600, rejects: true, error: 'Error: fail' },
    ],
    behavior: 'resolve-reject',
    complexity: {
      time: 'O(1) — создание предрешённого промиса.',
      space: 'O(1) — константная память.',
    },
    resolveRejectConnection:
      'Promise.resolve(val) — это короткая запись для new Promise(r => r(val)), за исключением того, что если val уже является промисом, Promise.resolve вернёт его без изменений (идемпотентность). Promise.reject(err) аналогичен new Promise((_, r) => r(err)). Они напрямую переходят в fulfilled/rejected и запускают .then()/.catch() в следующей микрозадаче.',
    implementationCode: [
      '// Эквиваленты через конструктор new Promise():',
      'const myResolve = (value) => new Promise((resolve) => resolve(value));',
      'const myReject = (reason) => new Promise((_, reject) => reject(reason));',
      '',
      '// Проверка идемпотентности:',
      'const original = Promise.resolve(10);',
      'console.log(Promise.resolve(original) === original); // true',
    ],
    explanationSteps: [
      {
        title: 'Прямой переход',
        text: 'Промис создаётся сразу в состоянии fulfilled или rejected без нахождения в состоянии pending.',
      },
      {
        title: 'Идемпотентность',
        text: 'Если передать промис в Promise.resolve(), он возвращается как есть. Это полезно, чтобы гарантировать, что переменная является промисом, не создавая лишних обёрток.',
      },
    ],
  },
  {
    id: 'chaining',
    title: '.then / .catch / .finally',
    badge: 'Цепочки',
    description:
      'Методы экземпляра промиса. .then(onFulfilled, onRejected) — обрабатывает успех/ошибку. .catch(onRejected) — только ошибки. .finally(fn) — выполняется всегда.',
    tip: '.then() возвращает новый промис — это основа цепочек. .finally() не получает значение и не меняет его.',
    code: [
      'fetch("/api/user")',
      '  .then(res => res.json())      // парсим JSON',
      '  .then(user => user.name)      // берём имя',
      '  .catch(err => "Гость")        // при ошибке — дефолт',
      '  .finally(() => setLoading(false)) // всегда',
    ],
    promises: [
      { id: 'p1', label: 'fetch()', delayMs: 800, value: 'Response' },
      { id: 'p2', label: '.then(res.json)', delayMs: 400, value: '{ name: "Ali" }' },
      { id: 'p3', label: '.then(user.name)', delayMs: 200, value: '"Ali"' },
    ],
    behavior: 'chaining',
    complexity: {
      time: 'O(M) — где M это длина цепочки вызовов.',
      space: 'O(M) — каждый вызов .then/.catch возвращает новый промис.',
    },
    resolveRejectConnection:
      'Каждый вызов .then() или .catch() создаёт новый промис и возвращает его. Если колбэк внутри возвращает обычное значение, созданный промис переходит в fulfilled(значение). Если возвращает промис — перенимает его состояние. Если выбрасывает исключение throw — автоматически вызывает reject(error). Метод .finally(fn) пропускает исходное значение дальше, не изменяя его.',
    implementationCode: [
      '// Имитация создания нового промиса в цепочке:',
      'const myThen = (onFulfilled) => {',
      '  return new Promise((resolve, reject) => {',
      '    // При успехе текущего промиса вызывается onFulfilled:',
      '    try {',
      '      const result = onFulfilled(currentValue);',
      '      resolve(result); // возвращаем новый выполненный промис',
      '    } catch (err) {',
      '      reject(err); // если упало — новый промис отклонён',
      '    }',
      '  });',
      '};',
    ],
    explanationSteps: [
      {
        title: 'Создание нового промиса',
        text: 'Каждый вызов метода возвращает новый промис. Это позволяет строить последовательные цепочки асинхронных шагов.',
      },
      {
        title: 'Перехват ошибок с помощью .catch',
        text: '.catch(fn) эквивалентен .then(null, fn). Он ловит ошибку на любом предыдущем шаге цепочки, если она не была обработана ранее.',
      },
      {
        title: 'Нейтральный .finally',
        text: 'Функция в .finally не принимает аргументов и её возвращаемое значение игнорируется (если она не бросает ошибку), позволяя пробросить результат цепочки далее.',
      },
    ],
  },
]

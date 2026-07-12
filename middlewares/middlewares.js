"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// ЗАДАЧА: Middlewares (композиция промежуточных функций)
//
// Реализовать функцию middlewares, которая принимает любое количество
// middleware-функций и объединяет их в одну вызываемую функцию.
// Скомпонованная функция принимает context, возвращает Promise
// и вызывает каждый middleware ПО ПОРЯДКУ.
//
// Каждый middleware получает два аргумента:
//   · context — объект, общий для всех middleware (они его мутируют)
//   · next    — функция, которая запускает СЛЕДУЮЩИЙ middleware в цепочке
//
// Когда вызывается next(), запускается следующий middleware.
// Если middleware НЕ вызвал next() — цепочка останавливается.
//
// Выполнение должно быть АСИНХРОННЫМ и ПОСЛЕДОВАТЕЛЬНЫМ,
// как middleware работает во фреймворках вроде Koa.
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewaresTraced = exports.middlewaresWithThen = exports.middlewaresNoComment = void 0;
function middlewaresNoComment(...fns) {
    return async function (context = {}) {
        async function execute(index) {
            if (index === fns.length) {
                return;
            }
            const fn = fns[index];
            await fn(context, () => execute(index + 1));
        }
        await execute(0);
    };
}
exports.middlewaresNoComment = middlewaresNoComment;
// ─────────────────────────────────────────────────────────────────────────────
// РЕШЕНИЕ: рекурсивная композиция
//
// Главная идея — это композиция функций с передачей управления через next().
// Ключевой приём — РЕКУРСИЯ.
//
// Почему НЕ обычный цикл for?
//   Цикл всегда прогнал бы все функции подряд. Но здесь middleware сам решает,
//   вызывать ли next() и когда. `await next()` должен приостановить текущий
//   middleware, пока не завершится ВСЯ нижележащая часть цепочки.
//   Цикл такого "паузa посередине" не умеет — а рекурсия умеет.
//
// Форма стека вызовов — "луковица" (onion):
//   fn1 начал → await next() → fn2 начал → await next() → fn3 (нет next) → резолв
//   → fn2 продолжил после await → fn1 продолжил после await
// ─────────────────────────────────────────────────────────────────────────────
function middlewares(...fns) {
    // Возвращаем скомпонованную функцию. Она принимает context (по умолчанию {})
    // и возвращает Promise (потому что async).
    return async function (context = {}) {
        // execute(index) — запускает middleware под номером index.
        async function execute(index) {
            // Дошли до конца цепочки — останавливаемся.
            // Это база рекурсии: последний next() просто ничего не делает.
            if (index === fns.length) {
                return;
            }
            // Берём текущий middleware.
            const fn = fns[index];
            // Вызываем его, передавая:
            //   · context — общий объект
            //   · () => execute(index + 1) — это и есть next(). Когда middleware
            //     вызовет next(), запустится СЛЕДУЮЩИЙ middleware.
            //
            // await нужен, чтобы если middleware async и делает `await next()`,
            // мы дождались завершения всей нижележащей цепочки прежде чем
            // продолжить текущий (та самая "луковица").
            await fn(context, () => execute(index + 1));
        }
        // Запускаем цепочку с первого middleware.
        await execute(0);
    };
}
exports.default = middlewares;
// ─────────────────────────────────────────────────────────────────────────────
// АЛЬТЕРНАТИВНЫЙ ПОДХОД: только промисы (без async/await)
//
// То же самое, но выражено через Promise.resolve().then(...).
// Promise.resolve() позволяет и sync, и async middleware идти по одному пути.
// ─────────────────────────────────────────────────────────────────────────────
function middlewaresWithThen(...fns) {
    return function (context = {}) {
        function execute(index) {
            if (index === fns.length) {
                return Promise.resolve();
            }
            const fn = fns[index];
            // Оборачиваем результат fn(...) в Promise.resolve, чтобы sync и async
            // middleware обрабатывались одинаково.
            return Promise.resolve(fn(context, () => execute(index + 1)));
        }
        return execute(0);
    };
}
exports.middlewaresWithThen = middlewaresWithThen;
// ─────────────────────────────────────────────────────────────────────────────
// ВЕРСИЯ С ПОДРОБНОЙ ТРАССИРОВКОЙ (для наглядности)
//
// Та же логика, что и в middlewares(), но с console.log на каждом шаге.
// Показывает "луковичный" поток: как управление уходит ВНИЗ по цепочке,
// доходит до ядра, а потом разворачивается ОБРАТНО НАВЕРХ.
//
// Обозначения (слева каждой строки):
//   ↓ ВХОД   — вызываем middleware #index (управление идёт вниз)
//   → NEXT   — middleware вызвал next(), уходим на следующий уровень
//   ⌂ ЯДРО   — конец цепочки, next() больше некого запускать
//   ⏸ AWAIT  — текущий middleware приостановлен на `await next()`
//   ▶ RESUME — нижняя часть завершилась, middleware продолжает после await
//   ↑ ВЫХОД  — middleware #index полностью завершился
//
// Отступ (indent) = глубина рекурсии. shot() печатает текущий стек context,
// чтобы было видно, как он наполняется по ходу выполнения.
// ─────────────────────────────────────────────────────────────────────────────
function middlewaresTraced(...fns) {
    let step = 0; // сквозной счётчик шагов, чтобы видеть реальный порядок событий
    return async function (context = {}) {
        console.log('═'.repeat(70));
        console.log(`🚀 СТАРТ. Всего middleware: ${fns.length}. context =`, context);
        console.log('═'.repeat(70));
        // Печать одной строки трассировки с номером шага, отступом и стеком context.
        const log = (index, mark, msg) => {
            step += 1;
            const pad = '│  '.repeat(index); // вертикальные направляющие по глубине
            const stack = Array.isArray(context.stack) ? ` stack=[${context.stack.join(', ')}]` : '';
            console.log(`шаг ${String(step).padStart(2, ' ')} ${pad}${mark} #${index}: ${msg}${stack}`);
        };
        async function execute(index) {
            // База рекурсии: дошли до конца — запускать больше некого.
            if (index === fns.length) {
                log(index, '⌂ ЯДРО', 'конец цепочки — next() ничего не запускает, возвращаемся');
                return;
            }
            const fn = fns[index];
            // Управление идёт ВНИЗ: запускаем middleware под номером index.
            log(index, '↓ ВХОД ', `вызываем middleware #${index} (fn(context, next))`);
            // Оборачиваем next(), чтобы залогировать и его вызов, и приостановку/возврат.
            const next = () => {
                log(index, '→ NEXT ', `middleware #${index} вызвал next() → передаём управление #${index + 1}`);
                log(index, '⏸ AWAIT', `middleware #${index} приостановлен, ждёт всю нижнюю цепочку`);
                const p = execute(index + 1);
                // Когда нижняя часть завершится — залогируем возобновление.
                return p.then(() => {
                    log(index, '▶ RESUME', `нижняя цепочка завершилась → middleware #${index} продолжает после await next()`);
                });
            };
            // await приостановит текущий middleware на `await next()`, пока не
            // завершится ВСЯ нижняя часть цепочки (та самая луковица).
            await fn(context, next);
            // Управление вернулось НАВЕРХ: нижняя часть цепочки полностью отработала.
            log(index, '↑ ВЫХОД', `middleware #${index} полностью завершился`);
        }
        await execute(0);
        console.log('═'.repeat(70));
        console.log(`🏁 ФИНАЛ. context =`, context);
        console.log('═'.repeat(70));
    };
}
exports.middlewaresTraced = middlewaresTraced;
// 1. Обработчик ошибок — ставится ПЕРВЫМ, оборачивает всю цепочку в try/catch.
async function errorHandler(ctx, next) {
    try {
        await next(); // если ЛЮБОЙ middleware ниже упадёт — поймаем здесь
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { error: err.message };
        console.log('  🛡️  errorHandler поймал ошибку:', err.message);
    }
}
// 2. Логгер — использует луковицу: замеряет время ДО и ПОСЛЕ обработки.
async function logger(ctx, next) {
    const start = Date.now();
    console.log(`  📝 → ${ctx.method} ${ctx.url}`); // до обработки
    await next(); // вся обработка запроса происходит тут
    const ms = Date.now() - start;
    console.log(`  📝 ← ${ctx.status} за ${ms}мс`); // после обработки
}
// 3. CORS — просто дополняет заголовки и пропускает дальше.
async function cors(ctx, next) {
    ctx.headers['Access-Control-Allow-Origin'] = '*';
    console.log('  🌐 cors: заголовки выставлены');
    await next();
}
// 4. Аутентификация — может ОБОРВАТЬ цепочку, не вызвав next().
async function auth(ctx, next) {
    const token = ctx.headers['authorization'];
    if (!token) {
        ctx.status = 401;
        ctx.body = 'Требуется авторизация';
        console.log('  🔐 auth: токена нет → 401, цепочка остановлена (next не вызван)');
        return; // ← НЕ вызываем next() → handler не запустится
    }
    ctx.user = { id: 1, name: 'Алибек' }; // "проверили токен", кладём юзера в context
    console.log('  🔐 auth: токен валиден → пропускаем дальше');
    await next();
}
// 5. Бизнес-логика — финальный обработчик, next() уже не нужен.
async function handler(ctx, _next) {
    console.log(`  🎯 handler: обрабатываю запрос для юзера "${ctx.user?.name}"`);
    ctx.status = 200;
    ctx.body = { message: `Привет, ${ctx.user?.name}!` };
}
async function realWorldExample() {
    const app = middlewares(errorHandler, logger, cors, auth, handler);
    console.log('\n=== Реальный пример A: валидный запрос (есть токен) ===');
    const ctxOk = {
        method: 'GET',
        url: '/api/user',
        headers: { authorization: 'token123' },
    };
    await app(ctxOk);
    console.log('  РЕЗУЛЬТАТ:', ctxOk.status, ctxOk.body);
    console.log('\n=== Реальный пример B: нет токена (auth обрывает цепочку) ===');
    const ctxNoAuth = {
        method: 'GET',
        url: '/api/user',
        headers: {}, // токена нет
    };
    await app(ctxNoAuth);
    console.log('  РЕЗУЛЬТАТ:', ctxNoAuth.status, ctxNoAuth.body);
    // handler НЕ запустился — auth оборвал цепочку
    console.log('\n=== Реальный пример C: handler бросает ошибку (errorHandler ловит) ===');
    const appWithError = middlewares(errorHandler, logger, cors, auth, async () => {
        throw new Error('База данных недоступна');
    });
    const ctxErr = {
        method: 'GET',
        url: '/api/user',
        headers: { authorization: 'token123' },
    };
    await appWithError(ctxErr);
    console.log('  РЕЗУЛЬТАТ:', ctxErr.status, ctxErr.body);
}
// ── Тесты ──────────────────────────────────────────────────────────────────
//
// Запуск: npx tsx middlewares.ts
// или:    npx ts-node middlewares.ts
async function runTests() {
    console.log('--- Тест 1: Базовая композиция (луковица) ---');
    async function fn1(ctx, next) {
        ctx.stack.push('fn1-start');
        await next();
        ctx.stack.push('fn1-end');
    }
    async function fn2(ctx, next) {
        ctx.stack.push('fn2-start');
        await new Promise((resolve) => setTimeout(resolve, 100));
        await next();
        ctx.stack.push('fn2-end');
    }
    function fn3(ctx, next) {
        ctx.stack.push('fn3-start');
        next();
        ctx.stack.push('fn3-end');
    }
    const composedFn = middlewares(fn1, fn2, fn3);
    const context = { stack: [] };
    await composedFn(context);
    console.log(context.stack);
    // ['fn1-start', 'fn2-start', 'fn3-start', 'fn3-end', 'fn2-end', 'fn1-end']
    console.log('--- Тест 2: Middleware не вызвал next() → цепочка стоп ---');
    const stopStack = [];
    const stopComposed = middlewares((ctx, next) => {
        stopStack.push('A');
        next();
    }, (ctx, next) => {
        stopStack.push('B');
        // next() НЕ вызван → C не запустится
    }, (ctx, next) => {
        stopStack.push('C');
        next();
    });
    await stopComposed({});
    console.log(stopStack); // ['A', 'B']
    console.log('--- Тест 3: Пустой список middleware ---');
    const emptyComposed = middlewares();
    await emptyComposed({}); // ничего не делает, не падает
    console.log('OK — не упало');
    console.log('--- Тест 4: Общий context мутируется всеми ---');
    const counterComposed = middlewares(async (ctx, next) => {
        ctx.count = (ctx.count ?? 0) + 1;
        await next();
    }, async (ctx, next) => {
        ctx.count += 10;
        await next();
    });
    const ctx4 = {};
    await counterComposed(ctx4);
    console.log(ctx4.count); // 11
    console.log('--- Тест 5: Вариант с .then (middlewaresWithThen) ---');
    const thenStack = [];
    const thenComposed = middlewaresWithThen(async (ctx, next) => {
        thenStack.push('1-start');
        await next();
        thenStack.push('1-end');
    }, async (ctx, next) => {
        thenStack.push('2');
        await next();
    });
    await thenComposed({});
    console.log(thenStack); // ['1-start', '2', '1-end']
    console.log('\n--- Тест 6: ПОДРОБНАЯ ТРАССИРОВКА (middlewaresTraced) ---');
    async function t1(ctx, next) {
        ctx.stack.push('fn1-start');
        await next();
        ctx.stack.push('fn1-end');
    }
    async function t2(ctx, next) {
        ctx.stack.push('fn2-start');
        await new Promise((resolve) => setTimeout(resolve, 100));
        await next();
        ctx.stack.push('fn2-end');
    }
    function t3(ctx, next) {
        ctx.stack.push('fn3-start');
        next();
        ctx.stack.push('fn3-end');
    }
    const tracedFn = middlewaresTraced(t1, t2, t3);
    await tracedFn({ stack: [] });
    // Пример применения в реальном проекте (HTTP-цепочка в стиле Koa).
    await realWorldExample();
}
runTests();

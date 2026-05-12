"use strict";
// =================================================================
// УСЛОЖНЕНИЕ: debounce с методами cancel() и flush()
// cancel() — отменяет отложенный вызов
// flush()  — немедленно выполняет отложенный вызов
// =================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = void 0;
// T extends (...args: any[]) => any — T должен быть функцией, иначе Parameters<T> не скомпилируется
function debounce(func, wait = 0) {
    // Три переменные замыкания — хранят состояние одного "ожидающего вызова"
    // ReturnType<typeof setTimeout> — кросс-платформенный тип ID таймера (number | NodeJS.Timeout)
    let timeoutId;
    // any — this может быть чем угодно в зависимости от того как вызвали debounced-функцию
    let context = undefined;
    // Parameters<T> | undefined — последние аргументы вызова, либо undefined если вызовов не было
    let argsToInvoke = undefined;
    // Отменяет таймер и сигнализирует что нет активного ожидания
    function clearTimer() {
        clearTimeout(timeoutId); // clearTimeout безопасно принимает undefined — это no-op
        timeoutId = undefined; // undefined = нет активного таймера (проверяем == null ниже)
    }
    // Немедленно выполняет отложенный вызов, если он есть
    function invoke() {
        if (timeoutId == null) {
            // == null ловит и null и undefined — нет ожидающего вызова
            return;
        }
        clearTimer(); // отменяем таймер — иначе он сработает ещё раз после invoke
        func.apply(context, argsToInvoke); // вызываем func с сохранёнными this и аргументами
    }
    // Обёртка — обычная function (НЕ стрелка): this определяется в момент вызова снаружи
    function fn(...args) {
        clearTimer(); // отменяем предыдущий таймер — каждый новый вызов сбрасывает отсчёт
        argsToInvoke = args; // сохраняем последние аргументы — flush/таймер используют именно их
        context = this; // сохраняем this — понадобится в invoke() через func.apply
        timeoutId = setTimeout(function () {
            invoke(); // по истечении wait вызываем invoke, который выполнит func
        }, wait);
    }
    // Вешаем методы прямо на функцию — в JS функция это объект, свойства добавляются как обычно
    fn.cancel = clearTimer; // cancel = просто отменить таймер и сбросить состояние
    fn.flush = invoke; // flush = выполнить немедленно то что ждёт таймера
    // as unknown as DebouncedFunction<T> — нужен двойной каст:
    // TS не знает что fn уже имеет cancel/flush до их присвоения выше,
    // поэтому приводим через unknown (промежуточный "любой тип") к нашему интерфейсу
    return fn;
}
exports.debounce = debounce;
function debounce1(func, wait = 0) {
    let timeoutId;
    let context = undefined;
    let argsToInvoke = undefined;
    function clearTimer() {
        clearTimeout(timeoutId);
        timeoutId = undefined;
    }
    function invoke() {
        // Don't invoke if there's no pending callback.
        if (timeoutId == null) {
            return;
        }
        clearTimer();
        func.apply(context, argsToInvoke);
    }
    function fn(...args) {
        clearTimer();
        // Keep only the latest call details for the trailing invocation.
        argsToInvoke = args;
        context = this;
        timeoutId = setTimeout(function () {
            invoke();
        }, wait);
    }
    // Expose the extra controls on the debounced function itself.
    fn.cancel = clearTimer;
    fn.flush = invoke;
    return fn;
}
exports.default = debounce1;

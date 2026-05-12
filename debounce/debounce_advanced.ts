// =================================================================
// УСЛОЖНЕНИЕ: debounce с методами cancel() и flush()
// cancel() — отменяет отложенный вызов
// flush()  — немедленно выполняет отложенный вызов
// =================================================================

// DebouncedFunction расширяет Function двумя методами
// Это intersection type: функция И объект с cancel/flush одновременно
interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void // сама debounced-функция — та же сигнатура что и оригинал
  cancel: () => void // отменить отложенный вызов
  flush: () => void // немедленно выполнить отложенный вызов
}

// T extends (...args: any[]) => any — T должен быть функцией, иначе Parameters<T> не скомпилируется
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number = 0): DebouncedFunction<T> {
  // Три переменные замыкания — хранят состояние одного "ожидающего вызова"
  // ReturnType<typeof setTimeout> — кросс-платформенный тип ID таймера (number | NodeJS.Timeout)
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  // any — this может быть чем угодно в зависимости от того как вызвали debounced-функцию
  let context: any = undefined
  // Parameters<T> | undefined — последние аргументы вызова, либо undefined если вызовов не было
  let argsToInvoke: Parameters<T> | undefined = undefined

  // Отменяет таймер и сигнализирует что нет активного ожидания
  function clearTimer() {
    clearTimeout(timeoutId) // clearTimeout безопасно принимает undefined — это no-op
    timeoutId = undefined // undefined = нет активного таймера (проверяем == null ниже)
  }

  // Немедленно выполняет отложенный вызов, если он есть
  function invoke() {
    if (timeoutId == null) {
      // == null ловит и null и undefined — нет ожидающего вызова
      return
    }
    clearTimer() // отменяем таймер — иначе он сработает ещё раз после invoke
    func.apply(context, argsToInvoke as Parameters<T>) // вызываем func с сохранёнными this и аргументами
  }

  // Обёртка — обычная function (НЕ стрелка): this определяется в момент вызова снаружи
  function fn(this: any, ...args: Parameters<T>) {
    clearTimer() // отменяем предыдущий таймер — каждый новый вызов сбрасывает отсчёт
    argsToInvoke = args // сохраняем последние аргументы — flush/таймер используют именно их
    context = this // сохраняем this — понадобится в invoke() через func.apply
    timeoutId = setTimeout(function () {
      invoke() // по истечении wait вызываем invoke, который выполнит func
    }, wait)
  }

  // Вешаем методы прямо на функцию — в JS функция это объект, свойства добавляются как обычно
  fn.cancel = clearTimer // cancel = просто отменить таймер и сбросить состояние
  fn.flush = invoke // flush = выполнить немедленно то что ждёт таймера

  // as unknown as DebouncedFunction<T> — нужен двойной каст:
  // TS не знает что fn уже имеет cancel/flush до их присвоения выше,
  // поэтому приводим через unknown (промежуточный "любой тип") к нашему интерфейсу
  return fn as unknown as DebouncedFunction<T>
}

// =================================================================
// REACT-ВЕРСИЯ: useDebouncedCallback
// Та же логика cancel/flush, но адаптированная для React:
// - состояние в useRef вместо let (не сбрасывается при ререндере)
// - useCallback для стабильных ссылок на функции
// - useEffect cleanup при размонтировании компонента
// =================================================================

// React-импорты закомментированы — этот файл не React-модуль
// import { useRef, useCallback, useEffect } from 'react'

// type DebouncedCallback<T extends (...args: any[]) => any> = {
//   (...args: Parameters<T>): void;
//   cancel: () => void;
//   flush: () => void;
// }

// function useDebouncedCallback<T extends (...args: any[]) => any>(
//   callback: T,
//   wait: number,
// ): DebouncedCallback<T> {
//
//   // useRef вместо let — значение живёт между рендерами, изменение не вызывает ререндер
//   const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
//   const argsRef    = useRef<Parameters<T> | undefined>(undefined); // аргументы последнего вызова
//   const contextRef = useRef<any>(undefined);                       // this последнего вызова
//
//   // useCallback(fn, []) — одна ссылка на весь цикл жизни компонента
//   // без этого: каждый рендер → новый clearTimer → deps useEffect меняются → бесконечный цикл
//   const clearTimer = useCallback(() => {
//     clearTimeout(timeoutRef.current);
//     timeoutRef.current = undefined;
//   }, []);
//
//   const invoke = useCallback(() => {
//     if (timeoutRef.current == null) return; // нет ожидающего вызова
//     clearTimer();
//     callback.apply(contextRef.current, argsRef.current);
//   }, [callback, clearTimer]);
//
//   const debounced = useCallback(function (this: any, ...args: Parameters<T>) {
//     argsRef.current    = args; // в ref, не в замыкание — иначе устареет после ререндера
//     contextRef.current = this;
//     clearTimer();
//     timeoutRef.current = setTimeout(invoke, wait);
//   }, [wait, callback, clearTimer, invoke]) as DebouncedCallback<T>;
//
//   useEffect(() => {
//     debounced.cancel = clearTimer;
//     debounced.flush  = invoke;
//     return () => clearTimer(); // unmount: отменяем таймер, иначе setState на мёртвом компоненте
//   }, [debounced, clearTimer, invoke]);
//
//   return debounced;
// }
//
// // Пример:
// // function SearchBar() {
// //   const search = useDebouncedCallback(async (q: string) => {
// //     const data = await fetchCustomers(q)
// //     setResults(data)
// //   }, 300)
// //   return (
// //     <>
// //       <input onChange={e => search(e.target.value)} />
// //       <button onClick={search.flush}>Найти сейчас</button>
// //       <button onClick={search.cancel}>Отмена</button>
// //     </>
// //   )
// // }

interface DebouncedFunction1 extends Function {
  cancel: () => void
  flush: () => void
}

export default function debounce1(func: Function, wait: number = 0): DebouncedFunction1 {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let context: any = undefined
  let argsToInvoke: Array<any> | undefined = undefined

  function clearTimer() {
    clearTimeout(timeoutId)
    timeoutId = undefined
  }

  function invoke() {
    // Don't invoke if there's no pending callback.
    if (timeoutId == null) {
      return
    }

    clearTimer()
    func.apply(context, argsToInvoke)
  }

  function fn(this: any, ...args: Array<any>) {
    clearTimer()
    // Keep only the latest call details for the trailing invocation.
    argsToInvoke = args
    context = this
    timeoutId = setTimeout(function () {
      invoke()
    }, wait)
  }

  // Expose the extra controls on the debounced function itself.
  fn.cancel = clearTimer
  fn.flush = invoke
  return fn
}

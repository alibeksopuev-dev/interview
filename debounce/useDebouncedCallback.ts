import { useRef, useCallback, useEffect } from 'react'

// =================================================================
// ТИПИЗАЦИЯ
// =================================================================

// Тип возврата хука — вызываемая функция И объект с cancel/flush одновременно
// { (...args): void } — call signature: описывает саму функцию внутри interface/type
// cancel/flush — методы навешанные на эту функцию как свойства объекта
type DebouncedCallback<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void; // Parameters<T> — те же аргументы что и у оригинала
  cancel: () => void;
  flush: () => void;
}

// =================================================================
// useDebouncedCallback — аналог debounce_advanced, безопасный для React
//
// Отличие от обычного debounce: в React функции пересоздаются на каждый рендер.
// Чтобы не плодить таймеры — храним состояние в useRef (не в замыкании),
// а сами функции стабилизируем через useCallback.
// =================================================================
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,   // T — тип переданного callback, TS выведет автоматически
  wait: number,
): DebouncedCallback<T> {

  // useRef<X> — ящик, который живёт всё время жизни компонента
  // .current можно менять без ререндера (в отличие от useState)
  // ReturnType<typeof setTimeout> — кросс-платформенный тип ID таймера
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const argsRef    = useRef<Parameters<T> | undefined>(undefined); // аргументы последнего вызова
  const contextRef = useRef<any>(undefined);                       // this последнего вызова

  // useCallback(fn, []) — мемоизирует функцию, возвращает одну и ту же ссылку
  // Без useCallback: каждый рендер создаёт новый clearTimer → useEffect deps меняются → бесконечный цикл
  const clearTimer = useCallback(() => {
    clearTimeout(timeoutRef.current); // clearTimeout с undefined — безопасный no-op
    timeoutRef.current = undefined;   // сигнал: нет активного таймера
  }, []); // [] — clearTimer никогда не меняется

  const invoke = useCallback(() => {
    if (timeoutRef.current == null) { // == null ловит и null и undefined
      return;                         // нет ожидающего вызова — выходим, как в debounce_advanced
    }
    clearTimer();                                          // отменяем таймер перед вызовом
    callback.apply(contextRef.current, argsRef.current);  // вызываем с сохранёнными this и args
  }, [callback, clearTimer]); // пересоздаём если изменился callback

  const debounced = useCallback(function (this: any, ...args: Parameters<T>) {
    argsRef.current    = args; // сохраняем последние аргументы — invoke возьмёт именно их
    contextRef.current = this; // сохраняем this — invoke передаст его через .apply
    clearTimer();              // отменяем предыдущий таймер — каждый новый вызов сбрасывает отсчёт
    timeoutRef.current = setTimeout(() => {
      invoke();                // по истечении wait → invoke выполнит callback
    }, wait);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wait, callback, clearTimer, invoke]) as DebouncedCallback<T>;
  // as DebouncedCallback<T> — каст нужен потому что useCallback не знает про cancel/flush,
  // которые навешиваем ниже; через unknown не идём — структура уже совместима

  // useEffect: навешиваем cancel/flush после каждого пересоздания debounced
  // и чистим таймер при размонтировании компонента
  useEffect(() => {
    debounced.cancel = clearTimer; // cancel — просто отменить таймер, callback не вызывается
    debounced.flush  = invoke;     // flush — немедленно выполнить ожидающий вызов

    return () => {
      clearTimer(); // размонтирование: отменяем висящий таймер — предотвращаем setState на мёртвом компоненте
    };
  }, [debounced, clearTimer, invoke]);

  return debounced;
}

// =================================================================
// ПРИМЕР ИСПОЛЬЗОВАНИЯ
// =================================================================

// function SearchBar() {
//   const [results, setResults] = useState([])
//
//   // Стабильная ссылка — не пересоздаётся на каждый рендер
//   const search = useDebouncedCallback(async (query: string) => {
//     const data = await fetchResults(query)
//     setResults(data)
//   }, 300)
//
//   return (
//     <>
//       <input onChange={e => search(e.target.value)} />
//       <button onClick={search.flush}>Найти сейчас</button>   // flush: не ждать таймера
//       <button onClick={search.cancel}>Отмена</button>         // cancel: отменить запрос
//     </>
//   )
// }

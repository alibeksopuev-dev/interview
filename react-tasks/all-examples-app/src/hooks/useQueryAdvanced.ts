import { DependencyList, useCallback, useEffect, useRef, useState } from 'react'

type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// =================================================================
// Модуль 1: Кэширование
// Глобальный Map — живёт всё время работы приложения.
// Ключ = строка (обычно URL), значение = любые данные.
// =================================================================
const cache = new Map<string, unknown>()

export function useQueryCached<T>(
  cacheKey: string,
  fn: () => Promise<T>,
  deps: DependencyList = [],
): AsyncState<T> & { fromCache: boolean } {
  const cached = cache.get(cacheKey) as T | undefined

  const [state, setState] = useState<AsyncState<T>>(
    // Если данные уже в кэше — сразу success, не показываем loading
    cached !== undefined
      ? { status: 'success', data: cached }
      : { status: 'loading' },
  )
  const [fromCache, setFromCache] = useState(cached !== undefined)

  useEffect(() => {
    // Кэш актуален — запрос не нужен
    if (cache.has(cacheKey)) {
      setState({ status: 'success', data: cache.get(cacheKey) as T })
      setFromCache(true)
      return
    }

    let ignore = false
    setState({ status: 'loading' })
    setFromCache(false)

    fn()
      .then(data => {
        if (ignore) return
        cache.set(cacheKey, data)
        setState({ status: 'success', data })
        setFromCache(false)
      })
      .catch(error => {
        if (ignore) return
        setState({ status: 'error', error })
      })

    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, fromCache }
}

export function clearCache(key?: string) {
  if (key) cache.delete(key)
  else cache.clear()
}

// =================================================================
// Модуль 2: Дедупликация запросов
// Если два компонента запрашивают одни данные одновременно —
// реально уходит только один HTTP-запрос, второй подписывается
// на тот же промис.
// =================================================================
const inFlight = new Map<string, Promise<unknown>>()

export function useQueryDeduped<T>(
  dedupKey: string,
  fn: () => Promise<T>,
  deps: DependencyList = [],
): AsyncState<T> & { deduped: boolean } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [deduped, setDeduped] = useState(false)

  useEffect(() => {
    let ignore = false
    setState({ status: 'loading' })

    let promise: Promise<T>
    if (inFlight.has(dedupKey)) {
      // Уже летит запрос с таким ключом — подписываемся на него
      promise = inFlight.get(dedupKey) as Promise<T>
      setDeduped(true)
    } else {
      // Первый запрос — создаём и регистрируем
      promise = fn().finally(() => inFlight.delete(dedupKey))
      inFlight.set(dedupKey, promise)
      setDeduped(false)
    }

    promise
      .then(data => {
        if (ignore) return
        setState({ status: 'success', data })
      })
      .catch(error => {
        if (ignore) return
        setState({ status: 'error', error })
      })

    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, deduped }
}

// =================================================================
// Модуль 3: Повтор при ошибке (Retry)
// При ошибке делает до maxRetries повторных попыток с экспоненциальной
// задержкой: 1с → 2с → 4с → ...
// =================================================================
export function useQueryRetry<T>(
  fn: () => Promise<T>,
  deps: DependencyList = [],
  maxRetries = 3,
): AsyncState<T> & { attempt: number } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  // Ref нужен чтобы таймер retry не держал устаревшее замыкание
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let ignore = false
    let currentAttempt = 0
    setState({ status: 'loading' })
    setAttempt(0)

    function run() {
      fn()
        .then(data => {
          if (ignore) return
          setState({ status: 'success', data })
        })
        .catch(error => {
          if (ignore) return
          if (currentAttempt < maxRetries) {
            // Экспоненциальная задержка: 1000мс, 2000мс, 4000мс…
            const delay = 1000 * 2 ** currentAttempt
            currentAttempt++
            setAttempt(currentAttempt)
            retryTimerRef.current = setTimeout(run, delay)
          } else {
            setState({ status: 'error', error })
          }
        })
    }

    run()

    return () => {
      ignore = true
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, attempt }
}

// =================================================================
// Модуль 4: Фоновая ревалидация
// Возвращает данные из стейта мгновенно (даже если чуть устаревшие),
// параллельно тихо обновляет их в фоне.
// Паттерн называется stale-while-revalidate (SWR).
// =================================================================
export function useQuerySWR<T>(
  fn: () => Promise<T>,
  deps: DependencyList = [],
  revalidateMs = 5000,
): AsyncState<T> & { revalidating: boolean } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [revalidating, setRevalidating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Первый fetch — обычный, показываем loading
  useEffect(() => {
    let ignore = false
    setState({ status: 'loading' })
    setRevalidating(false)

    fn()
      .then(data => {
        if (ignore) return
        setState({ status: 'success', data })
      })
      .catch(error => {
        if (ignore) return
        setState({ status: 'error', error })
      })

    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Фоновый интервал — тихо обновляет данные, не сбрасывая в loading
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRevalidating(true)
      fn()
        .then(data => {
          setState({ status: 'success', data })
          setRevalidating(false)
        })
        .catch(() => {
          // При ошибке ревалидации не трогаем существующие данные
          setRevalidating(false)
        })
    }, revalidateMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, revalidateMs])

  return { ...state, revalidating }
}

// Ручная ревалидация — для кнопки "Обновить"
export function useQueryManualRevalidate<T>(
  fn: () => Promise<T>,
  deps: DependencyList = [],
): AsyncState<T> & { revalidating: boolean; revalidate: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [revalidating, setRevalidating] = useState(false)
  const [tick, setTick] = useState(0)
  const isFirstRun = useRef(true)

  useEffect(() => {
    let ignore = false

    if (isFirstRun.current) {
      isFirstRun.current = false
      setState({ status: 'loading' })
    } else {
      // Ревалидация: не сбрасываем данные, только ставим флаг
      setRevalidating(true)
    }

    fn()
      .then(data => {
        if (ignore) return
        setState({ status: 'success', data })
        setRevalidating(false)
      })
      .catch(error => {
        if (ignore) return
        setState({ status: 'error', error })
        setRevalidating(false)
      })

    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const revalidate = useCallback(() => setTick(t => t + 1), [])

  return { ...state, revalidating, revalidate }
}

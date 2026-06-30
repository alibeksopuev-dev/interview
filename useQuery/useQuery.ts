// @ts-ignore
import { DependencyList, useEffect, useState } from 'react'

// Дискриминированный union — статус однозначно определяет доступные поля
type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

export default function useQuery<T>(
  fn: () => Promise<T>,
  deps: DependencyList = [],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })

  useEffect(() => {
    // ignore = true после cleanup — предотвращает запись устаревших ответов
    let ignore = false

    setState({ status: 'loading' })

    fn()
      .then(data => {
        if (ignore) return
        setState({ status: 'success', data })
      })
      .catch(error => {
        if (ignore) return
        setState({ status: 'error', error })
      })

    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

const cache = new Map<string, unknown>()

function useQueryCached<T>(
  cacheKey: string,
  fn: () => Promise<T>,
  deps: DependencyList = [],
): AsyncState<T> & { fromCache: boolean } {
  const cached = cache.get(cacheKey) as T | undefined
  const hasCache = cache.has(cacheKey)
  const [state, setState] = useState<AsyncState<T>>(
    hasCache ? { status: 'success', data: cached } : { status: 'loading' },
  )
  const [fromCache, setFromCache] = useState<boolean>(hasCache)

  useEffect(() => {
    if (cache.has(cacheKey)) {
      setState({ status: 'success', data: cache.get(cacheKey) as T })
      setFromCache(true)
      return
    }
    // ignore = true после cleanup — предотвращает запись устаревших ответов
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

    return () => {
      ignore = true
    }
  }, deps)

  return { ...state, fromCache }
}

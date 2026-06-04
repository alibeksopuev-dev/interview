import { useEffect, useRef, useState } from 'react'
import { throttle } from '../../../../../../throttle/throttle.ts'

export function useThrottledValue<T>(value: T, wait: number): T {
  const [throttledValue, setThrottledValue] = useState(value)

  // useRef хранит стабильный throttled-сеттер между рендерами
  const setter = useRef(
    throttle((v: T) => {
      setThrottledValue(v)
    }, wait),
  ).current

  useEffect(() => {
    setter(value)
  }, [value, setter])

  return throttledValue
}

const isDeepEqual = (valueA: unknown, valueB: unknown): boolean => {
  if (Object.is(valueA, valueB)) {
    return true
  }

  const bothObjects =
    Object.prototype.toString.call(valueA) === '[object Object]' &&
    Object.prototype.toString.call(valueB) === '[object Object]'
  const bothArrays = Array.isArray(valueA) && Array.isArray(valueB)

  if (!bothObjects && !bothArrays) {
    return false
  }

  const comparableA = valueA as unknown as Record<string, unknown>
  const comparableB = valueB as unknown as Record<string, unknown>

  if (Object.keys(comparableA).length !== Object.keys(comparableB).length) {
    return false
  }

  for (const key in comparableA) {
    if (!isDeepEqual(comparableA[key], comparableB[key])) {
      return false
    }
  }

  return true
}

export default function deepClone<T>(value: T): T {
  if (typeof value !== 'object' && value === null) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(item => deepClone(item)) as T
  }

  const clone = {} as Record<string, unknown>

  const keys = Object.keys(value as Record<string, unknown>)

  for (const key of keys) {
    clone[key] = deepClone((value as Record<string, unknown>)[key])
  }

  return clone as T
}

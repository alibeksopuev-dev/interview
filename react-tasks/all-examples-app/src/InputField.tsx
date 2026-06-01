import { ChangeEvent, FC, useEffect, useState } from 'react'

const useDebouncedValue = <T,>(value: T, timeout: number = 0): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, timeout)

    return () => clearTimeout(timeoutId)
  }, [value, timeout])

  return debouncedValue
}

interface InputFieldProps {
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  debounceTimeout?: number
  id: string
  name: string
  value?: string
}

export const InputField: FC<InputFieldProps> = ({
  onChange,
  debounceTimeout = 0, // если 0 — debounce отключён
  value,
  ...rest
}) => {
  const [inputValue, setInputValue] = useState(value)

  // inputValue меняется на каждый keystroke, но debouncedValue —
  // только после паузы debounceTimeout мс
  const debouncedValue = useDebouncedValue(inputValue, debounceTimeout)

  useEffect(() => {
    // Этот эффект срабатывает только когда debouncedValue "устоялось"
    // т.е. пользователь перестал печатать на debounceTimeout мс
    if (onChange && debounceTimeout) {
      onChange({
        target: { id: rest.id, name: rest.name, value: debouncedValue },
      } as ChangeEvent<HTMLInputElement>)
    }
  }, [debouncedValue]) // НЕ зависит от inputValue напрямую

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value) // обновляем сразу — для отображения в UI

    // Если debounce не нужен (timeout=0) — вызываем onChange немедленно
    if (onChange && !debounceTimeout) {
      onChange(event)
    }
  }

  return (
    <input
      id={rest.id}
      name={rest.name}
      value={inputValue}
      onChange={handleChange}
      placeholder='Debounce test'
    />
  )
}

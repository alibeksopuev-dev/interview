function isLetter(char) {
  return char.toLowerCase() !== char.toUpperCase();
}

function isEquals(char1, char2) {
  return char1.toLowerCase() === char2.toLowerCase();
}

function isPalindrome(str) {
  let start = 0;
  let end = str.length - 1;

  while (start < end) {
    const firstChar = str[start];
    const endChar = str[end];

    if (!isLetter(firstChar)) {
      start += 1;
      continue;
    }

    if (!isLetter(endChar)) {
      end -= 1;
      continue;
    }

    if (!isEquals(firstChar, endChar)) {
      return false;
    }

    start += 1;
    end -= 1;
  }

  return true;
}

console.log(isPalindrome("A man, a plan, a canal: Panama"));

function range(arr) {
  const sortedArr = [...arr].sort((a, b) => a - b);
  if (!sortedArr.length) {
    return ''
  }

  const result = [String(sortedArr[0])];
  let isInterval = false;

  for (let i = 1; i <= sortedArr.length; i++) {
    const prev = sortedArr[i - 1];
    const current = sortedArr[i];

    if (current - prev === 1) {
      isInterval = true;
      continue;
    }

    if (isInterval) {
      result[result.length - 1] += `-${prev}`
      isInterval = false;
    }

    if (current) {
      result.push(String(current));
    }

  }
  return result.join(',');
}


const array1 = [[1, 3], [2, 6], [8, 10], [15, 18]]; // [[1, 6], [8, 10], [15, 18]]
const array2 = [[1, 4], [4, 5]]; // [[1, 5]]
const array3 = [[11, 12], [2, 3], [5, 7], [1, 4], [8, 10], [6, 8]]; // [[1, 4], [5, 10], [11, 12]]

function merge(intervals) {
  if (intervals.length < 2) return intervals

  intervals.sort((a, b) => a[0] - b[0])

  let result = [intervals[0]]

  for (let interval of intervals) {
    let recent = result[result.length - 1];

    if (recent[1] >= interval[0]) {
      recent[1] = Math.max(recent[1], interval[1])
    } else {
      result.push(interval)
    }
  }

  return result
}

console.log(merge(array3));

intervals = [
  [1, 4],   // интервал 1
  [2, 3],   // интервал 2
  [5, 7],   // интервал 3
  [6, 8],   // интервал 4
  [8, 10],  // интервал 5
  [11, 12]  // интервал 6
]

/**
 * Проверяет правильность последовательности скобок в строке
 * @param {string} bracketString - строка, содержащая скобки для проверки
 * @returns {boolean} - true если последовательность правильная, false если нет
 */
function isValidBrackets(bracketString) {
  // Стек для хранения открывающих скобок
  const openBracketsStack = [];

  // Объект, определяющий соответствие между закрывающими и открывающими скобками
  const bracketPairs = {
    ')': '(',  // для круглых скобок
    '}': '{',  // для фигурных скобок
    ']': '['   // для квадратных скобок
  };

  // Проходим по каждому символу в строке
  for (let position = 0; position < bracketString.length; position++) {
    const currentBracket = bracketString[position];

    // Проверяем, является ли текущий символ закрывающей скобкой
    if (isClosingBracket(currentBracket)) {
      // Получаем соответствующую открывающую скобку для текущей закрывающей
      const matchingOpenBracket = bracketPairs[currentBracket];
      // Получаем последнюю открывающую скобку из стека
      const lastOpenBracket = openBracketsStack.pop();

      // Если скобки не соответствуют друг другу - последовательность неверная
      if (matchingOpenBracket !== lastOpenBracket) {
        return false;
      }
    } else {
      // Если это открывающая скобка - добавляем её в стек
      openBracketsStack.push(currentBracket);
    }
  }

  // Проверяем, что все открывающие скобки были закрыты
  return openBracketsStack.length === 0;
}

/**
 * Проверяет, является ли символ закрывающей скобкой
 * @param {string} bracket - символ для проверки
 * @returns {boolean} - true если это закрывающая скобка, false если нет
 */
function isClosingBracket(bracket) {
  const closingBrackets = [')', '}', ']'];
  return closingBrackets.indexOf(bracket) > -1;
}

/**
 * Проверяет правильность последовательности скобок в строке
 * @param {string} bracketString - строка, содержащая скобки для проверки
 * @returns {boolean} - true если последовательность правильная, false если нет
 */
function isValidBrackets(bracketString) {
  // Стек для хранения открывающих скобок
  const openBracketsStack = [];

  // Объект, определяющий соответствие между закрывающими и открывающими скобками
  const bracketPairs = {
    ')': '(',  // для круглых скобок
    '}': '{',  // для фигурных скобок
    ']': '['   // для квадратных скобок
  };

  // Проходим по каждому символу в строке
  for (let position = 0; position < bracketString.length; position++) {
    const currentBracket = bracketString[position];

    // Проверяем, является ли текущий символ закрывающей скобкой
    if (isClosingBracket(currentBracket)) {
      // Получаем соответствующую открывающую скобку для текущей закрывающей
      const matchingOpenBracket = bracketPairs[currentBracket];
      // Получаем последнюю открывающую скобку из стека
      const lastOpenBracket = openBracketsStack.pop();

      // Если скобки не соответствуют друг другу - последовательность неверная
      if (matchingOpenBracket !== lastOpenBracket) {
        return false;
      }
    } else {
      // Если это открывающая скобка - добавляем её в стек
      openBracketsStack.push(currentBracket);
    }
  }

  // Проверяем, что все открывающие скобки были закрыты
  return openBracketsStack.length === 0;
}

/**
 * Проверяет, является ли символ закрывающей скобкой
 * @param {string} bracket - символ для проверки
 * @returns {boolean} - true если это закрывающая скобка, false если нет
 */
function isClosingBracket(bracket) {
  const closingBrackets = [')', '}', ']'];
  return closingBrackets.indexOf(bracket) > -1;
}

// Примеры использования с разными тестовыми случаями
const testCases = [
  '()',           // true  - простая пара скобок
  '()[]{}',       // true  - несколько пар разных скобок
  '(]',           // false - несоответствующие скобки
  '{[]}',         // true  - вложенные скобки
  '([)]',         // false - перекрестные скобки
  '{[[]{}]}()()'  // true  - сложная комбинация вложенных скобок
];

const firstUniqChar = function (s) {
  let map = new Map();

  for (let i = 0; i < s.length; i++) {
    let current = s[i];

    if (map.has(current)) {
      map.set(current, map.get(current) + 1);
    } else {
      map.set(current, 1);
    }
  }
  for (let i = 0; i < s.length; i++) {
    let current = s[i];
    if (map.get(current) === 1) {
      return i;
    }
  }
  return -1;
}

console.log(firstUniqChar('leetcode'));


/**
 * Вычисляет n-ное число Фибоначчи с использованием рекурсии и мемоизации
 * @param {number} n - позиция числа Фибоначчи
 * @param {Object} memo - кеш для хранения уже вычисленных значений
 * @returns {number} число Фибоначчи в позиции n
 */
function fibonacci(n, memo = {}) {
  // Базовые случаи
  if (n <= 1) {
    return n;
  }

  // Проверяем, есть ли значение в кеше
  if (n in memo) {
    return memo[n]; // что здесь происходит?
  }

  // Вычисляем новое значение и сохраняем в кеш
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo); // что здесь происходит, что подставляется?
  return memo[n];
}
// Примеры:
console.log(fibonacci(8));  // 21
console.log(fibonacci(10)); // 55

/**
 * React Senior Interview Tasks Collection
 */

// ================ TASK 1: Closure in useEffect ================
/**
 * Задача: Почему счетчик остановится на 1 и как это исправить?
 */

// ❌ Проблемный код
function CounterBad() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1); // Замыкание на старом значении count
    }, 1000);
    return () => clearInterval(timer);
  }, []);
}

// ✅ Правильное решение
function CounterGood() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => prev + 1); // Используем функциональное обновление
    }, 1000);
    return () => clearInterval(timer);
  }, []);
}

// ================ TASK 2: List Optimization ================
/**
 * Задача: Оптимизировать рендеринг списка с тяжелыми вычислениями
 */

// ❌ Неоптимизированный код
function ExpensiveListBad({ items, onItemClick }) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id} onClick={() => onItemClick(item.id)}>
          {heavyCalculation(item)}
        </div>
      ))}
    </div>
  );
}

// ✅ Оптимизированное решение
const ListItem = memo(function ListItem({ item, onItemClick }) {
  const memoizedValue = useMemo(
    () => heavyCalculation(item),
    [item]
  );

  const handleClick = useCallback(
    () => onItemClick(item.id),
    [item.id, onItemClick]
  );

  return (
    <div onClick={handleClick}>
      {memoizedValue}
    </div>
  );
});

function ExpensiveListGood({ items, onItemClick }) {
  return (
    <div>
      {items.map(item => (
        <ListItem
          key={item.id}
          item={item}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
}

// ================ TASK 3: Cached API Hook ================
/**
 * Задача: Реализовать хук для кэширования API запросов
 */

function useCachedAPI(url, options = {}) {
  const cache = useRef(new Map());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const forceRefetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);
      const json = await response.json();
      cache.current.set(url, json);
      setData(json);
    } catch (err) {
      setError(err);
      cache.current.delete(url);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;

    if (cache.current.has(url) && !options.forceRefetch) {
      setData(cache.current.get(url));
      return;
    }

    forceRefetch();
  }, [url, options.forceRefetch, forceRefetch]);

  return { data, loading, error, refetch: forceRefetch };
}

// ================ TASK 4: Error Boundary ================
/**
 * Задача: Реализовать ErrorBoundary с хуками
 */

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

function useErrorHandler() {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  return setError;
}

// ================ TASK 5: Custom Store ================
/**
 * Задача: Реализовать менеджер состояния с оптимизацией ререндеров
 */

function createStore(initialState) {
  const subscribers = new Map();
  let state = initialState;

  function useStore(selector, deps = []) {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const selectorRef = useRef(selector);
    const prevValueRef = useRef();

    const selectedValue = useMemo(
      () => selector(state),
      [state, ...deps]
    );

    useEffect(() => {
      selectorRef.current = selector;
      prevValueRef.current = selectedValue;

      const callback = () => {
        const newValue = selectorRef.current(state);
        if (newValue !== prevValueRef.current) {
          prevValueRef.current = newValue;
          forceUpdate();
        }
      };

      subscribers.set(callback, selector);
      return () => subscribers.delete(callback);
    }, [selector, selectedValue]);

    return selectedValue;
  }

  function setState(newState) {
    state = typeof newState === 'function'
      ? newState(state)
      : newState;
    subscribers.forEach(callback => callback());
  }

  return [useStore, setState];
}

// ================ TASK 6: Form Validation ================
/**
 * Задача: Реализовать хук для работы с формами и валидацией
 */

function useForm(initialValues, validationSchema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  const debouncedValidate = useCallback(
    debounce(async (name, value) => {
      try {
        setIsValidating(true);
        const error = await validationSchema[name]?.(value, values);
        setErrors(prev => ({ ...prev, [name]: error }));
      } finally {
        setIsValidating(false);
      }
    }, 300),
    [values, validationSchema]
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      debouncedValidate(name, value);
    }
  }, [touched, debouncedValidate]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    debouncedValidate(name, values[name]);
  }, [values, debouncedValidate]);

  return {
    values,
    errors,
    touched,
    isValidating,
    handleChange,
    handleBlur
  };
}

// ================ TASK 7: Animation Hook ================
/**
 * Задача: Реализовать хук для управления анимациями
 */

function useAnimation(ref, isVisible) {
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    let frameId;

    if (isVisible) {
      element.style.opacity = '0';
      element.style.transition = 'opacity 0.3s';

      frameId = requestAnimationFrame(() => {
        frameId = requestAnimationFrame(() => {
          element.style.opacity = '1';
        });
      });
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      if (element) {
        element.style.opacity = '';
        element.style.transition = '';
      }
    };
  }, [isVisible]);
}

// ================ TASK 8: Async State Updates ================
/**
 * Задача: Правильно обработать асинхронные обновления состояния
 */

// ❌ Проблемный код
function AsyncCounterBad() {
  const [count, setCount] = useState(0);

  const increment = async () => {
    const newCount = await fetchCount(count);
    setCount(count + newCount); // Может быть неактуальным
  };
}

// ✅ Правильное решение
function AsyncCounterGood() {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  const increment = async () => {
    const newCount = await fetchCount(countRef.current);
    setCount(current => current + newCount);
  };
}

// ================ TASK 9: Context Optimization ================
/**
 * Задача: Оптимизировать обновления контекста
 */

const StateContext = createContext();
const DispatchContext = createContext();

function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const memoizedState = useMemo(() => state, [state]);

  return (
    <StateContext.Provider value={memoizedState}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// ================ TASK 10: Infinite Scroll ================
/**
 * Задача: Реализовать бесконечную прокрутку с виртуализацией
 */

function useInfiniteScroll(fetchMore) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  const lastElementRef = useCallback(node => {
    if (loading) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        fetchMore().then(newItems => {
          setItems(prev => [...prev, ...newItems]);
        });
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, fetchMore]);

  return { items, lastElementRef };
}

// Экспортируем все задачи для тестирования
export {
  CounterGood,
  ExpensiveListGood,
  useCachedAPI,
  ErrorBoundary,
  createStore,
  useForm,
  useAnimation,
  AsyncCounterGood,
  Provider,
  useInfiniteScroll
};
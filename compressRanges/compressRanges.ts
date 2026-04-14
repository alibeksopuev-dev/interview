/**
 * Преобразует массив чисел в строку, сворачивая последовательные числа в диапазоны
 * @param {number[]} arr - исходный массив чисел
 * @returns {string} - строка с диапазонами (например, "1-2,4,7-9")
 */
export function compressRanges(arr: number[]): string {
    // 1. Копируем исходный массив и сортируем его по возрастанию
    const sortedArr = [...arr].sort((a, b) => a - b);
    
    // Базовый случай: пустой массив
    if (!sortedArr.length) {
        return '';
    }

    // `result` служит "стеком" для хранения блоков итоговой строки
    // Кладем в него сразу самый ранний (наименьший) элемент
    const result: string[] = [String(sortedArr[0])];
    
    // Флаг, который показывает, идем ли мы сейчас по непрерывной последовательности (шаг +1)
    let isInterval = false;

    // Важно: мы идем до `i <= sortedArr.length` (включительно),
    // чтобы при `i === length` переменная `current` стала undefined, 
    // и мы смогли корректно закрыть интервал в самом конце массива
    for (let i = 1; i <= sortedArr.length; i++) {
        const prev = sortedArr[i - 1];
        const current = sortedArr[i];

        // Если элементы идут ровно по порядку:
        if (current !== undefined && current - prev === 1) {
            isInterval = true;
            continue; // идем к следующему числу, не прерывая интервал
        }

        // Если последовательность прервалась (или начался undefined), 
        // но мы находились в интервале — нужно его закрыть
        if (isInterval) {
            // Приклеиваем к последнему элементу в `result` границу вида `-5`
            result[result.length - 1] += `-${prev}`;
            isInterval = false;
        }

        // Если это новое число (после разрыва) — добавляем его в массив как потенциальное начало
        // Используем `current !== undefined` (вместо `if (current)`), чтобы не потерять число `0`
        if (current !== undefined) {
            result.push(String(current));
        }
    }

    // Склеиваем блоки через запятую
    return result.join(',');
}

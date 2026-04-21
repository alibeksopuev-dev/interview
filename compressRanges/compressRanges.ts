/**
 * Преобразует массив чисел в строку, сворачивая последовательные числа в диапазоны
 * @param {number[]} arr - исходный массив чисел
 * @returns {string} - строка с диапазонами (например, "1-2,4,7-9")
 * Пример исходного массива: [7, 1, 4, 2, 9, 8]
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

export function otherCompressRanges(arr: number[]): string {
    if (arr.length === 0) return "" // 1. Краевой случай: пустой массив

    // 2. Сортируем копию массива O(n log n). Копия нужна, чтобы не мутировать оригинал.
    const sorted = [...arr].sort((a, b) => a - b)
    const result: string[] = []

    // 3. Указатель на начало текущего потенциального диапазона
    let start = sorted[0]

    // Итерируемся до length включительно. На последнем шаге current будет undefined,
    // что спровоцирует условие "разрыва" и позволит закрыть последний диапазон.
    for (let i = 1; i <= sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];

        // 4. Проверяем разрыв: если текущее число не равно предыдущему + 1
        if (current !== prev + 1) {
            const end = prev // Предыдущее число было концом диапазона

            // 5. Формируем строку: либо одиночное число, либо интервал "start-end"
            result.push(start === end ? `${start}` : `${start}-${end}`)

            // 6. Передвигаем "start" на новое число, начиная новый отсчет
            start = sorted[i]
        }
    }

    // 7. Склеиваем все накопленные блоки через запятую
    return result.join(',')
}

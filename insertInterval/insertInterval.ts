/**
 * Вставляет новый интервал в отсортированный массив непересекающихся интервалов
 * и объединяет все пересекающиеся интервалы.
 *
 * @param {number[][]} intervals - отсортированный массив непересекающихся интервалов [[start, end], ...]
 * @param {number[]} newInterval - новый интервал [start, end] для вставки
 * @returns {number[][]} - итоговый массив объединённых интервалов
 */

// ─────────────────────────────────────────────────────────────────
// РЕШЕНИЕ 1: Линейное сканирование (три фазы)
// Time: O(n) | Space: O(n)
// ─────────────────────────────────────────────────────────────────
export function insertIntervalLinear(
    intervals: number[][],
    newInterval: number[],
): number[][] {
    let n = intervals.length,
        i = 0,
        res: number[][] = [];

    // ── Фаза 1: все интервалы, которые заканчиваются ДО начала нового ──
    // Условие: конец текущего интервала строго меньше начала нового → пересечения нет
    // Пример: текущий [1,2], новый [3,7] → 2 < 3 → добавляем как есть
    while (i < n && intervals[i][1] < newInterval[0]) {
        res.push(intervals[i]);
        i++;
    }

    // ── Фаза 2: сливаем все интервалы, которые ПЕРЕСЕКАЮТСЯ с новым ──
    // Условие: начало текущего интервала <= конца нового → есть перекрытие
    // Мы расширяем newInterval влево и вправо, охватывая все пересечения
    while (i < n && newInterval[1] >= intervals[i][0]) {
        // Сдвигаем левую границу к минимуму
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        // Сдвигаем правую границу к максимуму
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    // После слияния добавляем итоговый объединённый интервал
    res.push(newInterval);

    // ── Фаза 3: все интервалы, которые начинаются ПОСЛЕ конца нового ──
    // Пересечений больше нет — просто копируем остаток
    while (i < n) {
        res.push(intervals[i]);
        i++;
    }

    return res;
}

// ─────────────────────────────────────────────────────────────────
// РЕШЕНИЕ 2: Бинарный поиск + слияние (как в mergeIntervals)
// Time: O(n) | Space: O(n)  (бинарный поиск O(log n), но splice O(n))
// ─────────────────────────────────────────────────────────────────
export function insertIntervalBinary(
    intervals: number[][],
    newInterval: number[],
): number[][] {
    // Граничный случай: пустой массив
    if (intervals.length === 0) {
        return [newInterval];
    }

    let n = intervals.length;
    let target = newInterval[0]; // начало нового интервала — ключ для поиска
    let left = 0,
        right = n - 1;

    // ── Бинарный поиск позиции вставки ──
    // Ищем первый индекс, где intervals[mid][0] >= target
    // После цикла: left = индекс первого элемента с началом >= target
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (intervals[mid][0] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    // Вставляем newInterval на найденную позицию (O(n) из-за сдвига элементов)
    intervals.splice(left, 0, newInterval);

    // ── Стандартное слияние (как в mergeIntervals) ──
    // Теперь массив отсортирован по началу, но может содержать пересечения
    let res: number[][] = [];
    for (let interval of intervals) {
        // Если результат пуст или нет пересечения → добавляем новый "островок"
        if (res.length === 0 || res[res.length - 1][1] < interval[0]) {
            res.push(interval);
        } else {
            // Есть пересечение → расширяем конец последнего интервала
            res[res.length - 1][1] = Math.max(res[res.length - 1][1], interval[1]);
        }
    }

    return res;
}

/**
 * Находит непрерывный подмассив с наибольшим произведением элементов
 * В алгоритме одновременно высчитывается произведение слева-направо (префикс)
 * и справа-налево (суффикс), чтобы учесть особенности отрицательных чисел и нулей.
 * 
 * @param {number[]} numbers - массив целых чисел
 * @returns {number} - максимальное произведение
 */
export default function maxProductSubArray(numbers: number[]): number {
    const arrayLength = numbers.length;
  
    // prefixProduct хранит произведение слева направо
    let prefixProduct = 1; 
    // suffixProduct хранит произведение справа налево
    let suffixProduct = 1; 
    // maxProduct запоминает абсолютный рекорд, изначально ставим самое маленькое число
    let maxProduct = Number.NEGATIVE_INFINITY; 
  
    // Один проход по массиву (линейное время O(n))
    for (let i = 0; i < arrayLength; i++) {
        // Если на прошлом шаге левое произведение обнулилось,
        // начинаем новый подмассив прямо с текущего числа.
        // Иначе — продолжаем умножать накопленное на текущее.
        prefixProduct = prefixProduct === 0 ? numbers[i] : prefixProduct * numbers[i];
    
        // Определяем индекс для движения с конца массива навстречу
        const rightIndex = arrayLength - i - 1;
        
        // Делаем то же самое для правого произведения
        suffixProduct = suffixProduct === 0 ? numbers[rightIndex] : suffixProduct * numbers[rightIndex];
    
        // Обновляем общий максимум
        maxProduct = Math.max(maxProduct, Math.max(prefixProduct, suffixProduct));
    }
  
    return maxProduct;
}

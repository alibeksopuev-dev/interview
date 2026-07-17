"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Array.prototype.myReduce = function (callbackFn, initialValue) {
    // Проверяем количество аргументов, чтобы отличить явную передачу `undefined` в качестве initialValue
    // от ситуации, когда аргумент вообще не был передан.
    const noInitialValue = arguments.length <= 1;
    const arrayLength = this.length;
    let index = 0;
    let accumulator;
    if (noInitialValue) {
        // Ищем первый существующий индекс (пропускаем дыры в начале разреженного массива)
        while (index < arrayLength && !Object.hasOwn(this, index)) {
            index++;
        }
        // Если массив пустой (или содержит только дыры) и
        // начальное значение не задано — выбрасываем ошибку
        if (index >= arrayLength) {
            throw new TypeError('Reduce of empty array with no initial value');
        }
        accumulator = this[index];
        index++;
    }
    else {
        accumulator = initialValue;
    }
    for (; index < arrayLength; index++) {
        // Пропускаем несуществующие индексы (holes)
        if (Object.hasOwn(this, index)) {
            accumulator = callbackFn(accumulator, this[index], index, this);
        }
    }
    return accumulator;
};
// ── Тесты ──────────────────────────────────────────────────────────────────
// 1. Базовый случай с начальным значением
const sumWithInitial = [1, 2, 3].myReduce((acc, val) => acc + val, 10);
console.log('sumWithInitial:', sumWithInitial); // 16
// 2. Базовый случай без начального значения
const sumWithoutInitial = [1, 2, 3].myReduce((acc, val) => acc + val);
console.log('sumWithoutInitial:', sumWithoutInitial); // 6
// 3. Работа с разреженным массивом и initialValue
const sparseSum = [1, , 3].myReduce((acc, val) => acc + val, 10);
console.log('sparseSum:', sparseSum); // 14
// 4. Разреженный массив без initialValue (должен взять первый существующий элемент в качестве acc)
const sparseSumNoInitial = [, , 2, , 4].myReduce((acc, val) => acc + val);
console.log('sparseSumNoInitial:', sparseSumNoInitial); // 6
// 5. Ошибка при пустом массиве и без начального значения
try {
    ;
    [].myReduce((acc, val) => acc + val);
}
catch (e) {
    console.log('emptyArrayNoInitial throws TypeError:', e instanceof TypeError); // true
}
// 6. Передача undefined в качестве initialValue должна учитываться
const testExplicitUndefined = [1, 2].myReduce((acc, val) => acc + '-' + val, undefined);
console.log('testExplicitUndefined:', testExplicitUndefined); // 'undefined-1-2'
// 7. Пропуск при отсутствии начального значения
const testOmitted = [1, 2].myReduce((acc, val) => acc + '-' + val);
console.log('testOmitted:', testOmitted); // '1-2'

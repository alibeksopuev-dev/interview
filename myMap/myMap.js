"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Array.prototype.myMap = function (callbackFn, thisArg) {
    const len = this.length;
    // Pre-size the result so sparse inputs stay sparse in the output as well.
    const array = new Array(len);
    for (let k = 0; k < len; k++) {
        // Only existing indexes get visited; holes are preserved rather than
        // becoming explicit `undefined` entries.
        if (Object.hasOwn(this, k)) {
            array[k] = callbackFn.call(thisArg, this[k], k, this);
        }
    }
    return array;
};
// ── Тесты ──────────────────────────────────────────────────────────────────
const doubled = [1, 2, 3].myMap(x => x * 2);
console.log(doubled); // [2, 4, 6]
const strings = [1, 2, 3].myMap(x => String(x));
console.log(strings); // ['1', '2', '3']
// thisArg usage
const multiplier = { factor: 3 };
const tripled = [1, 2, 3].myMap(function (x) {
    return x * this.factor;
}, multiplier);
console.log(tripled); // [3, 6, 9]
// Sparse array: holes should be preserved
const sparse = [1, , 3].myMap(x => x * 2);
console.log(sparse); // [2, empty, 6]
console.log(Object.hasOwn(sparse, 1)); // false — hole preserved

export {};

declare global {
  interface Array<T> {
    myMap<U>(
      callbackFn: (value: T, index: number, array: Array<T>) => U,
      thisArg?: any,
    ): Array<U>;
  }
}

Array.prototype.myMap = function <T, U>(
  this: T[],
  callbackFn: (value: T, index: number, array: T[]) => U,
  thisArg?: any,
): U[] {
  const len = this.length;
  // Pre-size the result so sparse inputs stay sparse in the output as well.
  const array = new Array<U>(len);

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

const doubled = [1, 2, 3].myMap((x) => x * 2);
console.log(doubled); // [2, 4, 6]

const strings = [1, 2, 3].myMap((x) => String(x));
console.log(strings); // ['1', '2', '3']

// thisArg usage
const multiplier = { factor: 3 };
const tripled = [1, 2, 3].myMap(function (this: typeof multiplier, x: number) {
  return x * this.factor;
}, multiplier);
console.log(tripled); // [3, 6, 9]

// Sparse array: holes should be preserved
const sparse = [1, , 3].myMap((x) => x! * 2);
console.log(sparse); // [2, empty, 6]
console.log(Object.hasOwn(sparse, 1)); // false — hole preserved

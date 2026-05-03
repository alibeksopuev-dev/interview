"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isDeepEqual = (valueA, valueB) => {
    if (Object.is(valueA, valueB)) {
        return true;
    }
    const bothObjects = Object.prototype.toString.call(valueA) === '[object Object]' &&
        Object.prototype.toString.call(valueB) === '[object Object]';
    const bothArrays = Array.isArray(valueA) && Array.isArray(valueB);
    if (!bothObjects && !bothArrays) {
        return false;
    }
    const comparableA = valueA;
    const comparableB = valueB;
    if (Object.keys(comparableA).length !== Object.keys(comparableB).length) {
        return false;
    }
    for (const key in comparableA) {
        if (!isDeepEqual(comparableA[key], comparableB[key])) {
            return false;
        }
    }
    return true;
};
function deepClone(value) {
    if (typeof value !== 'object' && value === null) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(item => deepClone(item));
    }
    const clone = {};
    const keys = Object.keys(value);
    for (const key of keys) {
        clone[key] = deepClone(value[key]);
    }
    return clone;
}
exports.default = deepClone;

const isDeepEqual = (valueA: unknown, valueB: unknown): boolean => {
    if(Object.is(valueA, valueB)){
        return true;
    }

    const bothObjects = 
        Object.prototype.toString.call(valueA) === '[object Object]' && 
        Object.prototype.toString.call(valueB) === '[object Object]';
    const bothArrays = Array.isArray(valueA) && Array.isArray(valueB);

    if(!bothObjects && !bothArrays) {
        return false
    }

    const comparableA = valueA as Record<string, unknown>
    const comparableB = valueB as Record<string, unknown>

    if(Object.keys(comparableA).length !== Object.keys(comparableB).length) {
        return false
    }

    for(const key in comparableA) {
        if(!isDeepEqual(comparableA[key], comparableB[key])){
            return false
        }
    }

    return true
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const react_1 = require("react");
function useQuery(fn, deps = []) {
    const [state, setState] = (0, react_1.useState)({ status: 'loading' });
    (0, react_1.useEffect)(() => {
        // ignore = true после cleanup — предотвращает запись устаревших ответов
        let ignore = false;
        setState({ status: 'loading' });
        fn()
            .then(data => {
            if (ignore)
                return;
            setState({ status: 'success', data });
        })
            .catch(error => {
            if (ignore)
                return;
            setState({ status: 'error', error });
        });
        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    return state;
}
exports.default = useQuery;
const cache = new Map();
function useQueryCached(cacheKey, fn, deps = []) {
    const cached = cache.get(cacheKey);
    const hasCache = cache.has(cacheKey);
    const [state, setState] = (0, react_1.useState)(hasCache ? { status: 'success', data: cached } : { status: 'loading' });
    const [fromCache, setFromCache] = (0, react_1.useState)(hasCache);
    (0, react_1.useEffect)(() => {
        if (cache.has(cacheKey)) {
            setState({ status: 'success', data: cache.get(cacheKey) });
            setFromCache(true);
            return;
        }
        // ignore = true после cleanup — предотвращает запись устаревших ответов
        let ignore = false;
        setState({ status: 'loading' });
        setFromCache(false);
        fn()
            .then(data => {
            if (ignore)
                return;
            cache.set(cacheKey, data);
            setState({ status: 'success', data });
            setFromCache(false);
        })
            .catch(error => {
            if (ignore)
                return;
            setState({ status: 'error', error });
        });
        return () => {
            ignore = true;
        };
    }, deps);
    return { ...state, fromCache };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function useQuery(fn, deps = []) {
    const [state, setState] = (0, react_1.useState)({ status: 'loading' });
    (0, react_1.useEffect)(() => {
        // ignore = true после cleanup — предотвращает запись устаревших ответов
        let ignore = false;
        setState({ status: 'loading' });
        fn()
            .then((data) => {
            if (ignore)
                return;
            setState({ status: 'success', data });
        })
            .catch((error) => {
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

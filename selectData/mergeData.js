"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDataOld = void 0;
const SESSIONS = [
    { user: 8, duration: 50, equipment: ['bench'] },
    { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
    { user: 1, duration: 10, equipment: ['barbell'] },
    { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
    { user: 7, duration: 200, equipment: ['bike'] },
    { user: 2, duration: 200, equipment: ['treadmill'] },
    { user: 2, duration: 200, equipment: ['bike'] },
];
console.log(mergeData(SESSIONS));
function mergeData(sessions) {
    // Map сохраняет порядок вставки по спецификации JS (ES2015+):
    // Map.values() итерируется в порядке первой вставки ключа —
    // что совпадает с требованием «позиция первого вхождения пользователя»
    const sessionsForUser = new Map();
    sessions.forEach(session => {
        if (sessionsForUser.has(session.user)) {
            const userSession = sessionsForUser.get(session.user);
            userSession.duration += session.duration;
            session.equipment.forEach(eq => userSession.equipment.add(eq));
        }
        else {
            sessionsForUser.set(session.user, {
                ...session,
                equipment: new Set(session.equipment), // не мутируем входные данные
            });
        }
    });
    // Map.values() даёт значения в порядке первой вставки — отдельный results не нужен
    return Array.from(sessionsForUser.values()).map(session => ({
        ...session,
        equipment: Array.from(session.equipment).sort(),
    }));
}
exports.default = mergeData;
function mergeDataOld(sessions) {
    const results = [];
    // Point each user id at the cloned session already stored in `results`.
    const sessionsForUser = new Map();
    sessions.forEach(session => {
        if (sessionsForUser.has(session.user)) {
            const userSession = sessionsForUser.get(session.user);
            userSession.duration += session.duration;
            session.equipment.forEach(equipment => {
                userSession.equipment.add(equipment);
            });
        }
        else {
            const clonedSession = {
                ...session,
                // Use a Set internally so repeated equipment is deduplicated while merging.
                equipment: new Set(session.equipment),
            };
            sessionsForUser.set(session.user, clonedSession);
            results.push(clonedSession);
        }
    });
    // Convert the internal Set back to the sorted array shape expected by callers.
    return results.map(session => ({
        ...session,
        equipment: Array.from(session.equipment).sort(),
    }));
}
exports.mergeDataOld = mergeDataOld;
function mergeDataMine(sessions) {
    const results = [];
    const sessionsReversed = sessions.slice().reverse();
    const sessionsProcessed = [];
    const sessionsForUser = new Map();
    sessionsReversed.forEach((session) => {
        if (sessionsForUser.has(session.user)) {
            const userSession = sessionsForUser.get(session.user);
            userSession.duration += session.duration;
            session.equipment.forEach((eq) => userSession.equipment.add(eq));
        }
        else {
            const clonedSession = {
                ...session,
                equipment: new Set(session.equipment),
            };
            sessionsForUser.set(session.user, clonedSession);
            sessionsProcessed.push(clonedSession);
        }
    });
    sessionsProcessed.reverse();
    sessionsProcessed.forEach((session) => {
        results.push({
            ...session,
            equipment: Array.from(session.equipment).sort(),
        });
    });
    return results;
}

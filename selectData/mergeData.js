"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

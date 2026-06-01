"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mergeData(sessions) {
    // Внутреннее представление: equipment как Set для O(1) дедупликации при слиянии
    const results = [];
    // Map: userId → ссылка на тот же объект, что уже лежит в results
    // Благодаря этому обновление Map = обновление объекта в results (O(1))
    const sessionsForUser = new Map();
    sessions.forEach(session => {
        if (sessionsForUser.has(session.user)) {
            // Пользователь уже есть — обновляем его мёрдженный объект
            const userSession = sessionsForUser.get(session.user);
            userSession.duration += session.duration;
            session.equipment.forEach(eq => userSession.equipment.add(eq));
        }
        else {
            // Первое вхождение пользователя — клонируем и сохраняем позицию
            const clonedSession = {
                ...session,
                equipment: new Set(session.equipment), // не мутируем входные данные
            };
            sessionsForUser.set(session.user, clonedSession);
            results.push(clonedSession); // место = первое вхождение
        }
    });
    // Конвертируем Set обратно в отсортированный массив (публичный контракт)
    return results.map(session => ({
        ...session,
        equipment: Array.from(session.equipment).sort(),
    }));
}
exports.default = mergeData;

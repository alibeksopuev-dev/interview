"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Set overlap check — O(min(|A|, |B|)) вместо O(n*m) для вложенных includes
function setHasOverlap(setA, setB) {
    for (const val of Array.from(setA)) {
        if (setB.has(val))
            return true;
    }
    return false;
}
function selectData(sessions, options) {
    // Реверсируем входные данные: последнее вхождение пользователя становится первым.
    // Это позволяет мержить в «первое» (= реально последнее) вхождение,
    // и после обратного реверса порядок окажется правильным.
    const reversedSessions = sessions.slice().reverse();
    // Map: userId → ссылка на клон из sessionsProcessed (для быстрого обновления при мерже)
    const sessionsForUser = new Map();
    // Внутреннее представление: equipment хранится как Set для O(1) дедупликации
    const sessionsProcessed = [];
    reversedSessions.forEach(session => {
        if (options?.merge && sessionsForUser.has(session.user)) {
            // Пользователь уже встречался — обновляем существующий мёрдженный объект
            const userSession = sessionsForUser.get(session.user);
            userSession.duration += session.duration;
            session.equipment.forEach(e => userSession.equipment.add(e));
        }
        else {
            // Первое вхождение пользователя (в reversed-виде = реально последнее в оригинале)
            const clonedSession = {
                ...session,
                equipment: new Set(session.equipment), // не мутируем входные данные
            };
            if (options?.merge) {
                sessionsForUser.set(session.user, clonedSession);
            }
            sessionsProcessed.push(clonedSession);
        }
    });
    // Восстанавливаем оригинальный порядок:
    // при merge — «место» мёрдженной строки = позиция последнего вхождения пользователя
    sessionsProcessed.reverse();
    const optionEquipments = new Set(options?.equipment); // O(1) поиск по запрошенному оборудованию
    const results = [];
    sessionsProcessed.forEach(session => {
        // Отсеиваем сессию при первом же невыполненном условии (short-circuit)
        if ((options?.user != null && options.user !== session.user) ||
            (optionEquipments.size > 0 && !setHasOverlap(optionEquipments, session.equipment)) ||
            (options?.minDuration != null && options.minDuration > session.duration)) {
            return;
        }
        results.push({
            ...session,
            // Конвертируем Set обратно в отсортированный массив (публичный контракт)
            equipment: Array.from(session.equipment).sort(),
        });
    });
    return results;
}
exports.default = selectData;

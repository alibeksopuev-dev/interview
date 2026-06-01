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
            // Пользователь уже встречался — обновляем существующий объединенный объект
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
    // при merge — «место» объединенного объекта = позиция последнего вхождения пользователя
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
const SESSIONS = [
    { user: 8, duration: 50, equipment: ['bench'] },
    { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
    { user: 1, duration: 10, equipment: ['barbell'] },
    { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
    { user: 7, duration: 200, equipment: ['bike'] },
    { user: 2, duration: 200, equipment: ['treadmill'] },
    { user: 2, duration: 200, equipment: ['bike'] },
];
selectData(SESSIONS);
// [
//   { user: 8, duration: 50, equipment: ['bench'] },
//   { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
//   { user: 1, duration: 10, equipment: ['barbell'] },
//   { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
//   { user: 7, duration: 200, equipment: ['bike'] },
//   { user: 2, duration: 200, equipment: ['treadmill'] },
//   { user: 2, duration: 200, equipment: ['bike'] },
// ];
selectData(SESSIONS, { user: 2 });
// [
//   { user: 2, duration: 200, equipment: ['treadmill'] },
//   { user: 2, duration: 200, equipment: ['bike'] },
// ];
selectData(SESSIONS, { minDuration: 200 });
// [
//   { user: 7, duration: 200, equipment: ['bike'] },
//   { user: 2, duration: 200, equipment: ['treadmill'] },
//   { user: 2, duration: 200, equipment: ['bike'] },
// ];
selectData(SESSIONS, { minDuration: 400 });
// [];
selectData(SESSIONS, { equipment: ['bike', 'dumbbell'] });
// [
//   { user: 7, duration: 150, equipment: ['dumbbell', 'kettlebell'] },
//   { user: 7, duration: 100, equipment: ['bike', 'kettlebell'] },
//   { user: 7, duration: 200, equipment: ['bike'] },
//   { user: 2, duration: 200, equipment: ['bike'] },
// ];
selectData(SESSIONS, { merge: true });
// [
//   { user: 8, duration: 50, equipment: ['bench'] },
//   { user: 1, duration: 10, equipment: ['barbell'] },
//   { user: 7, duration: 450, equipment: ['bike', 'dumbbell', 'kettlebell'] },
//   { user: 2, duration: 400, equipment: ['bike', 'treadmill'] },
// ];
selectData(SESSIONS, { merge: true, minDuration: 400 });
// [
//   { user: 7, duration: 450, equipment: ['bike', 'dumbbell', 'kettlebell'] },
//   { user: 2, duration: 400, equipment: ['bike', 'treadmill'] },
// ];

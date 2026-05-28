"use strict";
// =================================================================
// РЕШЕНИЕ 1: Throttle — leading edge (вызов немедленно, блокировка на wait мс)
// =================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttleV2 = exports.throttle = void 0;
// <T extends any[]> — generic по tuple аргументов (не по самой функции как в debounce)
// Возвращаем функцию с той же сигнатурой аргументов T
function throttle(func, // конкретный тип переданной функции
wait) {
    // isLocked — булев флаг-замок:
    // false = окно открыто, можно вызывать func
    // true  = окно заблокировано, вызовы игнорируются
    let isLocked = false;
    return function (...args) {
        if (isLocked) {
            return; // окно заблокировано — просто игнорируем вызов, ничего не планируем
        }
        isLocked = true; // закрываем окно — следующие вызовы будут проигнорированы
        // планируем снятие блокировки через wait мс
        setTimeout(function () {
            isLocked = false; // через wait мс открываем окно снова
        }, wait);
        func.apply(this, args); // вызываем func НЕМЕДЛЕННО с правильным this и аргументами
    };
}
exports.throttle = throttle;
function throttle1(func, wait) {
    let shouldThrottle = false;
    // Добавляем явный `this: any` и типизируем аргументы как `T`
    return function (...args) {
        if (shouldThrottle) {
            return;
        }
        shouldThrottle = true;
        setTimeout(function () {
            shouldThrottle = false;
        }, wait);
        func.apply(this, args); // Теперь и this, и args типизированы корректно
    };
}
exports.default = throttle1;
// =================================================================
// РЕШЕНИЕ 2: То же самое с более явными комментариями о this
// (стрелка в setTimeout — this не нужен внутри, меняем только флаг)
// =================================================================
function throttleV2(func, wait) {
    let shouldThrottle = false;
    return function (...args) {
        if (shouldThrottle) {
            return;
        }
        shouldThrottle = true;
        setTimeout(() => {
            shouldThrottle = false;
        }, wait);
        func.apply(this, args);
    };
}
exports.throttleV2 = throttleV2;
// =================================================================
// Отличие от Debounce — ключевое сравнение
// =================================================================
// Debounce:  func вызывается ПОСЛЕ паузы — откладывает каждый вызов
// Throttle:  func вызывается НЕМЕДЛЕННО — блокирует следующие на wait мс
// Debounce — лифт: ждёт пока все войдут, потом закрывает двери
// Throttle — турникет: пропускает, потом блокирует на N секунд
// Debounce хранит: timeoutID (сбрасывает при каждом вызове)
// Throttle хранит: shouldThrottle (булев флаг, не сбрасывается при вызовах)

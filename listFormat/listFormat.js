"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OTHERS_LABEL = "other";
const OTHERS_SEPARATOR = " and ";
const SEPARATOR = ", ";
/**
 * Форматирует список строк в удобочитаемую строку.
 * Поддерживает сортировку, удаление дубликатов и ограничение длины списка с указанием количества оставшихся элементов.
 *
 * @param {Array<string>} itemsParam - Исходный список строк
 * @param {Object} [options] - Параметры форматирования
 * @param {boolean} [options.sorted] - Сортировать элементы по алфавиту
 * @param {number} [options.length] - Максимальное количество отображаемых элементов
 * @param {boolean} [options.unique] - Удалить дубликаты из списка
 * @returns {string} - Отформатированная строка
 */
function listFormat(itemsParam, options) {
    let items = itemsParam.filter((item) => !!item);
    if (!items.length || items.length === 0) {
        return "";
    }
    if (items.length === 1) {
        return items[0];
    }
    if (options === null || options === void 0 ? void 0 : options.sorted) {
        items.sort();
    }
    if (options === null || options === void 0 ? void 0 : options.unique) {
        items = Array.from(new Set(items));
    }
    if (items.length === 1) {
        return items[0];
    }
    if ((options === null || options === void 0 ? void 0 : options.length) && options.length > 0 && options.length < items.length) {
        const firstSection = items.slice(0, options.length).join(SEPARATOR);
        const count = items.length - options.length;
        const secondSection = `${count} ${OTHERS_LABEL + (count > 1 ? "s" : "")}`;
        return [firstSection, secondSection].join(OTHERS_SEPARATOR);
    }
    const firstSection = items.slice(0, items.length - 1).join(SEPARATOR);
    const secondSection = items[items.length - 1];
    return [firstSection, secondSection].join(OTHERS_SEPARATOR);
}
exports.default = listFormat;

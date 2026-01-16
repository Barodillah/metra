/**
 * Date/Time utility functions for handling UTC to WIB (UTC+7) conversion
 */

/**
 * Converts a UTC date string from the database to WIB (UTC+7) timezone
 * @param {string|Date} utcDate - The UTC date string or Date object from database
 * @returns {Date} - Date object adjusted to WIB timezone
 */
export function toWIB(utcDate) {
    if (!utcDate) return null;
    const date = new Date(utcDate);
    // Add 7 hours (in milliseconds) to convert UTC to WIB
    return new Date(date.getTime() + (7 * 60 * 60 * 1000));
}

/**
 * Formats a UTC date to WIB locale string
 * @param {string|Date} utcDate - The UTC date string or Date object
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @param {string} locale - Locale string, defaults to 'id-ID'
 * @returns {string} - Formatted date string in WIB
 */
export function formatDateWIB(utcDate, options = {}, locale = 'id-ID') {
    const wibDate = toWIB(utcDate);
    if (!wibDate) return '';
    return wibDate.toLocaleDateString(locale, options);
}

/**
 * Formats a UTC date to WIB time string
 * @param {string|Date} utcDate - The UTC date string or Date object
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @param {string} locale - Locale string, defaults to 'id-ID'
 * @returns {string} - Formatted time string in WIB
 */
export function formatTimeWIB(utcDate, options = {}, locale = 'id-ID') {
    const wibDate = toWIB(utcDate);
    if (!wibDate) return '';
    return wibDate.toLocaleTimeString(locale, options);
}

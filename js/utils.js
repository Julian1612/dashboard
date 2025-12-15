// js/utils.js

/**
 * Generiert eine sichere, zufällige UUID (Universally Unique Identifier).
 * Fällt auf eine weniger sichere Methode zurück, falls crypto.randomUUID nicht verfügbar ist.
 * @returns {string} Die generierte UUID.
 */
export function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// src/utils/formatTimestamp.js
export function formatTimestamp(isoString) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        // Use options to ensure consistent output (e.g., AM/PM)
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
        console.error("Error formatting timestamp:", e);
        return isoString; // Return original if invalid
    }
}
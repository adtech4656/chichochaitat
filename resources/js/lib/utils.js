/**
 * Minimal class-name joiner — avoids a dependency for one helper.
 */
export function cn(...values) {
    return values.flat(Infinity).filter(Boolean).join(' ');
}

/**
 * Format a price for the launch market, falling back to the platform default.
 */
export function formatPrice(amount, currency = 'XOF', locale = 'fr-FR') {
    const value = Number(amount ?? 0);

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: currency === 'XOF' ? 0 : 2,
        }).format(value);
    } catch {
        return `${value.toLocaleString()} ${currency}`;
    }
}

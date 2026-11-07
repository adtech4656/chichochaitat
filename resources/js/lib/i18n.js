import { usePage } from '@inertiajs/react';

/**
 * Translation helper backed by the server, so the correct language is present
 * on first paint and the choice survives a return visit via cookie.
 */
export function useTranslation() {
    const { locale = 'fr', translations = {} } = usePage().props;

    const t = (key, replacements) => {
        let value = translations?.[key] ?? key;

        if (replacements) {
            for (const [token, replacement] of Object.entries(replacements)) {
                value = value.split(`{${token}}`).join(String(replacement));
            }
        }

        return value;
    };

    return { t, locale };
}

/**
 * Property types and sub-types are stored in English in the database so the
 * data model stays language-neutral. This translates them for display and
 * falls back to the raw value for anything we do not have a key for.
 */
const TYPE_KEYS = {
    house: 'type.house',
    land: 'type.land',
    shop: 'type.shop',
    hotel: 'type.hotel',
    villa: 'type.villa',
    duplex: 'type.duplex',
    bungalow: 'type.bungalow',
    plot: 'type.plot',
    retail: 'type.retail',
};

export function useTypeLabel() {
    const { t } = useTranslation();

    return (value) => {
        if (!value) return '';

        const key = TYPE_KEYS[String(value).toLowerCase()];

        if (!key) return String(value);

        const translated = t(key);

        return translated === key ? String(value) : translated;
    };
}

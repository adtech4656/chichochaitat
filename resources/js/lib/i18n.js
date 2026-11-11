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

/**
 * Amenity translations for real estate features stored in inventory.
 */
const AMENITY_MAP_FR = {
    'air conditioning': 'Climatisation',
    'ac': 'Climatisation',
    'borehole': 'Forage d’eau autonome',
    'borehole water': 'Forage d’eau autonome',
    'security 24/7': 'Sécurité 24h/24 & Gardiennage',
    'swimming pool': 'Piscine privée',
    'pool': 'Piscine',
    'solar power': 'Énergie solaire',
    'solar': 'Énergie solaire',
    'garden': 'Jardin arboré',
    'furnished': 'Meublé',
    'balcony': 'Balcon / Terrasse',
    'terrace': 'Terrasse',
    'high speed fiber': 'Fibre optique haut débit',
    'fiber': 'Fibre optique',
    'generator': 'Groupe électrogène',
    'backup generator': 'Groupe électrogène',
    'water reservoir': 'Citerne / Réserve d’eau',
    'parking': 'Parking sécurisé',
    'parking clients': 'Parking clients',
    'elevator': 'Ascenseur',
    'gym': 'Salle de sport',
    'cctv': 'Vidéosurveillance',
    'gated community': 'Résidence fermée sécurisée',
    'beachfront': 'Accès direct plage / Bord de mer',
    'servant quarters': 'Dépendance pour personnel',
    'storage': 'Espace de stockage / Cave',
    'ocean view': 'Vue sur l’océan',
    'sea view': 'Vue mer',
    'modern kitchen': 'Cuisine équipée moderne',
    'paved access': 'Accès bitumé / Voie goudronnée',
    'rooftop': 'Rooftop panoramique',
};

const AMENITY_MAP_EN = {
    'air conditioning': 'Air conditioning',
    'borehole': 'Borehole water',
    'borehole water': 'Borehole water',
    'security 24/7': '24/7 Security',
    'swimming pool': 'Swimming pool',
    'solar power': 'Solar power',
    'garden': 'Private garden',
    'furnished': 'Furnished',
    'balcony': 'Balcony / Terrace',
    'high speed fiber': 'High-speed fiber',
    'generator': 'Backup generator',
    'water reservoir': 'Water reservoir',
    'parking': 'Secure parking',
    'elevator': 'Elevator',
    'gym': 'Fitness gym',
    'cctv': 'CCTV Surveillance',
    'beachfront': 'Beachfront',
    'gated community': 'Gated community',
};

export function useAmenityLabel() {
    const { locale } = useTranslation();

    return (tag) => {
        if (!tag) return '';
        const normalized = String(tag).trim().toLowerCase();
        if (locale === 'fr') {
            return AMENITY_MAP_FR[normalized] || String(tag);
        }
        return AMENITY_MAP_EN[normalized] || String(tag);
    };
}


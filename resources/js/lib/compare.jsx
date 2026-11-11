import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'cch_compare_properties';
const MAX_COMPARE = 4;

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [items, setItems] = useState(() => {
        try {
            if (typeof window === 'undefined') return [];
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.warn('Could not persist compare list in localStorage', e);
        }
    }, [items]);

    const compareIds = useMemo(() => items.map((i) => i.id), [items]);

    const isInCompare = useCallback((id) => {
        const numId = Number(id);
        return items.some((i) => Number(i.id) === numId);
    }, [items]);

    const openCompareDrawer = useCallback(() => setDrawerOpen(true), []);
    const closeCompareDrawer = useCallback(() => setDrawerOpen(false), []);

    const addToCompare = useCallback((property, openAfter = false) => {
        const numId = Number(property.id);
        const itemData = {
            id: numId,
            title: property.title || 'Propriété',
            price: property.price || 0,
            currency: property.currency || 'XOF',
            image: property.image || property.gallery?.[0] || '/images/hero-villa.jpg',
            city: property.city || 'Abidjan',
            district: property.district || '',
            type: property.type || 'Villa',
            intent: property.intent || 'sale',
            bedrooms: property.bedrooms ?? property.beds ?? null,
            bathrooms: property.bathrooms ?? property.baths ?? null,
            area: property.area ?? null,
            landArea: property.landArea ?? null,
            hasAcd: Boolean(property.hasAcd || property.title_deed_type === 'ACD' || property.legal_status === 'ACD_DELIVRE'),
            titleDeed: property.titleDeed || property.title_deed_type || 'ACD',
            has360: Boolean(property.has360 || property.virtualTourUrl || property.has_virtual_tour),
            isGpsVerified: Boolean(property.isGpsVerified || property.gps_status === 'verified'),
            href: property.href || `/property/${numId}`,
        };

        setItems((current) => {
            if (current.some((i) => Number(i.id) === numId)) {
                return current;
            }
            if (current.length >= MAX_COMPARE) {
                return [...current.slice(1), itemData];
            }
            return [...current, itemData];
        });

        if (openAfter) {
            setDrawerOpen(true);
        }
    }, []);

    const removeFromCompare = useCallback((id) => {
        const numId = Number(id);
        setItems((current) => current.filter((i) => Number(i.id) !== numId));
    }, []);

    const toggleCompare = useCallback((property, openAfter = false) => {
        const numId = Number(property.id);
        if (isInCompare(numId)) {
            removeFromCompare(numId);
        } else {
            addToCompare(property, openAfter);
        }
    }, [isInCompare, removeFromCompare, addToCompare]);

    const clearCompare = useCallback(() => {
        setItems([]);
    }, []);

    const value = useMemo(
        () => ({
            items,
            compareIds,
            isInCompare,
            addToCompare,
            removeFromCompare,
            toggleCompare,
            clearCompare,
            maxItems: MAX_COMPARE,
            count: items.length,
            drawerOpen,
            openCompareDrawer,
            closeCompareDrawer,
            setDrawerOpen,
        }),
        [items, compareIds, isInCompare, addToCompare, removeFromCompare, toggleCompare, clearCompare, drawerOpen, openCompareDrawer, closeCompareDrawer]
    );

    return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
    const context = useContext(CompareContext);
    if (!context) {
        throw new Error('useCompare must be used within a CompareProvider');
    }
    return context;
}

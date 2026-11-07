import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'cch_compare_properties';
const MAX_COMPARE = 4;

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
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

    const addToCompare = useCallback((property) => {
        const numId = Number(property.id);
        setItems((current) => {
            if (current.some((i) => Number(i.id) === numId)) {
                return current;
            }
            if (current.length >= MAX_COMPARE) {
                // Remove oldest, add new
                return [...current.slice(1), {
                    id: numId,
                    title: property.title || 'Propriété',
                    price: property.price || 0,
                    currency: property.currency || 'XOF',
                    image: property.image || property.gallery?.[0] || '/images/hero-villa.jpg',
                    city: property.city || 'Abidjan',
                    district: property.district || '',
                    type: property.type || 'Villa',
                }];
            }
            return [...current, {
                id: numId,
                title: property.title || 'Propriété',
                price: property.price || 0,
                currency: property.currency || 'XOF',
                image: property.image || property.gallery?.[0] || '/images/hero-villa.jpg',
                city: property.city || 'Abidjan',
                district: property.district || '',
                type: property.type || 'Villa',
            }];
        });
    }, []);

    const removeFromCompare = useCallback((id) => {
        const numId = Number(id);
        setItems((current) => current.filter((i) => Number(i.id) !== numId));
    }, []);

    const toggleCompare = useCallback((property) => {
        const numId = Number(property.id);
        if (isInCompare(numId)) {
            removeFromCompare(numId);
        } else {
            addToCompare(property);
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
        }),
        [items, compareIds, isInCompare, addToCompare, removeFromCompare, toggleCompare, clearCompare]
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

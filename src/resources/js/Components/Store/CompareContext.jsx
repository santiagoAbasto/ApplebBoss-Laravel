import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const MAX = 3;
const KEY = 'ab_compare';

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    }, [items]);

    const inCompare = useCallback((slug) => items.some((p) => p.slug === slug), [items]);

    const toggle = useCallback((product) => {
        setItems((prev) => {
            if (prev.some((p) => p.slug === product.slug)) {
                return prev.filter((p) => p.slug !== product.slug);
            }
            if (prev.length >= MAX) return prev;
            return [...prev, { slug: product.slug, name: product.name, price: product.price, image: product.images?.[0]?.url_card ?? null }];
        });
    }, []);

    const clear = useCallback(() => setItems([]), []);

    return (
        <CompareContext.Provider value={{ items, inCompare, toggle, clear, max: MAX }}>
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    const ctx = useContext(CompareContext);
    if (!ctx) throw new Error('useCompare must be used within CompareProvider');
    return ctx;
}

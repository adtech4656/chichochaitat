import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
    DEFAULT_SITE_CONFIG,
    fetchSiteConfig,
    getLocalSiteConfig,
    saveLocalSiteConfig,
    updateSiteConfig as updateSiteConfigApi,
} from './site-config-service';

const SiteConfigContext = createContext(null);

/**
 * SiteConfigProvider
 * Injects dynamic site configuration into the app hierarchy.
 * Bootstraps from Inertia page props (shared server state), caches locally,
 * and fetches the latest from `/api/site-config` to ensure zero stale hardcoded values.
 */
export function SiteConfigProvider({ children, initialConfig = null }) {
    const pageProps = usePage()?.props || {};
    const serverSite = pageProps.site || initialConfig || null;

    const [config, setConfig] = useState(() => {
        return getLocalSiteConfig(serverSite);
    });

    const [isLoading, setIsLoading] = useState(false);

    // Sync when server props change (e.g. Inertia navigation or locale swap)
    useEffect(() => {
        if (serverSite && Object.keys(serverSite).length > 0) {
            setConfig((prev) => {
                const merged = { ...prev, ...serverSite };
                saveLocalSiteConfig(merged);
                return merged;
            });
        }
    }, [serverSite]);

    // Service layer call: Fetch latest from `/api/site-config` on mount
    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        fetchSiteConfig()
            .then((latest) => {
                if (mounted && latest) {
                    setConfig(latest);
                }
            })
            .catch((err) => {
                console.warn('SiteConfigProvider: API fetch fallback used', err);
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        const handleConfigChange = (e) => {
            if (e.detail) {
                setConfig(e.detail);
            }
        };

        window.addEventListener('chichoc:site-config-change', handleConfigChange);
        return () => {
            mounted = false;
            window.removeEventListener('chichoc:site-config-change', handleConfigChange);
        };
    }, []);

    const refreshConfig = async () => {
        setIsLoading(true);
        try {
            const fresh = await fetchSiteConfig(true);
            setConfig(fresh);
            return fresh;
        } finally {
            setIsLoading(false);
        }
    };

    const mutateConfig = async (updates) => {
        setIsLoading(true);
        try {
            const updated = await updateSiteConfigApi(updates);
            setConfig(updated);
            return updated;
        } finally {
            setIsLoading(false);
        }
    };

    const value = useMemo(
        () => ({
            site: config,
            isLoading,
            refreshConfig,
            updateConfig: mutateConfig,
            name: config.name || DEFAULT_SITE_CONFIG.name,
            logoText: config.logoText || DEFAULT_SITE_CONFIG.logoText,
            logoHighlight: config.logoHighlight || DEFAULT_SITE_CONFIG.logoHighlight,
            logoBadge: config.logoBadge || DEFAULT_SITE_CONFIG.logoBadge,
            phone: config.phone || DEFAULT_SITE_CONFIG.phone,
            whatsapp: config.whatsapp || DEFAULT_SITE_CONFIG.whatsapp,
            email: config.email || DEFAULT_SITE_CONFIG.email,
            address: config.address || DEFAULT_SITE_CONFIG.address,
            hours: config.hours || DEFAULT_SITE_CONFIG.hours,
            escrowPartner: config.escrowPartner || DEFAULT_SITE_CONFIG.escrowPartner,
            stats: config.stats || DEFAULT_SITE_CONFIG.stats,
            social: config.social || DEFAULT_SITE_CONFIG.social,
        }),
        [config, isLoading]
    );

    return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

/**
 * Hook to access dynamic site branding, contact information, and texts anywhere in the component tree.
 */
export function useSiteConfig() {
    const context = useContext(SiteConfigContext);
    if (!context) {
        // Fallback gracefully to default config if used outside provider
        return {
            site: DEFAULT_SITE_CONFIG,
            isLoading: false,
            refreshConfig: async () => DEFAULT_SITE_CONFIG,
            updateConfig: async () => DEFAULT_SITE_CONFIG,
            ...DEFAULT_SITE_CONFIG,
        };
    }
    return context;
}

import { useState, useMemo, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import SiteLayout from '../Layouts/SiteLayout';
import PropertyCard from '../Components/PropertyCard';
import { HeartIcon, ArrowUpRightIcon, ShieldCheckIcon, CheckIcon } from '../Components/Icons';
import { Button, EmptyState } from '../Components/ui';
import { useTranslation } from '../lib/i18n';
import { useAuthModal } from '../lib/auth-modal';
import { page, staggerParent } from '../lib/motion';
import { cn } from '../lib/utils';
import { toggleStoredFavorite, getStoredFavorites } from '../lib/favorites-storage';

export default function Wishlist({ savedProperties = [], isGuest = false, user = null }) {
    const { t, locale } = useTranslation();
    const { openAuth } = useAuthModal();
    const [properties, setProperties] = useState(savedProperties);
    const [filterIntent, setFilterIntent] = useState('all'); // 'all' | 'sale' | 'rent'
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.favorites) {
                const favIds = e.detail.favorites;
                setProperties((prev) => prev.filter((p) => favIds.includes(Number(p.id))));
            }
        };
        window.addEventListener('chichoc:favorites-change', handler);
        return () => window.removeEventListener('chichoc:favorites-change', handler);
    }, []);

    const counts = useMemo(() => {
        const total = properties.length;
        const sale = properties.filter((p) => p.intent === 'sale').length;
        const rent = properties.filter((p) => p.intent === 'rent').length;
        return { total, sale, rent };
    }, [properties]);

    const filteredProperties = useMemo(() => {
        if (filterIntent === 'all') return properties;
        return properties.filter((p) => p.intent === filterIntent);
    }, [properties, filterIntent]);

    const handleShare = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard?.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleRemove = (propertyId) => {
        toggleStoredFavorite(propertyId);
        setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    };

    return (
        <motion.div variants={page} initial="initial" animate="animate" className="pb-28 lg:pb-24">
            <Head title="Ma Wishlist · Coups de Cœur Vérifiés | Chic Choc Habitat" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-28">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[0.75rem] text-faint mb-6">
                    <Link href="/" className="hover:text-heading transition-colors">
                        Accueil
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-body/80">Wishlist & Coups de Cœur</span>
                </nav>

                {/* Hero Header */}
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30">
                                <HeartIcon filled className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                                Sélection Personnelle
                            </span>
                        </div>
                        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-heading">
                            Ma Wishlist Immobilière
                        </h1>
                        <p className="mt-1 text-sm text-body/75">
                            {counts.total} bien{counts.total > 1 ? 's' : ''} sauvegardé{counts.total > 1 ? 's' : ''} avec audit de localisation GPS et visites virtuelles 360°
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-heading transition-colors hover:bg-white/10 cursor-pointer"
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-emerald-300">Lien copié !</span>
                                </>
                            ) : (
                                <>
                                    <span>🔗</span>
                                    <span>Partager la sélection</span>
                                </>
                            )}
                        </button>

                        <Button as="a" href="/properties" variant="secondary" size="sm">
                            Explorer les annonces
                        </Button>
                    </div>
                </div>

                {/* Session Persistence Banner */}
                <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheckIcon className="h-5 w-5 shrink-0 text-emerald-400" />
                            <div className="text-xs">
                                {!isGuest && user ? (
                                    <>
                                        <p className="font-semibold text-heading">
                                            Wishlist synchronisée avec votre profil {user.name} ({user.email})
                                        </p>
                                        <p className="text-body/70 mt-0.5">
                                            Vos biens restent sauvegardés sur tous vos téléphones, tablettes et ordinateurs.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-semibold text-heading">
                                            Wishlist active dans votre session de navigation actuelle
                                        </p>
                                        <p className="text-body/70 mt-0.5">
                                            Créez un compte gratuit pour synchroniser vos biens sauvegardés en permanence et recevoir les alertes de baisse de prix.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {isGuest && (
                            <button
                                type="button"
                                onClick={() => openAuth('signup')}
                                className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-[#070b0e] hover:bg-emerald-400 transition-colors cursor-pointer shrink-0"
                            >
                                Sauvegarder sur mon profil
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                {counts.total > 0 && (
                    <div className="flex items-center gap-2 mb-6">
                        {[
                            { key: 'all', label: `Tous (${counts.total})` },
                            { key: 'sale', label: `À Vendre (${counts.sale})` },
                            { key: 'rent', label: `À Louer (${counts.rent})` },
                        ].map((btn) => (
                            <button
                                key={btn.key}
                                type="button"
                                onClick={() => setFilterIntent(btn.key)}
                                className={cn(
                                    'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                                    filterIntent === btn.key
                                        ? 'bg-emerald-500 text-[#070b0e] shadow-sm'
                                        : 'bg-white/[0.05] text-body/80 hover:bg-white/10 hover:text-heading'
                                )}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content: Property Grid or Empty State */}
                {filteredProperties.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={HeartIcon}
                            title={
                                counts.total === 0
                                    ? 'Votre wishlist est vide pour le moment'
                                    : 'Aucun bien dans cette catégorie'
                            }
                            description={
                                counts.total === 0
                                    ? 'Parcourez notre catalogue immobilier vérifié et cliquez sur l’icône cœur pour conserver vos propriétés préférées dans votre profil.'
                                    : 'Modifiez vos filtres ci-dessus pour afficher vos autres biens sauvegardés.'
                            }
                            action={
                                <Button as="a" href="/properties" variant="secondary" size="sm" className="mt-4">
                                    Découvrir les biens vérifiés
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    <motion.div
                        variants={staggerParent}
                        initial="initial"
                        animate="animate"
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {filteredProperties.map((property) => (
                            <div key={property.id} className="relative group">
                                <PropertyCard
                                    property={property}
                                    onSave={(prop, nextSaved) => {
                                        if (!nextSaved) {
                                            handleRemove(prop.id);
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

Wishlist.layout = (page) => <SiteLayout>{page}</SiteLayout>;

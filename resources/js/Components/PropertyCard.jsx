import { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowUpRightIcon, BellIcon, HeartIcon, MapPinIcon } from './Icons';
import { cn } from '../lib/utils';
import { useMoney } from '../lib/money';
import { useTranslation } from '../lib/i18n';
import { useAuthModal } from '../lib/auth-modal';
import { spring, staggerChild } from '../lib/motion';

import { useCompare } from '../lib/compare';
import KycBadge from './KycBadge';
import GpsVerifiedBadge from './GpsVerifiedBadge';

/**
 * Flow 1 — Property card.
 * Glass surface, lazy-loaded imagery with a shimmer hand-off, and a spring
 * hover lift (scale 1.02) shared by every interactive surface in the product.
 */
import { isPropertyFavorite, toggleStoredFavorite } from '../lib/favorites-storage';

export default function PropertyCard({ property, priority = false, onSave }) {
    const { format } = useMoney();
    const { t, locale } = useTranslation();
    const { openAuth } = useAuthModal();
    const { auth } = usePage().props;
    const user = auth?.user;
    const { isInCompare, toggleCompare } = useCompare();

    const [imageLoaded, setImageLoaded] = useState(false);
    const [saved, setSaved] = useState(() => isPropertyFavorite(property?.id) || Boolean(property?.saved));

    const inCompare = isInCompare(property.id);

    useEffect(() => {
        setSaved(isPropertyFavorite(property?.id) || Boolean(property?.saved));
    }, [property.id, property.saved]);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.id === Number(property.id)) {
                setSaved(Boolean(e.detail.isFavorite));
            } else if (e.detail?.favorites) {
                setSaved(e.detail.favorites.includes(Number(property.id)));
            }
        };
        window.addEventListener('chichoc:favorites-change', handler);
        return () => window.removeEventListener('chichoc:favorites-change', handler);
    }, [property.id]);

    const toggleSave = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const result = toggleStoredFavorite(property.id);
        setSaved(result.isFavorite);
        onSave?.(property, result.isFavorite);
    };

    const handleCompare = (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleCompare(property, true);
    };

    return (
        <motion.article
            variants={staggerChild}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={spring}
            className="group glass relative flex flex-col overflow-hidden rounded-[1.5rem] will-change-transform hover:border-white/[0.18]"
        >
            <a href={property.href ?? '#'} className="flex flex-1 flex-col focus-visible:rounded-[1.5rem]">
                <div className="relative aspect-[4/3] overflow-hidden bg-void-raised">
                    {/* Shimmer until the decoded bitmap is painted. */}
                    {!imageLoaded && <div className="absolute inset-0 shimmer-surface" aria-hidden="true" />}

                    <img
                        src={property.image}
                        alt=""
                        loading={priority ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={priority ? 'high' : 'auto'}
                        onLoad={() => setImageLoaded(true)}
                        className={cn(
                            'h-full w-full object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                            imageLoaded ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0',
                            'group-hover:scale-[1.05]',
                        )}
                    />

                    {/* Legibility scrim for the badge row */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-void/70 to-transparent" />

                    <div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-1.5 z-10 max-w-[80%]">
                        {/* Primary Intent Badge (Sale vs Rent) */}
                        {property.intent === 'rent' ? (
                            <div className="flex items-center gap-1 rounded-full bg-cyan-400 px-2.5 py-1 text-[0.6875rem] font-extrabold tracking-[0.02em] text-[#070b0e] shadow-[0_2px_12px_rgba(34,211,238,0.45)] ring-1 ring-cyan-200">
                                <span>🔑</span>
                                <span>{t('badge.forRent', 'À LOUER')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[0.6875rem] font-extrabold tracking-[0.02em] text-[#070b0e] shadow-[0_2px_12px_rgba(16,185,129,0.45)] ring-1 ring-emerald-200">
                                <span>🏛</span>
                                <span>{t('badge.forSale', 'À VENDRE')}</span>
                            </div>
                        )}

                        {/* Distinct Property Type Badges */}
                        {property.type === 'Shop' && (
                            <div className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[0.6875rem] font-bold text-[#070b0e] shadow-[0_2px_10px_rgba(251,191,36,0.35)] ring-1 ring-amber-200">
                                <span>🏬</span>
                                <span>{t('badge.shop', 'BOUTIQUE / COMMERCE')}</span>
                            </div>
                        )}
                        {property.type === 'Hotel' && (
                            <div className="flex items-center gap-1 rounded-full bg-violet-400 px-2 py-0.5 text-[0.6875rem] font-bold text-[#070b0e] shadow-[0_2px_10px_rgba(167,139,250,0.35)] ring-1 ring-violet-200">
                                <span>🏨</span>
                                <span>{t('badge.hotel', 'HÔTEL & RÉSIDENCE')}</span>
                            </div>
                        )}
                        {property.type === 'Land' && (
                            <div className="flex items-center gap-1 rounded-full bg-lime-400 px-2 py-0.5 text-[0.6875rem] font-bold text-[#070b0e] shadow-[0_2px_10px_rgba(163,230,53,0.35)] ring-1 ring-lime-200">
                                <span>🌿</span>
                                <span>{t('badge.land', 'TERRAIN TITRÉ ACD')}</span>
                            </div>
                        )}
                        {property.type === 'House' && (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-800/90 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-100 ring-1 ring-emerald-400/40 backdrop-blur-md">
                                <span>🏡</span>
                                <span>{t('badge.house', 'VILLA / MAISON')}</span>
                            </div>
                        )}

                        <GpsVerifiedBadge property={property} variant="compact" />

                        {property.distanceKm !== undefined && (
                            <div className="flex items-center gap-1 rounded-full bg-cyan-950/85 px-2 py-0.5 text-[0.625rem] font-bold text-cyan-300 ring-1 ring-cyan-500/50 backdrop-blur-md shadow-sm">
                                <span>📍</span>
                                <span>{property.distanceKm} km</span>
                            </div>
                        )}

                        {property.price_drop_subscribed && (
                            <div
                                className="flex items-center gap-1 rounded-full bg-amber-500/25 px-2 py-0.5 text-[0.6875rem] font-medium text-amber-300 backdrop-blur-md ring-1 ring-amber-400/40"
                                title={t('prop.priceAlertSubscribed', 'Subscribed to price alerts')}
                            >
                                <BellIcon filled className="h-3 w-3 text-amber-400" />
                                <span>{t('prop.priceAlert', 'Price Alert')}</span>
                            </div>
                        )}
                    </div>

                    <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 z-10">
                        {/* Compare toggle button */}
                        <motion.button
                            type="button"
                            onClick={handleCompare}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            transition={spring}
                            aria-label={inCompare ? t('compare.remove') : t('compare.addToCompare')}
                            aria-pressed={inCompare}
                            title={inCompare ? t('compare.remove') : t('compare.addToCompare')}
                            className={cn(
                                'grid h-9 w-9 place-items-center rounded-full backdrop-blur-md ring-1 transition-all cursor-pointer',
                                inCompare
                                    ? 'bg-emerald-500 text-void ring-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] font-bold'
                                    : 'bg-void/60 text-heading/80 ring-white/15 hover:text-heading hover:bg-void/80',
                            )}
                        >
                            <span className="text-sm">⚖️</span>
                        </motion.button>

                        {/* Save / Favorite toggle button (locally persisted) */}
                        <motion.button
                            type="button"
                            onClick={toggleSave}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.88 }}
                            transition={spring}
                            aria-label={saved ? t('prop.unsave', 'Retirer des favoris') : t('prop.save', 'Ajouter aux favoris')}
                            aria-pressed={saved}
                            title={saved ? (locale === 'fr' ? 'Retirer des favoris (Sauvegardé localement)' : 'Remove from favorites (Saved locally)') : (locale === 'fr' ? 'Ajouter aux favoris (Sauvegarde locale)' : 'Save as favorite (Local storage)')}
                            className={cn(
                                'grid h-9 w-9 place-items-center rounded-full backdrop-blur-md ring-1 transition-all cursor-pointer shadow-md',
                                saved
                                    ? 'text-rose-400 ring-rose-500/70 bg-rose-950/70 shadow-[0_0_16px_rgba(244,63,94,0.45)]'
                                    : 'bg-void/65 text-white/80 ring-white/20 hover:text-rose-300 hover:ring-rose-400/50 hover:bg-void/90',
                            )}
                        >
                            <HeartIcon filled={saved} className={cn('h-4.5 w-4.5 transition-transform duration-200', saved && 'scale-110')} />
                        </motion.button>
                    </div>

                    {/* Bottom fade so the photo dissolves into the glass body */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-void/80 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-5">
                    <p className="flex items-center gap-1.5 text-[0.75rem] text-faint">
                        <MapPinIcon className="h-3.5 w-3.5 text-neon" />
                        {property.location}
                    </p>

                    <h3 className="mt-2 line-clamp-1 font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-heading">
                        {property.title}
                    </h3>

                    <p className="mt-1.5 text-[0.8125rem] text-body">
                        {property.bedrooms > 0 ? (
                            <>
                                {property.bedrooms} {t('prop.bedsShort')}
                                <span className="mx-1.5 text-white/20">·</span>
                                {property.bathrooms} {t('prop.bathsShort')}
                                <span className="mx-1.5 text-white/20">·</span>
                            </>
                        ) : null}
                        {property.area} m²
                    </p>

                    {property.agent && (
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-2.5 text-[0.75rem]">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.visit(`/agents/${property.agent.slug || property.agent.id}`);
                                }}
                                className="group/agent flex items-center gap-1.5 min-w-0 text-body/80 hover:text-heading transition-colors text-left"
                                title={t('agent.viewProfile', 'View agent profile')}
                            >
                                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-neon/15 text-[0.5625rem] font-bold text-neon ring-1 ring-neon/25 group-hover/agent:bg-neon/30">
                                    {property.agent.initials || 'AG'}
                                </span>
                                <span className="truncate font-medium text-heading/90 group-hover/agent:underline underline-offset-2">
                                    {property.agent.name}
                                </span>
                            </button>
                            {property.agent.verified && (
                                <KycBadge agent={property.agent} variant="pill" showDetails={false} />
                            )}
                        </div>
                    )}

                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                        <div>
                            <span className={cn(
                                "inline-block px-2 py-0.5 rounded text-[0.625rem] font-bold uppercase tracking-wider",
                                property.intent === 'rent'
                                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                                    : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            )}>
                                {property.intent === 'rent' ? t('category.rent', 'À Louer') : t('category.sale', 'À Vendre')}
                            </span>
                            <div className="mt-1 flex items-baseline gap-1.5">
                                <p className="font-display text-[1.125rem] font-bold tracking-[-0.01em] text-heading">
                                    {format(property.price)}
                                </p>
                                {property.intent === 'rent' && (
                                    <span className="text-[0.6875rem] font-medium text-faint">
                                        / {t('prop.month', 'mois')}
                                    </span>
                                )}
                                {property.original_price && property.original_price > property.price && (
                                    <span className="text-[0.75rem] text-faint line-through ml-1">
                                        {format(property.original_price)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-heading ring-1 ring-white/10 transition-all duration-300 group-hover:bg-neon group-hover:text-void group-hover:ring-neon group-hover:neon-glow">
                            <ArrowUpRightIcon className="h-[1.05rem] w-[1.05rem]" />
                        </span>
                    </div>
                </div>
            </a>
        </motion.article>
    );
}

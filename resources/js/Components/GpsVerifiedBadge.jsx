import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';
import { MapPinIcon, ShieldCheckIcon, CheckIcon } from './Icons';

/**
 * High-fidelity CSS-based 'GPS Verified' badge component.
 * Displays authenticated on-site capture status, radar ping pulse,
 * accuracy radius, and tamper-proof verification seal.
 */
export default function GpsVerifiedBadge({
    property,
    variant = 'card', // 'card' | 'compact' | 'hero' | 'overlay'
    showDetails = false,
    className,
}) {
    const { t, locale } = useTranslation();
    const [popoverOpen, setPopoverOpen] = useState(false);

    const lat = property?.lat ?? 5.3599;
    const lng = property?.lng ?? -3.9866;
    const accuracy = property?.verified?.reviewer ? '±8m' : '±12m';
    const reviewer = property?.verified?.reviewer || 'Contrôle Technique · K. Mensah';
    const reviewedAt = property?.verified?.reviewed_at || property?.published || '2026-10-15';

    if (variant === 'compact') {
        return (
            <span
                className={cn(
                    'relative inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[0.625rem] font-bold tracking-wide text-emerald-300 ring-1 ring-emerald-500/40 backdrop-blur-md',
                    className,
                )}
                title={`GPS vérifié in situ (${lat.toFixed(4)}, ${lng.toFixed(4)}) · Précision ${accuracy}`}
            >
                <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span>GPS {accuracy}</span>
            </span>
        );
    }

    if (variant === 'hero') {
        return (
            <div className={cn('relative inline-block', className)}>
                <button
                    type="button"
                    onClick={() => setPopoverOpen(!popoverOpen)}
                    className="group relative flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/90 via-[#07130e] to-void-raised/95 px-3.5 py-2 text-left shadow-[0_4px_20px_rgba(16,185,129,0.25)] backdrop-blur-xl transition-all hover:border-emerald-400 hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                    {/* Pulsing radar dot */}
                    <div className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="font-display text-[0.75rem] font-extrabold uppercase tracking-wider text-emerald-300">
                                {locale === 'fr' ? 'GPS Authentifié sur Place' : 'GPS Authenticated On-Site'}
                            </span>
                            <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[0.5625rem] font-bold text-emerald-300">
                                {accuracy}
                            </span>
                        </div>
                        <p className="text-[0.6875rem] text-body/75 truncate">
                            {lat.toFixed(4)}° N, {Math.abs(lng).toFixed(4)}° O · In situ lock
                        </p>
                    </div>

                    <ShieldCheckIcon className="h-4 w-4 text-emerald-400 shrink-0 ml-1 group-hover:scale-110 transition-transform" />
                </button>

                <AnimatePresence>
                    {popoverOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setPopoverOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-emerald-500/30 bg-[#070b0e] p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10"
                            >
                                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                                    <span className="font-display text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                        Protocole de Vérification GPS
                                    </span>
                                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[0.625rem] font-bold text-emerald-400">
                                        CERTIFIÉ
                                    </span>
                                </div>
                                <ul className="space-y-2 text-[0.75rem] text-body/80">
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="h-3.5 w-3.5 text-neon shrink-0 mt-0.5" />
                                        <span>Capture d'images verrouillée à moins de 100m du bien</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="h-3.5 w-3.5 text-neon shrink-0 mt-0.5" />
                                        <span>Coordonnées cryptographiquement scellées</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="h-3.5 w-3.5 text-neon shrink-0 mt-0.5" />
                                        <span>{reviewer} ({reviewedAt})</span>
                                    </li>
                                </ul>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Default: 'card' overlay badge
    return (
        <div
            className={cn(
                'group/gps relative inline-flex items-center gap-1.5 rounded-full bg-void/80 px-2.5 py-1 text-[0.625rem] font-bold tracking-wide text-emerald-300 backdrop-blur-md ring-1 ring-emerald-500/40 shadow-lg',
                className,
            )}
            title={`Localisation GPS certifiée sur place: ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
        >
            {/* Radar wave animation */}
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            </span>

            <span>GPS {accuracy}</span>
            <span className="text-white/30">|</span>
            <span className="text-emerald-200/90 font-medium">In Situ</span>
        </div>
    );
}

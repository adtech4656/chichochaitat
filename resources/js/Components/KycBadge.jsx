import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheckIcon, CheckIcon, CloseIcon } from './Icons';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';
import { spring } from '../lib/motion';

/**
 * KYC-Verified Badge Component.
 * Enhances user trust by highlighting that the listing's agent has completed
 * stringent identity checks, government ID verification, and commercial licensing.
 */
export default function KycBadge({
    agent,
    variant = 'pill',
    className,
    showDetails = false,
    interactive = true,
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const popoverRef = useRef(null);

    // Close on click outside and Escape key
    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const handleTriggerClick = (e) => {
        if (!interactive) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen((curr) => !curr);
    };

    const agentName = agent?.name || 'Agent Agréé';
    const agencyName = agent?.agency || 'Koffi & Co. Immobilier';
    const dealsCount = agent?.deals || 128;
    const rating = agent?.rating || 4.9;

    return (
        <div ref={popoverRef} className={cn('relative inline-flex items-center', className)}>
            {/* VARIANT: Overlay (ideal for photo overlays on cards) */}
            {variant === 'overlay' && (
                <button
                    type="button"
                    onClick={handleTriggerClick}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-label={t('kyc.agentBadge')}
                    className={cn(
                        'group/kyc flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide transition-all duration-300',
                        'bg-void/70 text-emerald-300 backdrop-blur-md border border-emerald-500/35 shadow-[0_4px_16px_rgba(0,0,0,0.5)]',
                        'hover:bg-void/85 hover:border-emerald-400 hover:text-emerald-200 hover:shadow-[0_0_12px_rgba(16,185,129,0.35)]',
                        interactive ? 'cursor-pointer' : 'cursor-default',
                    )}
                >
                    <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40 group-hover/kyc:scale-110 transition-transform">
                        <ShieldCheckIcon className="h-2.5 w-2.5 stroke-[2.4]" />
                    </span>
                    <span className="font-medium text-white/95">
                        KYC <span className="text-emerald-400 font-bold">Vérifié</span>
                    </span>
                </button>
            )}

            {/* VARIANT: Pill (clean, compact tag) */}
            {variant === 'pill' && (
                <button
                    type="button"
                    onClick={handleTriggerClick}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium transition-all duration-200',
                        'bg-emerald-500/12 text-emerald-300 border border-emerald-500/30 shadow-sm',
                        'hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-200',
                        interactive ? 'cursor-pointer' : 'cursor-default',
                    )}
                >
                    <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-500/25 text-emerald-400">
                        <CheckIcon className="h-2.5 w-2.5 stroke-[2.6]" />
                    </span>
                    <span className="font-semibold">{t('kyc.badge')}</span>
                    {showDetails && agent && (
                        <span className="text-emerald-400/70 text-[0.625rem]">· {dealsCount} deals</span>
                    )}
                </button>
            )}

            {/* VARIANT: Agent Profile Banner (for Property details page) */}
            {variant === 'agent' && (
                <div
                    onClick={interactive ? handleTriggerClick : undefined}
                    className={cn(
                        'flex items-center justify-between gap-3 rounded-xl bg-emerald-950/30 border border-emerald-500/25 p-3 backdrop-blur-sm transition-all',
                        interactive && 'hover:border-emerald-500/45 cursor-pointer hover:bg-emerald-950/40',
                    )}
                >
                    <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40 shadow-sm">
                            <ShieldCheckIcon className="h-4.5 w-4.5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[0.8125rem] font-bold text-white leading-tight">
                                    {t('kyc.agentBadge')}
                                </span>
                                <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[0.625rem] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                                    Niveau 3
                                </span>
                            </div>
                            <p className="text-[0.6875rem] text-body/80 mt-0.5">
                                Identité & habilitation certifiées par Chic Choc Habitat
                            </p>
                        </div>
                    </div>

                    {interactive && (
                        <span className="text-[0.6875rem] font-semibold text-emerald-400 underline underline-offset-2 shrink-0">
                            Détails
                        </span>
                    )}
                </div>
            )}

            {/* Trust Details Popover Dialog */}
            <AnimatePresence>
                {open && (
                    <>
                        <div
                            className="fixed inset-0 z-[85] bg-black/40 sm:hidden"
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={spring}
                            role="dialog"
                            aria-label={t('kyc.popoverTitle')}
                            className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-[90] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-emerald-500/35 bg-void-raised/98 p-5 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.95),0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-2xl ring-1 ring-white/10"
                        >
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                                <div className="flex items-center gap-2.5">
                                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                                        <ShieldCheckIcon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <h4 className="font-display text-[0.875rem] font-bold text-heading">
                                            {t('kyc.popoverTitle')}
                                        </h4>
                                        <p className="text-[0.6875rem] text-emerald-400 font-medium">
                                            {agentName} · {agencyName}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    aria-label={t('common.close')}
                                    className="grid h-6 w-6 place-items-center rounded-full text-body/60 hover:bg-white/10 hover:text-heading cursor-pointer"
                                >
                                    <CloseIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <p className="mt-3 text-[0.75rem] text-body/80 leading-relaxed">
                                {t('kyc.popoverSubtitle')} — Cet agent a satisfait à tous les contrôles réglementaires et d’intégrité requis en Côte d'Ivoire.
                            </p>

                            <div className="mt-4 space-y-2.5">
                                <div className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] p-2.5 border border-white/5">
                                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                                        <CheckIcon className="h-3 w-3 stroke-[2.5]" />
                                    </span>
                                    <div>
                                        <p className="text-[0.75rem] font-semibold text-white">
                                            {t('kyc.pillar1Title')}
                                        </p>
                                        <p className="text-[0.6875rem] text-body/70 mt-0.5">
                                            {t('kyc.pillar1Desc')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] p-2.5 border border-white/5">
                                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                                        <CheckIcon className="h-3 w-3 stroke-[2.5]" />
                                    </span>
                                    <div>
                                        <p className="text-[0.75rem] font-semibold text-white">
                                            {t('kyc.pillar2Title')}
                                        </p>
                                        <p className="text-[0.6875rem] text-body/70 mt-0.5">
                                            {t('kyc.pillar2Desc')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] p-2.5 border border-white/5">
                                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                                        <CheckIcon className="h-3 w-3 stroke-[2.5]" />
                                    </span>
                                    <div>
                                        <p className="text-[0.75rem] font-semibold text-white">
                                            {t('kyc.pillar3Title')}
                                        </p>
                                        <p className="text-[0.6875rem] text-body/70 mt-0.5">
                                            {t('kyc.pillar3Desc')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[0.6875rem]">
                                <span className="text-body/60">
                                    Transactions sécurisées: <strong className="text-white">{dealsCount}</strong>
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                                    ★ {rating}/5.0
                                </span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCompare } from '../lib/compare';
import { useTranslation } from '../lib/i18n';
import { CloseIcon } from './Icons';

export default function CompareFloatingBar() {
    const { items, removeFromCompare, clearCompare, count, maxItems, compareIds, openCompareDrawer } = useCompare();
    const { t } = useTranslation();
    const { url } = usePage();

    // Hide if on compare page itself or no items selected
    if (url?.startsWith('/compare') || url?.startsWith('/comparer') || count === 0) {
        return null;
    }

    const compareUrl = `/compare?ids=${compareIds.join(',')}`;

    return (
        <AnimatePresence>
            <motion.aside
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                aria-label={t('compare.title')}
                className="fixed bottom-4 inset-x-3 sm:inset-x-6 z-40 max-w-4xl mx-auto pointer-events-auto"
            >
                <div className="rounded-2xl border border-white/15 bg-void-raised/95 backdrop-blur-2xl p-3 sm:p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-emerald-500/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Indicator & Thumbnails */}
                        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
                            <div className="shrink-0 flex flex-col">
                                <span className="font-display text-xs sm:text-sm font-bold text-heading flex items-center gap-1.5">
                                    <span className="inline-block h-2 w-2 rounded-full bg-neon animate-pulse" />
                                    {t('compare.title')}
                                </span>
                                <span className="text-[0.6875rem] text-body/70 font-mono">
                                    {count} / {maxItems} {t('compare.selectedCount')}
                                </span>
                            </div>

                            <div className="h-8 w-px bg-white/10 shrink-0 hidden sm:block" />

                            {/* Property Thumbnails */}
                            <div className="flex items-center gap-2">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative group shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden border border-white/20 bg-void"
                                        title={item.title}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/hero-villa.jpg';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromCompare(item.id);
                                            }}
                                            aria-label={`${t('compare.remove')} ${item.title}`}
                                            className="absolute top-0.5 right-0.5 grid h-4 w-4 place-items-center rounded-full bg-void/85 text-white/90 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                                        >
                                            <CloseIcon className="h-2.5 w-2.5 stroke-[2.5]" />
                                        </button>
                                    </div>
                                ))}

                                {/* Empty Slots */}
                                {Array.from({ length: Math.max(0, maxItems - count) }).map((_, idx) => (
                                    <div
                                        key={`empty-${idx}`}
                                        className="shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center text-body/40 text-[0.625rem] font-mono"
                                    >
                                        +{idx + count + 1}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 justify-end shrink-0">
                            <button
                                type="button"
                                onClick={clearCompare}
                                className="px-3 py-2 text-xs font-semibold text-body/75 hover:text-rose-300 transition-colors cursor-pointer"
                            >
                                {t('compare.clearAll')}
                            </button>

                            <button
                                type="button"
                                onClick={openCompareDrawer}
                                className="flex items-center gap-2 rounded-xl bg-neon px-4 py-2 text-xs sm:text-sm font-bold text-void hover:bg-neon-bright hover:shadow-[0_0_20px_rgba(102,187,106,0.6)] transition-all cursor-pointer"
                            >
                                <span>⚖️</span>
                                <span>{t('compare.compareNow')} ({count})</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.aside>
        </AnimatePresence>
    );
}

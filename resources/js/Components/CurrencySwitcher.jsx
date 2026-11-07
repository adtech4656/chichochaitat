import { router, usePage } from '@inertiajs/react';
import { cn } from '../lib/utils';
import { ChevronDownIcon } from './Icons';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { spring } from '../lib/motion';

/**
 * Currency selector. Prices are stored in XOF and converted at display
 * time using live market rates, so switching currency never rewrites listings.
 */
export default function CurrencySwitcher({ className, align = 'right' }) {
    const { currency = 'XOF', currencies = {} } = usePage().props;
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const active = currencies[currency] ?? { code: currency, symbol: currency };

    const choose = (code) => {
        setOpen(false);
        if (code === currency) return;
        document.cookie = `currency=${code}; path=/; max-age=31536000; SameSite=Lax`;
        router.post(`/currency/${code}`, {}, { preserveScroll: true, preserveState: false });
    };

    // Close on click outside or Escape key
    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Currency"
                className="flex items-center gap-1.5 rounded-xl bg-white/[0.08] px-3 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-white ring-1 ring-white/15 transition-all hover:bg-white/[0.14] hover:ring-neon/40 focus:outline-none focus:ring-2 focus:ring-neon/60 cursor-pointer"
            >
                <span className="font-bold text-neon">{active.code}</span>
                <span className="text-[0.6875rem] text-body/70 font-normal">({active.symbol})</span>
                <ChevronDownIcon className={cn('h-3.5 w-3.5 transition-transform duration-200 text-body/80', open && 'rotate-180')} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Dim backdrop on mobile to prevent accidental touch-through */}
                        <div
                            className="fixed inset-0 z-[70] bg-black/40 sm:hidden"
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                        />

                        <motion.ul
                            role="listbox"
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={spring}
                            className={cn(
                                'absolute z-[80] mt-2 w-48 rounded-[1rem] border border-white/20 bg-void-raised/98 p-1.5 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.95),0_0_20px_rgba(102,187,106,0.15)] backdrop-blur-2xl ring-1 ring-white/10',
                                align === 'left' ? 'left-0' : 'right-0',
                            )}
                        >
                            <div className="px-2.5 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
                                <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-neon/90 flex items-center gap-1.5">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
                                    Taux Live FX (Direct)
                                </p>
                            </div>

                            {Object.values(currencies).map((item) => {
                                const isSelected = item.code === currency;
                                return (
                                    <li key={item.code}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => choose(item.code)}
                                            className={cn(
                                                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[0.8125rem] transition-colors cursor-pointer',
                                                isSelected
                                                    ? 'bg-neon/15 text-neon font-semibold ring-1 ring-neon/30'
                                                    : 'text-body/85 hover:bg-white/[0.08] hover:text-white',
                                            )}
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <span className="w-10 font-bold">{item.code}</span>
                                                <span className="text-body/60 text-xs">({item.symbol})</span>
                                                <span className="text-[0.7rem] text-faint truncate max-w-[4rem]">
                                                    {item.name}
                                                </span>
                                            </span>
                                            {isSelected && (
                                                <span className="text-xs font-bold text-neon">✓</span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </motion.ul>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

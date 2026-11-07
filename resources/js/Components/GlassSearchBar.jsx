import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, MapPinIcon, SearchIcon } from './Icons';
import { spring } from '../lib/motion';
import { cn } from '../lib/utils';
import { useTranslation, useTypeLabel } from '../lib/i18n';

/**
 * A real combobox: click to open, type to filter, arrow keys to move,
 * Enter to choose. A native <select> cannot accept text, which is why this is
 * hand-built — while keeping full keyboard and screen-reader semantics.
 */
function Combobox({ id, label, icon: Icon, options, value, onChange, anyLabel, formatOption }) {
    const { t } = useTranslation();

    const render = formatOption ?? ((option) => option);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlight, setHighlight] = useState(0);

    const rootRef = useRef(null);
    const inputRef = useRef(null);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        const matches = term
            ? options.filter((option) => render(option).toLowerCase().includes(term))
            : options;

        return [anyLabel, ...matches];
    }, [options, query, anyLabel, render]);

    /* Close on outside click. */
    useEffect(() => {
        if (!open) return undefined;

        const onDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
                setQuery('');
            }
        };

        document.addEventListener('mousedown', onDown);

        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    useEffect(() => {
        if (open) {
            setHighlight(0);
            window.setTimeout(() => inputRef.current?.focus(), 30);
        }
    }, [open]);

    const choose = (option) => {
        onChange(option === anyLabel ? '' : option);
        setOpen(false);
        setQuery('');
    };

    const onKeyDown = (event) => {
        if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
            event.preventDefault();
            setOpen(true);
            return;
        }

        if (!open) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlight((current) => Math.min(filtered.length - 1, current + 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlight((current) => Math.max(0, current - 1));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (filtered[highlight]) choose(filtered[highlight]);
        } else if (event.key === 'Escape') {
            setOpen(false);
            setQuery('');
        }
    };

    return (
        <div ref={rootRef} className="relative flex-1">
            <label
                htmlFor={id}
                className="block text-[0.625rem] font-medium uppercase tracking-[0.16em] text-faint"
            >
                {label}
            </label>

            <button
                type="button"
                id={id}
                onClick={() => setOpen((current) => !current)}
                onKeyDown={onKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="mt-1 flex w-full items-center gap-2 rounded-[0.7rem] px-1 py-1 text-left transition-colors focus-visible:bg-white/[0.06]"
            >
                {Icon && <Icon className="h-4 w-4 shrink-0 text-neon/80" />}

                <span
                    className={cn(
                        'flex-1 truncate text-[0.9375rem] font-medium',
                        value ? 'text-heading' : 'text-body/60',
                    )}
                >
                    {value ? render(value) : anyLabel}
                </span>

                <ChevronDownIcon
                    className={cn(
                        'h-4 w-4 shrink-0 text-body/60 transition-transform duration-300',
                        open && 'rotate-180',
                    )}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={spring}
                        className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[0.9rem] border border-white/[0.12] bg-void-raised/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl"
                    >
                        <div className="border-b border-white/[0.08] p-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setHighlight(0);
                                }}
                                onKeyDown={onKeyDown}
                                placeholder={t('search.placeholder')}
                                aria-label={`${label} — ${t('search.placeholder')}`}
                                className="w-full rounded-[0.6rem] bg-white/[0.05] px-3 py-2 text-[0.8125rem] text-heading outline-none placeholder:text-body/35 focus:bg-white/[0.08]"
                            />
                        </div>

                        <ul role="listbox" className="max-h-56 overflow-y-auto p-1">
                            {filtered.length === 0 && (
                                <li className="px-3 py-3 text-[0.75rem] text-faint">{t('search.noMatch')}</li>
                            )}

                            {filtered.map((option, index) => {
                                const isAny = option === anyLabel;
                                const selected = isAny ? !value : value === option;

                                return (
                                    <li key={option}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            onMouseEnter={() => setHighlight(index)}
                                            onClick={() => choose(option)}
                                            className={cn(
                                                'flex w-full items-center justify-between rounded-[0.55rem] px-3 py-2 text-left text-[0.8125rem] transition-colors',
                                                index === highlight ? 'bg-white/[0.08] text-heading' : 'text-body/80',
                                                selected && 'text-neon',
                                            )}
                                        >
                                            <span className="truncate">
                                                {index === 0 && isAny ? option : render(option)}
                                            </span>
                                            {selected && <span className="text-[0.625rem]">✓</span>}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Floating glass search bar with typed inputs for Location, Property Type, and Price Range.
 * The suggestions are shortcuts with full keyboard/touch navigation.
 */
export default function GlassSearchBar({ onSubmit, onChange, cities = [], types = [], initial = {} }) {
    const { t } = useTranslation();
    const typeLabel = useTypeLabel();

    const [values, setValues] = useState({
        location: initial.location ?? '',
        type: initial.type ?? '',
        budget: initial.budget ?? '',
    });

    const budgets = ['under25', '25to60', '60to120', '120plus'];
    const budgetLabel = (id) => t(`budget.${id}`);

    const defaultLocations = [
        'Cocody',
        'Riviera',
        'Plateau',
        'Marcory',
        'Angré',
        'Bingerville',
        'Assinie',
        'Abidjan',
        'Grand-Bassam',
        'Yamoussoukro',
        'San Pedro',
    ];

    const locationOptions = useMemo(() => {
        const combined = Array.from(new Set([...(cities || []), ...defaultLocations]));
        return combined.filter(Boolean);
    }, [cities]);

    const typeOptions = useMemo(() => {
        const defaultTypes = ['House', 'Land', 'Shop', 'Hotel'];
        const combined = Array.from(new Set([...(types || []), ...defaultTypes]));
        return combined.filter(Boolean);
    }, [types]);

    const submit = (event) => {
        event.preventDefault();
        onSubmit?.(values);
    };

    const set = (key) => (value) => {
        setValues((current) => {
            const next = { ...current, [key]: value };
            onChange?.(next);
            return next;
        });
    };

    return (
        <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.35 }}
            className="glass-strong relative w-full rounded-[1.35rem] p-2 sm:p-2.5 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.9)] border border-white/12"
        >
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

            <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                    <Combobox
                        id="search-location"
                        label={t('search.location')}
                        icon={MapPinIcon}
                        options={locationOptions}
                        anyLabel={t('search.anyLocation')}
                        value={values.location}
                        onChange={set('location')}
                    />

                    <span className="hidden w-px self-stretch bg-white/10 sm:block" />

                    <Combobox
                        id="search-type"
                        label={t('search.type')}
                        options={typeOptions}
                        anyLabel={t('search.anyType')}
                        value={values.type}
                        onChange={set('type')}
                        formatOption={typeLabel}
                    />

                    <span className="hidden w-px self-stretch bg-white/10 sm:block" />

                    <Combobox
                        id="search-budget"
                        label={t('search.priceRange', 'Price Range')}
                        options={budgets}
                        anyLabel={t('search.anyPrice', 'Any price')}
                        value={values.budget}
                        onChange={set('budget')}
                        formatOption={budgetLabel}
                    />
                </div>

                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                    className="flex items-center justify-center gap-2 rounded-[1rem] bg-neon px-6 py-3.5 text-[0.875rem] font-semibold text-void transition-all duration-300 hover:neon-glow shadow-md shrink-0 cursor-pointer"
                >
                    <SearchIcon className="h-[1.05rem] w-[1.05rem]" />
                    <span>{t('search.button')}</span>
                </motion.button>
            </div>
        </motion.form>
    );
}

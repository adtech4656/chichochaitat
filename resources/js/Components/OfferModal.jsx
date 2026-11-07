import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { router } from '@inertiajs/react';
import { CloseIcon } from './Icons';
import { modalPanel, spring } from '../lib/motion';
import { useMoney } from '../lib/money';
import { useTranslation } from '../lib/i18n';
import { cn } from '../lib/utils';

const DISCOUNTS = [3, 7, 10];

/**
 * Offer composer.
 *
 * Three preset positions below the asking price, plus the exact amount that
 * will be recorded. The amount is computed from the stored base price and sent
 * in the base currency, so a rate change can never alter what was agreed.
 */
export default function OfferModal({ open, property, onClose }) {
    const { format } = useMoney();
    const { t } = useTranslation();
    const [selected, setSelected] = useState(3);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    if (!property) return null;

    const amountFor = (percent) => Math.round(property.price * (1 - percent / 100));

    const submit = () => {
        setSending(true);

        router.post(
            '/offers',
            {
                property_id: property.id,
                discount_percent: selected,
                amount: amountFor(selected),
                message,
            },
            {
                preserveScroll: true,
                onSuccess: () => setSent(true),
                onFinish: () => setSending(false),
            },
        );
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div
                        className="absolute inset-0 bg-void-deep/75 backdrop-blur-xl"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="offer-title"
                        variants={modalPanel}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="glass-strong relative w-full max-w-md overflow-hidden rounded-[1.5rem] p-6"
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t('common.close')}
                            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-body/70 hover:bg-white/10 hover:text-heading"
                        >
                            <CloseIcon className="h-4 w-4" />
                        </button>

                        <p className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-neon/80">
                            {t('prop.makeOffer')}
                        </p>
                        <h2 id="offer-title" className="mt-2 font-display text-[1.25rem] font-semibold tracking-[-0.03em] text-heading">
                            {property.title}
                        </h2>

                        <div className="mt-4 flex items-baseline justify-between rounded-[0.8rem] bg-white/[0.04] px-3.5 py-2.5 ring-1 ring-white/10">
                            <span className="text-[0.75rem] text-body/70">{t('offer.askingPrice')}</span>
                            <span className="font-display text-[0.9375rem] font-semibold text-heading">
                                {format(property.price)}
                            </span>
                        </div>

                        <p className="mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
                            {t('offer.choose')}
                        </p>

                        <div className="mt-2.5 grid grid-cols-3 gap-2">
                            {DISCOUNTS.map((percent) => {
                                const active = selected === percent;

                                return (
                                    <button
                                        key={percent}
                                        type="button"
                                        onClick={() => setSelected(percent)}
                                        aria-pressed={active}
                                        className={cn(
                                            'rounded-[0.8rem] px-2 py-3 text-center transition-colors',
                                            active
                                                ? 'bg-neon/12 ring-1 ring-neon/40'
                                                : 'bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.07]',
                                        )}
                                    >
                                        <span className={cn('block text-[0.9375rem] font-semibold', active ? 'text-neon' : 'text-heading')}>
                                            −{percent}%
                                        </span>
                                        <span className="mt-0.5 block text-[0.625rem] text-faint">
                                            {format(amountFor(percent))}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <label htmlFor="offer-message" className="mt-4 block text-[0.75rem] font-medium text-body/80">
                            {t('offer.message')} <span className="text-faint">{t('offer.optional')}</span>
                        </label>
                        <textarea
                            id="offer-message"
                            rows={3}
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder={t('offer.messagePlaceholder')}
                            className="mt-1.5 w-full resize-none rounded-[0.8rem] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[0.8125rem] text-heading outline-none placeholder:text-body/30 focus:border-neon"
                        />

                        <div className="mt-4 flex items-center justify-between rounded-[0.8rem] bg-white/[0.03] px-3.5 py-3">
                            <span className="text-[0.75rem] text-body/70">{t('offer.youOffer')}</span>
                            <span className="font-display text-[1.0625rem] font-semibold text-heading">
                                {format(amountFor(selected))}
                            </span>
                        </div>

                        <p className="mt-2 text-[0.625rem] leading-relaxed text-faint">
                            {t('offer.rateNotice')}
                        </p>

                        <motion.button
                            type="button"
                            onClick={submit}
                            disabled={sending || sent}
                            whileHover={{ scale: sending ? 1 : 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={spring}
                            className="mt-4 w-full rounded-[0.85rem] bg-neon px-4 py-3.5 text-[0.875rem] font-semibold text-void transition-shadow hover:neon-glow disabled:opacity-70"
                        >
                            {sent
                                ? t('offer.sent')
                                : sending
                                    ? t('offer.sending')
                                    : t('offer.submit', { amount: format(amountFor(selected)) })}
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

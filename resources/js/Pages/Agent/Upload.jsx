import { useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import ConsoleLayout from '../../Layouts/ConsoleLayout';
import MapCanvas from '../../Components/MapCanvas';
import { Button, Divider } from '../../Components/ui';
import { CheckIcon, MapPinIcon } from '../../Components/Icons';
import { spring } from '../../lib/motion';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../lib/i18n';

export default function Upload({ requirement, checklist = [] }) {
    const { t, locale } = useTranslation();
    const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
    const [captured, setCaptured] = useState([]);
    const [flash, setFlash] = useState(null);

    const requiredKeys = useMemo(
        () => checklist.filter((item) => item.required).map((item) => item.key),
        [checklist],
    );

    const requiredDone = requiredKeys.filter((key) => captured.includes(key)).length;
    const complete = requiredDone === requiredKeys.length;

    const nextTarget = checklist.find((item) => !captured.includes(item.key)) ?? null;
    const inRange = requirement.distance_m <= requirement.tolerance_m;

    /* Clear the capture toast once it has played. */
    useEffect(() => {
        if (!flash) return undefined;

        const timer = window.setTimeout(() => setFlash(null), 900);

        return () => window.clearTimeout(timer);
    }, [flash]);

    const capture = () => {
        if (!nextTarget || !inRange) return;

        setCaptured((current) => [...current, nextTarget.key]);
        setFlash({ id: Date.now(), label: nextTarget.label });
    };

    return (
        <ConsoleLayout
            context={t('capture.context')}
            title={requirement.title}
            exitLabel={t('common.cancel')}
            exitHref="/account"
            actions={
                <span className="hidden items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-[0.6875rem] font-medium text-body/80 ring-1 ring-white/10 sm:flex">
                    <span className={cn('h-1.5 w-1.5 rounded-full', inRange ? 'bg-neon' : 'bg-danger')} />
                    {inRange ? t('capture.locked') : t('capture.outOfRange')}
                </span>
            }
        >
            <div className="mx-auto grid max-w-[1500px] gap-5 px-5 py-6 lg:grid-cols-[264px_minmax(0,1fr)_308px]">
                {/* ============================ Checklist ============================ */}
                <aside className="order-2 lg:order-1">
                    <div className="glass sticky top-24 rounded-[1.25rem] p-4">
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="font-display text-[0.9375rem] font-semibold text-heading">
                                {t('capture.requiredShots')}
                            </p>
                            <span className="text-[0.6875rem] font-medium text-faint">
                                {requiredDone}/{requiredKeys.length}
                            </span>
                        </div>

                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                            <motion.div
                                className="h-full rounded-full bg-neon"
                                animate={{ width: `${(requiredDone / requiredKeys.length) * 100}%` }}
                                transition={spring}
                            />
                        </div>

                        <ul className="mt-4 space-y-1">
                            {checklist.map((item) => {
                                const done = captured.includes(item.key);
                                const isNext = nextTarget?.key === item.key;

                                return (
                                    <motion.li
                                        key={item.key}
                                        layout
                                        transition={spring}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-[0.65rem] px-2 py-2 text-[0.75rem] transition-colors',
                                            isNext && 'bg-white/[0.05]',
                                        )}
                                    >
                                        <motion.span
                                            layout
                                            animate={done ? { scale: [0.6, 1.15, 1] } : { scale: 1 }}
                                            transition={spring}
                                            className={cn(
                                                'grid h-5 w-5 shrink-0 place-items-center rounded-full ring-1 transition-colors',
                                                done
                                                    ? 'bg-neon text-void ring-neon'
                                                    : isNext
                                                      ? 'bg-white/[0.06] ring-neon/40'
                                                      : 'bg-white/[0.03] ring-white/10',
                                            )}
                                        >
                                            {done ? (
                                                <CheckIcon className="h-3 w-3" />
                                            ) : (
                                                <span className={cn('h-1 w-1 rounded-full', isNext ? 'bg-neon' : 'bg-white/25')} />
                                            )}
                                        </motion.span>

                                        <span
                                            className={cn(
                                                'flex-1 truncate',
                                                done ? 'text-body/45 line-through' : isNext ? 'text-heading' : 'text-body/70',
                                            )}
                                        >
                                            {item.label}
                                        </span>

                                        {!item.required && (
                                            <span className="text-[0.5625rem] uppercase tracking-wider text-faint">
                                                {t('capture.optional')}
                                            </span>
                                        )}
                                    </motion.li>
                                );
                            })}
                        </ul>

                        <Divider className="my-3" />

                        <p className="flex items-start gap-1.5 text-[0.625rem] leading-relaxed text-faint">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/70" />
                            {t('capture.stampNote')}
                        </p>
                    </div>
                </aside>

                {/* ============================ Viewfinder ============================ */}
                <section className="order-1 lg:order-2">
                    <div className="overflow-hidden rounded-[1.25rem] bg-black ring-1 ring-white/10">
                        <div className="relative aspect-[4/3] w-full">
                            {/* Simulated sensor feed */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,255,255,0.045),transparent_62%)]" />
                            <div
                                className="absolute inset-0 opacity-[0.16]"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)',
                                    backgroundSize: '56px 56px',
                                }}
                            />

                            {/* Corner brackets */}
                            {[
                                'left-4 top-4 border-l-2 border-t-2 rounded-tl-md',
                                'right-4 top-4 border-r-2 border-t-2 rounded-tr-md',
                                'left-4 bottom-4 border-b-2 border-l-2 rounded-bl-md',
                                'right-4 bottom-4 border-b-2 border-r-2 rounded-br-md',
                            ].map((position) => (
                                <span
                                    key={position}
                                    className={cn(
                                        'absolute h-8 w-8',
                                        inRange ? 'border-neon/70' : 'border-danger/60',
                                        position,
                                    )}
                                />
                            ))}

                            {/* Crosshair */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="h-10 w-10 rounded-full border border-white/15" />
                                <div className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-white/25" />
                                <div className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/25" />
                            </div>

                            {/* Overlay chips */}
                            <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[0.625rem] font-medium text-heading backdrop-blur ring-1 ring-white/15">
                                    <span className={cn('h-1.5 w-1.5 rounded-full', inRange ? 'bg-neon' : 'bg-danger')} />
                                    {requirement.captured_lat.toFixed(5)}, {requirement.captured_lng.toFixed(5)}
                                </span>
                                <span className="rounded-full bg-black/65 px-2.5 py-1 text-[0.625rem] font-medium text-body backdrop-blur ring-1 ring-white/15">
                                    {new Date().toLocaleString(dateLocale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <span className="absolute right-4 top-4 rounded-full bg-danger/15 px-2.5 py-1 text-[0.625rem] font-semibold text-danger ring-1 ring-danger/35 backdrop-blur">
                                {t('capture.galleryDisabled')}
                            </span>

                            {/* Live target */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-5 pb-5 pt-12">
                                <p className="text-[0.625rem] uppercase tracking-[0.18em] text-faint">{t('capture.nowCapturing')}</p>
                                <p className="mt-1 font-display text-[1.125rem] font-semibold text-heading">
                                    {nextTarget?.label ?? t('capture.allCaptured')}
                                </p>
                            </div>

                            {/* Capture toast */}
                            <AnimatePresence>
                                {flash && (
                                    <motion.div
                                        key={flash.id}
                                        initial={{ opacity: 0, y: 16, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -48, scale: 0.9 }}
                                        transition={spring}
                                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/90 px-4 py-2 text-[0.75rem] font-semibold text-void shadow-[0_0_40px_rgba(102,187,106,0.6)]"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <CheckIcon className="h-3.5 w-3.5" />
                                            {flash.label} {t('capture.captured')}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Shutter bar */}
                        <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-black px-5 py-4">
                            <div className="hidden text-[0.6875rem] text-faint sm:block">
                                {inRange
                                    ? t('capture.gpsWithin', { distance: requirement.distance_m })
                                    : t('capture.moveCloser')}
                            </div>

                            <div className="flex flex-1 items-center justify-center sm:flex-none">
                                <motion.button
                                    type="button"
                                    onClick={capture}
                                    disabled={!nextTarget || !inRange}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.93 }}
                                    transition={spring}
                                    aria-label={t('capture.captureLabel', { label: nextTarget?.label ?? t('capture.photo') })}
                                    className="relative grid h-16 w-16 place-items-center rounded-full ring-2 ring-white/25 transition-opacity disabled:opacity-35"
                                >
                                    <span className="absolute inset-1.5 rounded-full bg-white" />
                                    <span className="absolute inset-0 rounded-full ring-2 ring-neon/60" />
                                </motion.button>
                            </div>

                            <div className="text-right text-[0.6875rem] text-faint">
                                {t('capture.progress', { done: captured.length, total: checklist.length })}
                            </div>
                        </div>
                    </div>

                    <p className="mt-3 text-center text-[0.625rem] text-faint">
                        {t('capture.vaultNote')}
                    </p>
                </section>

                {/* ============================== GPS ============================== */}
                <aside className="order-3">
                    <div className="glass sticky top-24 space-y-4 rounded-[1.25rem] p-4">
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-display text-[0.9375rem] font-semibold text-heading">
                                    {t('capture.locationLock')}
                                </p>
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-[0.625rem] font-semibold ring-1',
                                        inRange
                                            ? 'bg-neon/12 text-neon ring-neon/30'
                                            : 'bg-danger/12 text-danger ring-danger/30',
                                    )}
                                >
                                    {inRange ? t('capture.inRange') : t('capture.outOfRange')}
                                </span>
                            </div>

                            <p className="mt-1 text-[0.6875rem] text-faint">
                                {requirement.district}
                            </p>
                        </div>

                        <MapCanvas
                            height="h-44"
                            accuracy
                            markers={[
                                {
                                    id: 'captured',
                                    lat: requirement.captured_lat,
                                    lng: requirement.captured_lng,
                                    primary: true,
                                    label: t('capture.you'),
                                },
                                {
                                    id: 'stated',
                                    lat: requirement.stated_lat,
                                    lng: requirement.stated_lng,
                                },
                            ]}
                        />

                        <div className="space-y-2">
                            <Metric label={t('capture.distance')} value={`${requirement.distance_m} m`} good />
                            <Metric label={t('capture.tolerance')} value={`${requirement.tolerance_m} m`} />
                            <Metric label={t('capture.vpn')} value={t('capture.notDetected')} good />
                        </div>

                        <Divider />

                        <div className="rounded-[0.7rem] bg-white/[0.03] p-3">
                            <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-heading">
                                <MapPinIcon className="h-3.5 w-3.5 text-neon" />
                                {t('capture.whyTitle')}
                            </p>
                            <p className="mt-1.5 text-[0.625rem] leading-relaxed text-faint">
                                {t('capture.whyCopy')}
                            </p>
                        </div>

                        <Button
                            size="md"
                            className="w-full"
                            disabled={!complete}
                            onClick={() => router.post('/become-agent/capture', { title: requirement.title, location: requirement.address })}
                        >
                            {complete
                                ? t('capture.continueDocuments')
                                : t('capture.shotsRemaining', { count: requiredKeys.length - requiredDone })}
                        </Button>

                        <p className="text-center text-[0.625rem] text-faint">
                            <Link href="/agent/kyc" className="hover:text-neon">{t('capture.reviewKyc')}</Link>
                        </p>
                    </div>
                </aside>
            </div>
        </ConsoleLayout>
    );
}

function Metric({ label, value, good = false }) {
    return (
        <div className="flex items-center justify-between gap-3 text-[0.75rem]">
            <span className="text-body/65">{label}</span>
            <span className={cn('flex items-center gap-1 font-medium', good ? 'text-neon' : 'text-heading')}>
                {good && <CheckIcon className="h-3 w-3" />}
                {value}
            </span>
        </div>
    );
}

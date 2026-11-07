import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import ConsoleLayout from '../../Layouts/ConsoleLayout';
import { Avatar, Button, Divider, VerifiedBadge } from '../../Components/ui';
import {
    CameraIcon,
    CheckIcon,
    ChevronDownIcon,
    ShieldCheckIcon,
} from '../../Components/Icons';
import { spring } from '../../lib/motion';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../lib/i18n';

const STEPS = [
    { key: 'identity', titleKey: 'kyc.step.identity.title', copyKey: 'kyc.step.identity.copy' },
    { key: 'liveness', titleKey: 'kyc.step.liveness.title', copyKey: 'kyc.step.liveness.copy' },
    { key: 'address', titleKey: 'kyc.step.address.title', copyKey: 'kyc.step.address.copy' },
    { key: 'review', titleKey: 'kyc.step.review.title', copyKey: 'kyc.step.review.copy' },
];

const slide = {
    enter: (direction) => ({ opacity: 0, x: direction > 0 ? 56 : -56 }),
    center: { opacity: 1, x: 0 },
    exit: (direction) => ({ opacity: 0, x: direction > 0 ? -56 : 56 }),
};

export default function Kyc({ applicant }) {
    const { t } = useTranslation();
    const [stepIndex, setStepIndex] = useState(0);
    const [direction, setDirection] = useState(1);

    const [idType, setIdType] = useState('national-id');
    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [livenessDone, setLivenessDone] = useState(false);
    const [addressFile, setAddressFile] = useState(null);
    const [credentials, setCredentials] = useState('');
    const [consent, setConsent] = useState(false);

    const step = STEPS[stepIndex];

    const canContinue = [
        Boolean(idFront && idBack),
        livenessDone,
        Boolean(addressFile),
        consent,
    ][stepIndex];

    const go = (next) => {
        setDirection(next > stepIndex ? 1 : -1);
        setStepIndex(Math.max(0, Math.min(STEPS.length - 1, next)));
    };

    return (
        <ConsoleLayout
            context={t('kyc.context')}
            title={t('kyc.title')}
            exitLabel={t('kyc.exit')}
            exitHref="/account"
            actions={<VerifiedBadge label={t('kyc.badge')} />}
        >
            <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[280px_1fr] lg:py-16">
                {/* Stepper */}
                <aside>
                    <div className="lg:sticky lg:top-28">
                        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-neon/80">
                            {t('kyc.eyebrow')}
                        </p>
                        <h1 className="mt-2.5 font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.03em] text-heading">
                            {t('kyc.headline')}
                        </h1>
                        <p className="mt-2 text-[0.8125rem] leading-relaxed text-body/65">
                            {t('kyc.intro')}
                        </p>

                        <ol className="mt-7 space-y-1">
                            {STEPS.map((item, index) => {
                                const state =
                                    index < stepIndex ? 'done' : index === stepIndex ? 'active' : 'upcoming';

                                return (
                                    <li key={item.key}>
                                        <button
                                            type="button"
                                            onClick={() => go(index)}
                                            className="flex w-full items-start gap-3 rounded-[0.8rem] p-2.5 text-left transition-colors hover:bg-white/[0.04]"
                                        >
                                            <span
                                                className={cn(
                                                    'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-semibold transition-colors',
                                                    state === 'done' && 'bg-neon text-void',
                                                    state === 'active' && 'bg-neon/15 text-neon ring-1 ring-neon/40',
                                                    state === 'upcoming' && 'bg-white/[0.06] text-body/50 ring-1 ring-white/10',
                                                )}
                                            >
                                                {state === 'done' ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                                            </span>
                                            <span className="min-w-0">
                                                <span
                                                    className={cn(
                                                        'block text-[0.8125rem] font-medium',
                                                        state === 'upcoming' ? 'text-body/60' : 'text-heading',
                                                    )}
                                                >
                                                    {t(item.titleKey)}
                                                </span>
                                                <span className="mt-0.5 block text-[0.6875rem] leading-snug text-faint">
                                                    {t(item.copyKey)}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>

                        <div className="mt-6 flex items-center gap-2 rounded-[0.8rem] bg-white/[0.03] p-3 ring-1 ring-white/8">
                            <Avatar initials={applicant.initials} size="sm" />
                            <div className="min-w-0">
                                <p className="truncate text-[0.75rem] font-medium text-heading">{applicant.name}</p>
                                <p className="truncate text-[0.625rem] text-faint">{applicant.email}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Step card */}
                <div className="min-w-0">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                            <motion.div
                                className="h-full rounded-full bg-neon"
                                animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                                transition={spring}
                            />
                        </div>
                        <span className="text-[0.6875rem] font-medium text-faint">
                            {stepIndex + 1}/{STEPS.length}
                        </span>
                    </div>

                    <div className="glass-strong relative min-h-[30rem] overflow-hidden rounded-[1.5rem] p-6 sm:p-8">
                        <AnimatePresence mode="wait" custom={direction} initial={false}>
                            <motion.div
                                key={step.key}
                                custom={direction}
                                variants={slide}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={spring}
                            >
                                {stepIndex === 0 && (
                                    <div>
                                        <h2 className="font-display text-[1.25rem] font-semibold tracking-[-0.025em] text-heading">
                                            {t('kyc.id.title')}
                                        </h2>
                                        <p className="mt-1.5 text-[0.8125rem] text-body/65">
                                            {t('kyc.id.copy')}
                                        </p>

                                        <div className="mt-5 max-w-xs">
                                            <label className="mb-1.5 block text-[0.75rem] font-medium text-body/80">
                                                {t('kyc.id.documentType')}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={idType}
                                                    onChange={(event) => setIdType(event.target.value)}
                                                    className="w-full cursor-pointer appearance-none rounded-[0.8rem] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 pr-9 text-[0.8125rem] text-heading outline-none focus:border-neon"
                                                >
                                                    <option value="national-id" className="bg-void-raised">{t('kyc.id.nationalId')}</option>
                                                    <option value="passport" className="bg-void-raised">{t('kyc.id.passport')}</option>
                                                    <option value="residence" className="bg-void-raised">{t('kyc.id.residence')}</option>
                                                </select>
                                                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body/60" />
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                            <UploadTile label={t('kyc.id.front')} file={idFront} onChange={setIdFront} />
                                            <UploadTile label={t('kyc.id.back')} file={idBack} onChange={setIdBack} />
                                        </div>

                                        <p className="mt-4 flex items-start gap-2 text-[0.6875rem] leading-relaxed text-faint">
                                            <ShieldCheckIcon className="mt-px h-3.5 w-3.5 shrink-0 text-neon/70" />
                                            {t('kyc.id.encrypted')}
                                        </p>
                                    </div>
                                )}

                                {stepIndex === 1 && (
                                    <div>
                                        <h2 className="font-display text-[1.25rem] font-semibold tracking-[-0.025em] text-heading">
                                            {t('kyc.face.title')}
                                        </h2>
                                        <p className="mt-1.5 text-[0.8125rem] text-body/65">
                                            {t('kyc.face.copy')}
                                        </p>

                                        <div className="relative mt-6 mx-auto max-w-sm overflow-hidden rounded-[1.25rem] bg-void ring-1 ring-white/10">
                                            <div className="relative aspect-[4/5]">
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(102,187,106,0.14),transparent_65%)]" />

                                                <div className="absolute inset-6 rounded-[1rem] border border-dashed border-white/12" />

                                                {/* Corner marks */}
                                                {[
                                                    'left-6 top-6 border-l-2 border-t-2 rounded-tl-lg',
                                                    'right-6 top-6 border-r-2 border-t-2 rounded-tr-lg',
                                                    'left-6 bottom-6 border-b-2 border-l-2 rounded-bl-lg',
                                                    'right-6 bottom-6 border-b-2 border-r-2 rounded-br-lg',
                                                ].map((position) => (
                                                    <span
                                                        key={position}
                                                        className={cn(
                                                            'absolute h-7 w-7 transition-colors duration-500',
                                                            livenessDone ? 'border-neon' : 'border-white/30',
                                                            position,
                                                        )}
                                                    />
                                                ))}

                                                <div className="absolute inset-0 grid place-items-center">
                                                    <motion.div
                                                        animate={
                                                            livenessDone
                                                                ? { scale: 1, opacity: 1 }
                                                                : { scale: [1, 1.06, 1], opacity: [0.65, 1, 0.65] }
                                                        }
                                                        transition={
                                                            livenessDone
                                                                ? spring
                                                                : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                                                        }
                                                        className={cn(
                                                            'grid h-24 w-24 place-items-center rounded-full ring-1',
                                                            livenessDone
                                                                ? 'bg-neon/20 text-neon ring-neon/40'
                                                                : 'bg-white/[0.04] text-body/40 ring-white/12',
                                                        )}
                                                    >
                                                        {livenessDone ? (
                                                            <CheckIcon className="h-9 w-9" />
                                                        ) : (
                                                            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                                                                <path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15" />
                                                                <circle cx="12" cy="10.5" r="2.4" />
                                                                <path d="M8.4 16.4a4.2 4.2 0 0 1 7.2 0" />
                                                            </svg>
                                                        )}
                                                    </motion.div>
                                                </div>

                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/70 to-transparent p-4 text-center">
                                                    <p className="text-[0.75rem] font-medium text-heading">
                                                        {livenessDone ? t('kyc.face.confirmed') : t('kyc.face.prompt')}
                                                    </p>
                                                    <p className="mt-0.5 text-[0.625rem] text-faint">
                                                        {livenessDone ? t('kyc.face.matched') : t('kyc.face.pending')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex justify-center">
                                            <Button
                                                variant={livenessDone ? 'secondary' : 'primary'}
                                                onClick={() => setLivenessDone(true)}
                                                icon={CameraIcon}
                                            >
                                                {livenessDone ? t('kyc.face.retake') : t('kyc.face.start')}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {stepIndex === 2 && (
                                    <div>
                                        <h2 className="font-display text-[1.25rem] font-semibold tracking-[-0.025em] text-heading">
                                            {t('kyc.address.title')}
                                        </h2>
                                        <p className="mt-1.5 text-[0.8125rem] text-body/65">
                                            {t('kyc.address.copy')}
                                        </p>

                                        <div className="mt-5">
                                            <UploadTile
                                                label={t('kyc.address.upload')}
                                                file={addressFile}
                                                onChange={setAddressFile}
                                                className="sm:max-w-sm"
                                            />
                                        </div>

                                        <Divider className="my-6" />

                                        <label className="mb-1.5 block text-[0.75rem] font-medium text-body/80">
                                            {t('kyc.address.credentials')} <span className="text-faint">{t('kyc.address.optional')}</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={credentials}
                                            onChange={(event) => setCredentials(event.target.value)}
                                            placeholder={t('kyc.address.placeholder')}
                                            className="w-full max-w-md rounded-[0.8rem] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[0.8125rem] text-heading outline-none placeholder:text-body/30 focus:border-neon"
                                        />
                                        <p className="mt-2 text-[0.6875rem] text-faint">
                                            {t('kyc.address.hint')}
                                        </p>
                                    </div>
                                )}

                                {stepIndex === 3 && (
                                    <div>
                                        <h2 className="font-display text-[1.25rem] font-semibold tracking-[-0.025em] text-heading">
                                            {t('kyc.review.title')}
                                        </h2>
                                        <p className="mt-1.5 text-[0.8125rem] text-body/65">
                                            {t('kyc.review.copy')}
                                        </p>

                                        <div className="mt-5 space-y-2">
                                            {[
                                                [t('kyc.review.identity'), idType.replace('-', ' ')],
                                                [t('kyc.review.liveness'), livenessDone ? t('kyc.review.confirmed') : t('kyc.review.missing')],
                                                [t('kyc.review.address'), addressFile?.name ?? t('kyc.review.missing')],
                                                [t('kyc.review.credentials'), credentials || t('kyc.review.notProvided')],
                                            ].map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="flex items-center justify-between gap-3 rounded-[0.8rem] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-white/8"
                                                >
                                                    <span className="text-[0.75rem] text-body/75">{label}</span>
                                                    <span className="flex items-center gap-1.5 text-[0.75rem] font-medium text-heading">
                                                        <CheckIcon className="h-3 w-3 text-neon" />
                                                        <span className="max-w-[14rem] truncate capitalize">{value}</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-[0.8rem] bg-white/[0.03] p-3.5 ring-1 ring-white/8">
                                            <input
                                                type="checkbox"
                                                checked={consent}
                                                onChange={(event) => setConsent(event.target.checked)}
                                                className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-neon"
                                            />
                                            <span className="text-[0.75rem] leading-relaxed text-body/70">
                                                {t('kyc.review.consent')}
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="mt-5 flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => go(stepIndex - 1)}
                            disabled={stepIndex === 0}
                        >
                            {t('common.back')}
                        </Button>

                        {stepIndex === STEPS.length - 1 ? (
                            <Button
                                size="lg"
                                disabled={!canContinue}
                                onClick={() => router.post('/become-agent/kyc', {
                                    name: applicant.name,
                                    email: applicant.email,
                                    phone: applicant.phone,
                                    agency: applicant.agency,
                                    idType,
                                    credentials,
                                })}
                            >
                                {t('kyc.submit')}
                            </Button>
                        ) : (
                            <Button size="lg" onClick={() => go(stepIndex + 1)} disabled={!canContinue}>
                                {t('common.continue')}
                            </Button>
                        )}
                    </div>

                    <p className="mt-4 text-center text-[0.6875rem] text-faint">
                        {t('kyc.help')}{' '}
                        <Link href="/" className="text-neon/80 hover:text-neon">
                            {t('kyc.contactTrust')}
                        </Link>
                    </p>
                </div>
            </div>
        </ConsoleLayout>
    );
}

function UploadTile({ label, file, onChange, className }) {
    const { t } = useTranslation();

    return (
        <label
            className={cn(
                'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1rem] border border-dashed px-4 py-8 text-center transition-colors',
                file
                    ? 'border-neon/40 bg-neon/[0.06]'
                    : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]',
                className,
            )}
        >
            <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    onChange(selected);
                }}
            />

            <span
                className={cn(
                    'grid h-10 w-10 place-items-center rounded-full transition-colors',
                    file ? 'bg-neon/15 text-neon' : 'bg-white/[0.06] text-body/55 group-hover:text-heading',
                )}
            >
                {file ? <CheckIcon className="h-5 w-5" /> : <CameraIcon className="h-5 w-5" />}
            </span>

            <span className="max-w-full truncate text-[0.75rem] font-medium text-heading">
                {file ? file.name : label}
            </span>
            <span className="text-[0.625rem] text-faint">
                {file ? t('kyc.replace') : t('kyc.fileHint')}
            </span>
        </label>
    );
}

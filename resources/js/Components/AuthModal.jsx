import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AppleIcon, CloseIcon, EyeIcon, GoogleIcon, ShieldCheckIcon } from './Icons';
import { LogoMark } from './Logo';
import { cn } from '../lib/utils';
import { modalPanel, spring } from '../lib/motion';
import { useTranslation } from '../lib/i18n';
import { useSiteConfig } from '../lib/site-config-context';
import {
    signInWithFirebase,
    registerWithFirebase,
    signInWithGoogle,
    resetPasswordWithFirebase,
} from '../lib/firebase';

/**
 * Flow 2 — Firebase Authentication Modal.
 * Replaces demo accounts with authentic Firebase Authentication:
 * - Real email & password login
 * - Real email & password registration (with profile display name & phone)
 * - 1-Click Google OAuth Popup via Firebase Auth
 * - Automated Password Reset flow
 * - Synchronized HttpOnly server-side session and reactive state persistence
 */
export default function AuthModal({ open, mode: initialMode = 'signin', reason = '', onClose, onModeChange }) {
    const { t } = useTranslation();
    const { site } = useSiteConfig();
    const [currentMode, setCurrentMode] = useState(initialMode); // 'signin' | 'signup' | 'forgot'
    const [successMessage, setSuccessMessage] = useState('');

    const { data, setData, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [customError, setCustomError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);

    const panelRef = useRef(null);
    const firstFieldRef = useRef(null);
    const previouslyFocused = useRef(null);
    const titleId = useId();
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (open) {
            setCurrentMode(initialMode);
            setSuccessMessage('');
            setCustomError('');
        }
    }, [open, initialMode]);

    /* Lock scroll + restore focus + wire Escape while the dialog is open. */
    useEffect(() => {
        if (!open) return undefined;

        previouslyFocused.current = document.activeElement;
        const { overflow, paddingRight } = document.body.style;
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = 'hidden';
        if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

        const focusTimer = window.setTimeout(() => firstFieldRef.current?.focus(), 90);

        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.clearTimeout(focusTimer);
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = overflow;
            document.body.style.paddingRight = paddingRight;
            previouslyFocused.current?.focus?.();
        };
    }, [open, onClose]);

    /* Reset transient state whenever the dialog or tab changes. */
    useEffect(() => {
        if (!open) return;

        clearErrors();
        setCustomError('');
        setSuccessMessage('');
        const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 90);

        return () => window.clearTimeout(timer);
    }, [open, currentMode, clearErrors]);

    const setField = (key) => (event) => setData(key, event.target.value);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setCustomError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        try {
            if (currentMode === 'forgot') {
                const res = await resetPasswordWithFirebase(data.email);
                setSuccessMessage(res.message);
            } else if (currentMode === 'signup') {
                await registerWithFirebase({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    password: data.password,
                });

                reset();
                onClose?.();
                window.location.reload();
            } else {
                await signInWithFirebase(data.email, data.password);

                reset();
                onClose?.();
                window.location.reload();
            }
        } catch (err) {
            setCustomError(err.message || 'Une erreur est survenue lors de l’authentification.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setCustomError('');
        setSuccessMessage('');
        setSocialLoading(true);
        try {
            await signInWithGoogle();
            onClose?.();
            window.location.reload();
        } catch (err) {
            setCustomError(err.message || 'Échec de la connexion via Google.');
        } finally {
            setSocialLoading(false);
        }
    };

    const switchMode = (next) => {
        if (next === currentMode) return;
        reset();
        clearErrors();
        setCustomError('');
        setSuccessMessage('');
        setCurrentMode(next);
        onModeChange?.(next);
    };

    const displayError = customError || (Object.keys(errors).length > 0 ? Object.values(errors)[0] : '');
    const isSignup = currentMode === 'signup';
    const isForgot = currentMode === 'forgot';

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Scrim */}
                    <motion.div
                        className="absolute inset-0 bg-void-deep/75 backdrop-blur-xl"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) onClose?.();
                        }}
                        aria-hidden="true"
                    />

                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        variants={reduceMotion ? undefined : modalPanel}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="glass-strong relative w-full max-w-[27rem] overflow-hidden rounded-[1.75rem] p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)] sm:p-7 border border-white/15"
                    >
                        {/* Ambient green bloom + top-edge highlight */}
                        <div
                            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[26rem] -translate-x-1/2 rounded-full"
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(102,187,106,0.22) 0%, transparent 68%)',
                            }}
                            aria-hidden="true"
                        />
                        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-neon/50 to-transparent" />

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t('common.close')}
                            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-body/70 transition-colors hover:bg-white/10 hover:text-heading cursor-pointer"
                        >
                            <CloseIcon className="h-4 w-4" />
                        </button>

                        <div className="relative">
                            <div className="flex items-center gap-2.5 mb-3">
                                <LogoMark className="h-8 w-8 ring-1 ring-white/10" />
                                <div>
                                    <span className="font-display text-[0.875rem] font-bold tracking-tight text-heading">
                                        {site?.logoText || 'CHIC CHOC'} <span className="text-neon">{site?.logoHighlight || 'HABITAT'}</span>
                                    </span>
                                    <p className="text-[0.5625rem] font-semibold uppercase tracking-wider text-neon/80">
                                        Firebase Auth · Session Sécurisée
                                    </p>
                                </div>
                            </div>

                            {reason && (
                                <div className="mb-3.5 flex items-start gap-2.5 rounded-xl border border-neon/30 bg-neon/10 p-3 text-xs text-neon">
                                    <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                                    <div className="leading-snug text-neon">
                                        <p className="font-semibold">{t('auth.loginRequired')}</p>
                                        <p className="mt-0.5 text-body/90 text-[0.75rem]">{reason}</p>
                                    </div>
                                </div>
                            )}

                            {/* Mode Segmented Control (Sign In / Register / Reset) */}
                            <div className="mt-4 grid grid-cols-2 gap-1 rounded-[0.9rem] bg-white/[0.04] p-1 ring-1 ring-white/10">
                                {[
                                    { key: 'signin', label: t('auth.signinTab') },
                                    { key: 'signup', label: t('auth.signupTab') },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => switchMode(tab.key)}
                                        className="relative rounded-[0.7rem] px-3 py-2 text-[0.8125rem] font-medium transition-colors cursor-pointer"
                                    >
                                        {(currentMode === tab.key || (isForgot && tab.key === 'signin')) && (
                                            <motion.span
                                                layoutId="auth-tab-pill"
                                                className="absolute inset-0 rounded-[0.7rem] bg-white/[0.09] ring-1 ring-white/15"
                                                transition={spring}
                                            />
                                        )}
                                        <span
                                            className={cn(
                                                'relative',
                                                currentMode === tab.key ? 'text-heading font-semibold' : 'text-body/70',
                                            )}
                                        >
                                            {tab.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {isForgot && (
                                <div className="mt-3.5 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-heading">Réinitialisation de mot de passe</span>
                                    <button
                                        type="button"
                                        onClick={() => switchMode('signin')}
                                        className="text-neon hover:underline cursor-pointer"
                                    >
                                        Retour à la connexion
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                                {isSignup && (
                                    <Field
                                        ref={firstFieldRef}
                                        id="auth-name"
                                        label={t('auth.fullName')}
                                        autoComplete="name"
                                        value={data.name}
                                        onChange={setField('name')}
                                        placeholder="Ex: Kouamé Koffi"
                                        required
                                    />
                                )}

                                <Field
                                    ref={isSignup ? undefined : firstFieldRef}
                                    id="auth-email"
                                    label={t('auth.email')}
                                    type="email"
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={setField('email')}
                                    placeholder="nom@exemple.ci"
                                    required
                                />

                                {isSignup && (
                                    <Field
                                        id="auth-phone"
                                        label={t('auth.phone')}
                                        type="tel"
                                        autoComplete="tel"
                                        value={data.phone}
                                        onChange={setField('phone')}
                                        placeholder="+225 07 00 00 00"
                                    />
                                )}

                                {!isForgot && (
                                    <div>
                                        <div className="relative">
                                            <Field
                                                id="auth-password"
                                                label={t('auth.password')}
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete={isSignup ? 'new-password' : 'current-password'}
                                                value={data.password}
                                                onChange={setField('password')}
                                                placeholder="••••••••"
                                                required
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((current) => !current)}
                                                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                                                className="absolute right-2.5 top-[38px] grid h-8 w-8 place-items-center rounded-full text-body/60 transition-colors hover:text-heading cursor-pointer"
                                            >
                                                <EyeIcon open={!showPassword} className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {isSignup && (
                                            <p className="mt-1.5 text-[0.6875rem] text-faint">
                                                {t('auth.minPassword')} (6 caractères minimum Firebase)
                                            </p>
                                        )}
                                    </div>
                                )}

                                {!isSignup && !isForgot && (
                                    <div className="flex items-center justify-between pt-0.5">
                                        <label className="flex cursor-pointer items-center gap-2 text-[0.75rem] text-body/75">
                                            <input
                                                type="checkbox"
                                                defaultChecked
                                                className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-neon"
                                            />
                                            {t('auth.remember')}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => switchMode('forgot')}
                                            className="text-[0.75rem] font-medium text-neon/90 transition-colors hover:text-neon cursor-pointer"
                                        >
                                            {t('auth.forgot')}
                                        </button>
                                    </div>
                                )}

                                {displayError && (
                                    <p role="alert" className="rounded-[0.7rem] bg-danger/15 px-3 py-2 text-[0.75rem] text-danger ring-1 ring-danger/30 font-medium">
                                        {displayError}
                                    </p>
                                )}

                                {successMessage && (
                                    <p role="status" className="rounded-[0.7rem] bg-emerald-500/15 px-3 py-2 text-[0.75rem] text-emerald-300 ring-1 ring-emerald-500/30 font-medium">
                                        {successMessage}
                                    </p>
                                )}

                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting || socialLoading}
                                    whileHover={{ scale: (isSubmitting || socialLoading) ? 1 : 1.02 }}
                                    whileTap={{ scale: (isSubmitting || socialLoading) ? 1 : 0.98 }}
                                    transition={spring}
                                    className={cn(
                                        'mt-1 flex w-full items-center justify-center gap-2 rounded-[0.85rem] bg-neon px-4 py-3.5 text-[0.875rem] font-semibold text-void transition-shadow duration-300 cursor-pointer',
                                        'hover:neon-glow disabled:cursor-not-allowed disabled:opacity-70',
                                    )}
                                >
                                    {isSubmitting && (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-void/30 border-t-void" />
                                    )}
                                    {isSubmitting
                                        ? t('auth.wait')
                                        : isForgot
                                            ? 'Envoyer le lien de réinitialisation'
                                            : isSignup
                                                ? t('auth.createAccount')
                                                : t('auth.signinTab')}
                                </motion.button>
                            </form>

                            {!isForgot && (
                                <>
                                    <div className="my-5 flex items-center gap-3">
                                        <span className="h-px flex-1 bg-white/10" />
                                        <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-faint">{t('auth.or')}</span>
                                        <span className="h-px flex-1 bg-white/10" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <SocialButton
                                            icon={<GoogleIcon className="h-4 w-4" />}
                                            label="Google"
                                            onClick={handleGoogleSignIn}
                                            disabled={isSubmitting || socialLoading}
                                        />
                                        <SocialButton
                                            icon={<AppleIcon className="h-4 w-4" />}
                                            label="Apple"
                                            onClick={() => setCustomError('Connexion Apple bientôt disponible.')}
                                            disabled={isSubmitting || socialLoading}
                                        />
                                    </div>
                                </>
                            )}

                            <p className="mt-5 flex items-start gap-2 text-[0.6875rem] leading-relaxed text-faint">
                                <ShieldCheckIcon className="mt-px h-3.5 w-3.5 shrink-0 text-neon/70" />
                                <span>{t('auth.securityNote')} · Firebase Authentication sécurisé avec token JWT & cookie HttpOnly</span>
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const Field = forwardRef(function Field(
    { id, label, prefix, className, ...props },
    ref,
) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-[0.75rem] font-medium text-body/80">
                {label}
            </label>

            <div
                className={cn(
                    'flex items-center rounded-[0.8rem] border border-white/10 bg-white/[0.04] transition-[border-color,box-shadow,background-color] duration-300',
                    'hover:bg-white/[0.055]',
                    'focus-within:border-neon focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_3px_rgba(102,187,106,0.18),0_0_22px_-4px_rgba(102,187,106,0.55)]',
                )}
            >
                {prefix && (
                    <span className="border-r border-white/10 py-3 pl-3.5 pr-2.5 text-[0.875rem] text-body/70">
                        {prefix}
                    </span>
                )}

                <input
                    id={id}
                    ref={ref}
                    className={cn(
                        'w-full bg-transparent px-3.5 py-3 text-[0.9375rem] text-heading outline-none placeholder:text-body/30',
                        prefix && 'pl-3',
                        className,
                    )}
                    {...props}
                />
            </div>
        </div>
    );
});

function SocialButton({ icon, label, onClick, disabled }) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={spring}
            className="flex items-center justify-center gap-2 rounded-[0.8rem] border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[0.8125rem] font-medium text-heading transition-colors hover:bg-white/[0.07] disabled:opacity-50 cursor-pointer"
        >
            {icon}
            {label}
        </motion.button>
    );
}

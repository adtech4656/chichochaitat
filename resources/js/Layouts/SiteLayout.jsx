import { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogoMark } from '../Components/Logo';
import AuthModal from '../Components/AuthModal';
import LanguageSwitcher from '../Components/LanguageSwitcher';
import CurrencySwitcher from '../Components/CurrencySwitcher';
import { AuthModalProvider, useAuthModal } from '../lib/auth-modal';
import { CompareProvider, useCompare } from '../lib/compare';
import CompareFloatingBar from '../Components/CompareFloatingBar';
import { useTranslation } from '../lib/i18n';
import { spring } from '../lib/motion';
import { cn } from '../lib/utils';
import {
    ChevronDownIcon,
    CloseIcon,
    MenuIcon,
    MapPinIcon,
    SearchIcon,
    UserIcon,
    ShieldCheckIcon,
    ArrowUpRightIcon,
    HeartIcon,
    ChartBarIcon,
    PhoneIcon,
    WhatsAppIcon,
    MailIcon,
} from '../Components/Icons';
import { getStoredUser, switchDemoUser, mockLogout } from '../lib/auth-storage';

const NAV = [
    { key: 'nav.buy', label_fr: 'Acheter', label_en: 'Buy', href: '/properties?intent=sale', icon: '🏷️', desc_fr: 'Villas & appartements avec ACD / TF' },
    { key: 'nav.rent', label_fr: 'Louer', label_en: 'Rent', href: '/properties?intent=rent', icon: '🔑', desc_fr: 'Baux sécurisés loi 2019-576' },
    { key: 'nav.land', label_fr: 'Terrains', label_en: 'Land', href: '/properties?type=Land', icon: '🏞️', desc_fr: 'Parcelles avec bornage OGECI' },
    { key: 'nav.commercial', label_fr: 'Commerces', label_en: 'Commercial', href: '/properties?type=Shop', icon: '🏪', desc_fr: 'Boutiques & locaux avec vitrine' },
    { key: 'nav.hotel', label_fr: 'Hôtels', label_en: 'Hotels', href: '/properties?type=Hotel', icon: '🏨', desc_fr: 'Établissements & résidences meublées' },
];

function FloatingNav() {
    const { openAuth } = useAuthModal();
    const { count: compareCount } = useCompare();
    const { t, locale } = useTranslation();
    const { auth, url } = usePage().props;
    const serverUser = auth?.user ?? null;

    const [currentUser, setCurrentUser] = useState(() => getStoredUser(serverUser));
    const [scrolled, setScrolled] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sync auth state across localStorage and events
    useEffect(() => {
        const handleAuthChange = (e) => {
            setCurrentUser(e.detail || null);
        };
        window.addEventListener('chichoc:auth-change', handleAuthChange);
        return () => window.removeEventListener('chichoc:auth-change', handleAuthChange);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Prevent body scroll when sidebar drawer is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    const user = currentUser;
    const savedCount = (user?.saved_properties?.length ?? auth?.guest_saved_properties?.length) ?? (user?.saved_count || 0);

    const handleSwitchRole = (roleKey) => {
        const switched = switchDemoUser(roleKey);
        setCurrentUser(switched);
        setSidebarOpen(false);
    };

    const handleLogout = () => {
        mockLogout();
        setCurrentUser(null);
        setSidebarOpen(false);
        router.post('/logout', {}, { preserveScroll: true, onError: () => {} });
    };

    return (
        <>
            {/* Minimal Top Bar (Consistent on Laptop and Mobile) */}
            <div className="fixed inset-x-0 top-0 z-50 flex flex-col items-center px-3 pt-2.5 sm:px-6 sm:pt-4 pointer-events-none">
                <motion.header
                    initial={{ y: -24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ ...spring, delay: 0.05 }}
                    className={cn(
                        'pointer-events-auto w-full max-w-7xl transition-[background-color,box-shadow,border-color] duration-500',
                        'rounded-2xl sm:rounded-full',
                        scrolled || sidebarOpen
                            ? 'border border-white/[0.14] bg-void/95 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl'
                            : 'border border-white/[0.1] bg-white/[0.045] backdrop-blur-xl',
                    )}
                >
                    <div className="flex items-center justify-between px-3.5 py-2 sm:px-6 sm:py-2.5">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                            <LogoMark className="h-8 w-8 sm:h-9 sm:w-9 ring-1 ring-white/10 group-hover:scale-105 transition-transform" />
                            <div className="flex flex-col text-left">
                                <span className="font-display text-[0.875rem] sm:text-[0.9375rem] font-extrabold tracking-tight text-heading leading-tight">
                                    CHIC CHOC <span className="text-neon">HABITAT</span>
                                </span>
                                <span className="hidden sm:inline text-[0.5625rem] font-semibold text-emerald-300 uppercase tracking-wider">
                                    Portail Agréé & Tiers de Confiance
                                </span>
                            </div>
                        </Link>

                        {/* Top Bar Quick Controls */}
                        <div className="flex items-center gap-1.5 sm:gap-2.5">
                            {/* Live FX & Language Switchers */}
                            <LanguageSwitcher locale={locale} compact />
                            <CurrencySwitcher />

                            {/* Wishlist Link */}
                            <Link
                                href="/wishlist"
                                className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/[0.05] ring-1 ring-white/10 hover:bg-white/[0.1] text-rose-300 transition-colors shrink-0"
                                title="Wishlist (Coups de Cœur)"
                            >
                                <HeartIcon filled={savedCount > 0} className="h-4 w-4" />
                                {savedCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[0.5625rem] font-bold text-white shadow font-mono">
                                        {savedCount}
                                    </span>
                                )}
                            </Link>

                            {/* Compare Link */}
                            <Link
                                href="/compare"
                                className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/[0.05] ring-1 ring-white/10 hover:bg-white/[0.1] text-emerald-300 transition-colors shrink-0"
                                title="Comparateur de Biens"
                            >
                                <span className="text-xs sm:text-sm">⚖️</span>
                                {compareCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[0.5625rem] font-bold text-void shadow font-mono">
                                        {compareCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Avatar / Login */}
                            {user ? (
                                <Link
                                    href="/account"
                                    className="hidden sm:flex items-center gap-2 rounded-xl bg-white/[0.05] py-1 pl-1 pr-3 ring-1 ring-white/10 transition-colors hover:bg-white/[0.1]"
                                >
                                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-neon/30 to-neon/5 text-[0.625rem] font-semibold text-neon ring-1 ring-neon/25">
                                        {user.initials || 'CC'}
                                    </span>
                                    <span className="max-w-[6.5rem] truncate text-[0.8125rem] font-medium text-heading">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => openAuth('signin')}
                                    className="hidden sm:inline-flex rounded-xl px-3 py-1.5 text-[0.8125rem] font-medium text-body/85 hover:bg-white/[0.08] hover:text-heading cursor-pointer transition-colors"
                                >
                                    {t('nav.signIn')}
                                </button>
                            )}

                            {/* Slide-Out Sidebar Trigger (Menu Button on Laptop and Mobile) */}
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Open Navigation Sidebar"
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all cursor-pointer shrink-0"
                            >
                                <MenuIcon className="h-4 w-4 text-neon stroke-[2.5]" />
                                <span className="font-display tracking-wide uppercase text-[0.75rem]">Menu</span>
                            </button>
                        </div>
                    </div>
                </motion.header>
            </div>

            {/* Modern Slide-Out Sidebar Menu (Laptop & Mobile) */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Backdrop Scrim */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 z-[115] bg-black/80 backdrop-blur-md"
                        />

                        {/* Slide-out Sidebar Panel */}
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="fixed inset-y-0 right-0 z-[120] flex w-full sm:w-[440px] flex-col bg-[#070b0e] border-l border-white/10 shadow-2xl text-left"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b border-white/10 p-5 bg-void-raised/90 backdrop-blur-md shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <LogoMark className="h-8 w-8 ring-1 ring-white/10" />
                                    <div>
                                        <h3 className="font-display text-sm font-extrabold tracking-tight text-heading">
                                            CHIC CHOC <span className="text-neon">HABITAT</span>
                                        </h3>
                                        <p className="text-[0.625rem] text-emerald-400 font-semibold uppercase tracking-wider">
                                            Navigation & Conciergerie
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(false)}
                                    aria-label="Close menu"
                                    className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-heading ring-1 ring-white/10 hover:bg-white/[0.1] active:scale-95 cursor-pointer"
                                >
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Scrollable Navigation Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                {/* Section 1: User Account & 1-Click Role Switcher */}
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                                    {user ? (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/10 text-emerald-300 font-bold text-base ring-1 ring-emerald-500/30">
                                                    {user.initials || 'CC'}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="font-display font-bold text-heading text-sm truncate">{user.name}</p>
                                                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.625rem] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                                                            {user.role_label || (user.role === 'agent' ? 'Agent Agréé' : 'Acheteur')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-body/65 truncate mt-0.5">{user.email}</p>
                                                </div>
                                            </div>

                                            {/* 1-Click Role Switchers */}
                                            <div className="pt-2 border-t border-white/5 space-y-1.5">
                                                <p className="text-[0.625rem] font-bold uppercase tracking-wider text-neon flex items-center gap-1">
                                                    <span>⚡</span>
                                                    <span>Changer de Rôle Démo (LocalStorage)</span>
                                                </p>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSwitchRole('buyer')}
                                                        className={cn(
                                                            "rounded-xl p-2 text-left border transition-all cursor-pointer",
                                                            user.role === 'customer' && !user.properties_count
                                                                ? "border-neon bg-neon/15 text-neon"
                                                                : "border-white/10 bg-white/[0.03] text-body/75 hover:border-white/20"
                                                        )}
                                                    >
                                                        <p className="font-bold text-[0.6875rem] truncate">Acheteur</p>
                                                        <p className="text-[0.5625rem] text-faint truncate">K. Kouamé</p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSwitchRole('agent')}
                                                        className={cn(
                                                            "rounded-xl p-2 text-left border transition-all cursor-pointer",
                                                            user.role === 'agent'
                                                                ? "border-neon bg-neon/15 text-neon"
                                                                : "border-white/10 bg-white/[0.03] text-body/75 hover:border-white/20"
                                                        )}
                                                    >
                                                        <p className="font-bold text-[0.6875rem] truncate">Agent KYC</p>
                                                        <p className="text-[0.5625rem] text-faint truncate">Aya Koffi</p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSwitchRole('owner')}
                                                        className={cn(
                                                            "rounded-xl p-2 text-left border transition-all cursor-pointer",
                                                            user.properties_count
                                                                ? "border-neon bg-neon/15 text-neon"
                                                                : "border-white/10 bg-white/[0.03] text-body/75 hover:border-white/20"
                                                        )}
                                                    >
                                                        <p className="font-bold text-[0.6875rem] truncate">Propriétaire</p>
                                                        <p className="text-[0.5625rem] text-faint truncate">I. Touré</p>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                <Link
                                                    href="/account"
                                                    onClick={() => setSidebarOpen(false)}
                                                    className="flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] p-2.5 text-xs font-semibold text-heading hover:bg-white/10 transition-colors"
                                                >
                                                    <UserIcon className="h-3.5 w-3.5 text-neon" />
                                                    <span>Tableau de bord</span>
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={handleLogout}
                                                    className="flex items-center justify-center gap-1.5 rounded-xl bg-danger/10 p-2.5 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors cursor-pointer"
                                                >
                                                    <span>Déconnexion</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="font-display font-bold text-heading text-sm">Espace Personnel & Démo</p>
                                                <p className="text-xs text-body/70 mt-0.5">Accédez aux fonctionnalités ou testez un profil démo :</p>
                                            </div>

                                            {/* 1-Click Demo Profiles */}
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSwitchRole('buyer')}
                                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left hover:border-neon hover:bg-neon/10 transition-all cursor-pointer"
                                                >
                                                    <p className="font-bold text-[0.6875rem] text-heading">Acheteur</p>
                                                    <p className="text-[0.5625rem] text-faint truncate">Koffi Kouamé</p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSwitchRole('agent')}
                                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left hover:border-neon hover:bg-neon/10 transition-all cursor-pointer"
                                                >
                                                    <p className="font-bold text-[0.6875rem] text-emerald-300">Agent KYC</p>
                                                    <p className="text-[0.5625rem] text-faint truncate">Aya Koffi</p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSwitchRole('owner')}
                                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left hover:border-neon hover:bg-neon/10 transition-all cursor-pointer"
                                                >
                                                    <p className="font-bold text-[0.6875rem] text-heading">Propriétaire</p>
                                                    <p className="text-[0.5625rem] text-faint truncate">I. Touré</p>
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSidebarOpen(false);
                                                        openAuth('signin');
                                                    }}
                                                    className="rounded-xl bg-white/[0.06] p-2.5 text-xs font-semibold text-heading ring-1 ring-white/10 hover:bg-white/[0.1] cursor-pointer"
                                                >
                                                    {t('nav.signIn')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSidebarOpen(false);
                                                        openAuth('signup');
                                                    }}
                                                    className="rounded-xl bg-neon p-2.5 text-xs font-bold text-void shadow-md hover:brightness-105 cursor-pointer"
                                                >
                                                    {t('nav.getStarted')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 2: Navigation Principale */}
                                <div>
                                    <p className="px-1 pb-2 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-faint">
                                        {locale === 'fr' ? 'Navigation Principale' : 'Main Navigation'}
                                    </p>

                                    <div className="grid gap-1.5">
                                        <Link
                                            href="/"
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/5 hover:bg-white/[0.06] transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🏠</span>
                                                <div>
                                                    <p className="text-sm font-bold text-heading">Accueil</p>
                                                    <p className="text-[0.6875rem] text-body/65">Marché immobilier vérifié & recherche</p>
                                                </div>
                                            </div>
                                            <ChevronDownIcon className="h-4 w-4 -rotate-90 text-body/40" />
                                        </Link>

                                        <Link
                                            href="/properties"
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/5 hover:bg-white/[0.06] transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🔍</span>
                                                <div>
                                                    <p className="text-sm font-bold text-heading">Explorer les biens</p>
                                                    <p className="text-[0.6875rem] text-body/65">Catalogue complet avec géolocalisation</p>
                                                </div>
                                            </div>
                                            <ChevronDownIcon className="h-4 w-4 -rotate-90 text-body/40" />
                                        </Link>

                                        <Link
                                            href="/properties?view=map"
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center justify-between rounded-xl bg-emerald-950/40 p-3 border border-emerald-500/30 hover:bg-emerald-900/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🗺️</span>
                                                <div>
                                                    <p className="text-sm font-bold text-emerald-300">Carte GPS Interactive</p>
                                                    <p className="text-[0.6875rem] text-emerald-400/80">Localisation précise des biens à Abidjan</p>
                                                </div>
                                            </div>
                                            <ChevronDownIcon className="h-4 w-4 -rotate-90 text-emerald-400" />
                                        </Link>

                                        <Link
                                            href="/demande"
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-3 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🎯</span>
                                                <div>
                                                    <p className="text-sm font-bold text-emerald-200">Demande Sur-Mesure</p>
                                                    <p className="text-[0.6875rem] text-emerald-300/80">Mandat de recherche transmis à la conciergerie</p>
                                                </div>
                                            </div>
                                            <ArrowUpRightIcon className="h-4 w-4 text-emerald-400" />
                                        </Link>

                                        <Link
                                            href="/compare"
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center justify-between rounded-xl bg-emerald-950/25 p-3 border border-emerald-500/30 hover:bg-emerald-900/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">⚖️</span>
                                                <div>
                                                    <p className="text-sm font-bold text-emerald-300">Comparateur de Biens</p>
                                                    <p className="text-[0.6875rem] text-emerald-400/80">Tableau comparatif côte à côte</p>
                                                </div>
                                            </div>
                                            {compareCount > 0 ? (
                                                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-void font-mono">
                                                    {compareCount}
                                                </span>
                                            ) : (
                                                <ChevronDownIcon className="h-4 w-4 -rotate-90 text-emerald-400" />
                                            )}
                                        </Link>

                                        <Link
                                            href="/wishlist"
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center justify-between rounded-xl bg-rose-950/25 p-3 border border-rose-500/30 hover:bg-rose-900/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">❤️</span>
                                                <div>
                                                    <p className="text-sm font-bold text-rose-300">Ma Wishlist (Favoris)</p>
                                                    <p className="text-[0.6875rem] text-rose-400/80">Biens sauvegardés dans votre profil</p>
                                                </div>
                                            </div>
                                            {savedCount > 0 ? (
                                                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white font-mono">
                                                    {savedCount}
                                                </span>
                                            ) : (
                                                <ChevronDownIcon className="h-4 w-4 -rotate-90 text-rose-400" />
                                            )}
                                        </Link>

                                        <Link
                                            href="/agent/analytics"
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center justify-between rounded-xl bg-cyan-950/30 p-3 border border-cyan-500/30 hover:bg-cyan-900/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">📊</span>
                                                <div>
                                                    <p className="text-sm font-bold text-cyan-300">Statistiques Vues 30 Jours</p>
                                                    <p className="text-[0.6875rem] text-cyan-400/80">Audience Recharts pour agents certifiés</p>
                                                </div>
                                            </div>
                                            <ArrowUpRightIcon className="h-4 w-4 text-cyan-400" />
                                        </Link>
                                    </div>
                                </div>

                                {/* Section 3: Catégories Immobilières */}
                                <div>
                                    <p className="px-1 pb-2 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-faint">
                                        {locale === 'fr' ? 'Catégories Immobilières' : 'Property Categories'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {NAV.map((item) => (
                                            <Link
                                                key={item.key}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2.5 border border-white/5 hover:bg-white/[0.07] transition-colors"
                                            >
                                                <span className="text-base">{item.icon}</span>
                                                <span className="text-xs font-semibold text-heading truncate">{locale === 'fr' ? item.label_fr : item.label_en}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 4: Customer Care & Services Lines (ChiChoc Helpline) */}
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400">
                                            <ShieldCheckIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-display font-bold text-emerald-200 text-xs uppercase tracking-wide">
                                                Lignes Service Client & Conciergerie
                                            </h4>
                                            <p className="text-[0.625rem] text-emerald-400/80">
                                                Pour vos réclamations et assistance générale
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <a
                                            href="tel:+22507000000"
                                            className="flex items-center justify-between rounded-xl bg-white/[0.04] p-2.5 border border-white/10 hover:bg-white/10 text-heading transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <PhoneIcon className="h-4 w-4 text-emerald-400" />
                                                <span className="font-semibold">Ligne Centrale ChiChoc</span>
                                            </div>
                                            <span className="font-mono text-neon text-[0.6875rem] font-bold">+225 07 00 00 00</span>
                                        </a>

                                        <a
                                            href="https://wa.me/22507000000?text=Bonjour%20Service%20Client%20ChiChoc%20Habitat,%20j'ai%20besoin%20d'une%20assistance."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between rounded-xl bg-emerald-950/60 p-2.5 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <WhatsAppIcon className="h-4 w-4 fill-current" />
                                                <span className="font-semibold">WhatsApp Service Client</span>
                                            </div>
                                            <span className="text-[0.6875rem] font-bold">En ligne 7j/7</span>
                                        </a>

                                        <div className="flex items-center gap-2 px-1 text-[0.6875rem] text-faint">
                                            <MailIcon className="h-3.5 w-3.5" />
                                            <span>conciergerie@chichochabitat.ci</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * Mobile Bottom Navigation Bar.
 * Sits in the thumb-zone for smartphones & tablets (< lg screens)
 * Perfectly connects:
 * 1. Accueil (/)
 * 2. Explorer (/properties)
 * 3. Carte GPS (/properties?view=map)
 * 4. Demande (/demande)
 * 5. Connexion / Compte (/account or AuthModal)
 */
function MobileBottomNav() {
    const { url, auth } = usePage().props;
    const { openAuth } = useAuthModal();
    const [currentUser, setCurrentUser] = useState(() => getStoredUser(auth?.user));

    useEffect(() => {
        const handler = (e) => setCurrentUser(e.detail);
        window.addEventListener('chichoc:auth-change', handler);
        return () => window.removeEventListener('chichoc:auth-change', handler);
    }, []);

    const user = currentUser;

    const isHome = url === '/' || url === '';
    const isMap = url?.includes('view=map') || url?.includes('/map') || url?.includes('/carte');
    const isExplorer = (url?.startsWith('/properties') || url?.startsWith('/search')) && !isMap;
    const isDemande = url?.startsWith('/demande') || url?.startsWith('/request');
    const isAccount = url?.startsWith('/account') || url?.startsWith('/dashboard');

    return (
        <nav
            aria-label="Mobile Bottom Navigation"
            className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-void-raised/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 shadow-[0_-10px_35px_rgba(0,0,0,0.9)]"
        >
            <div className="grid grid-cols-5 items-center gap-1 max-w-md mx-auto text-center">
                {/* 1. Accueil */}
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center justify-center py-1 rounded-xl transition-all",
                        isHome ? "text-neon font-bold scale-105" : "text-body/70 hover:text-heading"
                    )}
                >
                    <span className="text-lg leading-none">🏠</span>
                    <span className={cn("text-[0.625rem] mt-1 font-semibold", isHome ? "text-neon" : "text-faint")}>
                        Accueil
                    </span>
                    {isHome && <span className="h-1 w-1 rounded-full bg-neon mt-0.5" />}
                </Link>

                {/* 2. Explorer */}
                <Link
                    href="/properties"
                    className={cn(
                        "flex flex-col items-center justify-center py-1 rounded-xl transition-all",
                        isExplorer ? "text-neon font-bold scale-105" : "text-body/70 hover:text-heading"
                    )}
                >
                    <span className="text-lg leading-none">🔍</span>
                    <span className={cn("text-[0.625rem] mt-1 font-semibold", isExplorer ? "text-neon" : "text-faint")}>
                        Explorer
                    </span>
                    {isExplorer && <span className="h-1 w-1 rounded-full bg-neon mt-0.5" />}
                </Link>

                {/* 3. Carte GPS */}
                <Link
                    href="/properties?view=map"
                    className={cn(
                        "flex flex-col items-center justify-center py-1 rounded-xl transition-all",
                        isMap ? "text-neon font-bold scale-105" : "text-body/70 hover:text-heading"
                    )}
                >
                    <span className="text-lg leading-none">🗺️</span>
                    <span className={cn("text-[0.625rem] mt-1 font-semibold", isMap ? "text-neon" : "text-faint")}>
                        Carte GPS
                    </span>
                    {isMap && <span className="h-1 w-1 rounded-full bg-neon mt-0.5" />}
                </Link>

                {/* 4. Demande Sur-Mesure */}
                <Link
                    href="/demande"
                    className={cn(
                        "flex flex-col items-center justify-center py-1 rounded-xl transition-all",
                        isDemande ? "text-emerald-300 font-bold scale-105" : "text-emerald-400/80 hover:text-emerald-200"
                    )}
                >
                    <span className="text-lg leading-none">🎯</span>
                    <span className={cn("text-[0.625rem] mt-1 font-semibold", isDemande ? "text-emerald-300 font-bold" : "text-emerald-400")}>
                        Demande
                    </span>
                    {isDemande && <span className="h-1 w-1 rounded-full bg-emerald-400 mt-0.5" />}
                </Link>

                {/* 5. Connexion / Compte */}
                {user ? (
                    <Link
                        href="/account"
                        className={cn(
                            "flex flex-col items-center justify-center py-1 rounded-xl transition-all",
                            isAccount ? "text-neon font-bold scale-105" : "text-body/70 hover:text-heading"
                        )}
                    >
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20 text-[0.625rem] font-bold text-emerald-300 ring-1 ring-emerald-500/40">
                            {user.initials}
                        </span>
                        <span className={cn("text-[0.625rem] mt-0.5 font-semibold", isAccount ? "text-neon" : "text-faint")}>
                            Compte
                        </span>
                        {isAccount && <span className="h-1 w-1 rounded-full bg-neon mt-0.5" />}
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={() => openAuth('signin')}
                        className="flex flex-col items-center justify-center py-1 rounded-xl text-body/70 hover:text-heading transition-all cursor-pointer"
                    >
                        <UserIcon className="h-5 w-5 text-body/60" />
                        <span className="text-[0.625rem] font-semibold mt-0.5 text-faint">
                            Connexion
                        </span>
                    </button>
                )}
            </div>
        </nav>
    );
}

function AuthHost() {
    const { open, mode, reason, closeAuth, openAuth } = useAuthModal();

    return (
        <AuthModal
            open={open}
            mode={mode}
            reason={reason}
            onClose={closeAuth}
            onModeChange={(next) => openAuth(next, reason)}
        />
    );
}

export default function SiteLayout({ children }) {
    const { t } = useTranslation();
    const { footerPages = {}, locale, site } = usePage().props;

    const columns = [
        {
            title: t('footer.explore'),
            links: [
                { label: t('footer.buyHome'), href: '/properties?intent=sale' },
                { label: t('footer.rentHome'), href: '/properties?intent=rent' },
                { label: t('footer.land'), href: '/properties?type=Land' },
                { label: t('footer.commercial'), href: '/properties?type=Shop' },
            ],
        },
        ...['trust', 'company', 'legal'].map((group) => ({
            title: t(`footer.${group}`),
            links: (footerPages?.[group] ?? []).map((page) => ({
                label: page.title,
                href: `/pages/${page.slug}`,
            })),
        })),
    ];

    return (
        <AuthModalProvider>
            <CompareProvider>
                <div className="relative flex min-h-dvh flex-col bg-void text-heading antialiased">
                <FloatingNav />

                <main className="flex-1 pb-24 lg:pb-0">{children}</main>

                <MobileBottomNav />

                <footer className="mt-24 border-t border-white/[0.08] mb-16 lg:mb-0">
                    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3">
                                <LogoMark className="h-10 w-10 ring-1 ring-white/10" />
                                <div className="flex flex-col text-left">
                                    <span className="font-display text-[1rem] font-bold tracking-tight text-heading leading-tight">
                                        CHIC CHOC <span className="text-neon">HABITAT</span>
                                    </span>
                                    <span className="text-[0.625rem] font-semibold text-neon/90 uppercase tracking-wider">
                                        Fiable · Sécurisé · Garantie
                                    </span>
                                </div>
                            </div>

                            <p className="mt-4 max-w-xs text-[0.8125rem] leading-relaxed text-body/65">
                                {site?.tagline}
                            </p>

                            {site?.email && (
                                <p className="mt-3 text-[0.75rem] text-body/55">
                                    {site.email}
                                    {site.phone ? ` · ${site.phone}` : ''}
                                </p>
                            )}

                            <div className="mt-5">
                                <LanguageSwitcher locale={locale} />
                            </div>
                        </div>

                        {columns.map((column) => (
                            <div key={column.title}>
                                <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-faint">
                                    {column.title}
                                </p>
                                <ul className="mt-4 space-y-2.5">
                                    {column.links.map((link) => (
                                        <li key={link.href + link.label}>
                                            <Link
                                                href={link.href}
                                                className="text-[0.8125rem] text-body/70 transition-colors hover:text-heading"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/[0.06]">
                        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-[0.75rem] text-faint sm:flex-row sm:items-center sm:justify-between">
                            <p>© {new Date().getFullYear()} ChiChoc-Habitat. {t('footer.rights')}.</p>
                            <p className="flex items-center gap-2">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon" />
                                Côte d’Ivoire · XOF · {locale === 'fr' ? 'Français' : 'English'}
                            </p>
                        </div>
                    </div>
                </footer>

                <CompareFloatingBar />
                <AuthHost />
            </div>
        </CompareProvider>
    </AuthModalProvider>
    );
}

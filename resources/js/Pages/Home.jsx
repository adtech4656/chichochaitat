import { useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import SiteLayout from '../Layouts/SiteLayout';
import LogoPreloader from '../Components/LogoPreloader';
import GlassSearchBar from '../Components/GlassSearchBar';
import PropertyCard from '../Components/PropertyCard';
import PropertyCardSkeleton from '../Components/PropertyCardSkeleton';
import AppointmentModal from '../Components/AppointmentModal';
import PropertyRequestModal from '../Components/PropertyRequestModal';
import { useAuthModal } from '../lib/auth-modal';
import { useTranslation } from '../lib/i18n';
import { useMoney } from '../lib/money';
import { page, spring, staggerParent } from '../lib/motion';
import {
    ArrowUpRightIcon,
    CameraIcon,
    CheckIcon,
    HeartIcon,
    MapPinIcon,
    SearchIcon,
    ShieldCheckIcon,
} from '../Components/Icons';
import { cn } from '../lib/utils';

const HERO_IMAGE =
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=80';

const INTENTS = [
    { key: 'buy', target: 'sale', labelKey: 'intent.buy', icon: '🏛' },
    { key: 'rent', target: 'rent', labelKey: 'intent.rent', icon: '🔑' },
    { key: 'land', target: 'Land', labelKey: 'intent.land', icon: '🌿' },
    { key: 'commercial', target: 'Shop', labelKey: 'intent.commercial', icon: '🏬' },
    { key: 'hospitality', target: 'Hotel', labelKey: 'intent.hospitality', icon: '🏨' },
];

const TRUST = [
    { icon: ShieldCheckIcon, titleKey: 'trust.identityTitle', copyKey: 'trust.identityCopy' },
    { icon: CameraIcon, titleKey: 'trust.captureTitle', copyKey: 'trust.captureCopy' },
    { icon: MapPinIcon, titleKey: 'trust.approvedTitle', copyKey: 'trust.approvedCopy' },
];

const HOW_IT_WORKS = [
    { step: '01', titleKey: 'how.step1Title', copyKey: 'how.step1Copy' },
    { step: '02', titleKey: 'how.step2Title', copyKey: 'how.step2Copy' },
    { step: '03', titleKey: 'how.step3Title', copyKey: 'how.step3Copy' },
    { step: '04', titleKey: 'how.step4Title', copyKey: 'how.step4Copy' },
];

export default function Home({ properties = [], content = {}, filters = {}, categories = {}, market = [] }) {
    const { openAuth } = useAuthModal();
    const { t, locale } = useTranslation();
    const { format } = useMoney();
    const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
    const reduceMotion = useReducedMotion();

    const [preloading, setPreloading] = useState(() => {
        if (typeof window === 'undefined') return true;

        return window.sessionStorage.getItem('cch:entered') !== '1';
    });

    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [appointmentOpen, setAppointmentOpen] = useState(false);
    const [appointmentProperty, setAppointmentProperty] = useState(null);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [searchFilters, setSearchFilters] = useState({
        location: '',
        type: '',
        budget: '',
    });

    /* Skeleton pass — mirrors the real network waterfall on first paint. */
    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), reduceMotion ? 120 : 900);

        return () => window.clearTimeout(timer);
    }, [reduceMotion]);

    const finishIntro = () => {
        window.sessionStorage.setItem('cch:entered', '1');
        setPreloading(false);
    };

    const hasActiveSearch = Boolean(
        searchFilters.location || searchFilters.type || searchFilters.budget,
    );

    const categoryCounts = useMemo(() => ({
        all: properties.length,
        sale: properties.filter((p) => p.intent === 'sale').length,
        rent: properties.filter((p) => p.intent === 'rent').length,
        Shop: properties.filter((p) => p.type.toLowerCase() === 'shop').length,
        Hotel: properties.filter((p) => p.type.toLowerCase() === 'hotel').length,
        Land: properties.filter((p) => p.type.toLowerCase() === 'land').length,
        House: properties.filter((p) => p.type.toLowerCase() === 'house').length,
    }), [properties]);

    const filteredProperties = useMemo(() => {
        let list = properties;

        // Separate Sale vs Rent, Shops/Stores, Hotels, Land, Houses
        if (selectedCategory === 'sale') {
            list = list.filter((p) => p.intent === 'sale');
        } else if (selectedCategory === 'rent') {
            list = list.filter((p) => p.intent === 'rent');
        } else if (selectedCategory === 'Shop') {
            list = list.filter((p) => p.type.toLowerCase() === 'shop');
        } else if (selectedCategory === 'Hotel') {
            list = list.filter((p) => p.type.toLowerCase() === 'hotel');
        } else if (selectedCategory === 'Land') {
            list = list.filter((p) => p.type.toLowerCase() === 'land');
        } else if (selectedCategory === 'House') {
            list = list.filter((p) => p.type.toLowerCase() === 'house');
        }

        if (searchFilters.location) {
            const loc = searchFilters.location.trim().toLowerCase();
            list = list.filter(
                (p) =>
                    p.city.toLowerCase().includes(loc) ||
                    p.location.toLowerCase().includes(loc) ||
                    (p.district && p.district.toLowerCase().includes(loc)),
            );
        }
        if (searchFilters.type) {
            list = list.filter((p) => p.type.toLowerCase() === searchFilters.type.toLowerCase());
        }
        if (searchFilters.budget) {
            const b = searchFilters.budget;
            if (b === 'under25') list = list.filter((p) => p.price < 25000000);
            else if (b === '25to60') list = list.filter((p) => p.price >= 25000000 && p.price <= 60000000);
            else if (b === '60to120') list = list.filter((p) => p.price >= 60000000 && p.price <= 120000000);
            else if (b === '120plus') list = list.filter((p) => p.price > 120000000);
        }
        return list;
    }, [properties, selectedCategory, searchFilters]);

    const search = (values) => {
        const query = {};
        if (values.type) query.type = values.type;
        if (values.location) query.city = values.location;
        if (values.budget) query.budget = values.budget;

        router.get('/properties', query, { preserveScroll: false });
    };

    return (
        <>
            <AnimatePresence>{preloading && <LogoPreloader onDone={finishIntro} />}</AnimatePresence>

            <motion.div variants={page} initial="initial" animate="animate" id="top" className="pb-24 lg:pb-0">
                {/* ============================ HERO ============================ */}
                <section className="relative isolate overflow-hidden">
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <div
                            className="absolute inset-0 animate-hero-drift bg-cover bg-center will-change-transform"
                            style={{ backgroundImage: `url(${HERO_IMAGE})` }}
                            aria-hidden="true"
                        />
                        <div className="absolute inset-0 hero-scrim" aria-hidden="true" />
                    </div>

                    <div className="mx-auto max-w-7xl px-6 pb-28 pt-36 sm:pt-40 lg:pb-36 lg:pt-48">
                        <motion.div
                            initial={{ opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...spring, delay: 0.1 }}
                            className="inline-flex items-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.06] px-3 py-1.5 backdrop-blur-xl"
                        >
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-70" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon" />
                            </span>
                            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-body">
                                {content.eyebrow ?? t('hero.badge')}
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 26 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...spring, delay: 0.16 }}
                            className="mt-7 max-w-3xl font-display text-[clamp(2.6rem,7.2vw,5.25rem)] font-semibold leading-[0.96] tracking-[-0.045em]"
                        >
                            <span className="block text-heading">{content.title_line1 ?? t('hero.title1Fallback')}</span>
                            <span className="block bg-gradient-to-r from-heading via-neon-bright to-neon bg-clip-text text-transparent drop-shadow-[0_0_44px_rgba(102,187,106,0.28)]">
                                {content.title_line2 ?? t('hero.title2Fallback')}
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...spring, delay: 0.22 }}
                            className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-body/85 sm:text-base"
                        >
                            {content.subtitle ?? t('hero.subtitleFallback')}
                        </motion.p>
                        <div className="mt-9 max-w-4xl">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <span className="text-[0.6875rem] font-bold text-body/75 uppercase tracking-wider hidden sm:inline">
                                    {locale === 'fr' ? 'Recherche Multicritères & Prix vérifiés' : 'Verified Multi-criteria Search'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setRequestModalOpen(true)}
                                    className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-3 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer shadow-sm ml-auto"
                                >
                                    <span>🎯</span>
                                    <span>{locale === 'fr' ? 'Demande sur-mesure aux agents' : 'Submit bespoke request to agents'}</span>
                                </button>
                            </div>
                            <GlassSearchBar
                                onSubmit={search}
                                onChange={setSearchFilters}
                                cities={filters.locations ?? filters.cities ?? []}
                                types={filters.types ?? []}
                            />
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.75rem] text-body/70"
                        >
                            {[t('hero.trust1'), t('hero.trust2'), t('hero.trust3')].map((item) => (
                                <span key={item} className="flex items-center gap-1.5">
                                    <span className="grid h-4 w-4 place-items-center rounded-full bg-neon/15 text-neon">
                                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="m2.5 6 2.2 2.2L9.5 3.6" />
                                        </svg>
                                    </span>
                                    {item}
                                </span>
                            ))}
                        </motion.div>

                        <div className="mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 border-t border-white/[0.08] pt-7 sm:grid-cols-4">
                            {[
                                [content.stats?.listings ?? '0', t('stat.listings')],
                                [content.stats?.agents ?? '0', t('stat.agents')],
                                [content.stats?.approval === '—' ? '—' : `${content.stats?.approval ?? '0'}%`, t('stat.approval')],
                                [content.stats?.response ?? '—', t('stat.response')],
                            ].map(([value, label]) => (
                                <div key={label}>
                                    <p className="font-display text-[1.375rem] font-semibold tracking-[-0.02em] text-heading">
                                        {value}
                                    </p>
                                    <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-faint">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========================= INTENT RAIL ========================= */}
                <section className="mx-auto -mt-10 max-w-7xl px-6">
                    <div className="fade-rail -mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex min-w-max gap-3">
                            {INTENTS.map((intent, index) => {
                                const isSelected = selectedCategory === intent.target;
                                return (
                                    <motion.button
                                        key={intent.key}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory(intent.target);
                                            document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-40px' }}
                                        transition={{ ...spring, delay: index * 0.04 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        className={cn(
                                            'glass flex items-center gap-3 rounded-[1.15rem] px-4 py-3 transition-colors text-left cursor-pointer',
                                            isSelected ? 'border-neon bg-neon/10' : 'hover:border-white/20'
                                        )}
                                    >
                                        <span className="grid h-9 w-9 place-items-center rounded-[0.7rem] bg-white/[0.06] text-base ring-1 ring-white/10">
                                            {intent.icon}
                                        </span>
                                        <span>
                                            <span className="block text-[0.8125rem] font-medium text-heading">
                                                {t(intent.labelKey)}
                                            </span>
                                            <span className="mt-0.5 block text-[0.6875rem] text-neon font-semibold">
                                                {t('intent.available', { count: categories[intent.key] ?? categoryCounts[intent.target] ?? 0 })}
                                            </span>
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ========================== PROPERTIES ========================= */}
                <section id="properties" className="mx-auto max-w-7xl scroll-mt-28 px-6 pt-24">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-neon/80">
                                    {hasActiveSearch ? t('search.filterProperties', 'Filter Properties') : t('home.featured')}
                                </p>
                                <span className="rounded-full bg-neon/15 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-neon border border-neon/30">
                                    {filteredProperties.length} {t('search.results', 'results')}
                                </span>
                            </div>
                            <h2 className="mt-2.5 max-w-xl font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-heading">
                                {hasActiveSearch
                                    ? t('search.filteredCount', { count: filteredProperties.length })
                                    : t('home.featuredTitle')}
                            </h2>
                        </div>

                        <div className="flex items-center gap-2">
                            {(hasActiveSearch || selectedCategory !== 'all') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory('all');
                                        setSearchFilters({ location: '', type: '', budget: '' });
                                    }}
                                    className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[0.75rem] font-medium text-body/80 hover:text-heading hover:bg-white/[0.08] transition-colors cursor-pointer"
                                >
                                    {t('search.clear', 'Clear filters')}
                                </button>
                            )}

                            <Link
                                href="/properties"
                                className="group flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-[0.8125rem] font-medium text-heading backdrop-blur-xl transition-colors hover:border-white/25"
                            >
                                {t('home.viewAll')}
                                <ArrowUpRightIcon className="h-4 w-4 text-body transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>

                    {/* Segmented Category Filter Navigation */}
                    <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
                        {[
                            { key: 'all', label: t('category.all', 'Tous les biens'), icon: '✨', count: categoryCounts.all },
                            { key: 'sale', label: t('category.sale', 'À Vendre'), icon: '🏛', count: categoryCounts.sale },
                            { key: 'rent', label: t('category.rent', 'À Louer'), icon: '🔑', count: categoryCounts.rent },
                            { key: 'Shop', label: t('category.shops', 'Boutiques & Magasins'), icon: '🏬', count: categoryCounts.Shop },
                            { key: 'Hotel', label: t('category.hotels', 'Hôtels & Résidences'), icon: '🏨', count: categoryCounts.Hotel },
                            { key: 'Land', label: t('category.lands', 'Terrains Titrés'), icon: '🌿', count: categoryCounts.Land },
                            { key: 'House', label: t('category.houses', 'Villas & Maisons'), icon: '🏡', count: categoryCounts.House },
                        ].map((tab) => {
                            const active = selectedCategory === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setSelectedCategory(tab.key)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.8125rem] font-semibold transition-all cursor-pointer',
                                        active
                                            ? 'bg-neon text-void shadow-[0_4px_16px_rgba(102,187,106,0.35)] ring-1 ring-neon'
                                            : 'bg-white/[0.04] text-body/80 hover:bg-white/[0.08] hover:text-heading ring-1 ring-white/10'
                                    )}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[0.6875rem] font-bold',
                                            active ? 'bg-void/25 text-void' : 'bg-white/[0.08] text-faint'
                                        )}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {loading ? (
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <PropertyCardSkeleton key={index} delay={index * 70} />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            variants={staggerParent}
                            initial="initial"
                            animate="animate"
                            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {filteredProperties.map((property, index) => (
                                <PropertyCard key={property.id} property={property} priority={index < 3} />
                            ))}
                        </motion.div>
                    )}

                    {!loading && filteredProperties.length === 0 && (
                        <div className="glass mt-8 flex flex-col items-center gap-3 rounded-[1.5rem] px-6 py-16 text-center">
                            <SearchIcon className="h-6 w-6 text-neon/70" />
                            <p className="font-display text-[1.0625rem] font-medium text-heading">
                                {t('home.empty')}
                            </p>
                            <p className="max-w-sm text-[0.8125rem] text-body/70">
                                {t('search.noResultsHelp')}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setSearchFilters({ location: '', type: '', budget: '' });
                                }}
                                className="mt-2 rounded-xl bg-neon/15 px-4 py-2 text-[0.8125rem] font-semibold text-neon border border-neon/30 hover:bg-neon/25 transition-colors cursor-pointer"
                            >
                                {t('search.reset', 'Reset all filters')}
                            </button>
                        </div>
                    )}
                </section>

                {/* ===================== INTERMEDIATION & APPOINTMENT BANNER ===================== */}
                <section className="mx-auto max-w-7xl px-6 pt-20">
                    <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/30 bg-gradient-to-br from-[#070b0e] via-[#091512] to-[#050e0b] p-8 sm:p-12 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[0.75rem] font-bold uppercase tracking-wider text-neon border border-neon/30">
                                    <ShieldCheckIcon className="h-4 w-4" />
                                    <span>{t('intermediary.title')}</span>
                                </div>
                                <h3 className="mt-4 font-display text-[1.65rem] sm:text-[2.1rem] font-bold tracking-tight text-heading">
                                    {locale === 'fr' 
                                        ? 'Sécurité Totale : Pourquoi les contacts directs sont proscrits' 
                                        : 'Total Security: Why Direct Contact Is Prohibited'}
                                </h3>
                                <p className="mt-3 text-[0.9375rem] leading-relaxed text-body/85">
                                    {t('intermediary.description')}
                                </p>
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                        <span className="font-bold text-neon block text-sm">
                                            {locale === 'fr' ? '1. Audit Bilatéral' : '1. Dual Verification'}
                                        </span>
                                        <p className="text-[0.75rem] text-faint mt-1">
                                            {locale === 'fr' 
                                                ? 'Contrôle KYC acheteur/locataire et vérification notariale du titre (ACD/IDUFCI).' 
                                                : 'Buyer KYC check and authentic title (ACD) audit on seller/agent.'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                        <span className="font-bold text-neon block text-sm">
                                            {locale === 'fr' ? '2. Rendez-vous Officiel' : '2. Official Appointment'}
                                        </span>
                                        <p className="text-[0.75rem] text-faint mt-1">
                                            {locale === 'fr'
                                                ? 'Visite sur site contradictoire encadrée et attestée par un délégué assermenté.'
                                                : 'Supervised on-site inspection coordinated by a sworn Chic Choc Habitat officer.'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                        <span className="font-bold text-neon block text-sm">
                                            {locale === 'fr' ? '3. Clôture Notariée' : '3. Notary Escrow Closing'}
                                        </span>
                                        <p className="text-[0.75rem] text-faint mt-1">
                                            {locale === 'fr'
                                                ? 'Signature officielle et séquestre garanti pour zéro risque d’escroquerie.'
                                                : 'Binding notary deeds or registered leases with zero off-platform risk.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAppointmentProperty(properties[0] || null);
                                        setAppointmentOpen(true);
                                    }}
                                    className="flex items-center justify-center gap-2.5 rounded-2xl bg-neon px-6 py-4 font-display text-[0.9375rem] font-bold text-void shadow-[0_4px_24px_rgba(102,187,106,0.4)] hover:bg-neon-bright hover:shadow-[0_4px_30px_rgba(102,187,106,0.6)] transition-all cursor-pointer"
                                >
                                    <ShieldCheckIcon className="h-5 w-5" />
                                    <span>{t('intermediary.scheduleAppointment')}</span>
                                </button>
                                <p className="text-center text-[0.6875rem] text-faint">
                                    {t('intermediary.noDirectContact')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================= VERIFICATION ======================== */}
                <section id="verified" className="mx-auto max-w-7xl scroll-mt-28 px-6 pt-24">
                    <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                        <div>
                            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-neon/80">
                                {t('home.why')}
                            </p>
                            <h2 className="mt-2.5 font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-heading">
                                {t('home.whyTitle')}
                            </h2>
                            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-body/75">
                                {t('home.whyCopy')}
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {TRUST.map(({ icon: Icon, titleKey, copyKey }, index) => (
                                <motion.div
                                    key={titleKey}
                                    initial={{ opacity: 0, y: 22 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-60px' }}
                                    transition={{ ...spring, delay: index * 0.06 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="glass rounded-[1.35rem] p-5"
                                >
                                    <span className="grid h-10 w-10 place-items-center rounded-[0.8rem] bg-neon/10 text-neon ring-1 ring-neon/25">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-4 font-display text-[0.9375rem] font-semibold tracking-[-0.01em] text-heading">
                                        {t(titleKey)}
                                    </h3>
                                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-body/65">
                                        {t(copyKey)}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========================= HOW IT WORKS ======================== */}
                <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-28 px-6 pt-24">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-neon/80">
                                {t('home.how')}
                            </p>
                            <h2 className="mt-2.5 max-w-lg font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-heading">
                                {t('home.howTitle')}
                            </h2>
                        </div>
                        <p className="max-w-sm text-[0.8125rem] leading-relaxed text-body/60">
                            {t('home.howCopy')}
                        </p>
                    </div>

                    <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {HOW_IT_WORKS.map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ ...spring, delay: index * 0.06 }}
                                whileHover={{ scale: 1.02 }}
                                className="glass group relative overflow-hidden rounded-[1.35rem] p-5"
                            >
                                {/* Connecting hairline between steps */}
                                {index < HOW_IT_WORKS.length - 1 && (
                                    <span
                                        className="pointer-events-none absolute -right-2 top-9 hidden h-px w-4 bg-white/15 xl:block"
                                        aria-hidden="true"
                                    />
                                )}

                                <span className="font-mono text-[0.6875rem] tracking-[0.2em] text-neon/70">
                                    {item.step}
                                </span>

                                <h3 className="mt-3 font-display text-[1rem] font-semibold tracking-[-0.015em] text-heading">
                                    {t(item.titleKey)}
                                </h3>
                                <p className="mt-2 text-[0.8125rem] leading-relaxed text-body/65">
                                    {t(item.copyKey)}
                                </p>

                                <span
                                    className="pointer-events-none absolute -bottom-10 -right-10 h-24 w-24 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                    style={{ background: 'radial-gradient(circle, rgba(102,187,106,0.16) 0%, transparent 70%)' }}
                                    aria-hidden="true"
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* =========================== INSIGHTS ========================== */}
                <section id="insights" className="mx-auto max-w-7xl scroll-mt-28 px-6 pt-24">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-neon/80">
                                {t('home.insights')}
                            </p>
                            <h2 className="mt-2.5 font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-heading">
                                {t('home.insightsTitle')}
                            </h2>
                        </div>
                        <Link
                            href="/properties"
                            className="group flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-[0.8125rem] font-medium text-heading transition-colors hover:border-white/25"
                        >
                            {t('home.insightsAction')}
                            <ArrowUpRightIcon className="h-4 w-4 text-body transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </Link>
                    </div>

                    <div className="mt-9 grid gap-4 lg:grid-cols-3">
                        {market.map((insight, index) => (
                            <motion.article
                                key={insight.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ ...spring, delay: index * 0.06 }}
                                className="glass flex flex-col rounded-[1.35rem] p-5"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-body/80 ring-1 ring-white/10">
                                        {insight.region}
                                    </span>
                                    <span className="flex items-center gap-1 rounded-full bg-neon/10 px-2 py-0.5 text-[0.625rem] font-semibold text-neon ring-1 ring-neon/25">
                                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M6 9.5V2.5M3 5.5 6 2.5l3 3" />
                                        </svg>
                                        {insight.intent_label}
                                    </span>
                                </div>

                                <h3 className="mt-3.5 font-display text-[1rem] font-semibold leading-snug tracking-[-0.015em] text-heading">
                                    <Link href={insight.href} className="transition-colors hover:text-neon">
                                        {insight.title}
                                    </Link>
                                </h3>
                                <p className="mt-2 flex-1 text-[0.8125rem] leading-relaxed text-body/65">
                                    {t('market.summary', { type: insight.type, area: insight.area })}
                                </p>

                                <p className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3 text-[0.625rem] uppercase tracking-[0.14em] text-faint">
                                    <span>{format(insight.price)}</span>
                                    <span>
                                        {insight.published
                                            ? new Date(insight.published).toLocaleDateString(dateLocale, {
                                                  day: 'numeric',
                                                  month: 'short',
                                              })
                                            : ''}{' '}
                                        · {t('market.verifiedOn')}
                                    </span>
                                </p>
                            </motion.article>
                        ))}
                    </div>
                </section>

                {/* ============================ CTA ============================= */}
                <section className="mx-auto max-w-7xl px-6 pt-24">
                    <div className="glass-strong relative overflow-hidden rounded-[1.75rem] px-7 py-12 sm:px-12 sm:py-14">
                        <div
                            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
                            style={{ background: 'radial-gradient(circle, rgba(102,187,106,0.22) 0%, transparent 70%)' }}
                            aria-hidden="true"
                        />
                        <div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
                            <div className="max-w-xl">
                                <h2 className="font-display text-[clamp(1.6rem,3vw,2.125rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-heading">
                                    {t('home.ctaTitle')}
                                </h2>
                                <p className="mt-3 text-[0.875rem] leading-relaxed text-body/75">
                                    {t('home.ctaCopy')}
                                </p>
                            </div>

                            <motion.button
                                type="button"
                                onClick={() => openAuth('signup')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={spring}
                                className="shrink-0 rounded-full bg-neon px-6 py-3.5 text-[0.875rem] font-semibold text-void transition-shadow duration-300 hover:neon-glow"
                            >
                                {t('home.ctaButton')}
                            </motion.button>
                        </div>
                    </div>
                </section>
            </motion.div>

            {appointmentOpen && appointmentProperty && (
                <AppointmentModal
                    isOpen={appointmentOpen}
                    onClose={() => setAppointmentOpen(false)}
                    property={appointmentProperty}
                    onOpenAuth={openAuth}
                />
            )}

            <PropertyRequestModal
                isOpen={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
            />

            <MobileTabBar />
        </>
    );
}

/**
 * Persistent mobile navigation. On a phone the four jobs — search, save,
 * talk, manage — are always one tap away.
 */
function MobileTabBar() {
    const { t } = useTranslation();

    const items = [
        { label: t('mobile.search'), href: '/properties', icon: SearchIcon },
        { label: t('mobile.saved'), href: '/account', icon: HeartIcon },
        { label: t('mobile.chats'), href: '/account', icon: ChatIcon },
        { label: t('mobile.profile'), href: '/account', icon: UserIcon },
    ];

    return (
        <nav
            aria-label={t('mobile.nav')}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-void/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        >
            <div className="grid grid-cols-4">
                {items.map(({ label, href, icon: Icon }) => (
                    <Link
                        key={label}
                        href={href}
                        className="flex flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium text-body/65 transition-colors hover:text-heading"
                    >
                        <Icon className="h-[1.15rem] w-[1.15rem]" />
                        {label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}

function ChatIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            <path d="M20.5 12a8 8 0 0 1-8 8H8l-4 3v-5.2A8 8 0 0 1 12.5 4a8 8 0 0 1 8 8Z" />
        </svg>
    );
}

function UserIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
    );
}

Home.layout = (pageContent) => <SiteLayout>{pageContent}</SiteLayout>;

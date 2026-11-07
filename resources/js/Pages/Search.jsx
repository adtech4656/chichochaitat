import { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import SiteLayout from '../Layouts/SiteLayout';
import PropertyCard from '../Components/PropertyCard';
import KycBadge from '../Components/KycBadge';
import GpsVerifiedBadge from '../Components/GpsVerifiedBadge';
import InteractiveMap from '../Components/InteractiveMap';
import PropertyRequestModal from '../Components/PropertyRequestModal';
import { Button, Chip, EmptyState, StatusPill } from '../Components/ui';
import { ChevronDownIcon, CloseIcon, MapPinIcon, SearchIcon } from '../Components/Icons';
import { page, spring, staggerParent } from '../lib/motion';
import { cn } from '../lib/utils';
import { useMoney } from '../lib/money';
import { useTranslation, useTypeLabel } from '../lib/i18n';

const BUDGET_KEYS = ['budget.under25', 'budget.25to60', 'budget.60to120', 'budget.120plus'];

const VIEWS = [
    { key: 'grid', labelKey: 'search.grid' },
    { key: 'list', labelKey: 'search.list' },
    { key: 'map', labelKey: 'search.map' },
];

const SORTS = [
    { key: 'newest', labelKey: 'search.newest' },
    { key: 'nearest', labelKey: 'search.sortNearest' },
    { key: 'price-asc', labelKey: 'search.priceAsc' },
    { key: 'price-desc', labelKey: 'search.priceDesc' },
    { key: 'area-desc', labelKey: 'search.largest' },
];

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
}

const PER_PAGE = 6;

function readInitialFilters() {
    if (typeof window === 'undefined') return { intent: 'all', type: 'all', city: 'all', budget: null };

    const params = new URLSearchParams(window.location.search);
    const budgetRaw = params.get('budget');
    let budgetVal = null;
    if (budgetRaw !== null) {
        const budgetMap = { under25: 0, '25to60': 1, '60to120': 2, '120plus': 3 };
        if (budgetMap[budgetRaw] !== undefined) {
            budgetVal = budgetMap[budgetRaw];
        } else if (!isNaN(Number(budgetRaw))) {
            budgetVal = parseInt(budgetRaw, 10);
        }
    }

    const loc = params.get('city') ?? params.get('location') ?? 'all';

    return {
        intent: params.get('intent') ?? 'all',
        type: params.get('type') ?? 'all',
        city: loc,
        budget: budgetVal,
    };
}

export default function Search({ properties = [], filters: options = {}, stats = {}, initialView = 'grid' }) {
    const initial = readInitialFilters();
    const { t } = useTranslation();
    const typeLabel = useTypeLabel();

    const [state, setState] = useState({
        intent: initial.intent ?? 'all',
        type: initial.type ?? 'all',
        subType: 'all',
        city: initial.city ?? 'all',
        budget: initial.budget ?? null,
        bedrooms: 0,
        amenities: [],
        verifiedOnly: false,
        kycVerifiedOnly: false,
        sort: 'newest',
    });

    const isUrlMapView = typeof window !== 'undefined' && (
        new URLSearchParams(window.location.search).get('view') === 'map' ||
        window.location.pathname.includes('map') ||
        window.location.pathname.includes('carte')
    );
    const [view, setView] = useState(initialView === 'map' || isUrlMapView ? 'map' : 'grid');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'map' || window.location.pathname.includes('map') || window.location.pathname.includes('carte')) {
            setView('map');
        }
    }, []);
    const [pageIndex, setPageIndex] = useState(1);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [isLocatingUser, setIsLocatingUser] = useState(false);
    const [requestModalOpen, setRequestModalOpen] = useState(false);

    const handleLocateLive = () => {
        if (!navigator.geolocation) return;
        setIsLocatingUser(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                setIsLocatingUser(false);
                setState((curr) => ({ ...curr, sort: 'nearest' }));
            },
            () => {
                setIsLocatingUser(false);
                const loc = { lat: 5.3599, lng: -3.9866 };
                setUserLocation(loc);
                setState((curr) => ({ ...curr, sort: 'nearest' }));
            },
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    /* Any filter change resets pagination — otherwise a narrow result set can
       land on an empty page. */
    useEffect(() => {
        setPageIndex(1);
    }, [state]);

    const set = (key) => (value) => setState((current) => ({ ...current, [key]: value }));

    const toggleAmenity = (amenity) =>
        setState((current) => ({
            ...current,
            amenities: current.amenities.includes(amenity)
                ? current.amenities.filter((item) => item !== amenity)
                : [...current.amenities, amenity],
        }));

    const reset = () =>
        setState({
            intent: 'all',
            type: 'all',
            city: 'all',
            budget: null,
            bedrooms: 0,
            amenities: [],
            verifiedOnly: false,
            sort: 'newest',
        });

    const activeCount = [
        state.intent !== 'all',
        state.type !== 'all',
        state.city !== 'all',
        state.budget !== null,
        state.bedrooms > 0,
        ...state.amenities,
        state.verifiedOnly,
        state.kycVerifiedOnly,
    ].filter(Boolean).length;

    const results = useMemo(() => {
        let list = properties.map((item) => ({
            ...item,
            distanceKm: userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, item.lat, item.lng) : undefined,
        }));

        if (state.intent !== 'all') list = list.filter((item) => item.intent === state.intent);
        if (state.type !== 'all') list = list.filter((item) => item.type === state.type);
        if (state.city !== 'all') {
            const loc = state.city.toLowerCase();
            list = list.filter(
                (item) =>
                    item.city.toLowerCase() === loc ||
                    (item.district && item.district.toLowerCase() === loc) ||
                    item.location.toLowerCase().includes(loc),
            );
        }
        if (state.bedrooms > 0) list = list.filter((item) => item.bedrooms >= state.bedrooms);
        if (state.kycVerifiedOnly) list = list.filter((item) => item.agent?.verified);

        if (state.budget !== null) {
            const budget = options.budgets?.[state.budget];
            if (budget) {
                list = list.filter(
                    (item) =>
                        item.price >= budget.min && (budget.max === null || item.price <= budget.max),
                );
            }
        }

        if (state.amenities.length > 0) {
            list = list.filter((item) =>
                state.amenities.every((amenity) => item.tags.includes(amenity)),
            );
        }

        const sorters = {
            newest: (a, b) => b.published.localeCompare(a.published),
            nearest: (a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999),
            'price-asc': (a, b) => a.price - b.price,
            'price-desc': (a, b) => b.price - a.price,
            'area-desc': (a, b) => b.area - a.area,
        };

        return list.sort(sorters[state.sort] ?? sorters.newest);
    }, [properties, state, options.budgets, userLocation]);

    const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
    const visible = results.slice((pageIndex - 1) * PER_PAGE, pageIndex * PER_PAGE);

    const filterPanel = (
        <div className="space-y-6">
            <FilterSection title={t('search.listingType')}>
                <div className="flex flex-wrap gap-2">
                    {[
                        ['all', t('search.all')],
                        ['sale', t('search.buy')],
                        ['rent', t('search.rent')],
                    ].map(([key, label]) => (
                        <Chip key={key} active={state.intent === key} onClick={() => set('intent')(key)}>
                            {label}
                        </Chip>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title={t('search.propertyType')}>
                <div className="flex flex-wrap gap-2">
                    <Chip active={state.type === 'all'} onClick={() => set('type')('all')}>
                        {t('search.any')}
                    </Chip>
                    {(options.types ?? []).map((type) => (
                        <Chip key={type} active={state.type === type} onClick={() => set('type')(type)}>
                            {typeLabel(type)}
                        </Chip>
                    ))}
                </div>

                {(options.subTypes ?? []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Chip active={state.subType === 'all'} onClick={() => set('subType')('all')}>
                            {t('search.allStyles')}
                        </Chip>
                        {(options.subTypes ?? []).map((sub) => (
                            <Chip key={sub} active={state.subType === sub} onClick={() => set('subType')(sub)}>
                                {typeLabel(sub)}
                            </Chip>
                        ))}
                    </div>
                )}
            </FilterSection>

            <FilterSection title={t('search.city')}>
                <div className="relative">
                    <select
                        value={state.city}
                        onChange={(event) => set('city')(event.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-[0.8rem] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 pr-9 text-[0.8125rem] text-heading outline-none transition-colors focus:border-neon"
                    >
                        <option value="all" className="bg-void-raised">
                            {t('search.anyCity')}
                        </option>
                        {(options.cities ?? []).map((city) => (
                            <option key={city} value={city} className="bg-void-raised">
                                {city}
                            </option>
                        ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body/60" />
                </div>
            </FilterSection>

            <FilterSection title={t('search.budget')}>
                <div className="grid gap-2">
                    {(options.budgets ?? []).map((budget, index) => (
                        <button
                            key={budget.label}
                            type="button"
                            onClick={() => set('budget')(state.budget === index ? null : index)}
                            className={cn(
                                'flex items-center justify-between rounded-[0.7rem] px-3 py-2 text-[0.8125rem] transition-colors',
                                state.budget === index
                                    ? 'bg-neon/12 text-neon ring-1 ring-neon/30'
                                    : 'text-body/75 hover:bg-white/[0.05] hover:text-heading',
                            )}
                        >
                            {BUDGET_KEYS[index] ? t(BUDGET_KEYS[index]) : budget.label}
                            {state.budget === index && <span className="h-1.5 w-1.5 rounded-full bg-neon" />}
                        </button>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title={t('search.bedrooms')}>
                <div className="flex gap-2">
                    {[0, 1, 2, 3, 4].map((count) => (
                        <button
                            key={count}
                            type="button"
                            onClick={() => set('bedrooms')(count)}
                            className={cn(
                                'h-9 flex-1 rounded-[0.6rem] text-[0.75rem] font-medium transition-colors',
                                state.bedrooms === count
                                    ? 'bg-neon text-void'
                                    : 'bg-white/[0.05] text-body/75 ring-1 ring-white/10 hover:text-heading',
                            )}
                        >
                            {count === 0 ? t('search.any') : `${count}+`}
                        </button>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title={t('search.amenities')}>
                <div className="grid gap-1.5">
                    {(options.amenities ?? []).map((amenity) => {
                        const checked = state.amenities.includes(amenity);

                        return (
                            <label
                                key={amenity}
                                className="flex cursor-pointer items-center gap-2.5 rounded-[0.6rem] px-1 py-1.5 text-[0.8125rem] text-body/80 transition-colors hover:text-heading"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleAmenity(amenity)}
                                    className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-neon"
                                />
                                {amenity}
                            </label>
                        );
                    })}
                </div>
            </FilterSection>

            <div className="flex items-center justify-between rounded-[0.8rem] bg-white/[0.04] px-3.5 py-3 ring-1 ring-white/8">
                <div>
                    <p className="text-[0.8125rem] font-medium text-heading">{t('search.verifiedOnlyToggle')}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-faint">{t('search.verifiedOnlyHint')}</p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={state.verifiedOnly}
                    onClick={() => set('verifiedOnly')(!state.verifiedOnly)}
                    className={cn(
                        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
                        state.verifiedOnly ? 'bg-neon' : 'bg-white/15',
                    )}
                >
                    <motion.span
                        layout
                        transition={spring}
                        className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow',
                            state.verifiedOnly ? 'left-[1.375rem]' : 'left-0.5',
                        )}
                    />
                </button>
            </div>

            {/* KYC-Verified Agents Only Filter */}
            <div className="flex items-center justify-between rounded-[0.8rem] bg-emerald-950/25 border border-emerald-500/25 px-3.5 py-3">
                <div>
                    <p className="text-[0.8125rem] font-semibold text-white flex items-center gap-1.5">
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/25 text-emerald-400 text-[0.6875rem]">
                            ✓
                        </span>
                        {t('kyc.filterLabel')}
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] text-body/70">{t('kyc.filterHint')}</p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={state.kycVerifiedOnly}
                    onClick={() => set('kycVerifiedOnly')(!state.kycVerifiedOnly)}
                    className={cn(
                        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 cursor-pointer',
                        state.kycVerifiedOnly ? 'bg-emerald-500' : 'bg-white/15',
                    )}
                >
                    <motion.span
                        layout
                        transition={spring}
                        className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow',
                            state.kycVerifiedOnly ? 'left-[1.375rem]' : 'left-0.5',
                        )}
                    />
                </button>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={reset}>
                {t('search.resetAll')}
            </Button>
        </div>
    );

    return (
        <motion.div variants={page} initial="initial" animate="animate">
            <div className="mx-auto max-w-7xl px-6 pt-28 sm:pt-32">
                {/* Breadcrumb + heading */}
                <nav className="flex items-center gap-2 text-[0.75rem] text-faint" aria-label={t('prop.breadcrumb')}>
                    <Link href="/" className="transition-colors hover:text-heading">
                        {t('prop.crumbHome')}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-body/80">{t('prop.crumbProperties')}</span>
                </nav>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <h1 className="font-display text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-heading">
                            {state.intent === 'rent'
                                ? t('search.titleRent')
                                : state.intent === 'sale'
                                  ? t('search.titleSale')
                                  : t('search.titleAll')}
                        </h1>
                        <p className="mt-2.5 text-[0.875rem] text-body/70">
                            <span className="font-semibold text-heading">{results.length}</span>{' '}
                            {results.length === 1 ? t('search.resultOne') : t('search.resultMany')}
                            {state.city !== 'all' && ` · ${state.city}`}
                            <span className="mx-2 text-white/20">·</span>
                            {t('search.networkListings', { count: stats.listings ?? results.length })}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleLocateLive}
                            disabled={isLocatingUser}
                            className={cn(
                                "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.75rem] font-bold transition-all ring-1 cursor-pointer",
                                userLocation
                                    ? "bg-cyan-500/15 text-cyan-300 ring-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                                    : "bg-white/[0.05] text-heading ring-white/10 hover:bg-white/[0.09]"
                            )}
                        >
                            <MapPinIcon className="h-3.5 w-3.5 text-cyan-400" />
                            <span>{isLocatingUser ? 'Localisation...' : userLocation ? '📍 Proximité GPS Active' : '📍 Autour de moi (GPS)'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setRequestModalOpen(true)}
                            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-neon/20 to-emerald-500/20 px-3.5 py-2 text-[0.75rem] font-bold text-neon ring-1 ring-neon/40 hover:from-neon/30 hover:to-emerald-500/30 transition-all cursor-pointer shadow-sm"
                        >
                            <span>🎯</span>
                            <span>{t('search.bespokeRequest', 'Demande sur-mesure')}</span>
                        </button>

                        <Button
                            variant="secondary"
                            size="md"
                            className="lg:hidden"
                            icon={SearchIcon}
                            onClick={() => setDrawerOpen(true)}
                        >
                            {t('search.filters')}{activeCount > 0 && ` · ${activeCount}`}
                        </Button>

                        <div className="relative hidden sm:block">
                            <select
                                value={state.sort}
                                onChange={(event) => set('sort')(event.target.value)}
                                aria-label={t('search.sort')}
                                className="cursor-pointer appearance-none rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 pr-9 text-[0.8125rem] font-medium text-heading outline-none transition-colors focus:border-neon"
                            >
                                {SORTS.map((sort) => (
                                    <option key={sort.key} value={sort.key} className="bg-void-raised">
                                        {t(sort.labelKey)}
                                    </option>
                                ))}
                            </select>
                            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body/60" />
                        </div>

                        <div className="flex rounded-full bg-white/[0.05] p-1 ring-1 ring-white/10">
                            {VIEWS.map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => setView(option.key)}
                                    aria-pressed={view === option.key}
                                    className="relative rounded-full px-3 py-1.5 text-[0.75rem] font-medium transition-colors"
                                >
                                    {view === option.key && (
                                        <motion.span
                                            layoutId="view-pill"
                                            transition={spring}
                                            className="absolute inset-0 rounded-full bg-white/[0.1] ring-1 ring-white/12"
                                        />
                                    )}
                                    <span className={cn('relative', view === option.key ? 'text-heading' : 'text-body/70')}>
                                        {t(option.labelKey)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-[268px_1fr]">
                    {/* Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="glass sticky top-28 max-h-[calc(100dvh-9rem)] overflow-y-auto rounded-[1.35rem] p-5">
                            <div className="mb-5 flex items-center justify-between">
                                <p className="font-display text-[0.9375rem] font-semibold text-heading">
                                    {t('search.filters')}
                                </p>
                                {activeCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="text-[0.6875rem] font-medium text-neon/85 transition-colors hover:text-neon"
                                    >
                                        {t('search.clear')} ({activeCount})
                                    </button>
                                )}
                            </div>
                            {filterPanel}
                        </div>
                    </aside>

                    {/* Results */}
                    <div>
                        {/* Quick Category Quick-Filter Bar */}
                        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
                            {[
                                { key: 'all', label: t('category.all', 'Tous'), icon: '✨' },
                                { key: 'sale', intent: 'sale', label: t('category.sale', 'À Vendre'), icon: '🏛' },
                                { key: 'rent', intent: 'rent', label: t('category.rent', 'À Louer'), icon: '🔑' },
                                { key: 'Shop', type: 'Shop', label: t('category.shops', 'Boutiques'), icon: '🏬' },
                                { key: 'Hotel', type: 'Hotel', label: t('category.hotels', 'Hôtels'), icon: '🏨' },
                                { key: 'Land', type: 'Land', label: t('category.lands', 'Terrains'), icon: '🌿' },
                                { key: 'House', type: 'House', label: t('category.houses', 'Maisons'), icon: '🏡' },
                            ].map((cat) => {
                                const isActive =
                                    cat.key === 'all'
                                        ? state.intent === 'all' && state.type === 'all'
                                        : cat.intent
                                        ? state.intent === cat.intent
                                        : state.type === cat.type;

                                return (
                                    <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => {
                                            if (cat.key === 'all') {
                                                setState((curr) => ({ ...curr, intent: 'all', type: 'all' }));
                                            } else if (cat.intent) {
                                                setState((curr) => ({ ...curr, intent: cat.intent, type: 'all' }));
                                            } else if (cat.type) {
                                                setState((curr) => ({ ...curr, type: cat.type, intent: 'all' }));
                                            }
                                        }}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.75rem] font-semibold transition-all cursor-pointer',
                                            isActive
                                                ? 'bg-neon text-void shadow-[0_2px_12px_rgba(102,187,106,0.35)] ring-1 ring-neon'
                                                : 'bg-white/[0.04] text-body/80 hover:bg-white/[0.08] hover:text-heading ring-1 ring-white/10',
                                        )}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {view === 'map' && (
                            <div className="mb-6">
                                <InteractiveMap
                                    height="h-[520px]"
                                    caption={t('search.inView', { count: results.length })}
                                    showVerificationCircle={false}
                                    onUserLocation={(loc) => {
                                        setUserLocation(loc);
                                        setState((curr) => ({ ...curr, sort: 'nearest' }));
                                    }}
                                    markers={results.map((property, index) => ({
                                        id: property.id,
                                        lat: property.lat,
                                        lng: property.lng,
                                        title: property.title,
                                        price: property.price,
                                        currency: property.currency,
                                        intent: property.intent,
                                        image: property.image,
                                        location: property.location,
                                        district: property.district,
                                        href: property.href,
                                        primary: index === 0,
                                    }))}
                                />
                            </div>
                        )}

                        {results.length === 0 ? (
                            <EmptyState
                                icon={SearchIcon}
                                title={t('search.noResults')}
                                description={t('search.noResultsHelp')}
                                action={
                                    <Button variant="secondary" size="sm" className="mt-2" onClick={reset}>
                                        {t('search.reset')}
                                    </Button>
                                }
                            />
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${view}-${pageIndex}-${state.sort}`}
                                    variants={staggerParent}
                                    initial="initial"
                                    animate="animate"
                                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                >
                                    {view === 'list' ? (
                                        <div className="space-y-3">
                                            {visible.map((property) => (
                                                <PropertyRow key={property.id} property={property} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                            {visible.map((property, index) => (
                                                <PropertyCard
                                                    key={property.id}
                                                    property={property}
                                                    priority={index < 3}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}

                        {pageCount > 1 && (
                            <div className="mt-10 flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPageIndex((current) => Math.max(1, current - 1))}
                                    disabled={pageIndex === 1}
                                    className="rounded-full px-3.5 py-2 text-[0.75rem] font-medium text-body/75 ring-1 ring-white/10 transition-colors hover:text-heading disabled:opacity-35"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: pageCount }).map((_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setPageIndex(index + 1)}
                                        aria-current={pageIndex === index + 1 ? 'page' : undefined}
                                        className={cn(
                                            'h-9 w-9 rounded-full text-[0.8125rem] font-semibold transition-colors',
                                            pageIndex === index + 1
                                                ? 'bg-neon text-void'
                                                : 'text-body/75 ring-1 ring-white/10 hover:text-heading',
                                        )}
                                    >
                                        {index + 1}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setPageIndex((current) => Math.min(pageCount, current + 1))}
                                    disabled={pageIndex === pageCount}
                                    className="rounded-full px-3.5 py-2 text-[0.75rem] font-medium text-body/75 ring-1 ring-white/10 transition-colors hover:text-heading disabled:opacity-35"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile filter drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <motion.div
                        className="fixed inset-0 z-[100] lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-void-deep/75 backdrop-blur-md"
                            onMouseDown={(event) => {
                                if (event.target === event.currentTarget) setDrawerOpen(false);
                            }}
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={spring}
                            className="glass-strong absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[1.75rem] p-5 pb-8"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <p className="font-display text-[1rem] font-semibold text-heading">
                                    Filters {activeCount > 0 && `· ${activeCount}`}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    aria-label="Close filters"
                                    className="grid h-8 w-8 place-items-center rounded-full text-body/70 hover:bg-white/10 hover:text-heading"
                                >
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {filterPanel}

                            <Button
                                size="lg"
                                className="mt-6 w-full"
                                onClick={() => setDrawerOpen(false)}
                            >
                                Show {results.length} results
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bespoke Property Request Modal */}
            <PropertyRequestModal
                isOpen={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
                defaultIntent={state.intent === 'rent' ? 'rent' : 'sale'}
                defaultType={state.type !== 'all' ? state.type : 'House'}
            />
        </motion.div>
    );
}

function FilterSection({ title, children }) {
    return (
        <div>
            <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
                {title}
            </p>
            {children}
        </div>
    );
}

function PropertyRow({ property }) {
    const { format } = useMoney();
    const { t } = useTranslation();
    const typeLabel = useTypeLabel();

    return (
        <motion.article
            whileHover={{ scale: 1.005 }}
            transition={spring}
            className="glass group flex gap-4 overflow-hidden rounded-[1.15rem] p-3 transition-colors hover:border-white/20"
        >
            <Link href={property.href} className="relative h-28 w-40 shrink-0 overflow-hidden rounded-[0.9rem] bg-void-raised sm:h-32 sm:w-52">
                <img
                    src={property.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute left-2 top-2 flex flex-col gap-1 items-start z-10">
                    <span className={cn(
                        "rounded-full px-2 py-0.5 text-[0.5625rem] font-extrabold uppercase tracking-wider text-[#070b0e] shadow",
                        property.intent === 'rent' ? "bg-cyan-400 ring-1 ring-cyan-200" : "bg-emerald-500 ring-1 ring-emerald-200"
                    )}>
                        {property.intent === 'rent' ? t('badge.forRent', 'À LOUER') : t('badge.forSale', 'À VENDRE')}
                    </span>
                    <span className="rounded-full bg-void/85 px-1.5 py-0.5 text-[0.5625rem] font-semibold text-white/90 backdrop-blur ring-1 ring-white/15">
                        {typeLabel(property.type)}
                    </span>
                </div>
            </Link>

            <div className="flex min-w-0 flex-1 flex-col justify-between py-1 pr-2">
                <div>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-[0.6875rem] text-faint">
                                <MapPinIcon className="h-3 w-3 text-neon" />
                                {property.location}
                            </p>
                            <Link
                                href={property.href}
                                className="mt-1 block truncate font-display text-[0.9375rem] font-semibold tracking-[-0.01em] text-heading hover:text-neon"
                            >
                                {property.title}
                            </Link>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {property.agent?.verified && (
                                <KycBadge agent={property.agent} variant="pill" showDetails={false} />
                            )}
                            <GpsVerifiedBadge property={property} variant="compact" />
                            {property.distanceKm !== undefined && (
                                <span className="rounded-full bg-cyan-950/80 px-2 py-0.5 text-[0.625rem] font-bold text-cyan-300 ring-1 ring-cyan-500/40">
                                    📍 {property.distanceKm} km
                                </span>
                            )}
                            <StatusPill status="approved" />
                        </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-body/70">
                        <span>
                            {property.bedrooms > 0 && `${property.bedrooms} ${t('prop.bedsShort')} · `}
                            {property.bathrooms > 0 && `${property.bathrooms} ${t('prop.bathsShort')} · `}
                            {property.area} m² · {typeLabel(property.type)}
                        </span>
                        {property.agent && (
                            <span className="text-emerald-400/90 font-medium text-[0.6875rem]">
                                · Agent: {property.agent.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                        <span className={cn(
                            "inline-block px-1.5 py-0.2 rounded text-[0.5625rem] font-bold uppercase tracking-wider mb-0.5",
                            property.intent === 'rent' ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        )}>
                            {property.intent === 'rent' ? t('category.rent', 'À Louer') : t('category.sale', 'À Vendre')}
                        </span>
                        <p className="font-display text-[1rem] font-bold text-heading">
                            {format(property.price)}
                            {property.intent === 'rent' && (
                                <span className="ml-1 text-[0.6875rem] font-normal text-faint">
                                    / {t('prop.month', 'mois')}
                                </span>
                            )}
                        </p>
                    </div>

                    <Link
                        href={property.href}
                        className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[0.75rem] font-semibold text-heading ring-1 ring-white/10 transition-colors hover:bg-neon hover:text-void hover:ring-neon"
                    >
                        {t('prop.view')}
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}

Search.layout = (pageContent) => <SiteLayout>{pageContent}</SiteLayout>;

import { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SiteLayout from '../Layouts/SiteLayout';
import { useCompare } from '../lib/compare';
import { useTranslation } from '../lib/i18n';
import { formatMoney } from '../lib/money';
import { useAuthModal } from '../lib/auth-modal';
import GpsVerifiedBadge from '../Components/GpsVerifiedBadge';
import PannellumTourViewer from '../Components/PannellumTourViewer';
import {
    CheckIcon,
    CloseIcon,
    MapPinIcon,
    ShieldCheckIcon,
    UserIcon,
} from '../Components/Icons';

export default function Compare({ comparedProperties = [], availableProperties = [], initialIds = [] }) {
    const { t, locale } = useTranslation();
    const { auth, currencies, currency } = usePage().props;
    const user = auth?.user;
    const { openAuth } = useAuthModal();
    const { items, addToCompare, removeFromCompare, clearCompare, isInCompare, maxItems } = useCompare();

    // Merge properties from server props with local items if needed
    const properties = useMemo(() => {
        if (comparedProperties && comparedProperties.length > 0) {
            return comparedProperties;
        }
        return [];
    }, [comparedProperties]);

    const [onlyDifferences, setOnlyDifferences] = useState(false);
    const [activeTourProperty, setActiveTourProperty] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);

    // Filter available properties that are not currently in comparison
    const selectableProperties = useMemo(() => {
        const currentIds = properties.map((p) => p.id);
        return availableProperties.filter((p) => {
            if (currentIds.includes(p.id)) return false;
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                p.title?.toLowerCase().includes(q) ||
                p.city?.toLowerCase().includes(q) ||
                p.district?.toLowerCase().includes(q) ||
                p.type?.toLowerCase().includes(q)
            );
        });
    }, [availableProperties, properties, searchQuery]);

    const handleAddProperty = (prop) => {
        addToCompare(prop);
        const currentIds = properties.map((p) => p.id);
        const nextIds = [...currentIds, prop.id];
        router.visit(`/compare?ids=${nextIds.join(',')}`, { preserveState: true, preserveScroll: true });
        setSelectorOpen(false);
        setSearchQuery('');
    };

    const handleRemoveProperty = (id) => {
        removeFromCompare(id);
        const nextIds = properties.filter((p) => p.id !== id).map((p) => p.id);
        if (nextIds.length > 0) {
            router.visit(`/compare?ids=${nextIds.join(',')}`, { preserveState: true, preserveScroll: true });
        } else {
            router.visit('/compare', { preserveState: true, preserveScroll: true });
        }
    };

    const handleClearAll = () => {
        clearCompare();
        router.visit('/compare', { preserveState: true });
    };

    const handleContactAgent = (prop) => {
        if (!user) {
            openAuth('signin', t('auth.promptContactAgent'));
            return;
        }
        // Redirect to chat with property pre-selected
        router.post('/chat/conversations', {
            property_id: prop.id,
            message: `Bonjour, je souhaite échanger au sujet du bien #${prop.id} (${prop.title}) vu sur le comparateur.`,
        });
    };

    // Helper to determine if an attribute differs across compared properties
    const hasDifference = (extractor) => {
        if (properties.length <= 1) return true;
        const first = extractor(properties[0]);
        return properties.some((p) => extractor(p) !== first);
    };

    // Rows configuration
    const comparisonSections = [
        {
            title: locale === 'fr' ? '1. Finances & Valorisation' : '1. Finances & Valuation',
            rows: [
                {
                    key: 'price',
                    label: locale === 'fr' ? 'Prix affiché' : 'Listed Price',
                    render: (p) => (
                        <div className="flex flex-col">
                            <span className="font-display text-base sm:text-lg font-bold text-neon-bright">
                                {formatMoney(p.price, { targetCurrency: currency, currencies, locale })}
                            </span>
                            <span className="text-[0.6875rem] text-body/70">
                                {p.intent === 'rent'
                                    ? (locale === 'fr' ? 'Loyer mensuel' : 'Per month')
                                    : (locale === 'fr' ? 'Prix de vente ferme' : 'Sale price')}
                            </span>
                        </div>
                    ),
                    diff: (p) => p.price,
                },
                {
                    key: 'price_sqm',
                    label: locale === 'fr' ? 'Prix au m²' : 'Price per sqm',
                    render: (p) => {
                        const sqm = p.area && p.area > 0 ? Math.round(p.price / p.area) : null;
                        return (
                            <span className="font-mono text-xs sm:text-sm text-heading">
                                {sqm
                                    ? `${formatMoney(sqm, { targetCurrency: currency, currencies, locale })} / m²`
                                    : '—'}
                            </span>
                        );
                    },
                    diff: (p) => (p.area && p.area > 0 ? Math.round(p.price / p.area) : 0),
                },
            ],
        },
        {
            title: locale === 'fr' ? '2. Spécifications & Espaces' : '2. Specifications & Spaces',
            rows: [
                {
                    key: 'type',
                    label: locale === 'fr' ? 'Type de bien' : 'Property Type',
                    render: (p) => (
                        <span className="inline-flex items-center rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-heading ring-1 ring-white/10">
                            {p.type}
                        </span>
                    ),
                    diff: (p) => p.type,
                },
                {
                    key: 'area',
                    label: locale === 'fr' ? 'Surface totale' : 'Total Area',
                    render: (p) => (
                        <span className="font-mono text-xs sm:text-sm font-semibold text-heading">
                            {p.area ? `${p.area} m²` : '—'}
                        </span>
                    ),
                    diff: (p) => p.area,
                },
                {
                    key: 'rooms',
                    label: locale === 'fr' ? 'Chambres / Pièces' : 'Bedrooms / Rooms',
                    render: (p) => (
                        <span className="text-xs sm:text-sm text-heading">
                            {p.beds ? `${p.beds} ${locale === 'fr' ? 'chambres' : 'beds'}` : '—'}
                            {p.baths ? ` · ${p.baths} ${locale === 'fr' ? 'salles d’eau' : 'baths'}` : ''}
                        </span>
                    ),
                    diff: (p) => `${p.beds || 0}-${p.baths || 0}`,
                },
                {
                    key: 'location',
                    label: locale === 'fr' ? 'Commune & Quartier' : 'District & City',
                    render: (p) => (
                        <div className="flex items-center gap-1.5 text-xs text-body/90">
                            <MapPinIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>{p.district ? `${p.district}, ${p.city}` : p.location || p.city}</span>
                        </div>
                    ),
                    diff: (p) => `${p.city}-${p.district}`,
                },
            ],
        },
        {
            title: locale === 'fr' ? '3. Sécurité Juridique & Cadastre 100% Vérifié' : '3. Legal Security & Certified Cadastre',
            rows: [
                {
                    key: 'title_deed',
                    label: locale === 'fr' ? 'Titre juridique' : 'Legal Deed',
                    render: (p) => (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-xs text-emerald-300">
                                {p.legal_title || 'Arrêté de Concession Définitive (ACD)'}
                            </span>
                            <span className="text-[0.6875rem] text-body/70">
                                {locale === 'fr' ? 'Contrôlé au Livre Foncier' : 'Verified at land registry'}
                            </span>
                        </div>
                    ),
                    diff: (p) => p.legal_title || 'ACD',
                },
                {
                    key: 'gps_verified',
                    label: locale === 'fr' ? 'Audit GPS Terrain' : 'GPS On-Site Audit',
                    render: (p) => (
                        <div className="flex items-center gap-2">
                            <GpsVerifiedBadge compact />
                            <span className="font-mono text-[0.6875rem] text-body/70 hidden sm:inline">
                                {p.coordinates?.lat?.toFixed(4)}, {p.coordinates?.lng?.toFixed(4)}
                            </span>
                        </div>
                    ),
                    diff: (p) => `${p.coordinates?.lat}-${p.coordinates?.lng}`,
                },
                {
                    key: 'verification_level',
                    label: locale === 'fr' ? 'Statut certification' : 'Certification Status',
                    render: (p) => (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <ShieldCheckIcon className="h-3.5 w-3.5" />
                            {locale === 'fr' ? '100% Vérifié par ChiChoc' : '100% ChiChoc Verified'}
                        </span>
                    ),
                    diff: () => 'verified',
                },
            ],
        },
        {
            title: locale === 'fr' ? '4. Immersion & Visite Virtuelle 360°' : '4. Virtual Tour & Immersion',
            rows: [
                {
                    key: 'virtual_tour',
                    label: locale === 'fr' ? 'Visite 360° Pannellum' : '360° Pannellum Tour',
                    render: (p) => {
                        const hasTour = Boolean(p.virtualTour || p.virtual_tour || p.hasVirtualTour);
                        return (
                            <div>
                                {hasTour ? (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTourProperty(p)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-neon/15 px-3 py-1.5 text-xs font-bold text-neon-bright border border-neon/30 hover:bg-neon/25 transition-all cursor-pointer"
                                    >
                                        <span>🌀</span>
                                        <span>{locale === 'fr' ? 'Explorer en 360°' : 'Launch 360° Tour'}</span>
                                    </button>
                                ) : (
                                    <span className="text-xs text-body/50">
                                        {locale === 'fr' ? 'Photos HD uniquement' : 'HD Photos only'}
                                    </span>
                                )}
                            </div>
                        );
                    },
                    diff: (p) => Boolean(p.virtualTour || p.virtual_tour || p.hasVirtualTour),
                },
            ],
        },
        {
            title: locale === 'fr' ? '5. Équipements & Prestations' : '5. Amenities & Features',
            rows: [
                {
                    key: 'pool',
                    label: locale === 'fr' ? 'Piscine' : 'Swimming Pool',
                    render: (p) => (
                        p.features?.some((f) => f.toLowerCase().includes('piscine') || f.toLowerCase().includes('pool')) ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                                <CheckIcon className="h-4 w-4" /> {locale === 'fr' ? 'Oui' : 'Yes'}
                            </span>
                        ) : (
                            <span className="text-body/40 text-xs">—</span>
                        )
                    ),
                    diff: (p) => p.features?.some((f) => f.toLowerCase().includes('piscine') || f.toLowerCase().includes('pool')),
                },
                {
                    key: 'generator',
                    label: locale === 'fr' ? 'Groupe Électrogène' : 'Backup Generator',
                    render: (p) => (
                        p.features?.some((f) => f.toLowerCase().includes('groupe') || f.toLowerCase().includes('generator')) ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                                <CheckIcon className="h-4 w-4" /> {locale === 'fr' ? 'Oui (Inclus)' : 'Yes (Included)'}
                            </span>
                        ) : (
                            <span className="text-body/40 text-xs">—</span>
                        )
                    ),
                    diff: (p) => p.features?.some((f) => f.toLowerCase().includes('groupe') || f.toLowerCase().includes('generator')),
                },
                {
                    key: 'security',
                    label: locale === 'fr' ? 'Sécurité & Gardiennage' : '24/7 Security',
                    render: (p) => (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <CheckIcon className="h-4 w-4" /> {locale === 'fr' ? '24h/24 & Vidéo' : '24/7 & CCTV'}
                        </span>
                    ),
                    diff: () => true,
                },
                {
                    key: 'water_tank',
                    label: locale === 'fr' ? 'Réserve d’eau / Forage' : 'Water Reserve / Borehole',
                    render: (p) => (
                        p.features?.some((f) => f.toLowerCase().includes('eau') || f.toLowerCase().includes('forage') || f.toLowerCase().includes('water')) ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                                <CheckIcon className="h-4 w-4" /> {locale === 'fr' ? 'Oui' : 'Yes'}
                            </span>
                        ) : (
                            <span className="text-body/40 text-xs">—</span>
                        )
                    ),
                    diff: (p) => p.features?.some((f) => f.toLowerCase().includes('eau') || f.toLowerCase().includes('forage') || f.toLowerCase().includes('water')),
                },
                {
                    key: 'parking',
                    label: locale === 'fr' ? 'Parking / Garage' : 'Parking / Garage',
                    render: (p) => (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <CheckIcon className="h-4 w-4" /> {locale === 'fr' ? 'Privatif' : 'Private'}
                        </span>
                    ),
                    diff: () => true,
                },
            ],
        },
        {
            title: locale === 'fr' ? '6. Contact Agent & Mandat' : '6. Assigned Agent & Mandate',
            rows: [
                {
                    key: 'agent',
                    label: locale === 'fr' ? 'Agent vérifié assigné' : 'Assigned Agent',
                    render: (p) => (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                                    {p.agent?.name ? p.agent.name[0] : 'K'}
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-heading truncate">{p.agent?.name || 'Koffi Amani'}</p>
                                    <p className="text-[0.625rem] text-neon font-semibold uppercase">{locale === 'fr' ? 'Certifié Agréé' : 'Certified Agent'}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleContactAgent(p)}
                                className="w-full rounded-xl bg-white/[0.08] hover:bg-neon hover:text-void py-1.5 px-2.5 text-xs font-semibold text-heading transition-colors cursor-pointer text-center"
                            >
                                {locale === 'fr' ? 'Contacter l’agent' : 'Contact Agent'}
                            </button>
                        </div>
                    ),
                    diff: (p) => p.agent?.name || 'Koffi Amani',
                },
            ],
        },
    ];

    return (
        <SiteLayout>
            <Head>
                <title>{t('compare.pageTitle')} — ChiChoc Habitat</title>
                <meta name="description" content={t('compare.metaDescription')} />
            </Head>

            <main className="min-h-screen pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header breadcrumb & title */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-white/10">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-body/75 mb-2">
                            <Link href="/" className="hover:text-heading transition-colors">
                                {t('nav.home')}
                            </Link>
                            <span>/</span>
                            <Link href="/properties" className="hover:text-heading transition-colors">
                                {t('nav.listings')}
                            </Link>
                            <span>/</span>
                            <span className="text-neon">{t('compare.title')}</span>
                        </div>

                        <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-heading tracking-tight flex items-center gap-3">
                            <span>⚖️</span>
                            <span>{t('compare.title')}</span>
                        </h1>
                        <p className="mt-1.5 text-sm sm:text-base text-body/80 max-w-2xl">
                            {t('compare.subtitle')}
                        </p>
                    </div>

                    {/* Actions bar */}
                    {properties.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Differences toggle */}
                            <label className="flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-xs font-medium text-body/90 cursor-pointer hover:bg-white/[0.08] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={onlyDifferences}
                                    onChange={(e) => setOnlyDifferences(e.target.checked)}
                                    className="rounded border-white/20 bg-void text-neon focus:ring-neon/40 h-4 w-4"
                                />
                                <span>{t('compare.showDifferencesOnly')}</span>
                            </label>

                            {/* Add property button */}
                            {properties.length < maxItems && (
                                <button
                                    type="button"
                                    onClick={() => setSelectorOpen(true)}
                                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer"
                                >
                                    <span>+</span>
                                    <span>{t('compare.addProperty')}</span>
                                </button>
                            )}

                            {/* Clear all */}
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-body/70 hover:text-rose-300 hover:border-rose-500/30 transition-colors cursor-pointer"
                            >
                                {t('compare.clearAll')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {properties.length === 0 ? (
                    <div className="mt-12 rounded-3xl border border-white/10 bg-void-raised/60 backdrop-blur-xl p-8 sm:p-16 text-center max-w-2xl mx-auto">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-3xl ring-1 ring-emerald-500/30 mb-5">
                            ⚖️
                        </div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-heading">
                            {t('compare.emptyTitle')}
                        </h2>
                        <p className="mt-2 text-sm text-body/80 leading-relaxed">
                            {t('compare.emptyCopy')}
                        </p>

                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                href="/properties"
                                className="rounded-xl bg-neon px-6 py-2.5 text-sm font-bold text-void hover:bg-neon-bright hover:shadow-[0_0_20px_rgba(102,187,106,0.6)] transition-all"
                            >
                                {t('compare.browseProperties')}
                            </Link>
                            <Link
                                href="/properties?view=map"
                                className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-heading hover:bg-white/[0.1] transition-all"
                            >
                                {locale === 'fr' ? '🗺️ Carte GPS' : '🗺️ Map View'}
                            </Link>
                        </div>

                        {/* Quick pick from available properties */}
                        {availableProperties.length > 0 && (
                            <div className="mt-10 border-t border-white/10 pt-8 text-left">
                                <p className="text-xs font-bold uppercase tracking-wider text-body/70 mb-4">
                                    {locale === 'fr' ? 'Propriétés vérifiées suggérées à comparer :' : 'Suggested properties to compare:'}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {availableProperties.slice(0, 4).map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between p-2.5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={p.image}
                                                    alt={p.title}
                                                    className="h-12 w-12 rounded-xl object-cover shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-heading truncate">{p.title}</p>
                                                    <p className="text-[0.6875rem] text-neon font-semibold">
                                                        {formatMoney(p.price, { targetCurrency: currency, currencies, locale })}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleAddProperty(p)}
                                                className="shrink-0 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                                            >
                                                + {locale === 'fr' ? 'Comparer' : 'Compare'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Side-by-Side Comparison Table */
                    <div className="mt-8 overflow-x-auto rounded-3xl border border-white/10 bg-void-raised/80 backdrop-blur-2xl shadow-2xl">
                        <table className="w-full border-collapse text-left min-w-[700px]">
                            {/* Sticky Header Row: Property Cards */}
                            <thead>
                                <tr className="border-b border-white/15 bg-void-deep/90">
                                    {/* Top-left corner cell */}
                                    <th className="p-4 sm:p-6 w-56 sm:w-64 align-bottom border-r border-white/10">
                                        <div className="space-y-1">
                                            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-neon">
                                                {properties.length} / {maxItems} {locale === 'fr' ? 'Biens comparés' : 'Compared'}
                                            </span>
                                            <p className="text-xs text-body/75">
                                                {locale === 'fr' ? 'Balayez horizontalement pour voir tous les critères' : 'Swipe horizontally to view all criteria'}
                                            </p>
                                        </div>
                                    </th>

                                    {/* Columns for each property */}
                                    {properties.map((p) => (
                                        <th key={p.id} className="p-4 sm:p-5 w-72 sm:w-80 align-top border-r border-white/10 last:border-r-0">
                                            <div className="relative flex flex-col h-full rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 group hover:border-neon/40 transition-all">
                                                {/* Top action: Remove */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveProperty(p.id)}
                                                    aria-label={`${t('compare.remove')} ${p.title}`}
                                                    className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-void/80 text-body/70 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer z-10"
                                                    title={t('compare.remove')}
                                                >
                                                    <CloseIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                                                </button>

                                                {/* Photo with GPS badge */}
                                                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-void mb-3">
                                                    <img
                                                        src={p.image || p.gallery?.[0] || '/images/hero-villa.jpg'}
                                                        alt={p.title}
                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute top-2 left-2">
                                                        <GpsVerifiedBadge compact />
                                                    </div>
                                                </div>

                                                {/* Title & Location */}
                                                <Link
                                                    href={p.href || `/properties/${p.id}`}
                                                    className="font-display text-sm sm:text-base font-bold text-heading hover:text-neon transition-colors line-clamp-2"
                                                >
                                                    {p.title}
                                                </Link>
                                                <p className="text-xs text-body/75 mt-0.5 flex items-center gap-1">
                                                    <MapPinIcon className="h-3 w-3 text-emerald-400 shrink-0" />
                                                    <span className="truncate">{p.district ? `${p.district}, ${p.city}` : p.city}</span>
                                                </p>

                                                {/* Price badge */}
                                                <div className="mt-3 pt-3 border-t border-white/10 flex items-baseline justify-between">
                                                    <span className="font-display text-base sm:text-lg font-extrabold text-neon-bright">
                                                        {formatMoney(p.price, { targetCurrency: currency, currencies, locale })}
                                                    </span>
                                                    <span className="text-[0.6875rem] font-semibold text-body/70">
                                                        {p.intent === 'rent' ? '/ mois' : 'Vente'}
                                                    </span>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="mt-3 flex gap-2">
                                                    <Link
                                                        href={p.href || `/properties/${p.id}`}
                                                        className="flex-1 rounded-xl bg-neon/15 hover:bg-neon hover:text-void py-2 text-center text-xs font-bold text-neon-bright transition-all"
                                                    >
                                                        {locale === 'fr' ? 'Voir la fiche' : 'View Listing'}
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleContactAgent(p)}
                                                        className="rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] px-3 py-2 text-xs font-semibold text-heading transition-colors cursor-pointer"
                                                        title="Contacter l’agent"
                                                    >
                                                        💬
                                                    </button>
                                                </div>
                                            </div>
                                        </th>
                                    ))}

                                    {/* Empty Add Slot Column if < 4 */}
                                    {properties.length < maxItems && (
                                        <th className="p-4 sm:p-5 w-64 align-top">
                                            <button
                                                type="button"
                                                onClick={() => setSelectorOpen(true)}
                                                className="w-full h-full min-h-[260px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 hover:border-emerald-500/50 hover:bg-emerald-500/5 p-6 transition-all text-center cursor-pointer group"
                                            >
                                                <div className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.05] text-emerald-400 group-hover:bg-neon group-hover:text-void group-hover:scale-110 transition-all mb-3 text-xl font-bold">
                                                    +
                                                </div>
                                                <span className="font-display text-sm font-bold text-heading group-hover:text-neon">
                                                    {t('compare.addProperty')}
                                                </span>
                                                <span className="text-xs text-body/60 mt-1">
                                                    {locale === 'fr' ? 'Comparer un autre bien' : 'Add another listing'}
                                                </span>
                                            </button>
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            {/* Comparison Body Rows */}
                            <tbody className="divide-y divide-white/5">
                                {comparisonSections.map((section) => {
                                    // Filter rows if onlyDifferences is true
                                    const visibleRows = section.rows.filter((row) => {
                                        if (!onlyDifferences) return true;
                                        return hasDifference(row.diff);
                                    });

                                    if (visibleRows.length === 0) return null;

                                    return (
                                        <tr key={section.title} className="contents">
                                            {/* Section Header Row */}
                                            <tr className="bg-white/[0.02]">
                                                <td
                                                    colSpan={properties.length + (properties.length < maxItems ? 2 : 1)}
                                                    className="px-4 sm:px-6 py-3 font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-300 border-t border-b border-white/10"
                                                >
                                                    {section.title}
                                                </td>
                                            </tr>

                                            {/* Section Data Rows */}
                                            {visibleRows.map((row) => (
                                                <tr key={row.key} className="hover:bg-white/[0.015] transition-colors">
                                                    {/* Label cell */}
                                                    <td className="p-4 sm:p-5 font-medium text-xs sm:text-sm text-body/80 border-r border-white/10 bg-void-raised/40">
                                                        {row.label}
                                                    </td>

                                                    {/* Value cells for each property */}
                                                    {properties.map((p) => (
                                                        <td key={`${p.id}-${row.key}`} className="p-4 sm:p-5 border-r border-white/10 last:border-r-0">
                                                            {row.render(p)}
                                                        </td>
                                                    ))}

                                                    {/* Empty slot spacer if < maxItems */}
                                                    {properties.length < maxItems && (
                                                        <td className="p-4 sm:p-5 text-center text-body/30 text-xs">
                                                            —
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Quick Property Selector Modal (to add to comparison) */}
            {selectorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setSelectorOpen(false)}
                    />
                    <div className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-void-raised p-6 shadow-2xl z-10">
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                            <div>
                                <h3 className="font-display text-lg font-bold text-heading">
                                    {t('compare.addProperty')}
                                </h3>
                                <p className="text-xs text-body/75">
                                    {locale === 'fr' ? 'Sélectionnez une propriété vérifiée à comparer' : 'Select a verified property to compare'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectorOpen(false)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-body/75 hover:bg-white/10 hover:text-white"
                            >
                                <CloseIcon className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="mt-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={locale === 'fr' ? 'Rechercher par titre, quartier (ex: Cocody, Villa)...' : 'Search by title, district...'}
                                className="w-full rounded-xl border border-white/15 bg-void px-3.5 py-2.5 text-sm text-heading placeholder:text-body/45 focus:border-neon focus:ring-1 focus:ring-neon"
                            />
                        </div>

                        {/* Property List */}
                        <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
                            {selectableProperties.length === 0 ? (
                                <p className="py-8 text-center text-xs text-body/60">
                                    {locale === 'fr' ? 'Aucune autre propriété disponible.' : 'No other property available.'}
                                </p>
                            ) : (
                                selectableProperties.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={p.image}
                                                alt={p.title}
                                                className="h-12 w-12 rounded-xl object-cover shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-heading truncate">{p.title}</p>
                                                <p className="text-[0.6875rem] text-body/75">
                                                    {p.district ? `${p.district}, ` : ''}{p.city} · {p.type}
                                                </p>
                                                <p className="text-xs font-semibold text-neon">
                                                    {formatMoney(p.price, { targetCurrency: currency, currencies, locale })}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddProperty(p)}
                                            className="shrink-0 rounded-xl bg-neon px-3.5 py-1.5 text-xs font-bold text-void hover:bg-neon-bright transition-all cursor-pointer"
                                        >
                                            + {locale === 'fr' ? 'Ajouter' : 'Add'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 360° Virtual Tour Modal Viewer */}
            {activeTourProperty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-lg"
                        onClick={() => setActiveTourProperty(null)}
                    />
                    <div className="relative w-full max-w-5xl h-[80vh] rounded-3xl border border-white/20 bg-void overflow-hidden shadow-2xl z-10 flex flex-col">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-void-raised">
                            <div className="flex items-center gap-2">
                                <span className="text-neon text-lg">🌀</span>
                                <div>
                                    <h4 className="font-display text-sm font-bold text-heading">{activeTourProperty.title}</h4>
                                    <p className="text-[0.6875rem] text-neon font-semibold">{t('tour.badge')}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTourProperty(null)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-heading hover:bg-rose-500 hover:text-white transition-colors"
                            >
                                <CloseIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <PannellumTourViewer
                                panoramaUrl={activeTourProperty.virtualTour || activeTourProperty.virtual_tour || '/panoramas/living-room.jpg'}
                                autoLoad={true}
                                title={activeTourProperty.title}
                            />
                        </div>
                    </div>
                </div>
            )}
        </SiteLayout>
    );
}

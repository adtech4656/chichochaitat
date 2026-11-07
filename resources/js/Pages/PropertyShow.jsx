import { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import SiteLayout from '../Layouts/SiteLayout';
import InteractiveMap from '../Components/InteractiveMap';
import VirtualTourViewer from '../Components/VirtualTourViewer';
import AgentChatDrawer from '../Components/AgentChatDrawer';
import PropertyCard from '../Components/PropertyCard';
import OfferModal from '../Components/OfferModal';
import AppointmentModal from '../Components/AppointmentModal';
import { Avatar, Button, Divider, SectionHeading, VerifiedBadge } from '../Components/ui';
import KycBadge from '../Components/KycBadge';
import GpsVerifiedBadge from '../Components/GpsVerifiedBadge';
import VerifiedAgentProfile from '../Components/VerifiedAgentProfile';
import { useAuthModal } from '../lib/auth-modal';
import { useCompare } from '../lib/compare';
import {
    ArrowUpRightIcon,
    BellIcon,
    CameraIcon,
    CheckIcon,
    HeartIcon,
    MapPinIcon,
    ShieldCheckIcon,
    UserIcon,
} from '../Components/Icons';
import { page, spring, staggerParent } from '../lib/motion';
import { cn } from '../lib/utils';
import { useMoney } from '../lib/money';
import { useTranslation, useTypeLabel } from '../lib/i18n';
import { getStoredUser } from '../lib/auth-storage';

const VERIFICATION_ROWS = [
    { key: 'agent', icon: ShieldCheckIcon },
    { key: 'location', icon: MapPinIcon },
    { key: 'photos', icon: CameraIcon },
    { key: 'video', icon: CameraIcon },
    { key: 'documents', icon: ShieldCheckIcon },
];

export default function PropertyShow({ property, similar = [] }) {
    const { format } = useMoney();
    const { t, locale } = useTranslation();
    const { openAuth } = useAuthModal();
    const { auth } = usePage().props;
    const [currentUser, setCurrentUser] = useState(() => getStoredUser(auth?.user));

    useEffect(() => {
        const handler = (e) => setCurrentUser(e.detail);
        window.addEventListener('chichoc:auth-change', handler);
        return () => window.removeEventListener('chichoc:auth-change', handler);
    }, []);

    const user = currentUser;
    const { isInCompare, toggleCompare } = useCompare();

    const typeLabel = useTypeLabel();
    const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
    const [activeImage, setActiveImage] = useState(0);
    const [saved, setSaved] = useState(Boolean(property.saved));
    const [priceDropActive, setPriceDropActive] = useState(Boolean(property.price_drop_subscribed));
    const [offerOpen, setOfferOpen] = useState(false);
    const [appointmentOpen, setAppointmentOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    const inCompare = isInCompare(property.id);

    useEffect(() => {
        setSaved(Boolean(property.saved));
    }, [property.saved]);

    useEffect(() => {
        setPriceDropActive(Boolean(property.price_drop_subscribed));
    }, [property.price_drop_subscribed]);

    const toggleSave = () => {
        if (!user) {
            openAuth('signin', t('auth.promptSave'));
            return;
        }
        setSaved((current) => !current);
        router.post(`/properties/${property.id}/save`, {}, { preserveScroll: true, preserveState: true });
    };

    const handleCompare = () => {
        if (!user) {
            openAuth('signin', t('auth.promptCompare'));
            return;
        }
        toggleCompare(property);
    };

    const togglePriceDrop = () => {
        if (!user) {
            openAuth('signin', t('auth.promptDefault'));
            return;
        }
        const next = !priceDropActive;
        setPriceDropActive(next);
        router.post(
            `/properties/${property.id}/price-drop-subscribe`,
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleOpenOffer = () => {
        if (!user) {
            openAuth('signin', t('auth.promptOffer'));
            return;
        }
        setOfferOpen(true);
    };

    const handleOpenAppointment = () => {
        if (!user) {
            openAuth('signin', t('auth.promptAppointment'));
            return;
        }
        setAppointmentOpen(true);
    };

    const [initialChatMessage, setInitialChatMessage] = useState('');

    const messageAgent = (customMsg = null) => {
        if (!user) {
            openAuth('signin', t('auth.promptChat'));
            return;
        }
        const defaultMsg = locale === 'fr'
            ? `Bonjour, je suis très intéressé(e) par ce bien "${property.title}". Pouvez-vous me transmettre les modalités et organiser la visite officielle ?`
            : `Hello, I am very interested in this property "${property.title}". Could you please provide details and schedule the official visit?`;

        setInitialChatMessage(typeof customMsg === 'string' && customMsg.trim() ? customMsg : defaultMsg);
        setChatOpen(true);
    };

    const gallery = property.gallery?.length > 0 ? property.gallery : [property.image];

    return (
        <motion.div variants={page} initial="initial" animate="animate" className="pb-28 lg:pb-0">
            <div className="mx-auto max-w-7xl px-6 pt-28 sm:pt-32">
                <nav className="flex items-center gap-2 text-[0.75rem] text-faint" aria-label={t('prop.breadcrumb')}>
                    <Link href="/" className="transition-colors hover:text-heading">
                        {t('prop.crumbHome')}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <Link href="/properties" className="transition-colors hover:text-heading">
                        {t('prop.crumbProperties')}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="truncate text-body/80">{property.title}</span>
                </nav>

                {/* Gallery */}
                <div className="mt-5 grid gap-3 lg:grid-cols-[1.65fr_1fr]">
                    <div className="relative overflow-hidden rounded-[1.5rem] ring-1 ring-white/10">
                        <motion.img
                            key={activeImage}
                            src={gallery[activeImage]}
                            alt={t('prop.viewAlt', { title: property.title, n: activeImage + 1 })}
                            initial={{ opacity: 0, scale: 1.02 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="aspect-[16/10] h-full w-full object-cover"
                        />

                        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-void/60 to-transparent" />

                        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 z-10">
                            <VerifiedBadge label={t('prop.fullyVerified')} />
                            {property.agent?.verified && (
                                <KycBadge agent={property.agent} variant="overlay" />
                            )}
                            <span className="rounded-full bg-void/60 px-2.5 py-1 text-[0.6875rem] font-medium text-heading backdrop-blur-md ring-1 ring-white/15">
                                {property.intent_label}
                            </span>
                        </div>

                        <button
                            type="button"
                            className="group absolute inset-0 grid place-items-center"
                            aria-label={t('prop.watchVerification')}
                        >
                            <span className="flex items-center gap-3 rounded-full bg-void/70 px-5 py-3 text-[0.8125rem] font-semibold text-heading backdrop-blur-xl ring-1 ring-white/20 transition-all duration-300 group-hover:bg-void/85 group-hover:neon-glow">
                                <span className="grid h-8 w-8 place-items-center rounded-full bg-neon text-void">
                                    <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3" fill="currentColor" aria-hidden="true">
                                        <path d="M3 1.5 10 6l-7 4.5z" />
                                    </svg>
                                </span>
                                {t('prop.watchVerification')}
                            </span>
                        </button>

                        <div className="absolute bottom-4 right-4 rounded-full bg-void/65 px-3 py-1.5 text-[0.6875rem] font-medium text-body backdrop-blur-md ring-1 ring-white/12">
                            {activeImage + 1} / {gallery.length}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 lg:grid-cols-2 lg:auto-rows-fr">
                        {gallery.slice(0, 4).map((image, index) => (
                            <button
                                key={image}
                                type="button"
                                onClick={() => setActiveImage(index)}
                                aria-label={t('prop.viewImage', { n: index + 1 })}
                                aria-current={activeImage === index}
                                className={cn(
                                    'relative overflow-hidden rounded-[1rem] ring-1 transition-all duration-300',
                                    activeImage === index
                                        ? 'ring-2 ring-neon'
                                        : 'ring-white/10 hover:ring-white/30',
                                )}
                            >
                                <img
                                    src={image}
                                    alt=""
                                    loading="lazy"
                                    className="aspect-[4/3] h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Header */}
                <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
                    <div className="min-w-0 max-w-2xl">
                        {/* Distinct Category & Intent Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            {property.intent === 'rent' ? (
                                <span className="flex items-center gap-1.5 rounded-full bg-cyan-400 px-3 py-1 text-[0.75rem] font-extrabold text-[#070b0e] shadow-[0_2px_12px_rgba(34,211,238,0.45)] ring-1 ring-cyan-200">
                                    <span>🔑</span>
                                    <span>{t('badge.forRent', 'À LOUER')}</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[0.75rem] font-extrabold text-[#070b0e] shadow-[0_2px_12px_rgba(16,185,129,0.45)] ring-1 ring-emerald-200">
                                    <span>🏛</span>
                                    <span>{t('badge.forSale', 'À VENDRE')}</span>
                                </span>
                            )}

                            {property.type === 'Shop' && (
                                <span className="flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[0.75rem] font-bold text-[#070b0e] shadow-[0_2px_10px_rgba(251,191,36,0.35)] ring-1 ring-amber-200">
                                    <span>🏬</span>
                                    <span>{t('badge.shop', 'BOUTIQUE / COMMERCE')}</span>
                                </span>
                            )}
                            {property.type === 'Hotel' && (
                                <span className="flex items-center gap-1.5 rounded-full bg-violet-400 px-2.5 py-1 text-[0.75rem] font-bold text-[#070b0e] shadow-[0_2px_10px_rgba(167,139,250,0.35)] ring-1 ring-violet-200">
                                    <span>🏨</span>
                                    <span>{t('badge.hotel', 'HÔTEL & RÉSIDENCE')}</span>
                                </span>
                            )}
                            {property.type === 'Land' && (
                                <span className="flex items-center gap-1.5 rounded-full bg-lime-400 px-2.5 py-1 text-[0.75rem] font-bold text-[#070b0e] shadow-[0_2px_10px_rgba(163,230,53,0.35)] ring-1 ring-lime-200">
                                    <span>🌿</span>
                                    <span>{t('badge.land', 'TERRAIN TITRÉ ACD')}</span>
                                </span>
                            )}
                            {property.type === 'House' && (
                                <span className="flex items-center gap-1.5 rounded-full bg-emerald-800/90 px-2.5 py-1 text-[0.75rem] font-semibold text-emerald-100 ring-1 ring-emerald-400/40">
                                    <span>🏡</span>
                                    <span>{t('badge.house', 'VILLA / MAISON')}</span>
                                </span>
                            )}
                        </div>

                        <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.375rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-heading">
                            {property.title}
                        </h1>

                        <p className="mt-2 flex items-center gap-1.5 text-[0.875rem] text-body/75">
                            <MapPinIcon className="h-4 w-4 text-neon" />
                            {property.location}
                            <span className="mx-1.5 text-white/20">·</span>
                            {t('prop.listedOn', {
                                date: new Date(property.published).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }),
                            })}
                        </p>

                        <div className="mt-3">
                            <GpsVerifiedBadge property={property} variant="hero" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <span className={cn(
                                "inline-block px-2 py-0.5 rounded text-[0.6875rem] font-bold uppercase tracking-wider",
                                property.intent === 'rent' ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            )}>
                                {property.intent === 'rent' ? t('category.rent', 'À Louer') : t('category.sale', 'À Vendre')}
                            </span>
                            <p className="mt-1 font-display text-[clamp(1.35rem,2.4vw,1.75rem)] font-bold tracking-[-0.03em] text-heading">
                                {format(property.price)}
                                {property.intent === 'rent' && (
                                    <span className="ml-1 text-[0.8125rem] font-normal text-faint">
                                        / {t('prop.month', 'mois')}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Compare toggle button */}
                        <motion.button
                            type="button"
                            onClick={handleCompare}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            transition={spring}
                            aria-pressed={inCompare}
                            aria-label={inCompare ? t('compare.remove') : t('compare.addToCompare')}
                            title={inCompare ? t('compare.remove') : t('compare.addToCompare')}
                            className={cn(
                                'grid h-11 w-11 place-items-center rounded-full ring-1 transition-all cursor-pointer',
                                inCompare
                                    ? 'bg-emerald-500 text-void ring-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] font-bold'
                                    : 'bg-white/[0.05] text-heading ring-white/12 hover:bg-white/[0.09]',
                            )}
                        >
                            <span className="text-base">⚖️</span>
                        </motion.button>

                        <motion.button
                            type="button"
                            onClick={toggleSave}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            transition={spring}
                            aria-pressed={saved}
                            aria-label={saved ? t('prop.unsave') : t('prop.save')}
                            title={saved ? t('prop.unsave') : t('prop.save')}
                            className={cn(
                                'grid h-11 w-11 place-items-center rounded-full ring-1 transition-colors',
                                saved ? 'bg-neon/12 text-neon ring-neon/40' : 'bg-white/[0.05] text-heading ring-white/12 hover:bg-white/[0.09]',
                            )}
                        >
                            <HeartIcon filled={saved} className="h-[1.1rem] w-[1.1rem]" />
                        </motion.button>

                        <motion.button
                            type="button"
                            onClick={togglePriceDrop}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            transition={spring}
                            aria-pressed={priceDropActive}
                            aria-label={priceDropActive ? t('prop.unsubscribePriceDrop') : t('prop.subscribePriceDrop')}
                            title={priceDropActive ? t('prop.unsubscribePriceDrop') : t('prop.subscribePriceDrop')}
                            className={cn(
                                'grid h-11 w-11 place-items-center rounded-full ring-1 transition-colors',
                                priceDropActive
                                    ? 'bg-amber-400/15 text-amber-400 ring-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.18)]'
                                    : 'bg-white/[0.05] text-heading ring-white/12 hover:bg-white/[0.09]',
                            )}
                        >
                            <BellIcon filled={priceDropActive} className="h-[1.1rem] w-[1.1rem]" />
                        </motion.button>
                    </div>
                </div>

                {/* Key facts */}
                <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-[1.15rem] bg-white/[0.08] sm:grid-cols-3 lg:grid-cols-5">
                    {[
                        property.bedrooms > 0 && [property.bedrooms, t('prop.bedrooms')],
                        property.bathrooms > 0 && [property.bathrooms, t('prop.bathrooms')],
                        [`${property.area} m²`, t('prop.area')],
                        [typeLabel(property.type), t('prop.type')],
                        [`${property.views.toLocaleString()}`, t('prop.views')],
                    ]
                        .filter(Boolean)
                        .map(([value, label]) => (
                            <div key={label} className="bg-void px-5 py-4">
                                <p className="font-display text-[1.0625rem] font-semibold text-heading">{value}</p>
                                <p className="mt-0.5 text-[0.6875rem] uppercase tracking-[0.12em] text-faint">{label}</p>
                            </div>
                        ))}
                </div>

                <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
                    {/* Left column */}
                    <div className="min-w-0 space-y-10">
                        <section>
                            <h2 className="font-display text-[1.125rem] font-semibold tracking-[-0.02em] text-heading">
                                {t('prop.about')}
                            </h2>
                            <p className="mt-3 text-[0.9375rem] leading-7 text-body/75">{property.description}</p>

                            {/* 360-degree Virtual Tour Viewer Component */}
                            <VirtualTourViewer
                                rooms={property.virtual_tours}
                                propertyTitle={property.title}
                            />
                        </section>

                        <section>
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-display text-[1.125rem] font-semibold tracking-[-0.02em] text-heading">
                                    {t('prop.amenities')}
                                </h2>
                                <span className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-neon/85">
                                    <CheckIcon className="h-3.5 w-3.5" />
                                    {t('prop.photoVerified')}
                                </span>
                            </div>

                            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                                {property.tags.map((tag) => (
                                    <div
                                        key={tag}
                                        className="flex items-center justify-between rounded-[0.8rem] bg-white/[0.04] px-3.5 py-2.5 ring-1 ring-white/8"
                                    >
                                        <span className="text-[0.8125rem] text-body/85">{tag}</span>
                                        <span className="grid h-5 w-5 place-items-center rounded-full bg-neon/15 text-neon">
                                            <CheckIcon className="h-3 w-3" />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Distinct Legal Cadastral (Sale) vs Lease Terms (Rent) */}
                        {property.intent === 'sale' ? (
                            <section className="glass rounded-[1.35rem] p-5 sm:p-6 border border-emerald-500/25 bg-gradient-to-br from-emerald-950/20 via-[#070b0e] to-void-raised/80">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                                            🏛
                                        </span>
                                        <div>
                                            <h3 className="font-display text-[0.9375rem] font-bold text-heading">
                                                {locale === 'fr' ? 'Dossier Foncier & Garanties Notariées' : 'Land Title & Notarial Guarantees'}
                                            </h3>
                                            <p className="text-[0.6875rem] text-emerald-400/90 font-medium">
                                                Authentification Ministère de la Construction et de l’Urbanisme (MCU)
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[0.625rem] font-bold text-emerald-300 ring-1 ring-emerald-500/30 uppercase tracking-wider">
                                        TITRE CERTIFIÉ
                                    </span>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                                    <div className="rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/8 space-y-1.5">
                                        <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-faint">
                                            Titre & Identification Foncier
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Nature du titre :</span>
                                            <span className="font-semibold text-emerald-300">Arrêté Concession Définitive (ACD)</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">N° Enregistrement ACD :</span>
                                            <span className="font-mono text-heading">ACD-2024-MCU-{(property.id * 142).toString().padStart(5, '0')}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Identifiant Unique (IDUFCI) :</span>
                                            <span className="font-mono text-neon">CI-ABJ-{(property.id * 2394).toString().padStart(6, '0')}-TF</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Bornage OGECI :</span>
                                            <span className="text-heading font-medium">Contradictoire 4 Bornes Scellées</span>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/8 space-y-1.5">
                                        <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-faint">
                                            Décomposition des Frais Notariés Légaux
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Droits d'enregistrement (7%) :</span>
                                            <span className="text-heading font-medium">{format(property.price * 0.07)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Émoluments notaire (3%) :</span>
                                            <span className="text-heading font-medium">{format(property.price * 0.03)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Conservation Foncière (1.5%) :</span>
                                            <span className="text-heading font-medium">{format(property.price * 0.015)}</span>
                                        </div>
                                        <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                                            <span className="font-semibold text-body">Garantie sous séquestre :</span>
                                            <span className="text-emerald-400 font-bold">Protégé CDC-CI</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ) : (
                            <section className="glass rounded-[1.35rem] p-5 sm:p-6 border border-cyan-500/25 bg-gradient-to-br from-cyan-950/20 via-[#070b0e] to-void-raised/80">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30">
                                            🔑
                                        </span>
                                        <div>
                                            <h3 className="font-display text-[0.9375rem] font-bold text-heading">
                                                {locale === 'fr' ? 'Conditions Locatives & Décompte d’Entrée' : 'Lease Terms & Move-in Breakdown'}
                                            </h3>
                                            <p className="text-[0.6875rem] text-cyan-400/90 font-medium">
                                                Réglementé selon la Loi n° 2019-576 sur les baux d'habitation en Côte d’Ivoire
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[0.625rem] font-bold text-cyan-300 ring-1 ring-cyan-500/30 uppercase tracking-wider">
                                        BAIL CONFORME
                                    </span>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                                    <div className="rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/8 space-y-1.5">
                                        <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-faint">
                                            Décompte Légal d'Entrée
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Caution de garantie (2 mois) :</span>
                                            <span className="text-heading font-medium">{format(property.price * 2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Loyers d'avance (2 mois max) :</span>
                                            <span className="text-heading font-medium">{format(property.price * 2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Honoraires agence & bail (1 mois) :</span>
                                            <span className="text-heading font-medium">{format(property.price)}</span>
                                        </div>
                                        <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                                            <span className="font-bold text-body">Total prévisionnel entrée :</span>
                                            <span className="text-cyan-300 font-bold">{format(property.price * 5)}</span>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/8 space-y-1.5">
                                        <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-faint">
                                            Garanties & Prestations Incluses
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">État des lieux contradictoire :</span>
                                            <span className="text-heading font-medium">Commissaire de Justice</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Gardiennage & Sécurité 24/7 :</span>
                                            <span className="text-emerald-400 font-medium">Inclus dans les charges</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Groupe & Suppresseur :</span>
                                            <span className="text-emerald-400 font-medium">Entretien assuré</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-body/75">Durée minimale du bail :</span>
                                            <span className="text-heading font-medium">12 mois renouvelables</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        <section>
                            <h2 className="font-display text-[1.125rem] font-semibold tracking-[-0.02em] text-heading">
                                {t('prop.location')}
                            </h2>
                            <p className="mt-2 text-[0.8125rem] text-body/65">
                                {t('prop.locationHelp')}
                            </p>
                            <div className="mt-4">
                                <InteractiveMap
                                    height="h-80"
                                    caption={t('prop.captureCaption')}
                                    markers={[
                                        {
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
                                            href: `/properties/${property.id}`,
                                            primary: true,
                                            label: property.district,
                                        },
                                    ]}
                                    center={[property.lat, property.lng]}
                                    zoom={15}
                                    showVerificationCircle
                                />
                            </div>
                        </section>

                        {/* Verification panel — the trust core */}
                        <section className="glass-strong relative overflow-hidden rounded-[1.5rem] p-6">
                            <div
                                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full"
                                style={{ background: 'radial-gradient(circle, rgba(102,187,106,0.18) 0%, transparent 70%)' }}
                                aria-hidden="true"
                            />

                            <div className="relative">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="grid h-10 w-10 place-items-center rounded-[0.8rem] bg-neon/12 text-neon ring-1 ring-neon/25">
                                            <ShieldCheckIcon className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <h2 className="font-display text-[1rem] font-semibold tracking-[-0.02em] text-heading">
                                                {t('prop.verification')}
                                            </h2>
                                            <p className="mt-0.5 text-[0.75rem] text-faint">
                                                {t('prop.reviewedBy', { name: property.verified.reviewer })}
                                            </p>
                                        </div>
                                    </div>

                                    <VerifiedBadge label={t('prop.approved')} />
                                </div>

                                <div className="mt-5 space-y-2.5">
                                    {VERIFICATION_ROWS.map(({ key, icon: Icon }) => (
                                        <div
                                            key={key}
                                            className="flex items-center gap-3 rounded-[0.8rem] bg-white/[0.03] px-3.5 py-3 ring-1 ring-white/8"
                                        >
                                            <Icon className="h-4 w-4 shrink-0 text-body/50" />

                                            <div className="min-w-0 flex-1">
                                                <p className="text-[0.8125rem] font-medium text-heading">
                                                    {t(`verify.${key}.label`)}
                                                </p>
                                                <p className="truncate text-[0.6875rem] text-faint">
                                                    {t(`verify.${key}.detail`)}
                                                </p>
                                            </div>

                                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neon/15 text-neon">
                                                <CheckIcon className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-4 text-[0.6875rem] leading-relaxed text-faint">
                                    {t('prop.reviewLocked', { date: property.verified.reviewed_at })}
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Dedicated Verified Agent Profile Component (Card Variant) */}
                        <VerifiedAgentProfile
                            agent={property.agent}
                            recentListings={[property]}
                            variant="card"
                            onContact={messageAgent}
                        />

                        <div className="glass rounded-[1.35rem] p-4 space-y-2">
                            <Button
                                variant="outline"
                                size="md"
                                className="w-full justify-center"
                                onClick={handleOpenOffer}
                            >
                                {t('prop.makeOffer')}
                            </Button>
                        </div>

                        <div className="glass rounded-[1.35rem] p-5">
                            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
                                {t('prop.priceBreakdown')}
                            </p>
                            <div className="mt-3 space-y-2 text-[0.8125rem]">
                                <div className="flex justify-between text-body/80">
                                    <span>{t('prop.listingPrice')}</span>
                                    <span className="text-heading">{format(property.price)}</span>
                                </div>
                                <div className="flex justify-between text-body/80">
                                    <span>{t('prop.fee')}</span>
                                    <span className="text-faint">{t('prop.included')}</span>
                                </div>
                            </div>
                            <Divider className="my-3" />
                            <div className="flex justify-between text-[0.875rem] font-semibold text-heading">
                                <span>{t('prop.youPay')}</span>
                                <span>{format(property.price)}</span>
                            </div>
                        </div>

                        {/* Price Drop Alert Card */}
                        <div className="glass rounded-[1.35rem] p-5 border border-white/10">
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 transition-colors',
                                        priceDropActive
                                            ? 'bg-amber-400/15 text-amber-400 ring-amber-400/35'
                                            : 'bg-white/[0.05] text-body/60 ring-white/10',
                                    )}
                                >
                                    <BellIcon filled={priceDropActive} className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-display text-[0.875rem] font-semibold text-heading">
                                        {t('prop.priceAlert')}
                                    </p>
                                    <p className="mt-1 text-[0.75rem] leading-relaxed text-body/70">
                                        {priceDropActive
                                            ? t('prop.priceAlertSubscribed')
                                            : t('prop.priceDropEmailHint')}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant={priceDropActive ? 'secondary' : 'primary'}
                                size="sm"
                                onClick={togglePriceDrop}
                                className={cn(
                                    'mt-4 w-full flex items-center justify-center gap-2',
                                    priceDropActive && 'text-amber-300 border-amber-400/30 hover:border-amber-400/50',
                                )}
                            >
                                <BellIcon filled={priceDropActive} className="h-3.5 w-3.5" />
                                <span>
                                    {priceDropActive
                                        ? t('prop.unsubscribePriceDrop')
                                        : t('prop.subscribePriceDrop')}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Similar */}
                {similar.length > 0 && (
                    <section className="mt-20">
                        <SectionHeading
                            eyebrow={t('prop.nearby')}
                            title={t('prop.similarTitle')}
                            action={
                                <Link
                                    href="/properties"
                                    className="group flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[0.8125rem] font-medium text-heading transition-colors hover:border-white/25"
                                >
                                    {t('prop.browseAll')}
                                    <ArrowUpRightIcon className="h-4 w-4 text-body transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </Link>
                            }
                        />

                        <motion.div
                            variants={staggerParent}
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true, margin: '-60px' }}
                            className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {similar.map((item) => (
                                <PropertyCard key={item.id} property={item} />
                            ))}
                        </motion.div>
                    </section>
                )}
            </div>

            <OfferModal open={offerOpen} property={property} onClose={() => setOfferOpen(false)} />

            {appointmentOpen && (
                <AppointmentModal
                    isOpen={appointmentOpen}
                    onClose={() => setAppointmentOpen(false)}
                    property={property}
                    onOpenAuth={openAuth}
                />
            )}

            {/* Instant Slide-over Agent Chat with AI Automation */}
            <AgentChatDrawer
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                property={property}
                user={user}
                onOpenAuth={openAuth}
                initialMessage={initialChatMessage}
                onScheduleAppointment={() => {
                    setChatOpen(false);
                    handleOpenAppointment();
                }}
            />

            {/* Sticky mobile CTA: Je suis intéressé(e) */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-void/90 px-4 py-3 backdrop-blur-xl lg:hidden">
                <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.625rem] uppercase tracking-wider text-faint">
                            {property.intent_label}
                        </p>
                        <p className="truncate font-display text-[0.9375rem] font-semibold text-heading">
                            {format(property.price)}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="primary"
                        className="shrink-0 bg-gradient-to-r from-emerald-500 to-teal-400 text-void font-extrabold shadow-md cursor-pointer"
                        onClick={() => messageAgent()}
                    >
                        <span>✨</span>
                        <span>{locale === 'fr' ? 'Je suis intéressé(e)' : "I'm Interested"}</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0 text-xs cursor-pointer"
                        onClick={handleOpenAppointment}
                    >
                        {locale === 'fr' ? 'Prendre RDV' : 'Visit'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

PropertyShow.layout = (pageContent) => <SiteLayout>{pageContent}</SiteLayout>;

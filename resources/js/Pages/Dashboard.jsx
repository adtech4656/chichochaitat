import { useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import SiteLayout from '../Layouts/SiteLayout';
import PropertyCard from '../Components/PropertyCard';
import KycBadge from '../Components/KycBadge';
import PropertyRequestModal from '../Components/PropertyRequestModal';
import { Avatar, Button, Divider, EmptyState, StatusPill } from '../Components/ui';
import {
    ArrowUpRightIcon,
    BellIcon,
    CheckIcon,
    HeartIcon,
    MapPinIcon,
    ShieldCheckIcon,
    ChartBarIcon,
} from '../Components/Icons';
import AgentStatsChart from '../Components/AgentStatsChart';
import PaymentModal from '../Components/PaymentModal';
import ReceiptCard from '../Components/ReceiptCard';
import { page, spring, staggerParent } from '../lib/motion';
import { useTranslation } from '../lib/i18n';
import { cn } from '../lib/utils';
import { useMoney } from '../lib/money';
import { getStoredUser, DEMO_USERS } from '../lib/auth-storage';

const TABS = [
    { key: 'saved', labelKey: 'account.saved', fallback: 'Wishlist (Favoris)', icon: HeartIcon },
    { key: 'stats', labelKey: 'account.stats', fallback: 'Statistiques Vues (30j)', icon: ChartBarIcon },
    { key: 'requests', labelKey: 'account.requests', fallback: 'Demandes sur-mesure', icon: ShieldCheckIcon },
    { key: 'priceAlerts', labelKey: 'account.priceAlerts', icon: BellIcon },
    { key: 'offers', labelKey: 'account.offers', icon: ArrowUpRightIcon },
    { key: 'chats', labelKey: 'account.chats', icon: ShieldCheckIcon },
    { key: 'profile', labelKey: 'account.profile', icon: CheckIcon },
];

export default function Dashboard({
    saved = [],
    priceAlerts = [],
    offers: initialOffers = [],
    chats: initialChats = [],
    propertyRequests = [],
    agentStats = null,
    initialTab = null,
    customer: initialCustomer,
}) {
    const customer = initialCustomer || getStoredUser() || DEMO_USERS.buyer;
    const { t, locale } = useTranslation();
    const { format } = useMoney();
    const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-GB';
    const [tab, setTab] = useState(() => {
        if (initialTab) return initialTab;
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const queryTab = params.get('tab');
            if (queryTab && ['saved', 'stats', 'requests', 'priceAlerts', 'offers', 'chats', 'profile'].includes(queryTab)) {
                return queryTab;
            }
        }
        return 'saved';
    });
    const [savedList, setSavedList] = useState(saved);
    const [wishlistIntentFilter, setWishlistIntentFilter] = useState('all');
    const [alertList, setAlertList] = useState(priceAlerts);
    const [requestsList, setRequestsList] = useState(propertyRequests);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [activeChatId, setActiveChatId] = useState(
        initialChats.find((chat) => chat.status === 'closed')?.id ?? initialChats[0]?.id ?? null,
    );

    useEffect(() => {
        setSavedList(saved);
    }, [saved]);

    useEffect(() => {
        setAlertList(priceAlerts);
    }, [priceAlerts]);

    useEffect(() => {
        setRequestsList(propertyRequests);
    }, [propertyRequests]);

    const handleClaimRequest = async (requestId) => {
        try {
            const res = await fetch(`/api/property-requests/${requestId}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ message: `Prise en charge par l'agent certifié ${customer.name}. Dossier en préparation.` }),
            });
            if (res.ok) {
                setRequestsList((prev) =>
                    prev.map((r) =>
                        r.id === requestId
                            ? { ...r, status: 'claimed', claimed_by_agent_name: customer.name }
                            : r,
                    ),
                );
            }
        } catch (e) {
            console.error(e);
        }
    };

    const unsubscribePriceAlert = (propertyId) => {
        setAlertList((prev) => prev.filter((p) => p.id !== propertyId));
        router.post(
            `/properties/${propertyId}/price-drop-subscribe`,
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const offers = initialOffers;
    const chats = initialChats;

    const sendMessage = () => {
        if (!messageText.trim() || !activeChat) return;
        const textToSend = messageText.trim();
        setMessageText('');
        router.post(
            `/chat/conversations/${activeChat.id}/messages`,
            { text: textToSend },
            { preserveScroll: true },
        );
    };

    const activeChat = useMemo(
        () => chats.find((chat) => chat.id === activeChatId) ?? null,
        [chats, activeChatId],
    );

    /**
     * Demonstrates the acceptance rule from the brief: when an agent accepts,
     * the thread closes, disappears from the customer's chat list, and the
     * transaction record is preserved.
     */
    const previewAcceptance = (offer) => {
        router.post(`/offers/${offer.id}/accept`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                openDealChat(offer);
            },
        });
    };

    const openDealChat = (offer) => {
        const chat = chats.find((item) => item.property.slug === offer.property.slug);
        if (chat) {
            setActiveChatId(chat.id);
        }
        setTab('chats');
    };

    const openChats = chats.filter((chat) => chat.status === 'open');
    const closedChats = chats.filter((chat) => chat.status === 'closed');
    const pendingOffers = offers.filter((offer) => offer.status === 'pending');

    return (
        <motion.div variants={page} initial="initial" animate="animate">
            <div className="mx-auto max-w-7xl px-6 pt-28 sm:pt-32">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-neon/80">
                            {t('account.title')}
                        </p>
                        <h1 className="mt-2.5 font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-heading">
                            {t('account.greeting', { name: customer.name.split(' ')[0] })}
                        </h1>
                        <p className="mt-2 text-[0.875rem] text-body/70">
                            {pendingOffers.length} offer{pendingOffers.length === 1 ? '' : 's'} awaiting a reply
                            <span className="mx-2 text-white/20">·</span>
                            {openChats.length} open chat{openChats.length === 1 ? '' : 's'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-[0.8125rem] font-medium text-heading">{customer.name}</p>
                            <p className="text-[0.6875rem] text-faint">Member since {customer.member_since}</p>
                        </div>
                        <Avatar initials={customer.initials} />
                    </div>
                </div>

                <div className="mt-9 grid gap-6 lg:grid-cols-[236px_1fr]">
                    {/* Sidebar */}
                    <aside>
                        <div className="glass sticky top-28 rounded-[1.35rem] p-3">
                            <nav className="space-y-1" aria-label="Account sections">
                                {TABS.map(({ key, labelKey, icon: Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setTab(key)}
                                        aria-current={tab === key}
                                        className="relative flex w-full items-center gap-2.5 rounded-[0.8rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium transition-colors"
                                    >
                                        {tab === key && (
                                            <motion.span
                                                layoutId="account-tab"
                                                transition={spring}
                                                className="absolute inset-0 rounded-[0.8rem] bg-white/[0.08] ring-1 ring-white/12"
                                            />
                                        )}
                                        <Icon
                                            className={cn(
                                                'relative h-4 w-4',
                                                tab === key ? 'text-neon' : 'text-body/55',
                                            )}
                                        />
                                        <span className={cn('relative', tab === key ? 'text-heading' : 'text-body/75')}>
                                            {t(labelKey)}
                                        </span>

                                        {key === 'priceAlerts' && alertList.length > 0 && (
                                            <span className="relative ml-auto rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[0.625rem] font-semibold text-amber-300">
                                                {alertList.length}
                                            </span>
                                        )}

                                        {key === 'offers' && pendingOffers.length > 0 && (
                                            <span className="relative ml-auto rounded-full bg-caution/15 px-1.5 py-0.5 text-[0.625rem] font-semibold text-caution">
                                                {pendingOffers.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </nav>

                            <Divider className="my-3" />

                            <Link
                                href="/agent/kyc"
                                className="group flex items-start gap-2.5 rounded-[0.8rem] bg-gradient-to-br from-neon/12 to-transparent p-3 ring-1 ring-neon/20 transition-colors hover:ring-neon/35"
                            >
                                <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                                <span>
                                    <span className="block text-[0.8125rem] font-semibold text-heading">
                                        Become an agent
                                    </span>
                                    <span className="mt-0.5 flex items-center gap-1 text-[0.6875rem] text-body/60">
                                        Start KYC
                                        <ArrowUpRightIcon className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                    </span>
                                </span>
                            </Link>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="min-w-0">
                        <AnimatePresence mode="wait">
                            {tab === 'saved' && (
                                <motion.section
                                    key="saved"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                        <PanelHeading
                                            title="Wishlist & Coups de Cœur"
                                            meta={`${savedList.length} bien${savedList.length > 1 ? 's' : ''} enregistré${savedList.length > 1 ? 's' : ''}`}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button as="a" href="/properties" variant="secondary" size="sm">
                                                + Explorer des biens
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Session Persistence Info Banner */}
                                    <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 text-xs text-body/80">
                                            <ShieldCheckIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                                            <span>
                                                Wishlist synchronisée avec votre profil <strong className="text-heading font-semibold">{customer.name}</strong>. Sauvegardée en session sécurisée.
                                            </span>
                                        </div>
                                        <span className="text-[0.6875rem] font-mono text-emerald-400/90 font-medium shrink-0">
                                            Actif
                                        </span>
                                    </div>

                                    {/* Filter by Intent */}
                                    {savedList.length > 0 && (
                                        <div className="flex items-center gap-2 mb-6">
                                            {[
                                                { key: 'all', label: `Tous (${savedList.length})` },
                                                { key: 'sale', label: `À Vendre (${savedList.filter((p) => p.intent === 'sale').length})` },
                                                { key: 'rent', label: `À Louer (${savedList.filter((p) => p.intent === 'rent').length})` },
                                            ].map((btn) => (
                                                <button
                                                    key={btn.key}
                                                    type="button"
                                                    onClick={() => setWishlistIntentFilter(btn.key)}
                                                    className={cn(
                                                        'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                                                        wishlistIntentFilter === btn.key
                                                            ? 'bg-emerald-500 text-[#070b0e] shadow-sm'
                                                            : 'bg-white/[0.05] text-body/80 hover:bg-white/10 hover:text-heading'
                                                    )}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {savedList.length === 0 ? (
                                        <EmptyState
                                            icon={HeartIcon}
                                            title={t('account.nothingSaved')}
                                            description="Vous n'avez pas encore ajouté de biens à votre wishlist. Cliquez sur l'icône cœur sur n'importe quelle annonce vérifiée pour la retrouver ici."
                                            action={
                                                <Button as="a" href="/properties" variant="secondary" size="sm" className="mt-3">
                                                    {t('account.browseProperties', 'Browse verified properties')}
                                                </Button>
                                            }
                                        />
                                    ) : (
                                        <motion.div
                                            variants={staggerParent}
                                            initial="initial"
                                            animate="animate"
                                            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                                        >
                                            {savedList
                                                .filter(Boolean)
                                                .filter((p) => wishlistIntentFilter === 'all' || p.intent === wishlistIntentFilter)
                                                .map((property) => (
                                                    <PropertyCard
                                                        key={property.id}
                                                        property={property}
                                                        onSave={(prop, nextSaved) => {
                                                            if (!nextSaved) {
                                                                setSavedList((prev) => prev.filter((p) => p.id !== prop.id));
                                                            }
                                                        }}
                                                    />
                                                ))}
                                        </motion.div>
                                    )}
                                </motion.section>
                            )}

                            {tab === 'stats' && (
                                <motion.section
                                    key="stats"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <AgentStatsChart
                                        stats={agentStats}
                                        agent={agentStats?.agent || {
                                            name: customer.name,
                                            agency: 'Koffi & Co. Immobilier',
                                            license_number: 'RCCM CI-ABJ-2021-B-8491',
                                            slug: 'aya-koffi',
                                        }}
                                    />
                                </motion.section>
                            )}

                            {tab === 'requests' && (
                                <motion.section
                                    key="requests"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                        <PanelHeading
                                            title={locale === 'fr' ? 'Demandes Immobilières Sur-Mesure' : 'Bespoke Property Requests'}
                                            meta={`${requestsList.length} demande(s) enregistrée(s)`}
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => setRequestModalOpen(true)}
                                            className="bg-neon text-void hover:bg-neon-bright"
                                        >
                                            🎯 + Déposer une demande
                                        </Button>
                                    </div>

                                    {requestsList.length === 0 ? (
                                        <EmptyState
                                            icon={ShieldCheckIcon}
                                            title="Aucune demande sur-mesure"
                                            description="Exprimez vos critères précis (budget, localisation, équipements) pour être mis en relation avec des offres 100% vérifiées."
                                            action={
                                                <Button size="sm" onClick={() => setRequestModalOpen(true)} className="mt-3">
                                                    Créer une demande sur-mesure
                                                </Button>
                                            }
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            {requestsList.map((req) => (
                                                <div
                                                    key={req.id}
                                                    className="glass rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all space-y-4"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className={cn(
                                                                    "rounded-full px-2.5 py-0.5 text-[0.6875rem] font-extrabold uppercase tracking-wider",
                                                                    req.intent === 'rent' ? "bg-cyan-400 text-[#070b0e]" : "bg-emerald-500 text-[#070b0e]"
                                                                )}>
                                                                    {req.intent === 'rent' ? 'À Louer' : 'À Vendre'}
                                                                </span>
                                                                <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-heading">
                                                                    {req.type}
                                                                </span>
                                                                {req.status === 'open' ? (
                                                                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[0.6875rem] font-bold text-amber-300 ring-1 ring-amber-400/40">
                                                                        🟡 Recherche active d'agent
                                                                    </span>
                                                                ) : (
                                                                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[0.6875rem] font-bold text-emerald-300 ring-1 ring-emerald-400/40">
                                                                        🟢 Prise en charge par {req.claimed_by_agent_name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="mt-2 font-display text-base font-semibold text-heading">
                                                                {req.district}, {req.city}
                                                            </h4>
                                                        </div>

                                                        <div className="text-right">
                                                            <span className="text-[0.6875rem] text-faint uppercase font-bold block">Budget cible</span>
                                                            <span className="font-display text-sm sm:text-base font-bold text-neon">
                                                                {format(req.budget_min)} — {format(req.budget_max)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Details & Facilities */}
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-body/80">
                                                        {req.bedrooms_min && <span>🛏 {req.bedrooms_min}+ ch.</span>}
                                                        {req.bathrooms_min && <span>🚿 {req.bathrooms_min}+ sdb</span>}
                                                        {req.surface_min && <span>📐 {req.surface_min} m² min.</span>}
                                                        {req.lat && req.lng && (
                                                            <span className="text-emerald-400 font-mono text-[0.6875rem]">
                                                                📍 GPS Live in situ ({req.lat.toFixed(4)}, {req.lng.toFixed(4)})
                                                            </span>
                                                        )}
                                                    </div>

                                                    {req.facilities && req.facilities.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {req.facilities.map((fac) => (
                                                                <span
                                                                    key={fac}
                                                                    className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-[0.6875rem] text-body/80 ring-1 ring-white/8"
                                                                >
                                                                    ✓ {fac}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {req.notes && (
                                                        <p className="text-xs text-body/70 italic bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                                            "{req.notes}"
                                                        </p>
                                                    )}

                                                    {/* Agent Response or Claim Action */}
                                                    {req.status === 'claimed' && req.agent_response && (
                                                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-200">
                                                            <strong className="block font-semibold text-emerald-300 mb-0.5">
                                                                Réponse de l'agent certifié ({req.claimed_by_agent_name}) :
                                                            </strong>
                                                            {req.agent_response}
                                                        </div>
                                                    )}

                                                    {/* If user is an agent and request is open */}
                                                    {(customer?.role === 'agent' || customer?.role === 'admin') && req.status === 'open' && (
                                                        <div className="pt-2 flex justify-end">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleClaimRequest(req.id)}
                                                                className="bg-emerald-500 text-void font-bold"
                                                            >
                                                                Prendre en charge cette demande client
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.section>
                            )}

                            {tab === 'priceAlerts' && (
                                <motion.section
                                    key="priceAlerts"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <PanelHeading
                                        title={t('account.priceAlertsTitle', 'Price Drop Alerts')}
                                        meta={t('account.priceAlertsMeta', { count: alertList.length })}
                                    />

                                    {alertList.length === 0 ? (
                                        <EmptyState
                                            icon={BellIcon}
                                            title={t('account.noPriceAlerts', 'No price alerts set')}
                                            description={t('account.noPriceAlertsHelp', 'Subscribe to any listing to receive instant notifications when the owner or agent reduces the asking price.')}
                                            action={
                                                <Button as="a" href="/properties" variant="secondary" size="sm" className="mt-3">
                                                    {t('account.browseProperties', 'Browse verified properties')}
                                                </Button>
                                            }
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2.5 rounded-2xl bg-amber-400/10 p-3.5 text-[0.8125rem] text-amber-200 ring-1 ring-amber-400/20">
                                                <BellIcon filled className="h-4 w-4 shrink-0 text-amber-400" />
                                                <span>{t('prop.priceDropEmailHint', 'You will receive email notifications as soon as any agent adjusts the price on these listings.')}</span>
                                            </div>

                                            <motion.div
                                                variants={staggerParent}
                                                initial="initial"
                                                animate="animate"
                                                className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                                            >
                                                {alertList.filter(Boolean).map((property) => (
                                                    <div key={property.id} className="group/alert relative flex flex-col">
                                                        <PropertyCard
                                                            property={property}
                                                            onSave={(prop, nextSaved) => {
                                                                if (!nextSaved) {
                                                                    setSavedList((prev) => prev.filter((p) => p.id !== prop.id));
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => unsubscribePriceAlert(property.id)}
                                                            className="mt-2 text-center text-[0.75rem] font-medium text-body/60 transition-colors hover:text-amber-400 py-1"
                                                        >
                                                            {t('prop.unsubscribePriceDrop', 'Unsubscribe from alerts')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.section>
                            )}

                            {tab === 'offers' && (
                                <motion.section
                                    key="offers"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                    className="space-y-3"
                                >
                                    <PanelHeading
                                        title={t('account.offers')}
                                        meta={t('account.offersMeta', { count: offers.length })}
                                    />

                                    {offers.length === 0 && (
                                        <EmptyState
                                            icon={ArrowUpRightIcon}
                                            title={t('account.noOffers')}
                                            description={t('account.noOffersHelp')}
                                            action={
                                                <Button as="a" href="/properties" variant="secondary" size="sm" className="mt-2">
                                                    {t('account.browseProperties')}
                                                </Button>
                                            }
                                        />
                                    )}

                                    {offers.map((offer) => (
                                        <motion.article
                                            key={offer.id}
                                            layout
                                            transition={spring}
                                            className="glass rounded-[1.15rem] p-4"
                                        >
                                            <div className="flex flex-wrap items-center gap-4">
                                                <Link
                                                    href={offer.property.href}
                                                    className="h-16 w-24 shrink-0 overflow-hidden rounded-[0.7rem] bg-void-raised"
                                                >
                                                    <img
                                                        src={offer.property.image}
                                                        alt=""
                                                        loading="lazy"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </Link>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Link
                                                            href={offer.property.href}
                                                            className="truncate font-display text-[0.9375rem] font-semibold text-heading hover:text-neon"
                                                        >
                                                            {offer.property.title}
                                                        </Link>
                                                        <StatusPill status={offer.status} />
                                                    </div>
                                                    <p className="mt-1 truncate text-[0.75rem] text-body/65">
                                                        {offer.property.location}
                                                        <span className="mx-1.5 text-white/20">·</span>
                                                        {offer.placed}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[0.625rem] uppercase tracking-wider text-faint">
                                                        Your offer
                                                    </p>
                                                    <p className="mt-0.5 font-display text-[0.9375rem] font-semibold text-heading">
                                                        {format(offer.amount)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
                                                {offer.status === 'accepted' ? (
                                                    <>
                                                        <p className="flex items-center gap-1.5 text-[0.75rem] text-neon">
                                                            <CheckIcon className="h-3.5 w-3.5" />
                                                            {t('account.dealConfirmedChat')}
                                                        </p>
                                                        <Button size="sm" variant="secondary" onClick={() => openDealChat(offer)}>
                                                            {t('account.viewReceipt')}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-[0.75rem] text-body/60">
                                                            {t('account.awaiting', { name: offer.agent.name })}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => previewAcceptance(offer)}
                                                            className="text-[0.75rem] font-medium text-neon/80 transition-colors hover:text-neon"
                                                        >
                                                            {t('account.previewAcceptance')}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </motion.article>
                                    ))}
                                </motion.section>
                            )}

                            {tab === 'chats' && (
                                <motion.section
                                    key="chats"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <PanelHeading
                                        title={t('account.conversations')}
                                        meta={t('account.conversationsMeta', {
                                            open: openChats.length,
                                            archived: closedChats.length,
                                        })}
                                    />

                                    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                                        {/* Thread list */}
                                        <div className="space-y-2">
                                            {chats.map((chat) => (
                                                <motion.button
                                                    key={chat.id}
                                                    layout
                                                    transition={spring}
                                                    type="button"
                                                    onClick={() => setActiveChatId(chat.id)}
                                                    className={cn(
                                                        'flex w-full items-center gap-3 rounded-[0.9rem] p-3 text-left transition-colors',
                                                        activeChatId === chat.id
                                                            ? 'bg-white/[0.07] ring-1 ring-white/15'
                                                            : 'hover:bg-white/[0.04]',
                                                    )}
                                                >
                                                    <Avatar initials={chat.agent.initials} size="sm" />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex items-center gap-1.5 truncate text-[0.8125rem] font-medium text-heading">
                                                            {chat.agent.name}
                                                            {chat.agent.verified && (
                                                                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[0.5625rem] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                                                                    KYC
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="block truncate text-[0.6875rem] text-faint">
                                                            {chat.property.title}
                                                        </span>
                                                    </span>
                                                    {chat.status === 'closed' ? (
                                                        <CheckIcon className="h-4 w-4 shrink-0 text-neon" />
                                                    ) : (
                                                        chat.unread > 0 && (
                                                            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-neon px-1 text-[0.625rem] font-bold text-void">
                                                                {chat.unread}
                                                            </span>
                                                        )
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Thread / receipt */}
                                        <div className="glass min-h-[26rem] rounded-[1.15rem] p-5">
                                            <AnimatePresence mode="wait">
                                                {activeChat && activeChat.status === 'closed' ? (
                                                    <DealReceipt
                                                        key={`deal-${activeChat.id}`}
                                                        chat={activeChat}
                                                    />
                                                ) : activeChat ? (
                                                    <motion.div
                                                        key={`thread-${activeChat.id}`}
                                                        initial={{ opacity: 0, y: 12 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -8 }}
                                                        transition={spring}
                                                        className="flex h-full flex-col"
                                                    >
                                                        <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4">
                                                            <div className="relative shrink-0">
                                                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-void font-bold shadow-md ring-1 ring-emerald-400/40">
                                                                    <ShieldCheckIcon className="h-5 w-5 stroke-[2.5]" />
                                                                </div>
                                                                <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-neon text-void ring-1 ring-void">
                                                                    <CheckIcon className="h-2.5 w-2.5 stroke-[3]" />
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h4 className="truncate text-[0.875rem] font-bold text-heading">
                                                                        {locale === 'fr' ? 'Médiation & Conciergerie Officielle ChiChoc Habitat' : 'ChiChoc Habitat Official Intermediation and Concierge Desk'}
                                                                    </h4>
                                                                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.625rem] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                                                                        {locale === 'fr' ? 'Tiers de Confiance' : 'Escrow Intermediary'}
                                                                    </span>
                                                                </div>
                                                                <p className="truncate text-[0.6875rem] text-body/75">
                                                                    <span className="font-semibold text-neon">{activeChat.property.title}</span>
                                                                    <span className="mx-1 text-white/20">·</span>
                                                                    <span>Agent Titulaire : <strong className="text-emerald-300">{activeChat.agent.name}</strong></span>
                                                                </p>
                                                            </div>
                                                            <StatusPill status={activeChat.status || 'open'} />
                                                        </div>

                                                        {/* Strict Intermediation Banner in Dashboard Thread */}
                                                        <div className="bg-emerald-950/40 border border-emerald-500/20 px-3 py-2 rounded-lg my-2 flex items-center gap-2">
                                                            <ShieldCheckIcon className="h-3.5 w-3.5 text-neon shrink-0" />
                                                            <p className="text-[0.6875rem] text-emerald-300 font-medium">
                                                                {locale === 'fr'
                                                                    ? 'Les échanges, accords et dépôts sous séquestre sont exclusivement arbitrés par ChiChoc Habitat. L’agent effectue l’audit et la visite.'
                                                                    : 'All inquiries, deals, and escrow deposits are handled exclusively by ChiChoc Habitat. The agent conducts audits and visits.'}
                                                            </p>
                                                        </div>

                                                        {/* In-Chat Escrow Deal Payment Strip */}
                                                        <div className="flex items-center justify-between bg-emerald-950/60 rounded-xl border border-emerald-500/30 p-3 my-2 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base">🤝</span>
                                                                <div>
                                                                    <p className="font-bold text-emerald-200">
                                                                        {activeChat.deal?.status === 'escrow_funded' || activeChat.payment_status === 'paid'
                                                                            ? (locale === 'fr' ? 'Acompte Séquestre Bloqué' : 'Escrow Deposit Funded')
                                                                            : (locale === 'fr' ? 'Accord & Acompte Sécurisé' : 'Escrow Deal & Deposit')}
                                                                    </p>
                                                                    <p className="text-[0.6875rem] text-emerald-300/80">
                                                                        {activeChat.deal?.amount_due
                                                                            ? `${activeChat.deal.amount_due.toLocaleString('fr-FR')} XOF`
                                                                            : activeChat.payment_amount
                                                                            ? `${activeChat.payment_amount.toLocaleString('fr-FR')} XOF`
                                                                            : `${Math.round(activeChat.property.price * 0.1).toLocaleString('fr-FR')} XOF (10% ${locale === 'fr' ? 'séquestre' : 'escrow'})`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPaymentModalOpen(true)}
                                                                className="flex items-center gap-1.5 rounded-xl bg-neon px-3.5 py-1.5 text-xs font-bold text-void hover:bg-neon-bright hover:shadow-[0_0_15px_rgba(102,187,106,0.6)] transition-all cursor-pointer"
                                                            >
                                                                <span>💳</span>
                                                                <span>{t('chat.makePayment', 'Effectuer le Paiement')}</span>
                                                            </button>
                                                        </div>

                                                        <div className="flex-1 space-y-3 py-4">
                                                            {activeChat.messages.map((message, index) => {
                                                                if (message.is_receipt && message.receipt) {
                                                                    return (
                                                                        <div key={index} className="w-full flex justify-center my-2">
                                                                            <ReceiptCard receipt={message.receipt} property={activeChat.property} />
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <div
                                                                        key={index}
                                                                        className={cn(
                                                                            'flex',
                                                                            message.from === 'me' ? 'justify-end' : 'justify-start',
                                                                        )}
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                'max-w-[80%] rounded-[1rem] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed',
                                                                                message.from === 'me'
                                                                                    ? 'bg-neon text-void'
                                                                                    : 'bg-white/[0.06] text-body/90 ring-1 ring-white/8',
                                                                            )}
                                                                        >
                                                                            {message.text}
                                                                            <span
                                                                                className={cn(
                                                                                    'mt-1 block text-[0.625rem]',
                                                                                    message.from === 'me' ? 'text-void/60' : 'text-faint',
                                                                                )}
                                                                            >
                                                                                {message.at}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="flex items-center gap-2 border-t border-white/[0.07] pt-4">
                                                            <input
                                                                type="text"
                                                                value={messageText}
                                                                onChange={(e) => setMessageText(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') sendMessage();
                                                                }}
                                                                placeholder={t('account.messagePlaceholder')}
                                                                className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[0.8125rem] text-heading outline-none placeholder:text-body/30 focus:border-neon"
                                                            />
                                                            <Button size="md" onClick={sendMessage}>{t('account.send')}</Button>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <EmptyState
                                                        key="no-chat"
                                                        title={t('account.noConversations')}
                                                        description={t('account.noConversationsHelp')}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {tab === 'profile' && (
                                <motion.section
                                    key="profile"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <PanelHeading title={t('account.profile')} meta={t('account.profileMeta')} />

                                    <div className="glass rounded-[1.15rem] p-5">
                                        <div className="flex items-center gap-4">
                                            <Avatar initials={customer.initials} size="lg" />
                                            <div>
                                                <p className="font-display text-[1.0625rem] font-semibold text-heading">
                                                    {customer.name}
                                                </p>
                                                <p className="text-[0.75rem] text-body/65">
                                                    {t('account.verifiedSince', { date: customer.member_since })}
                                                </p>
                                            </div>
                                        </div>

                                        <Divider className="my-5" />

                                        <dl className="grid gap-4 sm:grid-cols-2">
                                            {[
                                                [t('auth.email'), customer.email],
                                                [t('auth.phone'), customer.phone],
                                                [t('common.language'), 'Français · English'],
                                                [t('common.currency'), 'XOF · USD · EUR'],
                                            ].map(([label, value]) => (
                                                <div key={label}>
                                                    <dt className="text-[0.625rem] uppercase tracking-[0.14em] text-faint">
                                                        {label}
                                                    </dt>
                                                    <dd className="mt-1 text-[0.875rem] text-heading">{value}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Bespoke Property Request Modal */}
            <PropertyRequestModal
                isOpen={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
            />

            {/* Escrow Deal Payment Modal */}
            {paymentModalOpen && activeChat && (
                <PaymentModal
                    isOpen={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    conversation={activeChat}
                    property={activeChat.property}
                    onPaymentSuccess={(data) => {
                        router.reload({ preserveScroll: true });
                    }}
                />
            )}
        </motion.div>
    );
}

function PanelHeading({ title, meta }) {
    return (
        <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-[1.125rem] font-semibold tracking-[-0.02em] text-heading">
                {title}
            </h2>
            <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-faint">{meta}</span>
        </div>
    );
}

/**
 * The chat thread does not merely disappear when an offer is accepted — it
 * morphs into a permanent transaction record via a shared layout animation.
 */
function DealReceipt({ chat }) {
    const { format } = useMoney();
    const { t } = useTranslation();
    const { deal, property } = chat;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="relative flex h-full flex-col"
        >
            <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(102,187,106,0.22) 0%, transparent 70%)' }}
                aria-hidden="true"
            />

            <div className="relative flex flex-1 flex-col items-center justify-center py-6 text-center">
                <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...spring, delay: 0.08 }}
                    className="grid h-16 w-16 place-items-center rounded-full bg-neon/15 text-neon ring-1 ring-neon/35 neon-glow-soft"
                >
                    <CheckIcon className="h-7 w-7" />
                </motion.span>

                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.14 }}
                    className="mt-5 font-display text-[1.375rem] font-semibold tracking-[-0.03em] text-heading"
                >
                    {t('account.dealConfirmed')}
                </motion.h3>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.18 }}
                    className="mt-1.5 max-w-xs text-[0.8125rem] leading-relaxed text-body/70"
                >
                    {t('account.dealCopy')}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.22 }}
                    className="mt-6 w-full max-w-sm rounded-[1rem] bg-white/[0.04] p-4 text-left ring-1 ring-white/10"
                >
                    <ReceiptRow label={t('receipt.reference')} value={deal.reference} mono />
                    <ReceiptRow label={t('receipt.property')} value={property.title} />
                    <ReceiptRow label={t('receipt.agreedPrice')} value={format(property.price)} />
                    <ReceiptRow label={t('receipt.terms')} value={deal.terms} />
                    <ReceiptRow label={t('receipt.closed')} value={deal.closed} last />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.28 }}
                    className="mt-5 flex flex-wrap items-center justify-center gap-2"
                >
                    <Button size="sm" variant="secondary">
                        {t('receipt.download')}
                    </Button>
                    <Button size="sm" variant="outline" as="a" href="/properties">
                        {t('receipt.browseSimilar')}
                    </Button>
                </motion.div>

                <p className="mt-5 flex items-center gap-1.5 text-[0.6875rem] text-faint">
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-neon/60" />
                    {t('receipt.auditLog')}
                </p>
            </div>
        </motion.div>
    );
}

function ReceiptRow({ label, value, mono = false, last = false }) {
    return (
        <div className={cn('flex items-baseline justify-between gap-4 py-1.5', !last && 'border-b border-white/[0.06]')}>
            <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-faint">{label}</span>
            <span
                className={cn(
                    'text-right text-[0.8125rem] text-heading',
                    mono && 'font-mono text-[0.75rem] tracking-tight',
                )}
            >
                {value}
            </span>
        </div>
    );
}

Dashboard.layout = (pageContent) => <SiteLayout>{pageContent}</SiteLayout>;

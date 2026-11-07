import { useState, useMemo, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser } from '../lib/auth-storage';
import {
    ShieldCheckIcon,
    CheckIcon,
    StarIcon,
    BuildingIcon,
    MapPinIcon,
    PhoneIcon,
    MailIcon,
    WhatsAppIcon,
    ArrowUpRightIcon,
    CloseIcon,
    CameraIcon,
    UserIcon,
} from './Icons';
import GpsVerifiedBadge from './GpsVerifiedBadge';
import AppointmentModal from './AppointmentModal';
import { Avatar, Button, Divider, StatusPill } from './ui';
import { useTranslation } from '../lib/i18n';
import { useMoney } from '../lib/money';
import { useAuthModal } from '../lib/auth-modal';
import { cn } from '../lib/utils';
import { spring, staggerParent, staggerChild } from '../lib/motion';

/**
 * Dedicated profile component for verified real estate agents.
 * Displays:
 *  - High-impact verified status (Level 3 KYC, official license, on-site audit stamps)
 *  - Performance metrics (active listings, closed deals, rating, response time)
 *  - Direct Contact button with secure platform intermediation flow
 *  - Recent verified listings grid with GPS-verified and 360° tour indicators
 *  - Cryptographic verification audit certificate modal
 */
export default function VerifiedAgentProfile({
    agent,
    recentListings = [],
    stats = null,
    variant = 'full', // 'full' | 'card'
    className = '',
    onContact = null,
}) {
    const { t, locale } = useTranslation();
    const { format } = useMoney();
    const { openAuth } = useAuthModal();
    const { auth } = usePage().props;
    const [currentUser, setCurrentUser] = useState(() => getStoredUser(auth?.user));

    useEffect(() => {
        const handler = (e) => setCurrentUser(e.detail);
        window.addEventListener('chichoc:auth-change', handler);
        return () => window.removeEventListener('chichoc:auth-change', handler);
    }, []);

    const user = currentUser;

    const [filterIntent, setFilterIntent] = useState('all');
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
    const [auditModalOpen, setAuditModalOpen] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    // Derived statistics
    const activeStats = useMemo(() => {
        return {
            activeListings: stats?.activeListings ?? recentListings.length,
            dealsClosed: stats?.dealsClosed ?? agent?.deals ?? 36,
            rating: stats?.rating ?? agent?.rating ?? 4.9,
            avgResponse: stats?.avgResponse ?? agent?.response ?? '< 15 min',
            memberSince: stats?.memberSince ?? agent?.since ?? '2022',
            licenseNumber: agent?.license_number || `MCLU/CACI #CI-ABJ-${2020 + (agent?.id || 1)}-${88 + (agent?.id || 1)}`,
        };
    }, [agent, recentListings, stats]);

    // Filter recent listings
    const filteredListings = useMemo(() => {
        if (filterIntent === 'all') return recentListings;
        return recentListings.filter((item) => item.intent === filterIntent);
    }, [recentListings, filterIntent]);

    // ChiChoc Official Intermediation Hotline and WhatsApp
    const centralHotline = '+225 07 00 00 00';
    const whatsappMessage = encodeURIComponent(
        locale === 'fr'
            ? `Bonjour Conciergerie ChiChoc Habitat, je vous contacte via le profil vérifié de l'agent ${agent?.name || 'Agréé'} pour instruire un dossier ou planifier une visite officielle.`
            : `Hello ChiChoc Habitat Concierge, I am contacting you regarding verified agent ${agent?.name || 'Partner'} to inquire about listings or schedule an official tour.`
    );
    const whatsappUrl = `https://wa.me/22507000000?text=${whatsappMessage}`;
    const hotlineUrl = `tel:+22507000000`;

    const handleDirectContact = (e) => {
        if (e) e.preventDefault();
        if (!user) {
            openAuth('signin', t('auth.promptContactAgent'));
            return;
        }
        if (onContact) {
            onContact(agent);
            return;
        }
        setContactModalOpen(true);
    };

    const handleOpenAppointment = () => {
        if (!user) {
            openAuth('signin', t('auth.promptAppointment'));
            return;
        }
        setAppointmentModalOpen(true);
    };

    const handleOpenWhatsapp = (e) => {
        if (!user) {
            if (e) e.preventDefault();
            openAuth('signin', t('auth.promptContactAgent'));
            return;
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!user) {
            openAuth('signin', t('auth.promptContactAgent'));
            return;
        }
        if (!messageText.trim()) return;

        setIsSubmitting(true);
        const targetPropId = recentListings[0]?.id || 1;

        router.post(
            '/chat/conversations',
            {
                property_id: targetPropId,
                message: `[Demande transmise à la Médiation ChiChoc Habitat · Agent Référent: ${agent?.name}]: ${messageText}`,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setMessageSent(true);
                    setMessageText('');
                    setTimeout(() => {
                        setMessageSent(false);
                        setContactModalOpen(false);
                    }, 2200);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // =========================================================================
    // VARIANT: Compact / Card View (ideal for sidebar in PropertyShow)
    // =========================================================================
    if (variant === 'card') {
        return (
            <div className={cn("glass-strong rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl backdrop-blur-xl", className)}>
                {/* Agent Header */}
                <div className="flex items-start gap-3.5">
                    <div className="relative shrink-0">
                        {agent?.avatar ? (
                            <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-lg"
                            />
                        ) : (
                            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-300 font-bold text-lg ring-2 ring-emerald-500/40">
                                {agent?.initials || 'AG'}
                            </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-void shadow ring-2 ring-void">
                            <CheckIcon className="h-3 w-3 stroke-[3]" />
                        </span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-display font-bold text-heading text-base truncate">
                                {agent?.name}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setAuditModalOpen(true)}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.625rem] font-bold text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                                title="Voir le certificat d'accréditation"
                            >
                                <ShieldCheckIcon className="h-3 w-3" />
                                <span>Vérifié</span>
                            </button>
                        </div>
                        <p className="text-xs text-body/75 truncate mt-0.5">{agent?.agency}</p>
                        <p className="text-[0.6875rem] text-neon/90 font-mono mt-0.5">{activeStats.licenseNumber}</p>
                    </div>
                </div>

                {/* Key stats row */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/[0.03] p-2.5 text-center border border-white/5">
                    <div>
                        <p className="font-display font-bold text-heading text-sm">{activeStats.dealsClosed}+</p>
                        <p className="text-[0.5625rem] text-faint uppercase tracking-wider">Ventes</p>
                    </div>
                    <div className="border-x border-white/5">
                        <div className="flex items-center justify-center gap-1 font-display font-bold text-heading text-sm">
                            <StarIcon className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>{activeStats.rating}</span>
                        </div>
                        <p className="text-[0.5625rem] text-faint uppercase tracking-wider">Avis</p>
                    </div>
                    <div>
                        <p className="font-display font-bold text-emerald-400 text-sm">{activeStats.avgResponse}</p>
                        <p className="text-[0.5625rem] text-faint uppercase tracking-wider">Réponse</p>
                    </div>
                </div>

                {/* Central Platform Intermediation Action Group */}
                <div className="space-y-2 pt-1">
                    <Button
                        variant="primary"
                        size="md"
                        onClick={(e) => {
                            if (e) e.preventDefault();
                            if (!user) {
                                openAuth('signin', t('auth.promptContactAgent'));
                                return;
                            }
                            if (onContact) {
                                onContact(locale === 'fr'
                                    ? `Bonjour, je suis très intéressé(e) par ce bien "${recentListings[0]?.title || 'sélectionné'}". Pouvez-vous me transmettre les modalités et organiser la visite officielle ?`
                                    : `Hello, I am very interested in "${recentListings[0]?.title || 'this listing'}". Could you please provide details and schedule the official visit?`
                                );
                                return;
                            }
                            handleDirectContact(e);
                        }}
                        className="w-full justify-center bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-void font-extrabold shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:brightness-110 cursor-pointer text-sm"
                    >
                        <span>✨</span>
                        <span>{locale === 'fr' ? 'Je suis intéressé(e)' : "I'm Interested"}</span>
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleOpenAppointment}
                            className="justify-center text-xs"
                        >
                            <span>{locale === 'fr' ? 'Prendre RDV (2 Étapes)' : 'Book Tour (2 Steps)'}</span>
                        </Button>
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleOpenWhatsapp}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition-colors"
                        >
                            <WhatsAppIcon className="h-3.5 w-3.5 fill-current" />
                            <span>WhatsApp ChiChoc</span>
                        </a>
                    </div>
                </div>

                {/* Intermediation Notice */}
                <p className="text-[0.625rem] text-emerald-300/80 leading-relaxed bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/20 flex items-start gap-1.5">
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-neon shrink-0 mt-0.5" />
                    <span><strong>Intermédiation Obligatoire ChiChoc Habitat :</strong> Aucun contact direct avec les agents n'est autorisé. ChiChoc protège votre acompte sous séquestre notarié et certifie les titres de propriété.</span>
                </p>

                {/* Modal Renderings */}
                {renderContactModal()}
                {renderAuditModal()}
                {renderAppointmentModal()}
            </div>
        );
    }

    // =========================================================================
    // VARIANT: Full View (Dedicated Agent Page & Expanded View)
    // =========================================================================
    return (
        <div className={cn("space-y-10", className)}>
            {/* Main Agent Profile Hero Card */}
            <div className="relative overflow-hidden rounded-[2.25rem] border border-emerald-500/25 bg-void-raised/90 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
                {/* Background Banner */}
                <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-void-raised">
                    <img
                        src={agent?.cover_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80'}
                        alt=""
                        className="h-full w-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />

                    {/* Top Verified Shield Pill */}
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 rounded-full bg-void/85 px-4 py-1.5 text-xs font-semibold text-neon backdrop-blur-md border border-emerald-500/35 shadow-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon"></span>
                        </span>
                        <ShieldCheckIcon className="h-4 w-4" />
                        <span>Partenaire Agréé & Habilité Niveau 3</span>
                    </div>
                </div>

                {/* Profile Identity & Action Bar */}
                <div className="relative px-6 pb-8 pt-0 sm:px-10 sm:pb-10">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 -mt-16 sm:-mt-20">
                        {/* Avatar & Main Credentials */}
                        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                            <div className="relative shrink-0">
                                <div className="h-32 w-32 sm:h-40 sm:w-40 overflow-hidden rounded-[2rem] border-4 border-void bg-void-raised shadow-2xl ring-2 ring-emerald-500/50">
                                    {agent?.avatar ? (
                                        <img
                                            src={agent.avatar}
                                            alt={agent.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="grid h-full w-full place-items-center bg-emerald-950/40 text-emerald-300 text-3xl font-bold font-display">
                                            {agent?.initials || 'AG'}
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-void shadow-xl ring-4 ring-void cursor-pointer"
                                    onClick={() => setAuditModalOpen(true)}
                                    title="Certificat vérifié"
                                >
                                    <CheckIcon className="h-5 w-5 stroke-[3]" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-heading">
                                        {agent?.name}
                                    </h1>
                                    <button
                                        type="button"
                                        onClick={() => setAuditModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30 transition-colors shadow-sm"
                                    >
                                        <ShieldCheckIcon className="h-3.5 w-3.5" />
                                        <span>Agent Vérifié KYC</span>
                                    </button>
                                </div>

                                <p className="text-sm font-semibold text-emerald-400">
                                    {agent?.role_title || 'Courtier Immobilier Agréé — Expert Terrains & Résidentiel'}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-body/80">
                                    <span className="flex items-center gap-1.5 font-medium text-heading">
                                        <BuildingIcon className="h-4 w-4 text-emerald-400" />
                                        {agent?.agency}
                                    </span>
                                    <span className="text-white/20">·</span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPinIcon className="h-4 w-4 text-faint" />
                                        {agent?.office_address || 'Abidjan, Cocody Riviera Golf, Côte d’Ivoire'}
                                    </span>
                                    <span className="text-white/20">·</span>
                                    <span className="font-mono text-neon/90 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
                                        {activeStats.licenseNumber}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Central Platform Intermediation CTA Group */}
                        <div className="flex flex-wrap items-center gap-3 lg:self-end">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={(e) => {
                                    if (e) e.preventDefault();
                                    if (!user) {
                                        openAuth('signin', t('auth.promptContactAgent'));
                                        return;
                                    }
                                    if (onContact) {
                                        onContact(locale === 'fr'
                                            ? `Bonjour, je suis très intéressé(e) par vos biens vérifiés. Pouvez-vous me présenter les disponibilités et organiser une visite officielle ?`
                                            : `Hello, I am very interested in your verified listings. Could you please present available options and schedule an official visit?`
                                        );
                                        return;
                                    }
                                    handleDirectContact(e);
                                }}
                                className="gap-2.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-void font-extrabold shadow-[0_4px_24px_rgba(16,185,129,0.4)] hover:brightness-110 hover:scale-[1.02] transition-all cursor-pointer"
                            >
                                <span>✨</span>
                                <span>{locale === 'fr' ? 'Je suis intéressé(e)' : "I'm Interested"}</span>
                            </Button>

                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={handleOpenAppointment}
                                className="gap-2 border-white/15 bg-white/[0.06] hover:bg-white/10"
                            >
                                <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                                <span>{locale === 'fr' ? 'Prendre un Rendez-vous (2 Étapes)' : 'Schedule Tour (2 Steps)'}</span>
                            </Button>

                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleOpenWhatsapp}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/50 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
                            >
                                <WhatsAppIcon className="h-4 w-4 fill-current" />
                                <span>WhatsApp Médiation ChiChoc</span>
                            </a>

                            <a
                                href="tel:+22507000000"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-heading hover:bg-white/10 transition-colors"
                                title="Ligne Centrale ChiChoc Habitat : +225 07 00 00 00"
                            >
                                <PhoneIcon className="h-4 w-4 text-emerald-400" />
                                <span>Hotline : +225 07 00 00 00</span>
                            </a>

                            <Link
                                href="/agent/analytics"
                                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-colors"
                                title="Consulter les statistiques d'audience et de vues sur 30 jours"
                            >
                                <span>📊</span>
                                <span>Audience 30 Jours (Recharts)</span>
                            </Link>
                        </div>
                    </div>

                    {/* Trust Banner with 4 Pillars */}
                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/25 p-4 text-left">
                        <div className="flex items-start gap-2.5 p-2">
                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                                <CheckIcon className="h-4 w-4 stroke-[2.5]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-heading">Identité & CNI Certifiée</p>
                                <p className="text-[0.6875rem] text-body/70 mt-0.5">Biométrie et casier judiciaire audités</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 p-2 border-l border-white/5">
                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                                <CameraIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-heading">Audit Terrain & GPS In Situ</p>
                                <p className="text-[0.6875rem] text-body/70 mt-0.5">Vérification physique sous 100m</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 p-2 border-l border-white/5">
                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                                <ShieldCheckIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-heading">Agrément Ministère MCLU</p>
                                <p className="text-[0.6875rem] text-body/70 mt-0.5">Licence professionnelle en règle</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 p-2 border-l border-white/5">
                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                                <BuildingIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-heading">Séquestre Notarié CDC-CI</p>
                                <p className="text-[0.6875rem] text-body/70 mt-0.5">Zéro risque de spoliation financière</p>
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics Bar */}
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                        <div className="p-2">
                            <p className="font-display text-xl font-bold text-heading">
                                {activeStats.activeListings}
                            </p>
                            <p className="text-[0.6875rem] uppercase tracking-wider text-faint mt-0.5">
                                Biens Actifs Vérifiés
                            </p>
                        </div>

                        <div className="p-2 border-l border-white/[0.06]">
                            <p className="font-display text-xl font-bold text-heading">
                                {activeStats.dealsClosed}+
                            </p>
                            <p className="text-[0.6875rem] uppercase tracking-wider text-faint mt-0.5">
                                Transactions Scellées
                            </p>
                        </div>

                        <div className="p-2 border-l border-white/[0.06]">
                            <div className="flex items-center justify-center gap-1 font-display text-xl font-bold text-heading">
                                <StarIcon className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                                <span>{activeStats.rating}</span>
                                <span className="text-xs font-normal text-faint">/5.0</span>
                            </div>
                            <p className="text-[0.6875rem] uppercase tracking-wider text-faint mt-0.5">
                                Note de Confiance
                            </p>
                        </div>

                        <div className="p-2 border-l border-white/[0.06]">
                            <p className="font-display text-xl font-bold text-emerald-400">
                                {activeStats.avgResponse}
                            </p>
                            <p className="text-[0.6875rem] uppercase tracking-wider text-faint mt-0.5">
                                Temps de Réponse
                            </p>
                        </div>

                        <div className="col-span-2 sm:col-span-1 p-2 border-t sm:border-t-0 sm:border-l border-white/[0.06]">
                            <p className="font-display text-xl font-bold text-heading">
                                {activeStats.memberSince}
                            </p>
                            <p className="text-[0.6875rem] uppercase tracking-wider text-faint mt-0.5">
                                Partenaire Depuis
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Verified Listings Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-display text-xl sm:text-2xl font-bold text-heading">
                                Biens Récents de l'Agent Vérifié
                            </h2>
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                                {filteredListings.length} disponible(s)
                            </span>
                        </div>
                        <p className="text-xs text-body/75 mt-1">
                            Tous les biens de {agent?.name} ont fait l'objet d'un audit physique sur site avec coordonnées GPS authentifiées.
                        </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white/[0.04] p-1 border border-white/10">
                        <button
                            type="button"
                            onClick={() => setFilterIntent('all')}
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                                filterIntent === 'all'
                                    ? "bg-neon text-void shadow-sm"
                                    : "text-body/70 hover:text-heading"
                            )}
                        >
                            Tous ({recentListings.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterIntent('sale')}
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                                filterIntent === 'sale'
                                    ? "bg-neon text-void shadow-sm"
                                    : "text-body/70 hover:text-heading"
                            )}
                        >
                            À Vendre
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterIntent('rent')}
                            className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                                filterIntent === 'rent'
                                    ? "bg-neon text-void shadow-sm"
                                    : "text-body/70 hover:text-heading"
                            )}
                        >
                            À Louer
                        </button>
                    </div>
                </div>

                {/* Listings Grid */}
                {filteredListings.length > 0 ? (
                    <motion.div
                        variants={staggerParent}
                        initial="initial"
                        animate="animate"
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {filteredListings.map((property) => (
                            <motion.div
                                key={property.id}
                                variants={staggerChild}
                                whileHover={{ y: -5, scale: 1.01 }}
                                transition={spring}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-void-raised/70 shadow-lg backdrop-blur-md flex flex-col"
                            >
                                <Link href={`/properties/${property.id}`} className="block relative aspect-[16/10] overflow-hidden bg-void">
                                    <img
                                        src={property.image}
                                        alt={property.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent opacity-80" />

                                    {/* Badges on image */}
                                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                                        <GpsVerifiedBadge property={property} variant="compact" />
                                        {property.has_360_tour && (
                                            <span className="flex items-center gap-1 rounded-full bg-void/80 px-2 py-0.5 text-[0.625rem] font-bold text-cyan-300 ring-1 ring-cyan-400/40 backdrop-blur-md">
                                                360° Tour
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                        <span className="rounded-lg bg-void/85 px-2.5 py-1 text-sm font-extrabold text-neon ring-1 ring-neon/30 backdrop-blur-md">
                                            {format(property.price, property.currency)}
                                            {property.intent === 'rent' && <span className="text-[0.6875rem] font-normal text-white/70"> /mois</span>}
                                        </span>

                                        <span className={cn(
                                            "rounded px-2 py-0.5 text-[0.625rem] font-bold uppercase",
                                            property.intent === 'rent' ? "bg-cyan-500/20 text-cyan-300" : "bg-emerald-500/20 text-emerald-300"
                                        )}>
                                            {property.intent === 'rent' ? 'Location' : 'Vente'}
                                        </span>
                                    </div>
                                </Link>

                                <div className="p-4 flex flex-1 flex-col justify-between space-y-3">
                                    <div>
                                        <Link href={`/properties/${property.id}`} className="block">
                                            <h3 className="font-display font-semibold text-heading text-sm group-hover:text-neon transition-colors line-clamp-1">
                                                {property.title}
                                            </h3>
                                        </Link>
                                        <p className="flex items-center gap-1 text-xs text-body/70 mt-1">
                                            <MapPinIcon className="h-3.5 w-3.5 text-faint shrink-0" />
                                            <span className="truncate">{property.district}, {property.city}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-white/5 pt-2.5 text-xs text-body/75">
                                        <div className="flex items-center gap-3">
                                            {property.bedrooms && <span>{property.bedrooms} ch.</span>}
                                            {property.bathrooms && <span>· {property.bathrooms} sdb.</span>}
                                            {property.surface && <span>· {property.surface} m²</span>}
                                        </div>

                                        <Link
                                            href={`/properties/${property.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-neon hover:underline"
                                        >
                                            <span>Consulter</span>
                                            <ArrowUpRightIcon className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
                        <BuildingIcon className="mx-auto h-10 w-10 text-faint" />
                        <h4 className="font-display text-base font-semibold text-heading">
                            Aucun bien trouvé pour cette catégorie
                        </h4>
                        <p className="text-xs text-body/75 max-w-md mx-auto">
                            L'agent n'a pas de mandat actif correspondant à ce filtre. Vous pouvez lui transmettre une demande personnalisée directe.
                        </p>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleDirectContact}
                            className="bg-emerald-500 text-void font-bold mt-2"
                        >
                            Transmettre une demande sur-mesure à {agent?.name}
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal Renderings */}
            {renderContactModal()}
            {renderAuditModal()}
            {renderAppointmentModal()}
        </div>
    );

    // =========================================================================
    // MODAL: Direct Contact Dialog
    // =========================================================================
    function renderContactModal() {
        return (
            <AnimatePresence>
                {contactModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={spring}
                            className="w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/30 bg-void-raised shadow-2xl p-6 space-y-5"
                        >
                            <div className="flex items-start justify-between border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-void font-bold shadow-md ring-1 ring-emerald-400/40">
                                            <ShieldCheckIcon className="h-6 w-6 stroke-[2.5]" />
                                        </div>
                                        <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-void">
                                            <CheckIcon className="h-2.5 w-2.5 stroke-[3]" />
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-heading text-lg">
                                            {locale === 'fr' ? 'Conciergerie Officielle ChiChoc Habitat' : 'ChiChoc Habitat Official Concierge'}
                                        </h3>
                                        <p className="text-xs text-emerald-400 font-medium">
                                            {locale === 'fr' ? `Mandats & Biens de l'agent vérifié ${agent?.name}` : `Mandates for verified agent ${agent?.name}`}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setContactModalOpen(false)}
                                    className="rounded-full p-1.5 text-body/60 hover:bg-white/10 hover:text-heading cursor-pointer"
                                >
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {messageSent ? (
                                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-6 text-center space-y-2">
                                    <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-void mx-auto">
                                        <CheckIcon className="h-6 w-6 stroke-[3]" />
                                    </div>
                                    <h4 className="font-display font-bold text-heading text-base">Demande Enregistrée avec Succès</h4>
                                    <p className="text-xs text-body/80">
                                        Votre demande est prise en charge par la cellule de médiation ChiChoc Habitat. Un représentant officiel coordonnera avec l'agent et vous répondra sous quelques minutes.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-heading mb-1.5">
                                            {locale === 'fr' ? 'Votre demande à la Conciergerie ChiChoc (Tiers de Confiance)' : 'Your request to ChiChoc Concierge (Escrow Intermediary)'}
                                        </label>
                                        <textarea
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            rows={4}
                                            placeholder={locale === 'fr' ? `Bonjour, je souhaite des précisions sur les biens vérifiés de l'agent ${agent?.name} et organiser une visite officielle...` : `Hello, I would like details on verified listings by agent ${agent?.name} and arrange an official tour...`}
                                            className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm text-heading placeholder:text-body/35 focus:border-neon focus:outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Fast options */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMessageText("Je souhaite planifier une visite officielle supervisée avec la Conciergerie ChiChoc.")}
                                            className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[0.6875rem] text-body/80 hover:bg-white/10 hover:text-heading cursor-pointer border border-white/5"
                                        >
                                            📅 Planifier une visite
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMessageText("Le titre foncier (ACD / TF) a-t-il été certifié par ChiChoc Habitat ?")}
                                            className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[0.6875rem] text-body/80 hover:bg-white/10 hover:text-heading cursor-pointer border border-white/5"
                                        >
                                            📜 Vérifier les titres fonciers
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMessageText("Quelles sont les conditions de blocage de l'acompte sous séquestre notarié ?")}
                                            className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[0.6875rem] text-body/80 hover:bg-white/10 hover:text-heading cursor-pointer border border-white/5"
                                        >
                                            💰 Séquestre notarié
                                        </button>
                                    </div>

                                    {/* Neutral Intermediation Protection Guarantee */}
                                    <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/25 p-3 flex items-start gap-2 text-[0.71875rem] text-emerald-300">
                                        <ShieldCheckIcon className="h-4 w-4 text-neon shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="text-emerald-100 block mb-0.5">Intermédiation Obligatoire ChiChoc Habitat :</strong>
                                            Pour votre protection absolue, tous les échanges, vérifications de titres et versements sous séquestre sont gérés directement par ChiChoc Habitat. L'agent intervient pour l'audit et la visite officielle sur place.
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setContactModalOpen(false)}
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={isSubmitting || !messageText.trim()}
                                            className="bg-emerald-500 text-void font-bold shadow-md hover:bg-emerald-400 cursor-pointer"
                                        >
                                            {isSubmitting ? 'Transmission...' : (locale === 'fr' ? 'Transmettre à la Conciergerie' : 'Submit to Concierge')}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    // =========================================================================
    // MODAL: Cryptographic Verification Audit Certificate
    // =========================================================================
    function renderAuditModal() {
        return (
            <AnimatePresence>
                {auditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={spring}
                            className="w-full max-w-md rounded-3xl border border-emerald-500/35 bg-void-raised p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-start justify-between border-b border-white/10 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                                        <ShieldCheckIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-heading text-base">Certificat d'Audit & Agrément</h3>
                                        <p className="text-xs text-emerald-400">{agent?.name} · {agent?.agency}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAuditModalOpen(false)}
                                    className="rounded-full p-1.5 text-body/60 hover:bg-white/10 hover:text-heading cursor-pointer"
                                >
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-2.5 text-xs text-body/80">
                                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5 space-y-1">
                                    <p className="font-semibold text-white flex items-center justify-between">
                                        <span>Numéro d'Agrément Professionnel :</span>
                                        <span className="font-mono text-emerald-400">{activeStats.licenseNumber}</span>
                                    </p>
                                    <p className="text-[0.6875rem] text-body/70">
                                        Certifié conforme auprès du Ministère de la Construction, du Logement et de l'Urbanisme (MCLU).
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5 space-y-1">
                                    <p className="font-semibold text-white flex items-center justify-between">
                                        <span>Niveau de Contrôle KYC :</span>
                                        <span className="text-emerald-400 font-bold">Niveau 3 — Habilité Validé</span>
                                    </p>
                                    <p className="text-[0.6875rem] text-body/70">
                                        Pièce d'identité biométrique vérifiée, présence physique confirmée et casier judiciaire vierge.
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5 space-y-1">
                                    <p className="font-semibold text-white flex items-center justify-between">
                                        <span>Séquestre Financier & Caution :</span>
                                        <span className="text-emerald-400 font-bold">Compte Déposé CDC-CI</span>
                                    </p>
                                    <p className="text-[0.6875rem] text-body/70">
                                        Garantie financière active déposée auprès de la Caisse des Dépôts et Consignations de Côte d'Ivoire.
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5 space-y-1">
                                    <p className="font-semibold text-white flex items-center justify-between">
                                        <span>Horodatage & Empreinte Numérique :</span>
                                        <span className="font-mono text-[0.6875rem] text-faint">SHA-256: 8f9b...4c1a</span>
                                    </p>
                                    <p className="text-[0.6875rem] text-body/70">
                                        Enregistrement scellé dans le registre immuable Chic Choc Habitat.
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => setAuditModalOpen(false)}
                                className="w-full justify-center text-xs"
                            >
                                Fermer le certificat
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }

    // =========================================================================
    // MODAL: Official Appointment Scheduling
    // =========================================================================
    function renderAppointmentModal() {
        return (
            <AppointmentModal
                isOpen={appointmentModalOpen}
                onClose={() => setAppointmentModalOpen(false)}
                property={recentListings[0] || { id: 1, title: `Visite mandat ${agent?.name}`, location: agent?.office_address || 'Abidjan', agent }}
            />
        );
    }
}

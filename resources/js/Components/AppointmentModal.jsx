import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePage } from '@inertiajs/react';
import { useTranslation } from '../lib/i18n';
import { useMoney } from '../lib/money';
import { useSiteConfig } from '../lib/site-config-context';
import { Button } from './ui';
import { ShieldCheckIcon, CloseIcon, MapPinIcon, CheckIcon, PhoneIcon } from './Icons';
import { spring } from '../lib/motion';

/**
 * Appointment booking modal enforcing ChiChoc Habitat's mandatory 2-step intermediation protocol.
 * The customer chooses a desired slot, ChiChoc Habitat coordinates with the agent/owner to lock it in,
 * and then ChiChoc confirms the verified appointment and issues an official visit pass.
 */
export default function AppointmentModal({
    isOpen,
    onClose,
    property,
    onOpenAuth,
}) {
    const { t, locale } = useTranslation();
    const { format } = useMoney();
    const { site } = useSiteConfig();
    const { auth } = usePage().props;
    const user = auth?.user;

    const [date, setDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [timeSlot, setTimeSlot] = useState('morning');
    const [type, setType] = useState('visit');
    const [phone, setPhone] = useState(user?.phone || '');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [coordinationStep, setCoordinationStep] = useState(1); // 1 = client choice, 2 = agent coordination, 3 = confirmed
    const [submittedTicket, setSubmittedTicket] = useState(null);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!user && onOpenAuth) {
            onOpenAuth('signin', t('auth.promptAppointment'));
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/appointments/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    property_id: property.id,
                    agent_id: property.agent?.id || 1,
                    date,
                    time_slot: timeSlot,
                    appointment_type: type,
                    phone,
                    notes,
                }),
            });

            const data = await res.json();
            setSubmitting(false);

            if (res.ok && data.success) {
                setSubmittedTicket(data.appointment || {
                    id: Date.now(),
                    date,
                    time_slot: timeSlot === 'morning' ? 'Matinée (09h00 - 12h00)' : timeSlot === 'afternoon' ? 'Après-midi (14h00 - 17h00)' : 'Samedi matin (10h00 - 13h00)',
                    type: type === 'visit' ? 'Visite physique sur site' : 'Vérification juridique',
                    phone: phone || user?.phone || '',
                });
                setCoordinationStep(2);
            } else {
                setError(data.error || 'Erreur lors de la prise de rendez-vous.');
            }
        } catch (err) {
            setSubmitting(false);
            setError('Une erreur est survenue. Veuillez réessayer.');
        }
    };

    const handleSimulateConfirmation = () => {
        setCoordinationStep(3);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                    transition={spring}
                    className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#070b0e] shadow-2xl z-10 max-h-[92vh] flex flex-col"
                >
                    {/* Header Strip with Shield */}
                    <div className="border-b border-white/10 bg-void-raised/90 px-6 py-4 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-neon">
                                <ShieldCheckIcon className="h-5 w-5" />
                                <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
                                    {t('intermediary.title', 'Médiation & Conciergerie Officielle ChiChoc Habitat')}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-heading hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <CloseIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <h2 className="mt-2 font-display text-[1.25rem] font-bold text-heading">
                            {t('appointment.title', 'Rendez-vous Officiel & Visite Supervisée')}
                        </h2>
                        <p className="mt-1 text-[0.75rem] text-body/75">
                            {t('appointment.subtitle', 'Protocole en 2 étapes : ChiChoc coordonne avec le propriétaire/agent puis confirme votre visite')}
                        </p>
                    </div>

                    {/* Strict Intermediation Banner */}
                    <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-6 py-2.5 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheckIcon className="h-4 w-4 text-neon shrink-0" />
                            <p className="text-[0.6875rem] leading-relaxed text-emerald-300">
                                <strong className="font-semibold text-emerald-100">
                                    {t('intermediary.strictNotice')}
                                </strong>{' '}
                                {t('intermediary.noDirectContact')}. ChiChoc supervise l'ensemble du protocole.
                            </p>
                        </div>
                    </div>

                    {/* 3-Stage Visual Coordination Status Tracker */}
                    <div className="border-b border-white/10 bg-white/[0.02] px-6 py-3.5 shrink-0">
                        <div className="flex items-center justify-between text-[0.6875rem] font-semibold text-faint mb-2">
                            <span>{t('appointment.statusTracker', 'Suivi de Coordination ChiChoc Habitat')}</span>
                            <span className="font-mono text-neon">
                                {coordinationStep === 1 ? 'Étape 1 / 2' : coordinationStep === 2 ? 'Étape 2 / 2 (En cours)' : 'Confirmé & Validé'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {/* Step 1 */}
                            <div className={`rounded-xl p-2.5 border transition-all ${
                                coordinationStep >= 1
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                                    : 'bg-white/[0.02] border-white/5 text-faint'
                            }`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className={`grid h-4.5 w-4.5 place-items-center rounded-full text-[0.625rem] font-bold ${
                                        coordinationStep > 1 ? 'bg-neon text-void' : 'bg-emerald-500/20 text-neon'
                                    }`}>
                                        {coordinationStep > 1 ? '✓' : '1'}
                                    </span>
                                    <span className="font-bold text-[0.6875rem] truncate">
                                        {t('appointment.step1Title', '1. Demande Créneau')}
                                    </span>
                                </div>
                                <p className="text-[0.5625rem] text-body/70 line-clamp-1">
                                    {t('appointment.step1Desc', 'Choix de votre date')}
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className={`rounded-xl p-2.5 border transition-all ${
                                coordinationStep === 2
                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse'
                                    : coordinationStep > 2
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                                    : 'bg-white/[0.02] border-white/5 text-faint'
                            }`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className={`grid h-4.5 w-4.5 place-items-center rounded-full text-[0.625rem] font-bold ${
                                        coordinationStep > 2 ? 'bg-neon text-void' : coordinationStep === 2 ? 'bg-amber-400 text-void' : 'bg-white/10 text-faint'
                                    }`}>
                                        {coordinationStep > 2 ? '✓' : '2'}
                                    </span>
                                    <span className="font-bold text-[0.6875rem] truncate">
                                        {t('appointment.step2Title', '2. Coordination')}
                                    </span>
                                </div>
                                <p className="text-[0.5625rem] text-body/70 line-clamp-1">
                                    {t('appointment.step2Desc', 'ChiChoc fixe avec l’agent')}
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className={`rounded-xl p-2.5 border transition-all ${
                                coordinationStep === 3
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                    : 'bg-white/[0.02] border-white/5 text-faint'
                            }`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className={`grid h-4.5 w-4.5 place-items-center rounded-full text-[0.625rem] font-bold ${
                                        coordinationStep === 3 ? 'bg-neon text-void' : 'bg-white/10 text-faint'
                                    }`}>
                                        {coordinationStep === 3 ? '✓' : '3'}
                                    </span>
                                    <span className="font-bold text-[0.6875rem] truncate">
                                        {t('appointment.step3Title', '3. Pass Visite')}
                                    </span>
                                </div>
                                <p className="text-[0.5625rem] text-body/70 line-clamp-1">
                                    {t('appointment.step3Desc', 'Validation & Pass délivré')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Property summary */}
                    <div className="flex items-center gap-3 border-b border-white/[0.08] bg-white/[0.015] px-6 py-2.5 shrink-0">
                        {property.image && (
                            <img
                                src={property.image}
                                alt=""
                                className="h-9 w-12 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[0.8125rem] font-medium text-heading">
                                {property.title}
                            </h3>
                            <p className="text-[0.6875rem] text-faint flex items-center gap-1">
                                <MapPinIcon className="h-3 w-3 text-neon" />
                                <span className="truncate">{property.location}</span>
                                <span className="text-white/20">·</span>
                                <span className="font-semibold text-heading">{format(property.price)}</span>
                                {property.agent && (
                                    <>
                                        <span className="text-white/20">·</span>
                                        <span>Agent : <strong className="text-emerald-300">{property.agent.name}</strong></span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Scrollable Content Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {coordinationStep === 2 && (
                            <div className="space-y-5 text-center py-3">
                                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-400/20 text-amber-300 ring-2 ring-amber-400/30">
                                    <span className="text-2xl animate-spin">⏳</span>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-display text-xl font-bold text-heading">
                                        {locale === 'fr' ? 'Étape 2 en cours : Coordination avec l’Agent' : 'Step 2 in Progress: Coordinating with Agent'}
                                    </h3>
                                    <p className="text-xs text-body/80 max-w-md mx-auto leading-relaxed">
                                        {locale === 'fr'
                                            ? `Votre demande pour le ${submittedTicket?.date} a bien été enregistrée par la Conciergerie ChiChoc Habitat. Notre équipe prend contact avec l'agent/propriétaire (${property.agent?.name || 'Agréé'}) pour valider la clé et verrouiller le créneau exact.`
                                            : `Your request for ${submittedTicket?.date} has been recorded by the ChiChoc Habitat Concierge. We are now contacting agent/owner ${property.agent?.name || 'Partner'} to confirm property access and finalize your schedule.`}
                                    </p>
                                </div>

                                {/* Live Ticket Summary */}
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-2.5 max-w-md mx-auto text-xs">
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-faint">Référence Ticket</span>
                                        <span className="font-mono text-neon font-semibold">RDV-CCH-{submittedTicket?.id || 101}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-faint">Créneau sollicité</span>
                                        <span className="font-semibold text-heading">{submittedTicket?.date} ({submittedTicket?.time_slot})</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-faint">Agent Mandataire Notifié</span>
                                        <span className="font-semibold text-emerald-300">{property.agent?.name || 'Cabinet Partenaire'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-faint">Téléphone Confirmation</span>
                                        <span className="font-mono text-heading">{submittedTicket?.phone}</span>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/25 p-3 text-[0.6875rem] text-emerald-300 max-w-md mx-auto flex items-start gap-2 text-left">
                                    <ShieldCheckIcon className="h-4 w-4 text-neon shrink-0 mt-0.5" />
                                    <span>
                                        {locale === 'fr'
                                            ? 'Vous recevrez un SMS et un message WhatsApp de la Conciergerie avec votre Pass de Visite Officielle dès confirmation de l’agent (délai moyen : moins de 2 heures).'
                                            : 'You will receive an official visit pass via SMS & WhatsApp once the agent approves (average time: under 2 hours).'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="md"
                                        onClick={onClose}
                                        className="text-xs"
                                    >
                                        Fermer et Suivre dans mon Compte
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="md"
                                        onClick={handleSimulateConfirmation}
                                        className="text-xs bg-gradient-to-r from-emerald-500 to-teal-400 text-void font-bold"
                                    >
                                        <span>Passer à l’étape 3 (Pass Validé)</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {coordinationStep === 3 && (
                            <div className="space-y-5 text-center py-3">
                                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/20 text-neon ring-2 ring-emerald-500/40 shadow-lg">
                                    <CheckIcon className="h-9 w-9 stroke-[3]" />
                                </div>

                                <div className="space-y-1.5">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                                        <ShieldCheckIcon className="h-3.5 w-3.5" />
                                        <span>PASS VISITE OFFICIELLE DÉLIVRÉ</span>
                                    </span>
                                    <h3 className="font-display text-2xl font-bold text-heading">
                                        {locale === 'fr' ? 'Rendez-vous Confirmé par l’Agent !' : 'Appointment Confirmed by Agent!'}
                                    </h3>
                                    <p className="text-xs text-body/80 max-w-md mx-auto leading-relaxed">
                                        {locale === 'fr'
                                            ? `La Conciergerie ChiChoc Habitat a validé votre créneau avec l'agent ${property.agent?.name || 'Agréé'}. Un représentant assermenté sera présent sur place pour superviser la visite contradictoire.`
                                            : `ChiChoc Habitat Concierge has locked in the appointment slot with agent ${property.agent?.name || 'Partner'}. A sworn officer will be present on-site to oversee the tour.`}
                                    </p>
                                </div>

                                {/* Official Visit Pass Card */}
                                <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/60 to-void-raised p-5 text-left space-y-3 max-w-md mx-auto shadow-xl">
                                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                                        <div>
                                            <p className="font-display font-bold text-emerald-300 text-sm">PASS OFFICIEL DE VISITE</p>
                                            <p className="text-[0.625rem] text-faint">ChiChoc Habitat Escrow & Intermediation Guarantee</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono text-neon font-bold text-xs">CCH-PASS-{submittedTicket?.id || 101}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-faint text-[0.625rem] uppercase block">Date & Heure</span>
                                            <span className="font-bold text-heading text-sm">{submittedTicket?.date}</span>
                                            <span className="text-[0.6875rem] text-emerald-300 block">{submittedTicket?.time_slot}</span>
                                        </div>
                                        <div>
                                            <span className="text-faint text-[0.625rem] uppercase block">Délégué Superviseur</span>
                                            <span className="font-bold text-heading">Délégué ChiChoc Agréé</span>
                                            <span className="text-[0.6875rem] text-emerald-400 block">{site?.phone || '+225 07 00 00 00'}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[0.6875rem] text-body/75">
                                        <span>Agent Titulaire : <strong className="text-heading">{property.agent?.name}</strong></span>
                                        <span className="text-neon font-semibold">Titre ACD Contrôlé ✓</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="md"
                                        onClick={onClose}
                                        className="bg-emerald-500 text-void font-bold shadow-md hover:bg-emerald-400"
                                    >
                                        Terminer et Télécharger le Pass
                                    </Button>
                                </div>
                            </div>
                        )}

                        {coordinationStep === 1 && (
                            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                                {error && (
                                    <div className="rounded-xl bg-rose-500/15 p-3 text-[0.75rem] text-rose-300 border border-rose-500/30">
                                        {error}
                                    </div>
                                )}

                                {/* Appointment Type */}
                                <div>
                                    <label className="block text-[0.6875rem] font-medium uppercase tracking-wider text-faint mb-1.5">
                                        {t('appointment.type', 'Type de rendez-vous')}
                                    </label>
                                    <div className="grid gap-2">
                                        {[
                                            ['visit', t('appointment.typeVisit', 'Visite physique sur site avec délégué ChiChoc Habitat')],
                                            ['legal', t('appointment.typeLegal', 'Revue des pièces et vérification du titre foncier / ACD')],
                                            ['signing', t('appointment.typeSigning', 'Séance de finalisation du bail ou compromis chez le notaire')],
                                        ].map(([key, label]) => (
                                            <label
                                                key={key}
                                                className={`flex items-center gap-3 rounded-xl border p-2.5 text-[0.78125rem] cursor-pointer transition-colors ${
                                                    type === key
                                                        ? 'border-neon bg-neon/10 text-heading font-medium ring-1 ring-neon/30'
                                                        : 'border-white/10 bg-white/[0.03] text-body hover:bg-white/[0.06]'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value={key}
                                                    checked={type === key}
                                                    onChange={() => setType(key)}
                                                    className="accent-neon h-4 w-4 cursor-pointer"
                                                />
                                                <span>{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Date & Slot */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[0.6875rem] font-medium uppercase tracking-wider text-faint mb-1.5">
                                            {t('appointment.chooseDate', 'Date souhaitée')}
                                        </label>
                                        <input
                                            type="date"
                                            value={date}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                            className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-[0.8125rem] text-heading outline-none focus:border-neon"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[0.6875rem] font-medium uppercase tracking-wider text-faint mb-1.5">
                                            {t('appointment.chooseSlot', 'Créneau horaire')}
                                        </label>
                                        <select
                                            value={timeSlot}
                                            onChange={(e) => setTimeSlot(e.target.value)}
                                            className="w-full rounded-xl border border-white/12 bg-void-raised px-3 py-2 text-[0.8125rem] text-heading outline-none focus:border-neon cursor-pointer"
                                        >
                                            <option value="morning">{t('appointment.morning', 'Matinée (09h00 - 12h00)')}</option>
                                            <option value="afternoon">{t('appointment.afternoon', 'Après-midi (14h00 - 17h00)')}</option>
                                            <option value="saturday">{t('appointment.saturday', 'Samedi matin (10h00 - 13h00)')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-[0.6875rem] font-medium uppercase tracking-wider text-faint mb-1.5">
                                        {locale === 'fr' ? 'Votre numéro de téléphone (pour confirmation SMS/WhatsApp)' : 'Your phone number (for SMS/WhatsApp confirmation)'}
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+225 07..."
                                        required
                                        className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2 text-[0.8125rem] text-heading placeholder:text-faint/50 outline-none focus:border-neon"
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[0.6875rem] font-medium uppercase tracking-wider text-faint mb-1.5">
                                        {t('appointment.notes', 'Précisions complémentaires (facultatif)')}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        placeholder={locale === 'fr' ? 'Ex: Souhaite inspecter les fondations, voir l’accès bitumé et vérifier l’ACD...' : 'Any specific inspection requirements...'}
                                        className="w-full rounded-xl border border-white/12 bg-white/[0.04] p-3 text-[0.8125rem] text-heading placeholder:text-faint/50 outline-none focus:border-neon resize-none"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        loading={submitting}
                                        className="w-full justify-center text-[0.875rem] bg-gradient-to-r from-emerald-500 to-teal-400 text-void font-bold shadow-lg hover:brightness-110 cursor-pointer"
                                    >
                                        {t('appointment.submit', 'Transmettre la demande à ChiChoc Habitat')}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

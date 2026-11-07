import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import SiteLayout from '../Layouts/SiteLayout';
import {
    MapPinIcon,
    ShieldCheckIcon,
    CheckIcon,
    ArrowUpRightIcon,
    BuildingIcon,
    UserIcon,
} from '../Components/Icons';
import { Button, StatusPill } from '../Components/ui';
import { useTranslation } from '../lib/i18n';
import { useMoney } from '../lib/money';
import { useAuthModal } from '../lib/auth-modal';
import { cn } from '../lib/utils';
import { page, spring } from '../lib/motion';

const CATEGORIES = [
    { key: 'House', label_fr: 'Maison / Villa', icon: '🏡' },
    { key: 'Apartment', label_fr: 'Appartement', icon: '🏢' },
    { key: 'Land', label_fr: 'Terrain / Parcelle', icon: '🏞️' },
    { key: 'Shop', label_fr: 'Boutique / Commerce', icon: '🏪' },
    { key: 'Hotel', label_fr: 'Hôtel / Résidence', icon: '🏨' },
];

const FACILITIES_LIST = [
    'Piscine',
    'Sécurité 24/7',
    'Groupe électrogène',
    'Accès goudronné',
    'Titre Foncier / ACD',
    'Climatisation',
    'Parking sécurisé',
    'Jardin privatif',
    'Citerne / Suppresseur',
    'Ascenseur',
    'Bord de lagune',
    'Zone commerciale passante',
];

export default function Demande({ propertyRequests = [] }) {
    const { t, locale } = useTranslation();
    const { format } = useMoney();
    const { auth } = usePage().props;
    const user = auth?.user;
    const { openAuth } = useAuthModal();

    const [intent, setIntent] = useState('sale');
    const [type, setType] = useState('House');
    const [city, setCity] = useState('Abidjan');
    const [district, setDistrict] = useState('Cocody');
    const [budgetMin, setBudgetMin] = useState(intent === 'sale' ? 35000000 : 400000);
    const [budgetMax, setBudgetMax] = useState(intent === 'sale' ? 95000000 : 1200000);
    const [bedrooms, setBedrooms] = useState(3);
    const [bathrooms, setBathrooms] = useState(2);
    const [surface, setSurface] = useState(200);
    const [selectedFacilities, setSelectedFacilities] = useState(['Sécurité 24/7', 'Accès goudronné']);
    const [notes, setNotes] = useState('');
    const [userName, setUserName] = useState(user?.name || '');
    const [userPhone, setUserPhone] = useState(user?.phone || '');
    const [userEmail, setUserEmail] = useState(user?.email || '');
    const [coords, setCoords] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setIsLocating(false);
            },
            () => {
                setCoords({ lat: 5.3482, lng: -3.9781 }); // Abidjan fallback
                setIsLocating(false);
            }
        );
    };

    const toggleFacility = (facility) => {
        setSelectedFacilities((prev) =>
            prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!user) {
            openAuth('signin', locale === 'fr' ? 'Connectez-vous pour transmettre votre mandat de recherche officiel aux agents agréés.' : 'Please sign in to submit your official search mandate to verified agents.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            user_name: userName || user?.name || 'Client',
            user_phone: userPhone || user?.phone || '+225 00000000',
            user_email: userEmail || user?.email || 'client@example.com',
            intent,
            type,
            city,
            district,
            budget_min: Number(budgetMin),
            budget_max: Number(budgetMax),
            currency: 'XOF',
            lat: coords?.lat || 5.3482,
            lng: coords?.lng || -3.9781,
            bedrooms_min: Number(bedrooms),
            bathrooms_min: Number(bathrooms),
            surface_min: Number(surface),
            facilities: selectedFacilities,
            notes,
        };

        router.post('/api/property-requests', payload, {
            onSuccess: () => {
                setIsSubmitting(false);
                setSubmitted(true);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <motion.div variants={page} initial="initial" animate="animate" className="pb-28 lg:pb-20">
            <Head title="Demande Sur-Mesure aux Agents Vérifiés | Chic Choc Habitat" />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-28 space-y-12">
                {/* Hero Header */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                        <span>🎯</span>
                        <span>Mandat de Recherche Client · Réseau d'Agents Agréés</span>
                    </div>

                    <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-heading">
                        Déposez Votre Demande <span className="text-neon">Sur-Mesure</span>
                    </h1>

                    <p className="text-sm sm:text-base text-body/80 leading-relaxed">
                        Vous ne trouvez pas exactement le bien souhaité ? Décrivez vos critères, votre budget en XOF et votre localisation live. Nos agents agréés et vérifiés par Chic Choc Habitat vous répondront directement avec des offres vérifiées sur le terrain.
                    </p>
                </div>

                {/* Form Card or Success Confirmation */}
                <div className="glass-strong rounded-3xl border border-emerald-500/30 p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                    <div
                        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)' }}
                        aria-hidden="true"
                    />

                    {submitted ? (
                        <div className="py-12 text-center max-w-lg mx-auto space-y-4">
                            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-void mx-auto shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                                <CheckIcon className="h-8 w-8 stroke-[3]" />
                            </div>
                            <h2 className="font-display text-2xl font-bold text-heading">
                                Votre Mandat a Été Transmis aux Agents !
                            </h2>
                            <p className="text-sm text-body/85 leading-relaxed">
                                Votre demande sur-mesure a été diffusée au réseau d'agents vérifiés Chic Choc Habitat. Un agent agréé prendra en charge votre dossier et vous contactera dans votre espace client.
                            </p>
                            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                                <Button
                                    variant="primary"
                                    onClick={() => router.visit('/account')}
                                    className="bg-neon text-void font-bold"
                                >
                                    Consulter mes demandes dans mon Compte
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setSubmitted(false)}
                                >
                                    Déposer une autre demande
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Intent Switcher */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-2">
                                    Objectif de votre projet
                                </label>
                                <div className="grid grid-cols-2 gap-3 max-w-md">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIntent('sale');
                                            setBudgetMin(35000000);
                                            setBudgetMax(95000000);
                                        }}
                                        className={cn(
                                            "flex items-center justify-center gap-2 rounded-2xl py-3 px-4 font-display font-bold text-sm transition-all cursor-pointer",
                                            intent === 'sale'
                                                ? "bg-emerald-500 text-void shadow-lg shadow-emerald-500/25 scale-[1.02]"
                                                : "bg-white/[0.04] text-body/80 border border-white/10 hover:bg-white/[0.08]"
                                        )}
                                    >
                                        <span>🏷️</span>
                                        <span>Acheter un bien</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIntent('rent');
                                            setBudgetMin(350000);
                                            setBudgetMax(1200000);
                                        }}
                                        className={cn(
                                            "flex items-center justify-center gap-2 rounded-2xl py-3 px-4 font-display font-bold text-sm transition-all cursor-pointer",
                                            intent === 'rent'
                                                ? "bg-cyan-500 text-void shadow-lg shadow-cyan-500/25 scale-[1.02]"
                                                : "bg-white/[0.04] text-body/80 border border-white/10 hover:bg-white/[0.08]"
                                        )}
                                    >
                                        <span>🔑</span>
                                        <span>Louer un bien</span>
                                    </button>
                                </div>
                            </div>

                            {/* Property Type Category */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-2">
                                    Type de propriété
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                    {CATEGORIES.map((cat) => {
                                        const isSelected = type === cat.key;
                                        return (
                                            <button
                                                key={cat.key}
                                                type="button"
                                                onClick={() => setType(cat.key)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer",
                                                    isSelected
                                                        ? "bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/30"
                                                        : "bg-white/[0.03] border-white/10 text-body/80 hover:bg-white/[0.06]"
                                                )}
                                            >
                                                <span className="text-2xl mb-1">{cat.icon}</span>
                                                <span className="text-xs font-bold">{cat.label_fr}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Location & GPS Detection */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-1.5">
                                        Ville
                                    </label>
                                    <select
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full rounded-xl border border-white/15 bg-void-raised p-3 text-sm text-heading focus:border-neon focus:outline-none"
                                    >
                                        <option value="Abidjan">Abidjan</option>
                                        <option value="Bingerville">Bingerville</option>
                                        <option value="Grand-Bassam">Grand-Bassam</option>
                                        <option value="Yamoussoukro">Yamoussoukro</option>
                                        <option value="San-Pédro">San-Pédro</option>
                                        <option value="Bouaké">Bouaké</option>
                                        <option value="Assinie">Assinie</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-1.5">
                                        Quartier cible
                                    </label>
                                    <input
                                        type="text"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        placeholder="ex: Cocody Riviera Golf, Marcory Zone 4, Plateau..."
                                        className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm text-heading placeholder:text-body/30 focus:border-neon focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.02] p-3.5 border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400">
                                            <MapPinIcon className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold text-heading">Précision de recherche géographique</p>
                                            <p className="text-[0.6875rem] text-body/70">
                                                {coords ? `Position live capturée : ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Activer la géolocalisation pour cibler les biens au plus près de vous'}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleLocateMe}
                                        disabled={isLocating}
                                        className="text-xs shrink-0"
                                    >
                                        {isLocating ? 'Détection...' : coords ? '✓ Coordonnées fixées' : '📍 Utiliser ma position GPS'}
                                    </Button>
                                </div>
                            </div>

                            {/* Budget Range (XOF) */}
                            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-faint">
                                        Fourchette Budgétaire (XOF)
                                    </label>
                                    <span className="font-mono text-sm font-extrabold text-neon">
                                        {format(budgetMin, 'XOF')} — {format(budgetMax, 'XOF')}
                                    </span>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <span className="text-[0.6875rem] text-body/70 block mb-1">Budget minimum : {format(budgetMin, 'XOF')}</span>
                                        <input
                                            type="range"
                                            min={intent === 'sale' ? 10000000 : 100000}
                                            max={intent === 'sale' ? 300000000 : 5000000}
                                            step={intent === 'sale' ? 5000000 : 50000}
                                            value={budgetMin}
                                            onChange={(e) => setBudgetMin(Number(e.target.value))}
                                            className="w-full accent-emerald-500 cursor-pointer"
                                        />
                                    </div>

                                    <div>
                                        <span className="text-[0.6875rem] text-body/70 block mb-1">Budget maximum : {format(budgetMax, 'XOF')}</span>
                                        <input
                                            type="range"
                                            min={intent === 'sale' ? 20000000 : 200000}
                                            max={intent === 'sale' ? 500000000 : 10000000}
                                            step={intent === 'sale' ? 5000000 : 100000}
                                            value={budgetMax}
                                            onChange={(e) => setBudgetMax(Number(e.target.value))}
                                            className="w-full accent-emerald-500 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Specs (Bedrooms, Bathrooms, Surface) */}
                            {type !== 'Land' && (
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-1.5">
                                            Chambres min.
                                        </label>
                                        <select
                                            value={bedrooms}
                                            onChange={(e) => setBedrooms(Number(e.target.value))}
                                            className="w-full rounded-xl border border-white/15 bg-void-raised p-3 text-sm text-heading focus:border-neon focus:outline-none"
                                        >
                                            <option value={1}>1 chambre (Studio/2 pièces)</option>
                                            <option value={2}>2 chambres</option>
                                            <option value={3}>3 chambres</option>
                                            <option value={4}>4 chambres</option>
                                            <option value={5}>5+ chambres</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-1.5">
                                            Salles d'eau min.
                                        </label>
                                        <select
                                            value={bathrooms}
                                            onChange={(e) => setBathrooms(Number(e.target.value))}
                                            className="w-full rounded-xl border border-white/15 bg-void-raised p-3 text-sm text-heading focus:border-neon focus:outline-none"
                                        >
                                            <option value={1}>1 salle d'eau</option>
                                            <option value={2}>2 salles d'eau</option>
                                            <option value={3}>3 salles d'eau</option>
                                            <option value={4}>4+ salles d'eau</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-1.5">
                                            Superficie min. (m²)
                                        </label>
                                        <input
                                            type="number"
                                            value={surface}
                                            onChange={(e) => setSurface(Number(e.target.value))}
                                            placeholder="ex: 150"
                                            className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm text-heading focus:border-neon focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Facilities Checklist */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-2">
                                    Commodités & critères indispensables
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {FACILITIES_LIST.map((fac) => {
                                        const checked = selectedFacilities.includes(fac);
                                        return (
                                            <button
                                                key={fac}
                                                type="button"
                                                onClick={() => toggleFacility(fac)}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-xl p-2.5 text-xs text-left transition-all cursor-pointer border",
                                                    checked
                                                        ? "bg-emerald-500/15 border-emerald-400 text-emerald-200"
                                                        : "bg-white/[0.02] border-white/5 text-body/75 hover:bg-white/[0.05]"
                                                )}
                                            >
                                                <span className={cn(
                                                    "grid h-4 w-4 place-items-center rounded-md text-[0.625rem]",
                                                    checked ? "bg-emerald-500 text-void font-bold" : "bg-white/10"
                                                )}>
                                                    {checked ? '✓' : ''}
                                                </span>
                                                <span className="truncate">{fac}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Special notes */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-1.5">
                                    Précisions supplémentaires
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Exemple : Proximité école française, Titre Foncier impératif, facilité de paiement par traite ou prêt bancaire..."
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm text-heading placeholder:text-body/30 focus:border-neon focus:outline-none"
                                />
                            </div>

                            {/* Client Contact Info */}
                            {!user && (
                                <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-white/10">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-1">
                                            Votre Nom
                                        </label>
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="Koffi Kouamé"
                                            className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-2.5 text-sm text-heading focus:border-neon focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-1">
                                            Téléphone (WhatsApp)
                                        </label>
                                        <input
                                            type="tel"
                                            value={userPhone}
                                            onChange={(e) => setUserPhone(e.target.value)}
                                            placeholder="+225 07 00 00 00"
                                            className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-2.5 text-sm text-heading focus:border-neon focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-faint mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            placeholder="kouame@example.com"
                                            className="w-full rounded-xl border border-white/15 bg-white/[0.04] p-2.5 text-sm text-heading focus:border-neon focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Intermediation Safeguard Notice */}
                            <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/25 p-4 flex items-start gap-3 text-xs text-emerald-300">
                                <ShieldCheckIcon className="h-5 w-5 text-neon shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                    <strong className="text-emerald-100 block mb-0.5">Protection & Encadrement Chic Choc Habitat :</strong>
                                    Votre demande est diffusée aux agents agréés. Les échanges, vérifications de titres fonciers et rendez-vous sont obligatoirement supervisés par notre cellule pour éviter les fraudes et les arnaques.
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={isSubmitting}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-400 text-void font-extrabold shadow-[0_4px_24px_rgba(16,185,129,0.4)] hover:brightness-110"
                                >
                                    {isSubmitting ? 'Transmission en cours...' : 'Diffuser ma demande aux agents certifiés'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Community Live Demands List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                            <h3 className="font-display text-lg font-bold text-heading">
                                Mandats & Demandes Récents en Cours
                            </h3>
                            <p className="text-xs text-body/70">
                                Exemples de requêtes actuellement traitées et vérifiées par notre réseau.
                            </p>
                        </div>
                        <span className="rounded-full bg-neon/15 px-3 py-1 text-xs font-bold text-neon ring-1 ring-neon/30">
                            {propertyRequests.length} mandat(s) actif(s)
                        </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {propertyRequests.slice(0, 6).map((req) => (
                            <div
                                key={req.id}
                                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5 backdrop-blur-sm"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className={cn(
                                        "rounded px-2 py-0.5 text-[0.625rem] font-bold uppercase",
                                        req.intent === 'rent' ? "bg-cyan-500/20 text-cyan-300" : "bg-emerald-500/20 text-emerald-300"
                                    )}>
                                        {req.intent === 'rent' ? 'Location' : 'Achat'}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-neon">
                                        {format(req.budget_max, 'XOF')}
                                    </span>
                                </div>

                                <h4 className="font-display font-semibold text-heading text-sm">
                                    {req.type} · {req.district}, {req.city}
                                </h4>

                                <p className="text-[0.6875rem] text-body/75 line-clamp-2 italic">
                                    "{req.notes || 'Recherche active avec critères certifiés.'}"
                                </p>

                                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[0.6875rem]">
                                    <span className={cn(
                                        "font-medium",
                                        req.status === 'claimed' ? "text-emerald-400" : "text-amber-400"
                                    )}>
                                        {req.status === 'claimed' ? `✓ Pris par ${req.claimed_by_agent_name}` : '🟡 En attente d’agent'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

Demande.layout = (page) => <SiteLayout>{page}</SiteLayout>;

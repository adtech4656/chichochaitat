import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { router } from '@inertiajs/react';
import { CloseIcon, MapPinIcon, ShieldCheckIcon, CheckIcon } from './Icons';
import { Button } from './ui';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';
import { useMoney } from '../lib/money';

const FACILITY_OPTIONS = [
    { key: 'pool', label: 'Piscine privée' },
    { key: 'security', label: 'Sécurité & Gardiennage 24/7' },
    { key: 'generator', label: 'Groupe électrogène automatique' },
    { key: 'water_tank', label: 'Réserve d’eau / Suppresseur' },
    { key: 'ac', label: 'Climatisation centrale / split' },
    { key: 'parking', label: 'Garage fermé / Parking intérieur' },
    { key: 'paved_road', label: 'Accès direct voie bitumée' },
    { key: 'lagoon_view', label: 'Vue lagunaire ou mer' },
    { key: 'acd_title', label: 'Titre Foncier (TF) ou ACD obligatoire' },
];

export default function PropertyRequestModal({
    isOpen,
    onClose,
    defaultIntent = 'sale',
    defaultType = 'House',
}) {
    const { t, locale } = useTranslation();
    const { format } = useMoney();

    const [intent, setIntent] = useState(defaultIntent); // 'sale' | 'rent'
    const [type, setType] = useState(defaultType); // 'House' | 'Apartment' | 'Shop' | 'Hotel' | 'Land'
    const [city, setCity] = useState('Abidjan');
    const [district, setDistrict] = useState('Cocody Riviera');
    const [budgetMin, setBudgetMin] = useState(intent === 'rent' ? 400000 : 35000000);
    const [budgetMax, setBudgetMax] = useState(intent === 'rent' ? 1200000 : 85000000);
    const [bedrooms, setBedrooms] = useState(3);
    const [bathrooms, setBathrooms] = useState(2);
    const [surfaceMin, setSurfaceMin] = useState(150);
    const [selectedFacilities, setSelectedFacilities] = useState([
        'Sécurité & Gardiennage 24/7',
        'Groupe électrogène automatique',
    ]);
    const [notes, setNotes] = useState('');
    const [userGps, setUserGps] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const toggleFacility = (label) => {
        setSelectedFacilities((prev) =>
            prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
        );
    };

    const handleDetectLiveLocation = () => {
        if (!navigator.geolocation) {
            alert(locale === 'fr' ? 'La géolocalisation n’est pas supportée par votre navigateur.' : 'Geolocation is not supported by your browser.');
            return;
        }

        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserGps({ lat: latitude, lng: longitude });
                setGpsLoading(false);
                // In Côte d'Ivoire coordinates approx check
                if (latitude >= 5.2 && latitude <= 5.5 && longitude >= -4.1 && longitude <= -3.8) {
                    setCity('Abidjan');
                    setDistrict('Position Live GPS');
                }
            },
            () => {
                setGpsLoading(false);
                // Fallback to Abidjan Cocody if permissions denied
                setUserGps({ lat: 5.3599, lng: -3.9866 });
                setCity('Abidjan');
            },
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            intent,
            type,
            city,
            district,
            budget_min: Number(budgetMin),
            budget_max: Number(budgetMax),
            bedrooms_min: type === 'Land' || type === 'Shop' ? undefined : Number(bedrooms),
            bathrooms_min: type === 'Land' || type === 'Shop' ? undefined : Number(bathrooms),
            surface_min: Number(surfaceMin),
            facilities: selectedFacilities,
            notes,
            lat: userGps?.lat,
            lng: userGps?.lng,
        };

        try {
            const res = await fetch('/api/property-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSuccessMessage(
                    locale === 'fr'
                        ? 'Votre demande sur-mesure a été enregistrée et diffusée aux agents agréés Chic Choc Habitat.'
                        : 'Your bespoke request has been submitted and broadcast to certified Chic Choc Habitat agents.',
                );
                setTimeout(() => {
                    setSuccessMessage(null);
                    onClose();
                    router.visit('/account');
                }, 1800);
            }
        } catch (err) {
            console.error('Failed to submit request', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-void/80 backdrop-blur-xl"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-gradient-to-b from-[#0e161c] to-[#070b0e] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85)] z-10"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-white/10 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-neon/15 px-2.5 py-0.5 text-[0.6875rem] font-bold text-neon ring-1 ring-neon/30 uppercase tracking-wider">
                                    🎯 {locale === 'fr' ? 'Mandat de Recherche Client' : 'Bespoke Property Request'}
                                </span>
                                <span className="text-[0.6875rem] text-faint">Intermédiation Sécurisée</span>
                            </div>
                            <h3 className="mt-1.5 font-display text-xl font-bold tracking-tight text-heading">
                                {locale === 'fr'
                                    ? 'Déposez votre demande immobilière sur-mesure'
                                    : 'Submit your bespoke property search request'}
                            </h3>
                            <p className="mt-1 text-xs text-body/75">
                                {locale === 'fr'
                                    ? 'Nos agents de terrain certifiés recevront votre cahier des charges et vous proposeront uniquement des biens 100% audités.'
                                    : 'Our certified field agents will review your specifications and match you exclusively with 100% verified properties.'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-1.5 text-body/60 hover:bg-white/10 hover:text-heading transition-colors"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {successMessage ? (
                        <div className="py-12 text-center space-y-3">
                            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neon/15 text-neon ring-2 ring-neon/40">
                                <CheckIcon className="h-7 w-7" />
                            </div>
                            <h4 className="font-display text-lg font-bold text-heading">Demande Diffusée avec Succès</h4>
                            <p className="text-sm text-body/80 max-w-md mx-auto">{successMessage}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-5 space-y-5 max-h-[72vh] overflow-y-auto pr-1">
                            {/* Intent Selection (Acheter / Louer) */}
                            <div>
                                <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-faint mb-2">
                                    1. {locale === 'fr' ? 'Votre Intention' : 'Your Intent'}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIntent('sale');
                                            setBudgetMin(35000000);
                                            setBudgetMax(85000000);
                                        }}
                                        className={cn(
                                            'flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all',
                                            intent === 'sale'
                                                ? 'bg-emerald-500 text-[#070b0e] shadow-[0_2px_15px_rgba(16,185,129,0.4)] ring-1 ring-emerald-300'
                                                : 'bg-white/[0.04] text-body/80 hover:bg-white/[0.08] ring-1 ring-white/10',
                                        )}
                                    >
                                        <span>🏛</span>
                                        <span>{locale === 'fr' ? 'Acheter un Bien' : 'Buy a Property'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIntent('rent');
                                            setBudgetMin(400000);
                                            setBudgetMax(1200000);
                                        }}
                                        className={cn(
                                            'flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all',
                                            intent === 'rent'
                                                ? 'bg-cyan-400 text-[#070b0e] shadow-[0_2px_15px_rgba(34,211,238,0.4)] ring-1 ring-cyan-200'
                                                : 'bg-white/[0.04] text-body/80 hover:bg-white/[0.08] ring-1 ring-white/10',
                                        )}
                                    >
                                        <span>🔑</span>
                                        <span>{locale === 'fr' ? 'Louer un Bien' : 'Rent a Property'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Property Type Category */}
                            <div>
                                <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-faint mb-2">
                                    2. {locale === 'fr' ? 'Type de Propriété' : 'Property Type'}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {[
                                        { key: 'House', icon: '🏡', label: 'Villa / Maison' },
                                        { key: 'Apartment', icon: '🏢', label: 'Appartement' },
                                        { key: 'Shop', icon: '🏬', label: 'Boutique / Magasin' },
                                        { key: 'Hotel', icon: '🏨', label: 'Hôtel / Résidence' },
                                        { key: 'Land', icon: '🌿', label: 'Terrain Titré' },
                                    ].map((cat) => (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            onClick={() => setType(cat.key)}
                                            className={cn(
                                                'flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-center text-[0.6875rem] font-semibold transition-all',
                                                type === cat.key
                                                    ? 'bg-neon/15 text-neon ring-1 ring-neon/40 shadow'
                                                    : 'bg-white/[0.04] text-body/70 hover:bg-white/[0.08] ring-1 ring-white/10',
                                            )}
                                        >
                                            <span className="text-base">{cat.icon}</span>
                                            <span>{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Location & Live GPS */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-faint">
                                        3. {locale === 'fr' ? 'Localisation Souhaitée' : 'Desired Location'}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleDetectLiveLocation}
                                        disabled={gpsLoading}
                                        className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-900/90 transition-all cursor-pointer"
                                    >
                                        <MapPinIcon className="h-3 w-3 text-emerald-400" />
                                        <span>{gpsLoading ? 'Détection GPS...' : '📍 Utiliser ma position GPS en direct'}</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <select
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-heading focus:border-neon outline-none"
                                        >
                                            <option value="Abidjan" className="bg-[#090C10]">Abidjan</option>
                                            <option value="Yamoussoukro" className="bg-[#090C10]">Yamoussoukro</option>
                                            <option value="San-Pédro" className="bg-[#090C10]">San-Pédro</option>
                                            <option value="Bingerville" className="bg-[#090C10]">Bingerville</option>
                                            <option value="Grand-Bassam" className="bg-[#090C10]">Grand-Bassam</option>
                                            <option value="Assinie" className="bg-[#090C10]">Assinie</option>
                                        </select>
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            placeholder="Quartier (ex: Cocody Riviera, Zone 4, Plateau)"
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-heading placeholder-faint focus:border-neon outline-none"
                                        />
                                    </div>
                                </div>
                                {userGps && (
                                    <p className="mt-1 text-[0.625rem] text-emerald-400 font-mono">
                                        ✓ Coordonnées GPS verrouillées: {userGps.lat.toFixed(4)}°N, {Math.abs(userGps.lng).toFixed(4)}°W
                                    </p>
                                )}
                            </div>

                            {/* Budget Range */}
                            <div>
                                <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-faint mb-2">
                                    4. {locale === 'fr' ? 'Budget Prévisionnel (XOF)' : 'Budget Range (XOF)'}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[0.625rem] text-body/60 block mb-1">Minimum</span>
                                        <input
                                            type="number"
                                            value={budgetMin}
                                            onChange={(e) => setBudgetMin(Number(e.target.value))}
                                            step={intent === 'rent' ? 50000 : 5000000}
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-heading focus:border-neon outline-none"
                                        />
                                        <span className="text-[0.625rem] text-neon mt-1 block">{format(budgetMin)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[0.625rem] text-body/60 block mb-1">Maximum</span>
                                        <input
                                            type="number"
                                            value={budgetMax}
                                            onChange={(e) => setBudgetMax(Number(e.target.value))}
                                            step={intent === 'rent' ? 50000 : 5000000}
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-heading focus:border-neon outline-none"
                                        />
                                        <span className="text-[0.625rem] text-neon mt-1 block">{format(budgetMax)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bedrooms / Bathrooms / Area (if applicable) */}
                            {type !== 'Land' && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[0.625rem] text-body/60 block mb-1">Chambres min.</label>
                                        <select
                                            value={bedrooms}
                                            onChange={(e) => setBedrooms(Number(e.target.value))}
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-heading focus:border-neon outline-none"
                                        >
                                            {[1, 2, 3, 4, 5, 6].map((num) => (
                                                <option key={num} value={num} className="bg-[#090C10]">{num}+ pièces</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[0.625rem] text-body/60 block mb-1">Salles de bain</label>
                                        <select
                                            value={bathrooms}
                                            onChange={(e) => setBathrooms(Number(e.target.value))}
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-heading focus:border-neon outline-none"
                                        >
                                            {[1, 2, 3, 4].map((num) => (
                                                <option key={num} value={num} className="bg-[#090C10]">{num}+ sdb</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[0.625rem] text-body/60 block mb-1">Surface min. (m²)</label>
                                        <input
                                            type="number"
                                            value={surfaceMin}
                                            onChange={(e) => setSurfaceMin(Number(e.target.value))}
                                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-heading focus:border-neon outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Desired Facilities & Amenities */}
                            <div>
                                <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-faint mb-2">
                                    5. {locale === 'fr' ? 'Équipements & Critères Spécifiques' : 'Amenities & Facilities'}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {FACILITY_OPTIONS.map((fac) => {
                                        const isChecked = selectedFacilities.includes(fac.label);
                                        return (
                                            <button
                                                key={fac.key}
                                                type="button"
                                                onClick={() => toggleFacility(fac.label)}
                                                className={cn(
                                                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-all',
                                                    isChecked
                                                        ? 'bg-neon/15 text-heading ring-1 ring-neon/40'
                                                        : 'bg-white/[0.03] text-body/70 hover:bg-white/[0.06] ring-1 ring-white/8',
                                                )}
                                            >
                                                <span className={cn(
                                                    'grid h-4 w-4 shrink-0 place-items-center rounded-md border text-[0.65rem]',
                                                    isChecked ? 'border-neon bg-neon text-[#070b0e]' : 'border-white/20 bg-white/5',
                                                )}>
                                                    {isChecked && '✓'}
                                                </span>
                                                <span className="truncate">{fac.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Additional notes */}
                            <div>
                                <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-faint mb-1.5">
                                    6. {locale === 'fr' ? 'Détails Additionnels & Précisions' : 'Additional Notes'}
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Ex: Titre foncier impératif, préférence proximité école internationale, budget finançable sous 30 jours..."
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-heading placeholder-faint focus:border-neon outline-none"
                                />
                            </div>

                            {/* Platform Intermediation Notice */}
                            <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/30 p-3.5 flex items-start gap-3">
                                <ShieldCheckIcon className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="text-[0.6875rem] text-body/85 leading-relaxed">
                                    <strong className="text-emerald-300 font-semibold block mb-0.5">
                                        Protocole d'Intermédiation Sécurisée Chic Choc Habitat :
                                    </strong>
                                    Votre demande est transmise aux agents certifiés qui ont vérifié leurs biens sur place. Tout rendez-vous ou négociation est encadré par notre plateforme. Aucun contact direct non vérifié n’est autorisé.
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full"
                                    loading={submitting}
                                >
                                    {submitting ? 'Diffusion en cours...' : 'Diffuser ma demande aux agents certifiés'}
                                </Button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

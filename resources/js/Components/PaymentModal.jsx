import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from '../lib/i18n';
import { formatMoney } from '../lib/money';
import { CloseIcon, ShieldCheckIcon, CheckIcon } from './Icons';

export default function PaymentModal({
    isOpen,
    onClose,
    conversation,
    property,
    onPaymentSuccess,
}) {
    const { t, locale } = useTranslation();
    const { currencies, currency } = usePage().props;

    const amountXOF = conversation?.deal?.amount_due || conversation?.payment_amount || (property?.price ? Math.round(property.price * 0.1) : 500000);

    const [country, setCountry] = useState('CI');
    const [method, setMethod] = useState('mobile_money');
    const [operator, setOperator] = useState('Wave');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardName, setCardName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const countries = [
        { code: 'CI', name: 'Côte d’Ivoire', dial: '+225', flag: '🇨🇮' },
        { code: 'SN', name: 'Sénégal', dial: '+221', flag: '🇸🇳' },
        { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
        { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
        { code: 'INT', name: 'International / Diaspora', dial: '+', flag: '🌍' },
    ];

    const currentCountry = countries.find((c) => c.code === country) || countries[0];

    const mobileOperators = [
        { id: 'Wave', name: 'Wave Mobile Money', badge: '0% Frais', icon: '🌊', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
        { id: 'Orange Money', name: 'Orange Money', badge: 'Instantané', icon: '🍊', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
        { id: 'MTN MoMo', name: 'MTN Mobile Money', badge: 'MoMo Pay', icon: '🟡', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
        { id: 'Moov Money', name: 'Moov Money Flooz', badge: 'Instantané', icon: '🔵', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    ];

    const handleCountryChange = (cCode) => {
        setCountry(cCode);
        if (cCode === 'INT') {
            setMethod('card');
        } else {
            setMethod('mobile_money');
        }
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        setError('');
        setIsProcessing(true);

        try {
            const payload = {
                country,
                method,
                operator: method === 'mobile_money' ? operator : 'Visa/Mastercard',
                phoneNumber: method === 'mobile_money' ? `${currentCountry.dial} ${phoneNumber}` : '',
                cardNumber: method === 'card' ? cardNumber : '',
                cardExpiry,
                cardCvc,
                cardName,
                amount: amountXOF,
            };

            const res = await fetch(`/chat/conversations/${conversation.id}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            setIsProcessing(false);

            if (!res.ok || !data.success) {
                setError(data.error || 'Erreur lors du traitement du paiement.');
                return;
            }

            onPaymentSuccess?.(data);
            onClose();
        } catch (err) {
            setIsProcessing(false);
            setError(err.message || 'Erreur de connexion.');
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5">
            <div
                className="absolute inset-0 bg-void-deep/80 backdrop-blur-xl"
                onClick={onClose}
            />

            <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/15 bg-void-raised p-6 shadow-2xl z-10">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/20 text-neon text-lg ring-1 ring-emerald-500/30">
                            🛡️
                        </div>
                        <div>
                            <h3 className="font-display text-base sm:text-lg font-bold text-heading">
                                {t('payment.modalTitle')}
                            </h3>
                            <p className="text-xs text-neon font-semibold">
                                {t('payment.escrowSecured')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-body/75 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>
                </div>

                {/* Amount to pay banner */}
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xs text-body/80">{t('payment.amountDue')}:</span>
                        <p className="font-display text-xl sm:text-2xl font-extrabold text-neon-bright mt-0.5">
                            {amountXOF.toLocaleString('fr-FR')} XOF
                        </p>
                        {currency !== 'XOF' && (
                            <p className="text-xs text-emerald-300 font-mono mt-0.5">
                                ≈ {formatMoney(amountXOF, { targetCurrency: currency, currencies, locale })} ({t('payment.liveFx')})
                            </p>
                        )}
                    </div>
                    {property?.title && (
                        <div className="text-right max-w-[180px]">
                            <span className="text-[0.6875rem] text-body/60 uppercase tracking-wider">{t('payment.forProperty')}</span>
                            <p className="text-xs font-semibold text-heading truncate">{property.title}</p>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmitPayment} className="mt-5 space-y-4">
                    {/* Country Selector */}
                    <div>
                        <label className="block text-xs font-bold text-heading mb-1.5 uppercase tracking-wider">
                            {t('payment.selectCountry')}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {countries.map((c) => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleCountryChange(c.code)}
                                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                                        country === c.code
                                            ? 'border-neon bg-neon/15 text-heading font-bold shadow-[0_0_12px_rgba(102,187,106,0.3)]'
                                            : 'border-white/10 bg-white/[0.03] text-body/80 hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <span className="text-base">{c.flag}</span>
                                    <span className="truncate">{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                        <label className="block text-xs font-bold text-heading mb-1.5 uppercase tracking-wider">
                            {t('payment.selectMethod')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {country !== 'INT' && (
                                <button
                                    type="button"
                                    onClick={() => setMethod('mobile_money')}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                        method === 'mobile_money'
                                            ? 'border-neon bg-neon/15 text-heading ring-1 ring-neon'
                                            : 'border-white/10 bg-white/[0.03] text-body/80 hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-base">📱</span>
                                        <span className="text-[0.625rem] font-bold text-neon uppercase">Populaire</span>
                                    </div>
                                    <p className="mt-1 text-xs font-bold text-heading">Mobile Money</p>
                                    <p className="text-[0.6875rem] text-body/65">Wave, Orange, MTN, Moov</p>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setMethod('card')}
                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                    method === 'card'
                                        ? 'border-neon bg-neon/15 text-heading ring-1 ring-neon'
                                        : 'border-white/10 bg-white/[0.03] text-body/80 hover:bg-white/[0.06]'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-base">💳</span>
                                    <span className="text-[0.625rem] font-bold text-body/60 uppercase">Visa / MC</span>
                                </div>
                                <p className="mt-1 text-xs font-bold text-heading">Carte Bancaire</p>
                                <p className="text-[0.6875rem] text-body/65">Visa, Mastercard, Débit</p>
                            </button>
                        </div>
                    </div>

                    {/* Operator choices for Mobile Money */}
                    {method === 'mobile_money' && (
                        <div className="space-y-3 pt-1">
                            <label className="block text-xs font-semibold text-body/80">
                                {t('payment.chooseOperator')} :
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {mobileOperators.map((op) => (
                                    <button
                                        key={op.id}
                                        type="button"
                                        onClick={() => setOperator(op.id)}
                                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                            operator === op.id
                                                ? `${op.color} font-bold ring-1 ring-neon`
                                                : 'border-white/10 bg-white/[0.02] text-body/80 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <span className="flex items-center gap-1.5 truncate">
                                            <span>{op.icon}</span>
                                            <span>{op.name}</span>
                                        </span>
                                        <span className="text-[0.625rem] text-faint shrink-0">{op.badge}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Phone number input */}
                            <div>
                                <label className="block text-xs font-semibold text-body/80 mb-1">
                                    {t('payment.phoneNumber')} ({operator}) :
                                </label>
                                <div className="flex rounded-xl border border-white/15 bg-void overflow-hidden focus-within:border-neon focus-within:ring-1 focus-within:ring-neon">
                                    <span className="px-3 py-2.5 text-xs text-body/70 font-mono bg-white/[0.04] border-r border-white/10 flex items-center">
                                        {currentCountry.dial}
                                    </span>
                                    <input
                                        type="tel"
                                        required
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="07 00 00 00"
                                        className="w-full bg-transparent px-3 py-2.5 text-xs text-heading placeholder:text-body/40 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card fields */}
                    {method === 'card' && (
                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="block text-xs font-semibold text-body/80 mb-1">
                                    {t('payment.cardholderName')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    placeholder="Ex: Koffi Kouame"
                                    className="w-full rounded-xl border border-white/15 bg-void px-3 py-2 text-xs text-heading placeholder:text-body/40 outline-none focus:border-neon focus:ring-1 focus:ring-neon"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-body/80 mb-1">
                                    {t('payment.cardNumber')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={19}
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    placeholder="4000 1234 5678 9010"
                                    className="w-full rounded-xl border border-white/15 bg-void px-3 py-2 text-xs text-heading placeholder:text-body/40 outline-none focus:border-neon focus:ring-1 focus:ring-neon font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-body/80 mb-1">
                                        Expiration (MM/AA)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={5}
                                        value={cardExpiry}
                                        onChange={(e) => setCardExpiry(e.target.value)}
                                        placeholder="12/28"
                                        className="w-full rounded-xl border border-white/15 bg-void px-3 py-2 text-xs text-heading placeholder:text-body/40 outline-none focus:border-neon focus:ring-1 focus:ring-neon font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-body/80 mb-1">
                                        CVV / CVC
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        maxLength={4}
                                        value={cardCvc}
                                        onChange={(e) => setCardCvc(e.target.value)}
                                        placeholder="123"
                                        className="w-full rounded-xl border border-white/15 bg-void px-3 py-2 text-xs text-heading placeholder:text-body/40 outline-none focus:border-neon focus:ring-1 focus:ring-neon font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Escrow Guarantee Disclaimer */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[0.6875rem] text-emerald-300 flex items-start gap-2">
                        <ShieldCheckIcon className="h-4 w-4 text-neon shrink-0 mt-0.5" />
                        <p className="leading-tight">
                            {t('payment.escrowGuaranteeText')}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2.5 text-xs font-semibold text-body/75 hover:text-white transition-colors cursor-pointer"
                        >
                            {t('common.cancel')}
                        </button>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="flex items-center gap-2 rounded-xl bg-neon px-6 py-2.5 text-xs sm:text-sm font-bold text-void hover:bg-neon-bright hover:shadow-[0_0_20px_rgba(102,187,106,0.6)] transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-void border-t-transparent" />
                                    <span>{t('payment.processing')}</span>
                                </>
                            ) : (
                                <>
                                    <span>🔒</span>
                                    <span>{t('payment.confirmAndPay')} ({amountXOF.toLocaleString('fr-FR')} XOF)</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

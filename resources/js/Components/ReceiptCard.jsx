import { useTranslation } from '../lib/i18n';
import { formatMoney } from '../lib/money';
import { ShieldCheckIcon, CheckIcon } from './Icons';

export default function ReceiptCard({ receipt, property, isCompact = false }) {
    const { t, locale } = useTranslation();

    if (!receipt) return null;

    const formattedAmount = receipt.amount_formatted || `${(receipt.amount_paid || receipt.amount_xof || 0).toLocaleString('fr-FR')} ${receipt.currency || receipt.currency_code || 'XOF'}`;
    const txId = receipt.transaction_ref || receipt.receipt_number || receipt.transaction_id || 'TXN-CCH-ESCROW';
    const operatorName = receipt.operator_name || receipt.operator || 'Wave / Mobile Money';
    const accountIdentifier = receipt.payer_phone_or_account || receipt.account_identifier;

    return (
        <div className="w-full max-w-md my-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-emerald-500/20">
            {/* Top header badge */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <ShieldCheckIcon className="h-4 w-4 text-neon" />
                    <span>{t('payment.officialReceipt')}</span>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[0.6875rem] font-bold text-neon-bright border border-emerald-500/30">
                    {receipt.status === 'success' || receipt.status === 'completed' || receipt.status === 'escrow_secured'
                        ? (locale === 'fr' ? 'SÉQUESTRE SÉCURISÉ' : 'ESCROW FUNDED')
                        : receipt.status}
                </span>
            </div>

            {/* Receipt Body */}
            <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-baseline justify-between">
                    <span className="text-body/75">{t('payment.amountPaid')}:</span>
                    <span className="font-display text-base sm:text-lg font-extrabold text-neon-bright">
                        {formattedAmount}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-body/75">{t('payment.transactionId')}:</span>
                    <span className="font-mono text-[0.6875rem] text-heading bg-void/60 px-2 py-0.5 rounded border border-white/10 select-all">
                        {txId}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-body/75">{t('payment.method')}:</span>
                    <span className="font-semibold text-heading flex items-center gap-1">
                        <span>💳</span>
                        <span>{receipt.payment_method} ({operatorName})</span>
                    </span>
                </div>

                {accountIdentifier && (
                    <div className="flex items-center justify-between">
                        <span className="text-body/75">{t('payment.account')}:</span>
                        <span className="font-mono text-body/90 text-[0.6875rem]">
                            {accountIdentifier}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-body/75">{locale === 'fr' ? 'Horodatage' : 'Timestamp'}:</span>
                    <span className="text-body/70 text-[0.6875rem]">
                        {receipt.paid_at || new Date().toLocaleString()}
                    </span>
                </div>

                {property?.title && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[0.6875rem]">
                        <span className="text-body/60">{locale === 'fr' ? 'Bien sous contrat' : 'Property'}:</span>
                        <span className="text-heading font-medium truncate max-w-[180px]">{property.title}</span>
                    </div>
                )}
            </div>

            {/* Escrow Guarantee Disclaimer */}
            <div className="mt-3.5 rounded-xl bg-void/60 border border-emerald-500/20 p-2.5 text-[0.6875rem] text-emerald-300/90 flex items-start gap-2">
                <CheckIcon className="h-4 w-4 text-neon shrink-0 mt-0.5" />
                <p className="leading-tight">
                    {t('payment.receiptNote')}
                </p>
            </div>
        </div>
    );
}

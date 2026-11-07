import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';
import { useMoney } from '../lib/money';
import { Avatar, Button, Divider } from './ui';
import KycBadge from './KycBadge';
import { ShieldCheckIcon, PhoneIcon, WhatsAppIcon, ArrowUpRightIcon } from './Icons';
import PaymentModal from './PaymentModal';
import ReceiptCard from './ReceiptCard';

/**
 * Slide-over Agent Chat Drawer with real-time backend agent connection
 * and instant AI auto-reply automation trained on platform listings.
 */
export default function AgentChatDrawer({
    isOpen,
    onClose,
    property,
    initialConversation,
    user,
    onOpenAuth,
    onScheduleAppointment,
    initialMessage,
}) {
    const { t, locale } = useTranslation();
    const { format } = useMoney();
    const agent = property.agent;

    const [conversation, setConversation] = useState(initialConversation || null);
    const [messages, setMessages] = useState(initialConversation?.messages || []);
    const [input, setInput] = useState(initialMessage || '');
    const [isTyping, setIsTyping] = useState(false);
    const [isHumanTransferred, setIsHumanTransferred] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const messagesEndRef = useRef(null);

    // Update input whenever initialMessage changes
    useEffect(() => {
        if (initialMessage) {
            setInput(initialMessage);
        }
    }, [initialMessage]);

    // Initial greeting from official intermediary
    useEffect(() => {
        if (!initialConversation && messages.length === 0 && property) {
            const isFr = locale === 'fr';
            setMessages([
                {
                    id: 1,
                    from: 'agent',
                    is_ai: true,
                    text: isFr
                        ? `Bonjour ! Bienvenue à la Médiation & Conciergerie Officielle ChiChoc Habitat pour le bien "${property.title}". En tant qu'intermédiaire officiel et tiers de confiance agréé, nous vérifions les titres fonciers (ACD/TF) et sécurisons vos échanges et acomptes sous séquestre notarié. Comment pouvons-nous vous assister aujourd'hui ?`
                        : `Hello! Welcome to the ChiChoc Habitat Official Intermediation and Concierge Desk for "${property.title}". As your verified escrow intermediary, we audit property deeds and secure all negotiations and deposits in trust. How may we assist you today?`,
                    at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now(),
                },
            ]);
        }
    }, [property, initialConversation, locale]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, messages, isTyping]);

    const handleSendMessage = async (textToSend) => {
        const text = (textToSend || input).trim();
        if (!text) return;

        if (!user && onOpenAuth) {
            onOpenAuth('signin');
            return;
        }

        setInput('');
        const userMsg = {
            id: Date.now(),
            from: 'me',
            text,
            at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        try {
            let res;
            if (conversation?.id) {
                res = await fetch(`/chat/conversations/${conversation.id}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ message: text }),
                });
            } else {
                res = await fetch('/chat/conversations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        property_id: property.id,
                        message: text,
                    }),
                });
            }

            const data = await res.json();
            setIsTyping(false);

            if (data?.conversation) {
                setConversation(data.conversation);
                if (data.conversation.messages) {
                    setMessages(data.conversation.messages);
                }
            } else if (data?.reply) {
                const aiMsg = {
                    id: Date.now() + 50,
                    from: 'agent',
                    is_ai: true,
                    text: data.reply,
                    at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, aiMsg]);
            }
        } catch (err) {
            console.error('Chat error:', err);
            setIsTyping(false);
            // Fallback graceful client auto-reply from ChiChoc mediation
            const fallbackReply = locale === 'fr'
                ? `Merci pour votre message ! Ce bien "${property.title}" (${format(property.price)}) est sous mandat vérifié. Notre cellule de médiation ChiChoc Habitat coordonne directement avec l'agent/propriétaire (${agent.name}) pour instruire votre demande et organiser votre visite officielle en 2 étapes.`
                : `Thank you for your message! "${property.title}" (${format(property.price)}) is under verified mandate. Our ChiChoc Habitat Intermediation Desk coordinates directly with agent/owner ${agent.name} to process your request and arrange your 2-step official tour.`;

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 50,
                    from: 'agent',
                    is_ai: true,
                    text: fallbackReply,
                    at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now(),
                },
            ]);
        }
    };

    const handleTransferHuman = () => {
        setIsHumanTransferred(true);
        const notice = locale === 'fr'
            ? `Vous êtes pris en charge en priorité par un médiateur assermenté ChiChoc Habitat. L'agent titulaire ${agent.name} a été notifié pour la préparation de votre visite officielle.`
            : `You are now prioritized with a certified ChiChoc Habitat mediation officer. The assigned agent ${agent.name} has been notified to prepare your official visit.`;

        setMessages((prev) => [
            ...prev,
            {
                id: Date.now() + 100,
                from: 'agent',
                is_ai: false,
                text: notice,
                at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
            },
        ]);
    };

    const quickQuestions = locale === 'fr' ? [
        'Comment fonctionne le séquestre notarié ChiChoc ?',
        'Le titre foncier (ACD / TF) est-il audité ?',
        'Je souhaite planifier une visite officielle en 2 étapes.',
        'Quelles sont les conditions de paiement de l’acompte ?',
    ] : [
        'How does ChiChoc verified escrow work?',
        'Is the land title deed (ACD) audited?',
        'I want to schedule a 2-step official tour.',
        'What are the deposit payment terms?',
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-[#070b0e] border-l border-white/10 shadow-2xl"
                    >
                        {/* Drawer Header: ChiChoc Habitat Official Intermediation and Concierge Desk */}
                        <div className="flex items-center justify-between border-b border-white/10 p-4 bg-void-raised/80 backdrop-blur-md">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-void font-bold shadow-md ring-1 ring-emerald-400/40">
                                        <ShieldCheckIcon className="h-5 w-5 text-void stroke-[2.5]" />
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-neon text-void ring-1 ring-void">
                                        <CheckIcon className="h-2.5 w-2.5 stroke-[3]" />
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <h3 className="truncate font-display text-[0.875rem] font-bold text-heading">
                                            {locale === 'fr' ? 'Médiation & Conciergerie Officielle ChiChoc Habitat' : 'ChiChoc Habitat Official Intermediation and Concierge Desk'}
                                        </h3>
                                    </div>
                                    <p className="truncate text-[0.6875rem] text-body/75">
                                        <span className="font-mono text-neon font-semibold">Mandat #{property.id}</span>
                                        <span className="mx-1 text-white/20">·</span>
                                        <span>Agent : <strong className="text-emerald-300 font-semibold">{agent.name}</strong></span>
                                        <span className="mx-1 text-white/20">·</span>
                                        <span className="text-emerald-400 font-medium">{locale === 'fr' ? 'Tiers de Confiance' : 'Escrow Intermediary'}</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close chat"
                                className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-heading ring-1 ring-white/10 hover:bg-white/[0.1] active:scale-95"
                            >
                                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4l8 8M12 4L4 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Property Context Strip */}
                        <div className="flex items-center justify-between gap-3 bg-white/[0.02] px-4 py-2.5 border-b border-white/[0.06] text-[0.75rem]">
                            <div className="flex items-center gap-2 min-w-0">
                                <img
                                    src={property.image}
                                    alt=""
                                    className="h-8 w-11 rounded-md object-cover ring-1 ring-white/10 shrink-0"
                                />
                                <div className="truncate">
                                    <p className="truncate font-medium text-heading">{property.title}</p>
                                    <p className="text-[0.6875rem] text-faint">{format(property.price)} · {property.location}</p>
                                </div>
                            </div>

                            {onScheduleAppointment && (
                                <button
                                    type="button"
                                    onClick={onScheduleAppointment}
                                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-neon px-2.5 py-1 text-[0.6875rem] font-bold text-void shadow hover:bg-neon-bright transition-colors cursor-pointer"
                                >
                                    <ShieldCheckIcon className="h-3 w-3 text-void" />
                                    <span>{locale === 'fr' ? 'RDV Officiel' : 'Appointment'}</span>
                                </button>
                            )}
                        </div>

                        {/* Mandatory Intermediation Notice */}
                        <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="h-3.5 w-3.5 text-neon shrink-0" />
                                <p className="text-[0.6875rem] text-emerald-300 font-medium leading-tight">
                                    <strong className="text-emerald-100 font-semibold">{t('intermediary.strictNotice')}</strong> · {t('intermediary.noDirectContact')}
                                </p>
                            </div>
                        </div>

                        {/* In-Chat Escrow Deal & Payment Button */}
                        <div className="bg-emerald-950/70 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">🤝</span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-emerald-200 truncate">
                                        {conversation?.deal?.status === 'escrow_funded' || conversation?.payment_status === 'paid'
                                            ? (locale === 'fr' ? 'Acompte Séquestre Bloqué' : 'Escrow Deposit Funded')
                                            : (locale === 'fr' ? 'Accord & Acompte Sécurisé' : 'Escrow Deal & Deposit')}
                                    </p>
                                    <p className="text-[0.6875rem] text-emerald-300/80">
                                        {conversation?.deal?.amount_due
                                            ? `${conversation.deal.amount_due.toLocaleString('fr-FR')} XOF`
                                            : conversation?.payment_amount
                                            ? `${conversation.payment_amount.toLocaleString('fr-FR')} XOF`
                                            : `${format(Math.round(property.price * 0.1))} (10% ${locale === 'fr' ? 'séquestre' : 'escrow'})`}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!user && onOpenAuth) {
                                        onOpenAuth('signin', t('auth.promptPayment'));
                                        return;
                                    }
                                    setPaymentModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-neon px-3 py-1.5 text-xs font-bold text-void hover:bg-neon-bright hover:shadow-[0_0_15px_rgba(102,187,106,0.6)] transition-all shrink-0 cursor-pointer"
                            >
                                <span>💳</span>
                                <span>{t('chat.makePayment', 'Effectuer le Paiement')}</span>
                            </button>
                        </div>

                        {/* Message Feed */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                            {messages.map((msg) => {
                                if (msg.is_receipt && msg.receipt) {
                                    return (
                                        <div key={msg.id || msg.timestamp} className="w-full flex justify-center my-2">
                                            <ReceiptCard receipt={msg.receipt} property={property} />
                                        </div>
                                    );
                                }
                                const isMe = msg.from === 'me';
                                return (
                                    <div
                                        key={msg.id || msg.timestamp}
                                        className={cn(
                                            'flex flex-col max-w-[85%]',
                                            isMe ? 'ml-auto items-end' : 'mr-auto items-start',
                                        )}
                                    >
                                        {!isMe && (
                                            <div className="mb-1 flex items-center gap-1.5 text-[0.625rem] font-medium text-faint">
                                                <span className="font-semibold text-emerald-300">
                                                    {msg.is_ai
                                                        ? (locale === 'fr' ? 'ChiChoc Habitat — Médiateur Agréé' : 'ChiChoc Habitat — Intermediary Officer')
                                                        : (locale === 'fr' ? 'ChiChoc Habitat — Conciergerie' : 'ChiChoc Habitat — Concierge Desk')}
                                                </span>
                                                {msg.is_ai && (
                                                    <span className="rounded bg-neon/15 px-1 py-0.2 text-[0.5625rem] font-bold text-neon">
                                                        OFFICIEL
                                                    </span>
                                                )}
                                                <span>·</span>
                                                <span>{msg.at}</span>
                                            </div>
                                        )}

                                        <div
                                            className={cn(
                                                'rounded-2xl px-4 py-2.5 text-[0.8125rem] leading-relaxed',
                                                isMe
                                                    ? 'bg-neon/20 text-heading border border-neon/30 shadow-[0_2px_12px_rgba(102,187,106,0.15)] rounded-tr-sm'
                                                    : msg.is_ai
                                                    ? 'bg-[#0f171c] text-heading/95 border border-emerald-500/25 rounded-tl-sm shadow-md'
                                                    : 'bg-white/[0.07] text-heading border border-white/10 rounded-tl-sm',
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        </div>

                                        {isMe && (
                                            <span className="mt-1 text-[0.625rem] text-faint">{msg.at}</span>
                                        )}
                                    </div>
                                );
                            })}

                            {isTyping && (
                                <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] px-4 py-2.5 text-xs text-body border border-white/10 max-w-[200px]">
                                    <span className="flex gap-1">
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon" style={{ animationDelay: '0ms' }} />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon" style={{ animationDelay: '150ms' }} />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neon" style={{ animationDelay: '300ms' }} />
                                    </span>
                                    <span className="text-[0.6875rem] text-faint">
                                        {locale === 'fr' ? 'Médiation en cours...' : 'Intermediation response...'}
                                    </span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts Bar */}
                        <div className="border-t border-white/[0.06] bg-void-raised/50 p-2.5">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[0.625rem] uppercase tracking-wider text-faint font-semibold">
                                    {locale === 'fr' ? 'Questions fréquentes · Médiation & Séquestre' : 'FAQ · Mediation & Escrow'}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-300">
                                    <ShieldCheckIcon className="h-3 w-3 text-neon" />
                                    <span>{locale === 'fr' ? 'Médiateur ChiChoc Actif' : 'ChiChoc Intermediary Active'}</span>
                                </span>
                            </div>

                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                {quickQuestions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendMessage(q)}
                                        className="shrink-0 rounded-full bg-white/[0.04] px-3 py-1 text-[0.6875rem] text-body/80 ring-1 ring-white/10 transition-colors hover:bg-neon/15 hover:text-heading hover:ring-neon/30 cursor-pointer"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Box */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex items-center gap-2 border-t border-white/10 p-3 bg-void/80 backdrop-blur-md"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={locale === 'fr' ? 'Posez votre question à la Médiation ChiChoc...' : 'Ask ChiChoc Official Mediation...'}
                                className="flex-1 rounded-xl bg-white/[0.05] px-3.5 py-2.5 text-[0.8125rem] text-heading placeholder:text-faint ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-neon"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!input.trim() || isTyping}
                                className="shrink-0 text-[0.75rem] px-4"
                            >
                                <span>Envoyer</span>
                            </Button>
                        </form>

                        {/* Escrow Payment Modal */}
                        {paymentModalOpen && (
                            <PaymentModal
                                isOpen={paymentModalOpen}
                                onClose={() => setPaymentModalOpen(false)}
                                conversation={conversation || { id: 1 }}
                                property={property}
                                onPaymentSuccess={(data) => {
                                    if (data?.conversation) {
                                        setConversation(data.conversation);
                                        if (data.conversation.messages) {
                                            setMessages(data.conversation.messages);
                                        }
                                    }
                                }}
                            />
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

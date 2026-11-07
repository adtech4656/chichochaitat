import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ConsoleLayout from '../../Layouts/ConsoleLayout';
import MapCanvas from '../../Components/MapCanvas';
import { Avatar, Button, Divider, StatusPill } from '../../Components/ui';
import { CheckIcon, CloseIcon, MapPinIcon, ShieldCheckIcon } from '../../Components/Icons';
import { spring } from '../../lib/motion';
import { cn, formatPrice } from '../../lib/utils';

const REQUIRED_SHOTS = [
    'Front elevation',
    'Living room',
    'Kitchen',
    'Bedroom 1',
    'Bathroom 1',
    'Side elevation',
    'Street context',
    'Utility meter',
];

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_review', label: 'In review' },
    { key: 'approved', label: 'Approved' },
    { key: 'needs_info', label: 'Needs info' },
    { key: 'requests', label: 'Demandes clients' },
];

export default function Verification({ queue = [], counts = {}, propertyRequests = [] }) {
    const [tab, setTab] = useState('all');
    const [selectedId, setSelectedId] = useState(queue[0]?.property.id ?? null);
    const [activeMedia, setActiveMedia] = useState(0);
    const [note, setNote] = useState('');
    const [requestsList, setRequestsList] = useState(propertyRequests);

    const handleClaim = async (requestId) => {
        try {
            const res = await fetch(`/api/property-requests/${requestId}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ message: 'Demande prise en charge par l’administration Chic Choc Habitat.' }),
            });
            if (res.ok) {
                setRequestsList((prev) =>
                    prev.map((r) =>
                        r.id === requestId
                            ? { ...r, status: 'claimed', claimed_by_agent_name: 'Superviseur CCH' }
                            : r,
                    ),
                );
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filtered = useMemo(
        () => (tab === 'all' ? queue : queue.filter((item) => item.status === tab)),
        [queue, tab],
    );

    const selected = queue.find((item) => item.property.id === selectedId) ?? queue[0];

    if (!selected) {
        return (
            <ConsoleLayout context="Back office" title="Property verification">
                <div className="grid place-items-center py-32 text-[0.875rem] text-body/60">
                    The verification queue is empty.
                </div>
            </ConsoleLayout>
        );
    }

    const { property } = selected;
    const missingShots = selected.required_shots - selected.captured_shots;
    const missingDocs = Math.max(0, 3 - selected.documents);
    const canApprove = missingShots === 0 && missingDocs === 0 && selected.agent_kyc === 'approved';

    const handleDecision = (decision) => {
        router.post(
            `/admin/verification/${selected.property.id}/decision`,
            { decision, note },
            { preserveScroll: true },
        );
    };

    const gallery = property.gallery?.length ? property.gallery : [property.image];

    return (
        <ConsoleLayout
            context="Back office"
            title="Property verification"
            exitLabel="Exit console"
            actions={
                <span className="hidden items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-[0.6875rem] font-medium text-body/80 ring-1 ring-white/10 sm:flex">
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-neon" />
                    Technical review
                </span>
            }
        >
            <div className="mx-auto max-w-[1600px] px-5 py-5">
                {/* Filter tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {TABS.map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => setTab(option.key)}
                            className="relative rounded-full px-3.5 py-1.5 text-[0.75rem] font-medium transition-colors"
                        >
                            {tab === option.key && (
                                <motion.span
                                    layoutId="queue-tab"
                                    transition={spring}
                                    className="absolute inset-0 rounded-full bg-white/[0.09] ring-1 ring-white/15"
                                />
                            )}
                            <span className={cn('relative flex items-center gap-1.5', tab === option.key ? 'text-heading' : 'text-body/70')}>
                                {option.label}
                                <span className="rounded-full bg-white/[0.07] px-1.5 text-[0.625rem] text-faint">
                                    {counts[option.key] ?? 0}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>

                {tab === 'requests' ? (
                    <div className="mt-4 glass rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                            <div>
                                <h3 className="font-display text-lg font-bold text-heading">
                                    Demandes Immobilières & Mandats Clients Reçus
                                </h3>
                                <p className="text-xs text-body/75">
                                    Demandes vérifiées transmises par les clients avec géolocalisation live et budget certifié.
                                </p>
                            </div>
                            <span className="rounded-full bg-neon/15 px-3 py-1 text-xs font-bold text-neon ring-1 ring-neon/30">
                                {requestsList.length} demande(s) active(s)
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {requestsList.map((req) => (
                                <div
                                    key={req.id}
                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn(
                                                    "rounded px-2 py-0.5 text-[0.625rem] font-bold uppercase",
                                                    req.intent === 'rent' ? "bg-cyan-500/20 text-cyan-300" : "bg-emerald-500/20 text-emerald-300"
                                                )}>
                                                    {req.intent === 'rent' ? 'Location' : 'Achat'}
                                                </span>
                                                <span className="text-xs font-semibold text-heading">{req.type}</span>
                                            </div>
                                            <h4 className="font-display font-semibold text-heading mt-1 text-sm">
                                                {req.district}, {req.city}
                                            </h4>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono text-xs font-bold text-neon">
                                                {formatPrice(req.budget_min)} - {formatPrice(req.budget_max)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-body/70 space-y-1">
                                        <p>Client : <strong className="text-heading">{req.user_name}</strong> ({req.user_phone})</p>
                                        {req.lat && req.lng && (
                                            <p className="text-emerald-400 font-mono text-[0.6875rem]">
                                                📍 Coordonnées Live GPS : {req.lat.toFixed(4)}, {req.lng.toFixed(4)}
                                            </p>
                                        )}
                                        {req.notes && <p className="italic bg-black/30 p-2 rounded text-[0.6875rem]">"{req.notes}"</p>}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                        <span className={cn(
                                            "rounded-full px-2 py-0.5 text-[0.625rem] font-bold",
                                            req.status === 'open' ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                                        )}>
                                            {req.status === 'open' ? 'À réclamer' : `Pris par ${req.claimed_by_agent_name}`}
                                        </span>

                                        {req.status === 'open' && (
                                            <Button
                                                size="sm"
                                                className="bg-emerald-500 text-void font-bold text-xs"
                                                onClick={() => handleClaim(req.id)}
                                            >
                                                Prendre en charge
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                <div className="mt-4 grid gap-4 xl:grid-cols-[264px_minmax(0,1fr)]">
                    {/* Queue */}
                    <aside>
                        <div className="glass max-h-[calc(100dvh-11rem)] overflow-y-auto rounded-[1.25rem] p-2">
                            {filtered.map((item) => (
                                <button
                                    key={item.property.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedId(item.property.id);
                                        setActiveMedia(0);
                                    }}
                                    className={cn(
                                        'flex w-full gap-2.5 rounded-[0.8rem] p-2 text-left transition-colors',
                                        selectedId === item.property.id
                                            ? 'bg-white/[0.08] ring-1 ring-white/15'
                                            : 'hover:bg-white/[0.04]',
                                    )}
                                >
                                    <span className="h-12 w-16 shrink-0 overflow-hidden rounded-[0.5rem] bg-void-raised">
                                        <img src={item.property.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[0.75rem] font-medium text-heading">
                                            {item.property.title}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[0.625rem] text-faint">
                                            {item.property.district}
                                        </span>
                                        <span className="mt-1 flex items-center gap-1.5">
                                            <StatusPill status={item.status} />
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Split view */}
                    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                        {/* ============================ Media ============================ */}
                        <section className="space-y-4">
                            <div className="relative overflow-hidden rounded-[1.25rem] ring-1 ring-white/10">
                                <img
                                    src={gallery[activeMedia] ?? property.image}
                                    alt={`${property.title} verification media`}
                                    className="aspect-[16/10] w-full object-cover"
                                />

                                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-void/75 to-transparent" />

                                {/* GPS + timestamp overlay */}
                                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                                    <span className="flex items-center gap-1.5 rounded-full bg-void/75 px-2.5 py-1 text-[0.625rem] font-medium text-heading backdrop-blur ring-1 ring-white/15">
                                        <MapPinIcon className="h-3 w-3 text-neon" />
                                        {property.lat.toFixed(5)}, {property.lng.toFixed(5)}
                                    </span>
                                    <span className="rounded-full bg-void/75 px-2.5 py-1 text-[0.625rem] font-medium text-body backdrop-blur ring-1 ring-white/15">
                                        {selected.submitted} · 14:32
                                    </span>
                                </div>

                                <span className="absolute right-3 top-3 rounded-full bg-neon/15 px-2.5 py-1 text-[0.625rem] font-semibold text-neon ring-1 ring-neon/35 backdrop-blur">
                                    {selected.gps_delta} m from stated
                                </span>

                                <div className="absolute inset-x-3 bottom-3 flex gap-1.5">
                                    {gallery.slice(0, 4).map((image, index) => (
                                        <button
                                            key={image}
                                            type="button"
                                            onClick={() => setActiveMedia(index)}
                                            aria-label={`Verification image ${index + 1}`}
                                            className={cn(
                                                'h-11 w-16 overflow-hidden rounded-[0.5rem] ring-1 transition-all',
                                                activeMedia === index ? 'ring-2 ring-neon' : 'ring-white/20 hover:ring-white/40',
                                            )}
                                        >
                                            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {/* Video */}
                                <div className="glass relative overflow-hidden rounded-[1.1rem]">
                                    <div className="aspect-video bg-black/40" />
                                    <div className="absolute inset-0 grid place-items-center">
                                        <span className="grid h-12 w-12 place-items-center rounded-full bg-void/70 text-heading ring-1 ring-white/25 backdrop-blur">
                                            <svg viewBox="0 0 12 12" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true">
                                                <path d="M3 1.5 10 6l-7 4.5z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between text-[0.625rem]">
                                        <span className="text-heading">Walkthrough · 2:14</span>
                                        <span className="rounded-full bg-neon/15 px-2 py-0.5 font-semibold text-neon ring-1 ring-neon/30">
                                            Verified
                                        </span>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="glass rounded-[1.1rem] p-3.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[0.75rem] font-medium text-heading">Documents</p>
                                        <span className="text-[0.625rem] text-faint">{selected.documents} of 3</span>
                                    </div>

                                    <div className="mt-2.5 space-y-1.5">
                                        {['ADU certificate.pdf', 'Owner national ID.pdf', 'Proof of ownership.pdf']
                                            .slice(0, selected.documents)
                                            .map((document) => (
                                                <div
                                                    key={document}
                                                    className="flex items-center gap-2 rounded-[0.55rem] bg-white/[0.04] px-2.5 py-1.5"
                                                >
                                                    <CheckIcon className="h-3 w-3 shrink-0 text-neon" />
                                                    <span className="truncate text-[0.6875rem] text-body/85">{document}</span>
                                                </div>
                                            ))}

                                        {missingDocs > 0 && (
                                            <div className="flex items-center gap-2 rounded-[0.55rem] bg-danger/10 px-2.5 py-1.5 ring-1 ring-danger/25">
                                                <CloseIcon className="h-3 w-3 shrink-0 text-danger" />
                                                <span className="text-[0.6875rem] text-danger">
                                                    {missingDocs} document{missingDocs === 1 ? '' : 's'} missing
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* GPS comparison */}
                            <div className="glass rounded-[1.1rem] p-3.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-[0.75rem] font-medium text-heading">Captured vs stated location</p>
                                    <span className="text-[0.625rem] text-faint">
                                        Δ {selected.gps_delta} m
                                    </span>
                                </div>
                                <div className="mt-2.5">
                                    <MapCanvas
                                        height="h-48"
                                        accuracy
                                        markers={[
                                            { id: 'captured', lat: property.lat, lng: property.lng, primary: true, label: 'Captured' },
                                            { id: 'stated', lat: property.lat + 0.0004, lng: property.lng - 0.0006, label: 'Stated' },
                                        ]}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* ========================== Decision ========================== */}
                        <aside className="space-y-3">
                            <div className="glass sticky top-24 rounded-[1.25rem] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-display text-[1rem] font-semibold text-heading">
                                            {property.title}
                                        </p>
                                        <p className="mt-0.5 truncate text-[0.6875rem] text-faint">{property.location}</p>
                                    </div>
                                    <StatusPill status={selected.status} />
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <p className="font-display text-[1.0625rem] font-semibold text-heading">
                                        {formatPrice(property.price, property.currency)}
                                    </p>
                                    <span className="text-[0.625rem] uppercase tracking-wider text-faint">
                                        {property.intent_label}
                                    </span>
                                </div>

                                <Divider className="my-3" />

                                {/* Agent */}
                                <div className="flex items-center gap-2.5">
                                    <Avatar initials={property.agent.initials} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[0.75rem] font-medium text-heading">
                                            {property.agent.name}
                                        </p>
                                        <p className="truncate text-[0.625rem] text-faint">{property.agent.agency}</p>
                                    </div>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[0.5625rem] font-semibold ring-1',
                                            selected.agent_kyc === 'approved'
                                                ? 'bg-neon/12 text-neon ring-neon/30'
                                                : 'bg-caution/12 text-caution ring-caution/30',
                                        )}
                                    >
                                        KYC {selected.agent_kyc === 'approved' ? '✓' : 'pending'}
                                    </span>
                                </div>

                                <Divider className="my-3" />

                                {/* Photo checklist */}
                                <div className="flex items-center justify-between">
                                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
                                        Photo checklist
                                    </p>
                                    <span className="text-[0.625rem] text-faint">
                                        {selected.captured_shots}/{selected.required_shots}
                                    </span>
                                </div>

                                <div className="mt-2 space-y-1">
                                    {REQUIRED_SHOTS.slice(0, selected.required_shots).map((shot, index) => {
                                        const captured = index < selected.captured_shots;

                                        return (
                                            <div key={shot} className="flex items-center gap-2 text-[0.6875rem]">
                                                <span
                                                    className={cn(
                                                        'grid h-4 w-4 shrink-0 place-items-center rounded-full',
                                                        captured ? 'bg-neon/15 text-neon' : 'bg-danger/15 text-danger',
                                                    )}
                                                >
                                                    {captured ? <CheckIcon className="h-2.5 w-2.5" /> : <CloseIcon className="h-2.5 w-2.5" />}
                                                </span>
                                                <span className={captured ? 'text-body/75' : 'text-danger/90'}>{shot}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <Divider className="my-3" />

                                <label className="mb-1.5 block text-[0.6875rem] font-medium text-body/80">
                                    Internal note
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                    rows={2}
                                    placeholder="Visible to the review team only…"
                                    className="w-full resize-none rounded-[0.7rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-[0.75rem] text-heading outline-none placeholder:text-body/30 focus:border-neon"
                                />

                                <div className="mt-3 space-y-2">
                                    <Button size="md" className="w-full" disabled={!canApprove} onClick={() => handleDecision('approved')}>
                                        {canApprove ? 'Approve & publish' : 'Blocked — media incomplete'}
                                    </Button>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => handleDecision('needs_info')}>
                                            Request info
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDecision('rejected')}>
                                            Reject
                                        </Button>
                                    </div>
                                </div>

                                {!canApprove && (
                                    <p className="mt-2.5 rounded-[0.6rem] bg-caution/10 px-2.5 py-2 text-[0.625rem] leading-relaxed text-caution ring-1 ring-caution/25">
                                        Approval is locked until every mandatory shot and document is present
                                        {selected.agent_kyc !== 'approved' && ' and the agent passes KYC'}.
                                    </p>
                                )}

                                <p className="mt-3 flex items-start gap-1.5 text-[0.5625rem] leading-relaxed text-faint">
                                    <ShieldCheckIcon className="mt-px h-3 w-3 shrink-0 text-neon/60" />
                                    This decision is written to the immutable audit log and cannot be undone.
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            )}
        </div>
    </ConsoleLayout>
);
}

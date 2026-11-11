import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useCompare } from '../lib/compare';
import { useMoney } from '../lib/money';
import { useTranslation } from '../lib/i18n';
import { cn } from '../lib/utils';

export default function CompareDrawer() {
    const { items, removeFromCompare, clearCompare, drawerOpen, closeCompareDrawer } = useCompare();
    const { format } = useMoney();
    const { t, locale } = useTranslation();
    const [highlightDifferences, setHighlightDifferences] = useState(false);

    if (!drawerOpen) return null;

    const isFr = locale === 'fr';

    // Attribute comparison definition
    const attributes = [
        {
            key: 'price',
            label: isFr ? 'Prix' : 'Price',
            getValue: (item) => format(item.price) + (item.intent === 'rent' ? (isFr ? ' /mois' : ' /mo') : ''),
            getRaw: (item) => Number(item.price || 0),
        },
        {
            key: 'type',
            label: isFr ? 'Type de bien' : 'Property Type',
            getValue: (item) => item.type || (isFr ? 'Non renseigné' : 'Unspecified'),
            getRaw: (item) => item.type || '',
        },
        {
            key: 'location',
            label: isFr ? 'Commune / Quartier' : 'District / City',
            getValue: (item) => (item.district ? `${item.district}, ${item.city}` : item.city) || 'Abidjan',
            getRaw: (item) => `${item.district || ''}-${item.city || ''}`,
        },
        {
            key: 'area',
            label: isFr ? 'Superficie' : 'Living Area',
            getValue: (item) => (item.area ? `${item.area} m²` : (item.landArea ? `${item.landArea} m² (terrain)` : 'N/C')),
            getRaw: (item) => Number(item.area || item.landArea || 0),
        },
        {
            key: 'legal',
            label: isFr ? 'Statut Juridique' : 'Legal Title',
            getValue: (item) => item.hasAcd ? '✓ ACD Délivré & Notarié' : (item.titleDeed || (isFr ? 'En cours' : 'In process')),
            getRaw: (item) => Boolean(item.hasAcd),
            isBadge: true,
        },
        {
            key: 'rooms',
            label: isFr ? 'Chambres & Salles de bain' : 'Beds & Baths',
            getValue: (item) => {
                const beds = item.bedrooms ? `${item.bedrooms} ${isFr ? 'ch.' : 'beds'}` : '';
                const baths = item.bathrooms ? `${item.bathrooms} ${isFr ? 'sdb.' : 'baths'}` : '';
                return [beds, baths].filter(Boolean).join(' · ') || '—';
            },
            getRaw: (item) => `${item.bedrooms || 0}-${item.bathrooms || 0}`,
        },
        {
            key: 'gps',
            label: isFr ? 'Vérification GPS' : 'GPS Verification',
            getValue: (item) => item.isGpsVerified ? (isFr ? '✓ Relevé GPS Certifié' : '✓ Verified GPS') : (isFr ? 'En cours de relevé' : 'Pending'),
            getRaw: (item) => Boolean(item.isGpsVerified),
            isBadge: true,
        },
        {
            key: 'tour360',
            label: isFr ? 'Visite Virtuelle 360°' : '360° Virtual Tour',
            getValue: (item) => item.has360 ? (isFr ? '✓ Visite 360° Disponible' : '✓ 360° Available') : '—',
            getRaw: (item) => Boolean(item.has360),
            isBadge: true,
        },
    ];

    // Compute whether each row has differences across compared properties
    const diffMap = useMemo(() => {
        const map = {};
        if (items.length <= 1) return map;

        attributes.forEach((attr) => {
            const first = attr.getRaw(items[0]);
            map[attr.key] = items.some((item) => attr.getRaw(item) !== first);
        });
        return map;
    }, [items]);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="compare-drawer-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
                onClick={closeCompareDrawer}
                aria-hidden="true"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
                <div className="w-screen max-w-4xl bg-[#0b1015] border-l border-white/10 shadow-2xl flex flex-col text-heading">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-void-raised/95 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neon/15 border border-neon/30 text-neon flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(102,187,106,0.25)]">
                                ⚖️
                            </div>
                            <div>
                                <h2 id="compare-drawer-title" className="text-base sm:text-lg font-bold text-heading">
                                    {isFr ? 'Comparateur de Biens Vérifiés' : 'Verified Property Comparison'}
                                </h2>
                                <p className="text-xs text-body/70">
                                    {items.length === 0
                                        ? (isFr ? 'Aucune propriété sélectionnée' : 'No properties selected')
                                        : (isFr ? `${items.length} propriété(s) sur 4 max` : `${items.length} property/properties (max 4)`)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            {items.length >= 2 && (
                                <button
                                    type="button"
                                    onClick={() => setHighlightDifferences(!highlightDifferences)}
                                    className={cn(
                                        "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer",
                                        highlightDifferences
                                            ? "bg-neon/20 border-neon text-neon shadow-[0_0_12px_rgba(102,187,106,0.3)]"
                                            : "border-white/15 bg-white/5 text-body/80 hover:bg-white/10"
                                    )}
                                >
                                    {isFr ? 'Mettre en évidence les différences' : 'Highlight differences'}
                                </button>
                            )}

                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearCompare}
                                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                                >
                                    {isFr ? 'Tout effacer' : 'Clear all'}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={closeCompareDrawer}
                                className="p-2 text-body/60 hover:text-heading rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
                                    ⚖️
                                </div>
                                <h3 className="text-base font-bold text-heading mb-1">
                                    {isFr ? 'Votre comparateur est vide' : 'Your comparison is empty'}
                                </h3>
                                <p className="text-sm text-body/70 max-w-sm mb-6">
                                    {isFr
                                        ? 'Cliquez sur l’icône balance (⚖️) sur n’importe quelle annonce pour comparer instantanément les prix, superficies, titres ACD et visites virtuelles côte à côte.'
                                        : 'Click the scale icon (⚖️) on any listing card to immediately compare prices, areas, ACD status, and virtual tours side by side.'}
                                </p>
                                <Link
                                    href="/properties"
                                    onClick={closeCompareDrawer}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon text-void font-bold text-sm hover:brightness-105 transition shadow-sm"
                                >
                                    <span>{isFr ? 'Explorer les annonces vérifiées' : 'Browse verified listings'}</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Top Cards Header */}
                                <div className={cn(
                                    "grid gap-4",
                                    items.length === 1 && "grid-cols-1 max-w-sm mx-auto",
                                    items.length === 2 && "grid-cols-1 sm:grid-cols-2",
                                    items.length === 3 && "grid-cols-1 sm:grid-cols-3",
                                    items.length >= 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
                                )}>
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03] flex flex-col shadow-lg"
                                        >
                                            <div className="relative aspect-[16/10] bg-void-raised overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = '/images/hero-villa.jpg';
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCompare(item.id)}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition-colors backdrop-blur-xs cursor-pointer"
                                                    title={isFr ? 'Retirer du comparateur' : 'Remove from comparison'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                {item.isGpsVerified && (
                                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[11px] font-bold shadow-xs flex items-center gap-1 backdrop-blur-xs">
                                                        GPS Vérifié ✓
                                                    </span>
                                                )}
                                            </div>

                                            <div className="p-3.5 flex flex-col justify-between flex-1">
                                                <div>
                                                    <h4 className="font-bold text-heading text-sm line-clamp-1 mb-1" title={item.title}>
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-xs text-body/60 truncate mb-2">
                                                        {item.district ? `${item.district}, ${item.city}` : item.city}
                                                    </p>
                                                    <div className="text-base font-extrabold text-neon">
                                                        {format(item.price)}
                                                        {item.intent === 'rent' && <span className="text-xs font-normal text-body/60"> /mois</span>}
                                                    </div>
                                                </div>

                                                <Link
                                                    href={item.href || `/property/${item.id}`}
                                                    onClick={closeCompareDrawer}
                                                    className="mt-3 block w-full text-center py-2 px-3 rounded-xl bg-white/10 hover:bg-neon hover:text-void text-heading font-semibold text-xs transition cursor-pointer"
                                                >
                                                    {isFr ? 'Voir les détails' : 'View Details'}
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Side-by-Side Detailed Matrix Table */}
                                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
                                    <div className="px-4 py-3 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-neon">
                                            {isFr ? 'Tableau Comparatif des Caractéristiques' : 'Feature Comparison Matrix'}
                                        </span>
                                        {highlightDifferences && (
                                            <span className="text-[11px] text-amber-300 flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                                                {isFr ? 'Différences mises en relief' : 'Differences highlighted'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="divide-y divide-white/5">
                                        {attributes.map((attr) => {
                                            const isDifferent = diffMap[attr.key];
                                            const rowHighlight = highlightDifferences && isDifferent;

                                            return (
                                                <div
                                                    key={attr.key}
                                                    className={cn(
                                                        "p-4 transition-colors",
                                                        rowHighlight ? "bg-amber-500/10" : "hover:bg-white/[0.02]"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={cn(
                                                            "text-xs font-semibold",
                                                            rowHighlight ? "text-amber-300 font-bold" : "text-body/70"
                                                        )}>
                                                            {attr.label}
                                                            {rowHighlight && <span className="ml-1.5 text-[10px] uppercase font-bold text-amber-400">({isFr ? 'Différent' : 'Differs'})</span>}
                                                        </span>
                                                    </div>

                                                    <div className={cn(
                                                        "grid gap-4 text-xs",
                                                        items.length === 1 && "grid-cols-1",
                                                        items.length === 2 && "grid-cols-2",
                                                        items.length === 3 && "grid-cols-3",
                                                        items.length >= 4 && "grid-cols-2 lg:grid-cols-4",
                                                    )}>
                                                        {items.map((item) => (
                                                            <div
                                                                key={`${item.id}-${attr.key}`}
                                                                className={cn(
                                                                    "p-2.5 rounded-xl border",
                                                                    rowHighlight
                                                                        ? "border-amber-500/30 bg-amber-950/20 text-heading font-medium"
                                                                        : "border-white/5 bg-white/[0.03] text-heading font-normal"
                                                                )}
                                                            >
                                                                <span className="text-[10px] text-body/50 block truncate sm:hidden">
                                                                    {item.title}
                                                                </span>
                                                                <span className={cn(
                                                                    "font-semibold",
                                                                    attr.key === 'price' && "text-neon font-bold text-sm",
                                                                    attr.key === 'legal' && item.hasAcd && "text-emerald-300",
                                                                    attr.key === 'gps' && item.isGpsVerified && "text-emerald-300",
                                                                    attr.key === 'tour360' && item.has360 && "text-cyan-300",
                                                                )}>
                                                                    {attr.getValue(item)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10 bg-void-raised flex items-center justify-between">
                        <span className="text-xs text-body/60">
                            {isFr ? 'Données certifiées par l’audit juridique ChiChoc Habitat' : 'Certified data by ChiChoc Habitat legal audit'}
                        </span>
                        <button
                            type="button"
                            onClick={closeCompareDrawer}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-heading font-semibold text-xs transition cursor-pointer"
                        >
                            {isFr ? 'Fermer' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

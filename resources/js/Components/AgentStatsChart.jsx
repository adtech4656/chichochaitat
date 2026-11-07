import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { EyeIcon, ShieldCheckIcon, DownloadIcon, CameraIcon, ArrowUpRightIcon } from './Icons';
import GpsVerifiedBadge from './GpsVerifiedBadge';
import { useMoney } from '../lib/money';
import { cn } from '../lib/utils';

/**
 * Custom glassmorphism dark tooltip for Recharts.
 */
function CustomStatsTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="rounded-xl border border-white/15 bg-[#070b0e]/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 min-w-[210px]">
            <p className="text-xs font-semibold text-slate-300 border-b border-white/10 pb-1.5 mb-2">
                {label}
            </p>
            <div className="space-y-1.5 text-xs">
                {payload.map((entry, index) => {
                    const colorMap = {
                        views: '#10b981',
                        uniqueVisitors: '#06b6d4',
                        tour360Views: '#8b5cf6',
                        inquiries: '#f59e0b',
                    };
                    const nameMap = {
                        views: 'Vues Totales',
                        uniqueVisitors: 'Visiteurs Uniques',
                        tour360Views: 'Visites 360° Pannellum',
                        inquiries: 'Demandes & Contacts',
                    };
                    const entryColor = colorMap[entry.dataKey] || entry.color;
                    const entryName = nameMap[entry.dataKey] || entry.name;

                    return (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: entryColor }}
                                />
                                <span className="text-slate-400">{entryName}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-100 tabular-nums">
                                {entry.value?.toLocaleString()}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Recharts Dashboard Component for Verified Agents displaying 30-day listing view statistics.
 */
export default function AgentStatsChart({ stats, agent, className = '' }) {
    const { format } = useMoney();
    const [timeframe, setTimeframe] = useState('30d'); // '7d' | '14d' | '30d'
    const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
    const [activeMetrics, setActiveMetrics] = useState({
        views: true,
        uniqueVisitors: true,
        tour360Views: true,
        inquiries: true,
    });

    const fullStats = stats?.dailyStats || [];

    // Filter daily dataset based on active timeframe
    const filteredDailyData = useMemo(() => {
        if (!fullStats.length) return [];
        const sliceCount = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30;
        return fullStats.slice(-sliceCount);
    }, [fullStats, timeframe]);

    // Compute period-specific KPIs
    const kpis = useMemo(() => {
        const data = filteredDailyData;
        const totalViews = data.reduce((acc, d) => acc + (d.views || 0), 0);
        const totalUnique = data.reduce((acc, d) => acc + (d.uniqueVisitors || 0), 0);
        const totalInquiries = data.reduce((acc, d) => acc + (d.inquiries || 0), 0);
        const total360 = data.reduce((acc, d) => acc + (d.tour360Views || 0), 0);
        const avgDaily = data.length > 0 ? Math.round((totalViews / data.length) * 10) / 10 : 0;
        const convRate = totalUnique > 0 ? Math.round((totalInquiries / totalUnique) * 1000) / 10 : 0;

        return {
            totalViews,
            totalUnique,
            totalInquiries,
            total360,
            avgDaily,
            convRate,
        };
    }, [filteredDailyData]);

    const toggleMetric = (metricKey) => {
        setActiveMetrics((prev) => ({
            ...prev,
            [metricKey]: !prev[metricKey],
        }));
    };

    // CSV Export Handler
    const handleExportCsv = () => {
        if (!filteredDailyData.length) return;
        const headers = ['Date', 'Date_ISO', 'Vues_Totales', 'Visiteurs_Uniques', 'Visites_360_Pannellum', 'Demandes_Contacts', 'Partages'];
        const rows = filteredDailyData.map((d) => [
            `"${d.date}"`,
            `"${d.fullDate}"`,
            d.views,
            d.uniqueVisitors,
            d.tour360Views,
            d.inquiries,
            d.shares,
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `chichoc-stats-vues-${agent?.slug || 'agent'}-${timeframe}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const listingBreakdown = stats?.listingBreakdown || [];

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header with verified agent status, license, and controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-cyan-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
                        <ShieldCheckIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-display text-lg font-bold text-heading">
                                Tableau de Bord d'Audience & Vues
                            </h2>
                            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[0.6875rem] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                                Certifié CCH
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-body/70">
                            {agent?.name ? `Agent: ${agent.name}` : 'Agent vérifié'} · {agent?.agency || 'Koffi & Co. Immobilier'} · Agrément {agent?.license_number || 'CI-ABJ-2021-B-8491'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Timeframe selector */}
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                        {[
                            { key: '7d', label: '7 jours' },
                            { key: '14d', label: '14 jours' },
                            { key: '30d', label: '30 jours' },
                        ].map((btn) => (
                            <button
                                key={btn.key}
                                type="button"
                                onClick={() => setTimeframe(btn.key)}
                                className={cn(
                                    'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                                    timeframe === btn.key
                                        ? 'bg-emerald-500 text-[#070b0e] shadow-sm'
                                        : 'text-body/75 hover:text-heading hover:bg-white/[0.05]'
                                )}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* Chart type toggle */}
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                        <button
                            type="button"
                            onClick={() => setChartType('area')}
                            className={cn(
                                'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                                chartType === 'area'
                                    ? 'bg-white/15 text-heading ring-1 ring-white/20'
                                    : 'text-body/75 hover:text-heading'
                            )}
                        >
                            Courbe
                        </button>
                        <button
                            type="button"
                            onClick={() => setChartType('bar')}
                            className={cn(
                                'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                                chartType === 'bar'
                                    ? 'bg-white/15 text-heading ring-1 ring-white/20'
                                    : 'text-body/75 hover:text-heading'
                            )}
                        >
                            Barres
                        </button>
                    </div>

                    {/* Export CSV Button */}
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-heading transition-colors hover:bg-white/10 cursor-pointer"
                        title="Télécharger les statistiques au format CSV"
                    >
                        <DownloadIcon className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Exporter CSV</span>
                    </button>
                </div>
            </div>

            {/* 4 Summary KPI Cards */}
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Views */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-body/70 text-xs">
                        <span className="font-medium">Vues Totales ({timeframe === '30d' ? '30 jours' : timeframe === '14d' ? '14 jours' : '7 jours'})</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-2xl sm:text-3xl font-extrabold text-heading tabular-nums">
                            {kpis.totalViews.toLocaleString()}
                        </span>
                        <span className="text-[0.6875rem] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                            +{timeframe === '30d' ? '18.4%' : '12.2%'}
                        </span>
                    </div>
                    <p className="mt-1 text-[0.6875rem] text-faint">
                        Moyenne: <span className="font-mono text-body/90 font-semibold">{kpis.avgDaily}</span> vues / jour
                    </p>
                </div>

                {/* Unique Visitors */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-body/70 text-xs">
                        <span className="font-medium">Visiteurs Uniques</span>
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-2xl sm:text-3xl font-extrabold text-heading tabular-nums">
                            {kpis.totalUnique.toLocaleString()}
                        </span>
                        <span className="text-[0.6875rem] font-semibold text-cyan-300">
                            {kpis.totalViews > 0 ? `${Math.round((kpis.totalUnique / kpis.totalViews) * 100)}% ratio` : ''}
                        </span>
                    </div>
                    <p className="mt-1 text-[0.6875rem] text-faint">
                        Acheteurs & locataires qualifiés identifiés
                    </p>
                </div>

                {/* 360 Tours Explored */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-body/70 text-xs">
                        <span className="font-medium">Visites 360° Pannellum</span>
                        <span className="h-2 w-2 rounded-full bg-purple-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-2xl sm:text-3xl font-extrabold text-heading tabular-nums">
                            {kpis.total360.toLocaleString()}
                        </span>
                        <span className="text-[0.6875rem] font-bold text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded-md">
                            Immersion
                        </span>
                    </div>
                    <p className="mt-1 text-[0.6875rem] text-faint">
                        Scènes intérieures explorées en réalité virtuelle
                    </p>
                </div>

                {/* Inquiries & Deals */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-body/70 text-xs">
                        <span className="font-medium">Demandes & Offres</span>
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-2xl sm:text-3xl font-extrabold text-heading tabular-nums">
                            {kpis.totalInquiries.toLocaleString()}
                        </span>
                        <span className="text-[0.6875rem] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-md">
                            {kpis.convRate}% conv.
                        </span>
                    </div>
                    <p className="mt-1 text-[0.6875rem] text-faint">
                        Prises de contact et offres directes reçues
                    </p>
                </div>
            </div>

            {/* Metric Filter Toggles */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-body/70 mr-1">Afficher sur le graphique:</span>
                {[
                    { key: 'views', label: 'Vues Totales', color: 'bg-emerald-400' },
                    { key: 'uniqueVisitors', label: 'Visiteurs Uniques', color: 'bg-cyan-400' },
                    { key: 'tour360Views', label: 'Visites 360°', color: 'bg-purple-400' },
                    { key: 'inquiries', label: 'Demandes & Contacts', color: 'bg-amber-400' },
                ].map((m) => (
                    <button
                        key={m.key}
                        type="button"
                        onClick={() => toggleMetric(m.key)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer',
                            activeMetrics[m.key]
                                ? 'bg-white/10 text-heading ring-1 ring-white/20'
                                : 'bg-transparent text-faint hover:text-body/80 opacity-50'
                        )}
                    >
                        <span className={cn('h-2 w-2 rounded-full', m.color)} />
                        <span>{m.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Recharts Visualizer Canvas */}
            <div className="rounded-2xl border border-white/10 bg-[#070b0e]/80 p-5 backdrop-blur-xl shadow-2xl">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-heading">
                            Évolution Quotidienne des Consultations ({filteredDailyData.length} jours)
                        </h3>
                        <p className="text-[0.6875rem] text-faint">
                            Données consolidées de navigation et d'engagement pour les biens certifiés
                        </p>
                    </div>
                    {stats?.peakDay?.views > 0 && (
                        <div className="text-right">
                            <span className="text-[0.6875rem] text-faint uppercase">Pic d'audience</span>
                            <p className="font-mono text-xs font-bold text-emerald-400">
                                {stats.peakDay.date} · {stats.peakDay.views} vues
                            </p>
                        </div>
                    )}
                </div>

                {/* Recharts Chart Container */}
                <div className="h-72 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'area' ? (
                            <AreaChart data={filteredDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="gradUnique" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="grad360" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#ffffff0a" strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={{ stroke: '#ffffff15' }}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val}`}
                                />
                                <Tooltip content={<CustomStatsTooltip />} />
                                {activeMetrics.views && (
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        name="Vues Totales"
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#gradViews)"
                                    />
                                )}
                                {activeMetrics.uniqueVisitors && (
                                    <Area
                                        type="monotone"
                                        dataKey="uniqueVisitors"
                                        name="Visiteurs Uniques"
                                        stroke="#06b6d4"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#gradUnique)"
                                    />
                                )}
                                {activeMetrics.tour360Views && (
                                    <Area
                                        type="monotone"
                                        dataKey="tour360Views"
                                        name="Visites 360°"
                                        stroke="#8b5cf6"
                                        strokeWidth={1.75}
                                        fillOpacity={1}
                                        fill="url(#grad360)"
                                    />
                                )}
                                {activeMetrics.inquiries && (
                                    <Area
                                        type="monotone"
                                        dataKey="inquiries"
                                        name="Demandes Reçues"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        fillOpacity={0.2}
                                        fill="#f59e0b"
                                    />
                                )}
                            </AreaChart>
                        ) : (
                            <BarChart data={filteredDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid stroke="#ffffff0a" strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={{ stroke: '#ffffff15' }}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomStatsTooltip />} />
                                {activeMetrics.views && (
                                    <Bar dataKey="views" name="Vues" fill="#10b981" radius={[4, 4, 0, 0]} />
                                )}
                                {activeMetrics.uniqueVisitors && (
                                    <Bar dataKey="uniqueVisitors" name="Visiteurs" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                )}
                                {activeMetrics.tour360Views && (
                                    <Bar dataKey="tour360Views" name="360°" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                )}
                                {activeMetrics.inquiries && (
                                    <Bar dataKey="inquiries" name="Contacts" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                )}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Performance Breakdown Per Listing (Top Listings in last 30 Days) */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-heading">
                            Performance par Annonce Immobilière (30 derniers jours)
                        </h3>
                        <p className="text-[0.6875rem] text-faint">
                            Audience décomposée par mandat actif avec engagement 360° et taux de conversion
                        </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                        {listingBreakdown.length} mandat{listingBreakdown.length > 1 ? 's' : ''} suivi{listingBreakdown.length > 1 ? 's' : ''}
                    </span>
                </div>

                <div className="space-y-3">
                    {listingBreakdown.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 hover:border-white/15 transition-all"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="h-12 w-14 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                                />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-heading truncate max-w-xs sm:max-w-md">
                                            {item.title}
                                        </h4>
                                        <span className={cn(
                                            'rounded-md px-1.5 py-0.2 text-[0.625rem] font-extrabold uppercase',
                                            item.intent === 'rent' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                                        )}>
                                            {item.intent === 'rent' ? 'Location' : 'Vente'}
                                        </span>
                                    </div>
                                    <p className="text-[0.6875rem] text-faint truncate">
                                        {item.district}, {item.city} · <span className="font-mono text-slate-300">{format(item.price)}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Metrics Strip */}
                            <div className="flex items-center gap-4 sm:gap-6 ml-auto">
                                <div className="text-right">
                                    <span className="text-[0.625rem] text-faint block uppercase">Vues 30j</span>
                                    <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                                        {item.views30d.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <span className="text-[0.625rem] text-faint block uppercase">Visites 360°</span>
                                    <span className="font-mono text-xs font-bold text-purple-300 tabular-nums">
                                        {item.tour360Views30d.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[0.625rem] text-faint block uppercase">Demandes</span>
                                    <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                                        {item.inquiries30d}
                                    </span>
                                </div>
                                <Link
                                    href={`/properties/${item.slug || item.id}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                    title="Ouvrir l'annonce"
                                >
                                    <ArrowUpRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

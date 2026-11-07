import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import SiteLayout from '../../Layouts/SiteLayout';
import AgentStatsChart from '../../Components/AgentStatsChart';
import { ShieldCheckIcon } from '../../Components/Icons';
import { page } from '../../lib/motion';

export default function AgentAnalytics({ stats, agent }) {
    return (
        <motion.div variants={page} initial="initial" animate="animate" className="pb-28 lg:pb-24">
            <Head title={`Statistiques d'Audience 30 Jours — ${agent?.name || 'Agent'} | Chic Choc Habitat`} />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-28">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[0.75rem] text-faint mb-6">
                    <Link href="/" className="hover:text-heading transition-colors">
                        Accueil
                    </Link>
                    <span aria-hidden="true">/</span>
                    <Link href="/account" className="hover:text-heading transition-colors">
                        Espace Agent
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-body/80">Statistiques de Vues 30 Jours</span>
                </nav>

                {/* Agent Stats Recharts Component */}
                <AgentStatsChart stats={stats} agent={agent} />
            </div>
        </motion.div>
    );
}

AgentAnalytics.layout = (page) => <SiteLayout>{page}</SiteLayout>;

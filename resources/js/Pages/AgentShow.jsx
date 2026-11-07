import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import SiteLayout from '../Layouts/SiteLayout';
import VerifiedAgentProfile from '../Components/VerifiedAgentProfile';
import { page } from '../lib/motion';
import { useTranslation } from '../lib/i18n';

export default function AgentShow({ agent, properties = [], stats }) {
    const { t } = useTranslation();

    return (
        <motion.div variants={page} initial="initial" animate="animate" className="pb-28 lg:pb-24">
            <Head title={`${agent.name} — ${agent.agency} | Chic Choc Habitat`} />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 sm:pt-28">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-[0.75rem] text-faint mb-6" aria-label={t('prop.breadcrumb')}>
                    <Link href="/" className="transition-colors hover:text-heading">
                        {t('prop.crumbHome')}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <Link href="/properties" className="transition-colors hover:text-heading">
                        {t('agent.crumbAgents', 'Agents')}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="truncate text-body/80">{agent.name}</span>
                </nav>

                {/* Dedicated Verified Agent Profile Component */}
                <VerifiedAgentProfile
                    agent={agent}
                    recentListings={properties}
                    stats={stats}
                    variant="full"
                />
            </div>
        </motion.div>
    );
}

AgentShow.layout = (page) => <SiteLayout>{page}</SiteLayout>;

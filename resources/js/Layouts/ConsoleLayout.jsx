import { Link } from '@inertiajs/react';
import { LogoMark } from '../Components/Logo';
import { ArrowUpRightIcon } from '../Components/Icons';
import { useTranslation } from '../lib/i18n';
import { cn } from '../lib/utils';

/**
 * Full-focus shell for the agent and back-office flows.
 *
 * These screens are tasks, not marketing, so the chrome collapses to a single
 * hairline bar: where you are, who you are, and a way back out.
 */
export default function ConsoleLayout({
    title,
    subtitle,
    context,
    exitHref = '/',
    exitLabel,
    actions,
    children,
    className,
}) {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-dvh flex-col bg-void">
            <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-void/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-4">
                        <Link href="/" className="flex shrink-0 items-center gap-2.5">
                            <LogoMark className="h-8 w-8" />
                            <span className="hidden font-display text-[0.9375rem] font-semibold tracking-[-0.02em] text-heading sm:block">
                                ChiChoc<span className="text-neon">-</span>Habitat
                            </span>
                        </Link>

                        <span className="hidden h-5 w-px bg-white/12 sm:block" />

                        <div className="min-w-0">
                            <p className="truncate text-[0.625rem] font-medium uppercase tracking-[0.18em] text-faint">
                                {context ?? t('console.agentContext')}
                            </p>
                            <p className="truncate text-[0.8125rem] font-medium text-heading">
                                {title ?? subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {actions}

                        <Link
                            href={exitHref}
                            className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.75rem] font-medium text-body/75 transition-colors hover:bg-white/[0.06] hover:text-heading"
                        >
                            {exitLabel ?? t('console.exit')}
                            <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className={cn('flex-1', className)}>{children}</main>
        </div>
    );
}

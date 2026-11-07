import { router } from '@inertiajs/react';
import { cn } from '../lib/utils';

const LANGUAGES = [
    { code: 'fr', label: 'FR', name: 'Français' },
    { code: 'en', label: 'EN', name: 'English' },
];

/**
 * Segmented FR / EN control. The choice is posted to the server, which stores
 * it in a one-year cookie so the next visit opens in the same language.
 */
export default function LanguageSwitcher({ locale = 'fr', className, compact = false }) {
    const change = (code) => {
        if (code === locale) return;
        document.cookie = `locale=${code}; path=/; max-age=31536000; SameSite=Lax`;
        router.post(`/locale/${code}`, {}, { preserveScroll: true, preserveState: false });
    };

    return (
        <div
            role="group"
            aria-label="Language"
            className={cn(
                'flex items-center gap-0.5 rounded-xl bg-white/[0.05] p-0.5 ring-1 ring-white/10',
                className,
            )}
        >
            {LANGUAGES.map((language) => {
                const active = locale === language.code;

                return (
                    <button
                        key={language.code}
                        type="button"
                        onClick={() => change(language.code)}
                        aria-pressed={active}
                        aria-label={language.name}
                        className={cn(
                            'rounded-[0.6rem] px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] transition-colors',
                            active
                                ? 'bg-neon text-void'
                                : 'text-body/70 hover:bg-white/[0.07] hover:text-heading',
                        )}
                    >
                        {compact ? language.label : language.name}
                    </button>
                );
            })}
        </div>
    );
}

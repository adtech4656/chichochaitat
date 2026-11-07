import { cn } from '../lib/utils';

export const LOGO_DARK = '/assets/aistudio/Chic_Choc_Habitat_Logo__2__5ee6ccc6.png';
export const LOGO_LIGHT = '/assets/aistudio/Chic_Choc_Habitat_Logo__1__7632cf5c.png';

/**
 * Official Chic Choc Habitat mark.
 * Renders the authentic brand emblem with high resolution and crisp borders.
 */
export function LogoMark({ className = 'h-9 w-9', glow = false, alt = 'Chic Choc Habitat' }) {
    return (
        <img
            src={LOGO_DARK}
            alt={alt}
            className={cn(
                'shrink-0 object-contain rounded-lg bg-white/95 p-0.5 shadow-sm transition-transform duration-200',
                glow && 'shadow-[0_0_18px_rgba(102,187,106,0.65)]',
                className,
            )}
        />
    );
}

/**
 * Complete Wordmark with official brand badge and typography.
 */
export function Wordmark({ className, markClassName = 'h-9 w-9', showTrustBadges = false }) {
    return (
        <span className={cn('inline-flex items-center gap-2.5', className)}>
            <LogoMark className={markClassName} />
            <span className="flex flex-col text-left">
                <span className="font-display text-[1rem] font-bold tracking-tight text-heading leading-tight">
                    CHIC CHOC <span className="text-neon">HABITAT</span>
                </span>
                {showTrustBadges && (
                    <span className="text-[0.625rem] text-neon/80 font-medium tracking-wider uppercase">
                        Fiable · Sécurisé · Garantie
                    </span>
                )}
            </span>
        </span>
    );
}

/**
 * Full official logo image component.
 */
export function OfficialBrandLogo({ variant = 'dark', className = 'h-11 w-auto', alt = 'Chic Choc Habitat' }) {
    return (
        <img
            src={variant === 'light' ? LOGO_LIGHT : LOGO_DARK}
            alt={alt}
            className={cn('rounded-xl object-contain bg-white/95 p-1 shadow-md', className)}
        />
    );
}

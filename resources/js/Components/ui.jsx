import { motion } from 'framer-motion';
import { spring } from '../lib/motion';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';
import { CheckIcon } from './Icons';

/**
 * Button — the single interaction surface used across every screen.
 * Primary carries the neon glow; the other variants stay flat and quiet so
 * the accent never loses meaning.
 */
export function Button({
    as = 'button',
    variant = 'primary',
    size = 'md',
    className,
    icon: Icon,
    trailing: Trailing,
    loading = false,
    disabled = false,
    children,
    ...props
}) {
    const Component = motion[as] ?? motion.button;

    const variants = {
        primary: 'bg-neon text-void hover:neon-glow',
        secondary: 'bg-white/[0.06] text-heading ring-1 ring-white/12 hover:bg-white/[0.1]',
        outline: 'text-heading ring-1 ring-white/15 hover:bg-white/[0.06]',
        ghost: 'text-body/85 hover:bg-white/[0.06] hover:text-heading',
        danger: 'bg-danger/12 text-danger ring-1 ring-danger/30 hover:bg-danger/20',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-[0.75rem] rounded-full gap-1.5',
        md: 'px-4 py-2.5 text-[0.8125rem] rounded-full gap-2',
        lg: 'px-6 py-3.5 text-[0.875rem] rounded-full gap-2',
    };

    return (
        <Component
            whileHover={disabled || loading ? {} : { scale: 1.02 }}
            whileTap={disabled || loading ? {} : { scale: 0.98 }}
            transition={spring}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center font-semibold transition-[background-color,color,box-shadow] duration-300 disabled:cursor-not-allowed disabled:opacity-45',
                variants[variant],
                sizes[size],
                className,
            )}
            {...props}
        >
            {loading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
                Icon && <Icon className="h-4 w-4" />
            )}
            {children}
            {!loading && Trailing && <Trailing className="h-4 w-4" />}
        </Component>
    );
}

export function Chip({ active = false, className, children, ...props }) {
    return (
        <button
            type="button"
            aria-pressed={active}
            className={cn(
                'rounded-full px-3 py-1.5 text-[0.75rem] font-medium transition-colors duration-200',
                active
                    ? 'bg-neon text-void'
                    : 'bg-white/[0.05] text-body/80 ring-1 ring-white/10 hover:bg-white/[0.09] hover:text-heading',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export function VerifiedBadge({ label, className }) {
    const { t } = useTranslation();

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full bg-neon/12 px-2.5 py-1 text-[0.6875rem] font-semibold text-neon ring-1 ring-neon/25',
                className,
            )}
        >
            <CheckIcon className="h-3 w-3" />
            {label ?? t('prop.verified')}
        </span>
    );
}

export function GlassPanel({ as: Component = 'div', className, children, ...props }) {
    return (
        <Component className={cn('glass rounded-[1.35rem]', className)} {...props}>
            {children}
        </Component>
    );
}

export function SectionHeading({ eyebrow, title, description, action, className }) {
    return (
        <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
            <div>
                {eyebrow && (
                    <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-neon/80">
                        {eyebrow}
                    </p>
                )}
                <h2 className="mt-2.5 font-display text-[clamp(1.5rem,2.8vw,2.125rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-heading">
                    {title}
                </h2>
                {description && (
                    <p className="mt-2.5 max-w-xl text-[0.875rem] leading-relaxed text-body/70">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

export function Stat({ value, label, className }) {
    return (
        <div className={className}>
            <p className="font-display text-[1.375rem] font-semibold tracking-[-0.02em] text-heading">
                {value}
            </p>
            <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-faint">{label}</p>
        </div>
    );
}

export function Avatar({ initials, size = 'md', className }) {
    const sizes = {
        sm: 'h-8 w-8 text-[0.6875rem]',
        md: 'h-10 w-10 text-[0.8125rem]',
        lg: 'h-14 w-14 text-[1rem]',
    };

    return (
        <span
            className={cn(
                'grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-neon/25 to-neon/5 font-semibold text-neon ring-1 ring-neon/25',
                sizes[size],
                className,
            )}
        >
            {initials}
        </span>
    );
}

export function StatusPill({ status }) {
    const { t } = useTranslation();

    const map = {
        pending: ['status.pending', 'text-caution bg-caution/10 ring-caution/25'],
        in_review: ['status.inReview', 'text-caution bg-caution/10 ring-caution/25'],
        approved: ['status.approved', 'text-neon bg-neon/10 ring-neon/25'],
        rejected: ['status.rejected', 'text-danger bg-danger/10 ring-danger/25'],
        needs_info: ['status.needsInfo', 'text-caution bg-caution/10 ring-caution/25'],
        open: ['status.open', 'text-neon bg-neon/10 ring-neon/25'],
        closed: ['status.closed', 'text-body/70 bg-white/[0.05] ring-white/12'],
        accepted: ['status.accepted', 'text-neon bg-neon/10 ring-neon/25'],
    };

    const [labelKey, tone] = map[status] ?? map.pending;

    return (
        <span className={cn('rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ring-1', tone)}>
            {t(labelKey)}
        </span>
    );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div className={cn('glass flex flex-col items-center gap-3 rounded-[1.35rem] px-6 py-14 text-center', className)}>
            {Icon && (
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-neon/80 ring-1 ring-white/10">
                    <Icon className="h-5 w-5" />
                </span>
            )}
            <p className="font-display text-[1.0625rem] font-medium text-heading">{title}</p>
            {description && (
                <p className="max-w-sm text-[0.8125rem] leading-relaxed text-body/65">{description}</p>
            )}
            {action}
        </div>
    );
}

export function Divider({ className }) {
    return <div className={cn('h-px w-full bg-white/[0.08]', className)} />;
}

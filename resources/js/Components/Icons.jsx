/**
 * Inline icon set — no icon-font dependency, inherits currentColor.
 * All icons are 24×24 with a 1.75 stroke for an SF-Symbols-like weight.
 */

const base = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
};

export function MapPinIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.6" />
        </svg>
    );
}

export function HeartIcon({ filled = false, ...props }) {
    return (
        <svg {...base} {...props} fill={filled ? 'currentColor' : 'none'}>
            <path d="M12 20.2s-7.4-4.6-7.4-9.6a4.2 4.2 0 0 1 7.4-2.7 4.2 4.2 0 0 1 7.4 2.7c0 5-7.4 9.6-7.4 9.6Z" />
        </svg>
    );
}

export function ArrowUpRightIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M7 17 17 7M9 7h8v8" />
        </svg>
    );
}

export function SearchIcon(props) {
    return (
        <svg {...base} {...props}>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
        </svg>
    );
}

export function CloseIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="m6 6 12 12M18 6 6 18" />
        </svg>
    );
}

export function EyeIcon({ open = true, ...props }) {
    return (
        <svg {...base} {...props}>
            {open ? (
                <>
                    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            ) : (
                <>
                    <path d="M4 4l16 16" />
                    <path d="M9.9 5.2A9.9 9.9 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3 4.1M6.2 7.4A17 17 0 0 0 2.5 12S6 19 12 19a9.7 9.7 0 0 0 4-.9" />
                </>
            )}
        </svg>
    );
}

export function ShieldCheckIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M12 3.2 5 6v6c0 4.4 3 7.9 7 8.8 4-.9 7-4.4 7-8.8V6l-7-2.8Z" />
            <path d="m9 12 2.2 2.2L15.4 10" />
        </svg>
    );
}

export function CameraIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M4 8.5h2.5l1.3-2h8.4l1.3 2H20a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17v-7A1.5 1.5 0 0 1 4 8.5Z" />
            <circle cx="12" cy="13" r="3.2" />
        </svg>
    );
}

export function ChevronDownIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="m6 9.5 6 6 6-6" />
        </svg>
    );
}

export function MenuIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
    );
}

export function CheckIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="m5 12.5 4.2 4.2L19 7" />
        </svg>
    );
}

export function AppleIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.8 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-1-2.4-3.5ZM14.2 5.6c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.7-1.3Z" />
        </svg>
    );
}

export function GoogleIcon(props) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.7-5.5 3.7-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.7S6.9 21.4 12 21.4c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12Z" />
        </svg>
    );
}

export function UserIcon(props) {
    return (
        <svg {...base} {...props}>
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
    );
}

export function PhoneIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    );
}

export function MailIcon(props) {
    return (
        <svg {...base} {...props}>
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

export function WhatsAppIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.78 14.07c-.24.68-1.2 1.26-1.68 1.34-.45.08-1.04.14-3-.67-2.52-1.03-4.14-3.59-4.27-3.76-.12-.17-1.02-1.36-1.02-2.6 0-1.23.65-1.84.88-2.09.23-.25.5-.31.67-.31.17 0 .34 0 .49.01.16.01.37-.06.58.44.22.52.74 1.8.8 1.93.07.13.11.29.02.46-.08.17-.13.28-.25.43-.13.15-.27.33-.38.45-.13.13-.26.27-.11.53.15.25.66 1.09 1.42 1.76.98.87 1.81 1.14 2.06 1.27.26.13.41.11.56-.07.15-.17.65-.76.82-1.02.17-.26.35-.22.58-.13.24.08 1.5.71 1.76.84.26.13.43.2.49.31.06.11.06.66-.18 1.34z" />
        </svg>
    );
}

export function StarIcon({ filled = true, ...props }) {
    return (
        <svg {...base} {...props} fill={filled ? 'currentColor' : 'none'}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

export function BuildingIcon(props) {
    return (
        <svg {...base} {...props}>
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
        </svg>
    );
}

export function BellIcon({ filled = false, ...props }) {
    return (
        <svg {...base} {...props} fill={filled ? 'currentColor' : 'none'}>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    );
}

export function ChartBarIcon(props) {
    return (
        <svg {...base} {...props}>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
            <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
    );
}

export function DownloadIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}



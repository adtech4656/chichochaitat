import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import SiteLayout from '../Layouts/SiteLayout';
import { useTranslation } from '../lib/i18n';
import { page as pageMotion } from '../lib/motion';

/**
 * Renders admin-authored content.
 *
 * The body is sanitised server-side on save, but it is sanitised again here as
 * defence in depth: rows written before the sanitizer existed, or via a direct
 * database write, must not be able to execute script on the shared origin.
 */
const ALLOWED_TAGS = new Set([
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre',
    'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li', 'a', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

const ALLOWED_ATTRS = { a: ['href', 'title', 'rel'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'] };

const SAFE_SCHEMES = ['http:', 'https:', 'mailto:'];

function sanitizeNode(node) {
    const children = Array.from(node.childNodes);

    for (const child of children) {
        if (child.nodeType === Node.COMMENT_NODE) {
            node.removeChild(child);
            continue;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) continue;

        const tag = child.tagName.toLowerCase();

        if (!ALLOWED_TAGS.has(tag)) {
            const dangerous = ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form'];

            if (dangerous.includes(tag)) {
                node.removeChild(child);
                continue;
            }

            // Unwrap unknown tags: keep the text, discard the markup.
            while (child.firstChild) node.insertBefore(child.firstChild, child);
            node.removeChild(child);
            continue;
        }

        const allowed = ALLOWED_ATTRS[tag] ?? [];

        for (const attribute of Array.from(child.attributes)) {
            if (!allowed.includes(attribute.name.toLowerCase())) {
                child.removeAttribute(attribute.name);
                continue;
            }

            if (attribute.name.toLowerCase() === 'href') {
                const value = attribute.value.trim();

                try {
                    const parsed = new URL(value, window.location.origin);

                    if (!SAFE_SCHEMES.includes(parsed.protocol)) {
                        child.removeAttribute('href');
                        continue;
                    }

                    if (parsed.origin !== window.location.origin) {
                        child.setAttribute('rel', 'noopener noreferrer nofollow');
                    }
                } catch {
                    child.removeAttribute('href');
                }
            }
        }

        sanitizeNode(child);
    }
}

function toHtml(body = '') {
    if (typeof window === 'undefined') return '';

    const template = document.createElement('template');
    template.innerHTML = String(body);
    sanitizeNode(template.content);

    return template.innerHTML;
}

export default function Page({ page }) {
    const { t } = useTranslation();

    return (
        <motion.div variants={pageMotion} initial="initial" animate="animate">
            <article className="mx-auto max-w-3xl px-6 pt-32 sm:pt-36">
                <nav className="flex items-center gap-2 text-[0.75rem] text-faint" aria-label={t('prop.breadcrumb')}>
                    <Link href="/" className="transition-colors hover:text-heading">
                        {t('prop.crumbHome')}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-body/80">{page.title}</span>
                </nav>

                <header className="mt-6 border-b border-white/[0.08] pb-8">
                    <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-neon/80">
                        {page.group === 'legal' ? t('footer.legal') : page.group === 'trust' ? t('footer.trust') : t('footer.company')}
                    </p>
                    <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-heading">
                        {page.title}
                    </h1>
                    {page.updated_at && (
                        <p className="mt-3 text-[0.75rem] text-faint">{t('page.updated', { date: page.updated_at })}</p>
                    )}
                </header>

                <div
                    className="prose-cch mt-8 pb-10"
                    dangerouslySetInnerHTML={{ __html: toHtml(page.body) }}
                />

                <div className="glass mb-16 flex flex-wrap items-center justify-between gap-4 rounded-[1.35rem] p-5">
                    <div>
                        <p className="font-display text-[0.9375rem] font-semibold text-heading">
                            {t('page.ctaTitle')}
                        </p>
                        <p className="mt-1 text-[0.8125rem] text-body/65">
                            {t('page.ctaCopy')}
                        </p>
                    </div>
                    <Link
                        href="/pages/contact"
                        className="rounded-full bg-neon px-4 py-2 text-[0.8125rem] font-semibold text-void transition-shadow hover:neon-glow"
                    >
                        {t('page.ctaButton')}
                    </Link>
                </div>
            </article>
        </motion.div>
    );
}

Page.layout = (pageContent) => <SiteLayout>{pageContent}</SiteLayout>;

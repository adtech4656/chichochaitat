import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import 'leaflet/dist/leaflet.css';

const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });

function getInitialPage() {
    if (typeof window === 'undefined') return undefined;

    const scriptEl = document.querySelector('script[data-page="app"][type="application/json"]');
    if (scriptEl?.textContent) {
        try {
            return JSON.parse(scriptEl.textContent);
        } catch (e) {
            console.error('Failed to parse script data-page', e);
        }
    }

    const appEl = document.getElementById('app');
    if (appEl?.dataset?.page) {
        try {
            return JSON.parse(appEl.dataset.page);
        } catch (e) {
            console.error('Failed to parse app dataset page', e);
        }
    }

    return undefined;
}

const initialPage = getInitialPage();

createInertiaApp({
    title: (title) => (title ? `${title} — ChiChoc-Habitat` : 'ChiChoc-Habitat'),

    page: initialPage,

    resolve: (name) => {
        const page = pages[`./Pages/${name}.jsx`];

        if (!page) {
            throw new Error(`Inertia page not found: ${name}`);
        }

        return page;
    },

    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },

    progress: {
        color: '#66BB6A',
        showSpinner: false,
    },
});

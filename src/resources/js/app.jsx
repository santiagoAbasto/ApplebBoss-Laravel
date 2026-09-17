import './polyfills';
import '../css/app-vite.css';
import './bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-phone-number-input/style.css';
import 'flag-icons/css/flag-icons.min.css';
import { route } from 'ziggy-js';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    // Las páginas públicas ya traen el título completo desde SEO por página; solo se agrega la marca si falta.
    title: (title) => (!title ? appName : title.includes(appName) ? title : `${title} - ${appName}`),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#0f3d2e',
        delay: 150,
    },
});

import { Head, usePage } from '@inertiajs/react';

/**
 * Metaetiquetas de la página pública actual. La fuente es el servidor (App\Support\Seo):
 * el admin las edita en Marketing y SEO → SEO por página. Las mismas etiquetas ya vienen
 * renderizadas en app.blade.php; este componente las mantiene al navegar sin recargar.
 */
export default function SeoHead() {
    const { seo } = usePage().props;
    if (!seo) return null;

    return (
        <Head>
            <title>{seo.title}</title>
            {seo.description && <meta head-key="description" name="description" content={seo.description} />}
            <meta head-key="robots" name="robots" content={seo.robots} />
            <link head-key="canonical" rel="canonical" href={seo.canonical} />
            <meta head-key="og:site_name" property="og:site_name" content={seo.site_name} />
            <meta head-key="og:locale" property="og:locale" content="es_BO" />
            <meta head-key="og:type" property="og:type" content={seo.type} />
            <meta head-key="og:title" property="og:title" content={seo.title} />
            {seo.description && <meta head-key="og:description" property="og:description" content={seo.description} />}
            <meta head-key="og:url" property="og:url" content={seo.url} />
            {seo.image && <meta head-key="og:image" property="og:image" content={seo.image} />}
            <meta head-key="twitter:card" name="twitter:card" content={seo.image ? 'summary_large_image' : 'summary'} />
            <meta head-key="twitter:title" name="twitter:title" content={seo.title} />
            {seo.description && <meta head-key="twitter:description" name="twitter:description" content={seo.description} />}
            {seo.image && <meta head-key="twitter:image" name="twitter:image" content={seo.image} />}
        </Head>
    );
}

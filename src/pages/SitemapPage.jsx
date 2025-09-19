import React from 'react';
import { Helmet } from 'react-helmet';

const SitemapPage = () => {
    const baseUrl = window.location.origin;

    const staticPages = [
        { path: '/', priority: '1.00', lastmod: '2025-08-01' },
        { path: '/about-us', priority: '0.80', lastmod: '2025-08-01' },
        { path: '/track-report', priority: '0.80', lastmod: '2025-08-01' },
        { path: '/submit-report', priority: '0.80', lastmod: '2025-08-01' },
        { path: '/pricing', priority: '0.80', lastmod: '2025-08-01' },
        { path: '/faq', priority: '0.80', lastmod: '2025-08-01' },
        { path: '/login', priority: '0.64', lastmod: '2025-08-01' },
        { path: '/register', priority: '0.64', lastmod: '2025-08-01' },
        { path: '/privacy-policy', priority: '0.50', lastmod: '2025-08-01' },
        { path: '/terms-of-service', priority: '0.50', lastmod: '2025-08-01' },
        { path: '/disclaimer', priority: '0.50', lastmod: '2025-08-01' },
        { path: '/contact', priority: '0.50', lastmod: '2025-08-01' },
    ];

    const renderSitemap = () => {
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`;
        
        return (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'inherit', background: 'inherit', fontFamily: 'monospace' }}>
                {sitemapContent}
            </pre>
        );
    };

    return (
        <>
            <Helmet>
                <title>Sitemap - WhistleBlower.ng</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <div className="bg-background text-foreground min-h-screen p-4 md:p-8">
                {renderSitemap()}
            </div>
        </>
    );
};

export default SitemapPage;
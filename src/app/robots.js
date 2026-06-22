import { getSiteUrl } from '@/lib/siteConfig';

export default function robots() {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/home', '/calendar', '/tasks', '/analysis', '/focus', '/settings', '/o', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

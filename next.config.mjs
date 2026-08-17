/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok.io'],
  }),
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'thryvloop.com' }],
        destination: 'https://www.thryvloop.com/:path*',
        permanent: true,
      },
      {
        source: '/analysis',
        destination: '/analytics',
        permanent: true,
      },
      {
        source: '/analysis/:path*',
        destination: '/analytics/:path*',
        permanent: true,
      },
      {
        source: '/api/analysis/:path*',
        destination: '/api/analytics/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

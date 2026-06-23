import { Inter } from 'next/font/google';

/** Neo-grotesque sans for the marketing landing page (Inter-style). */
export const landingFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
});

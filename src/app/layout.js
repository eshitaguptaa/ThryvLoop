import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Poppins } from 'next/font/google';
import AppSessionProviders from '@/components/AppSessionProviders';
import ThemeProvider from '@/components/ThemeProvider';
import { NEXT_THEMES_STORAGE_KEY } from '@/lib/themePreferences';

const themeInitScript = `(function(){try{var k=${JSON.stringify(NEXT_THEMES_STORAGE_KEY)};var t=localStorage.getItem(k);var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d)r.classList.add('dark');else r.classList.remove('dark');}catch(e){}})();`;

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: 'ThryvLoop - Your Personal Productivity Hub',
  description: 'Transform your workspace with immersive ambience, intelligent task management, seamless integrations, and powerful analytics.',
  icons: {
    icon: '/LandingPageImages/logo.png',
    shortcut: '/LandingPageImages/logo.png',
    apple: '/LandingPageImages/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${poppins.className} ${poppins.variable} bg-background text-foreground`}>
        <ThemeProvider>
          <ClerkProvider>
            <AppSessionProviders>{children}</AppSessionProviders>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Poppins } from 'next/font/google';
import AppSessionProviders from '@/components/AppSessionProviders';
import ThemeProvider from '@/components/ThemeProvider';
import { NEXT_THEMES_STORAGE_KEY } from '@/lib/themePreferences';

const themeInitScript = `(function(){try{var k=${JSON.stringify(NEXT_THEMES_STORAGE_KEY)};var t=localStorage.getItem(k);var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.style.colorScheme='dark';}else{r.classList.remove('dark');r.style.colorScheme='light';}}catch(e){}})();`;

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: {
    default: 'ThryvLoop — The unified digital workspace for people and companies',
    template: '%s | ThryvLoop',
  },
  description:
    'ThryvLoop transforms digital workspaces for companies and individuals—one hub for focus, tasks, calendar, analytics, and ambience. No app-hopping. Measurable productivity gains.',
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100..700,0..1,-50..200&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${poppins.className} ${poppins.variable} bg-background text-foreground`}>
        <ThemeProvider>
          <ClerkProvider
            signInUrl="/?auth=signin"
            signUpUrl="/?auth=signup"
            signInFallbackRedirectUrl="/home"
            signUpFallbackRedirectUrl="/home"
            afterSignOutUrl="/"
            allowedRedirectOrigins={[
              'https://www.thryvloop.com',
              'https://thryvloop.com',
            ]}
          >
            <AppSessionProviders>{children}</AppSessionProviders>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

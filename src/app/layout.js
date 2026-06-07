import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Poppins } from 'next/font/google';
import AppSessionProviders from '@/components/AppSessionProviders';
import ThemeProvider from '@/components/ThemeProvider';

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

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} ${poppins.variable}`}>
        <ThemeProvider>
          <ClerkProvider>
            <AppSessionProviders>{children}</AppSessionProviders>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

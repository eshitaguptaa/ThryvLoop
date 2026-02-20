import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: 'ThryvLoop - Your Personal Productivity Hub',
  description: 'Transform your workspace with immersive ambience, intelligent task management, seamless integrations, and powerful analytics.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} ${poppins.variable}`}>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

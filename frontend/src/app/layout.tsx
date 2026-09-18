import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { SiteNav } from '@/components/layout/site-nav';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Embat Pulse — salud financiera mensual de la cartera',
  description:
    'Score X-Ray 0-100, trayectoria, régimen y línea de circulante dinámica sobre 1.286 pymes.',
};

/**
 * Wraps every page with the shared navigation and typography.
 *
 * @param props - The routed page.
 * @returns The HTML document shell in Spanish.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <SiteNav />
        {children}
      </body>
    </html>
  );
}

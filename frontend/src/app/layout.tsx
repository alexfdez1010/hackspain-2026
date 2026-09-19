import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';

import { SiteNav } from '@/components/layout/site-nav';
import { AssistantWidget } from '@/components/assistant/assistant-widget';
import { getAssistantMode } from '@/lib/assistant/config';
import './globals.css';
import '@/styles/nexo.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/** Resolve assistant credentials at request time, including keys added after a build. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Embat Pulse — salud financiera mensual de la cartera',
  description:
    'Score PULSE 0-100 con 11 variables en 4 pilares, historia mensual y previsión a seis meses sobre 1.285 pymes.',
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
        <Suspense fallback={null}>
          <SiteNav />
        </Suspense>
        {children}
        <AssistantWidget mode={getAssistantMode()} />
      </body>
    </html>
  );
}

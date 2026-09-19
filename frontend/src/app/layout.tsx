import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { inter } from '@/lib/fonts';
import './globals.css';
import '@/styles/nexo.css';

/** Lets the fixed launcher and the bottom sheet respect the safe areas of a phone. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Embat Pulse — salud financiera mensual de la cartera',
  description:
    'Score PULSE 0-100 con 11 variables en 4 pilares, historia mensual y previsión a seis meses sobre 1.285 pymes.',
};

/**
 * Wraps every page with typography. Product routes add their own nav.
 *
 * @param props - The routed page.
 * @returns The HTML document shell in Spanish.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

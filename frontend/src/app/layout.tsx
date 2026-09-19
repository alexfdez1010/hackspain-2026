import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { aktivGrotesk, dmSans } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Embat Pulse — salud financiera mensual de la cartera',
  description:
    'Score X-Ray 0-100, trayectoria, régimen y línea de circulante dinámica sobre 1.286 pymes.',
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
    <html lang="es" className={`${dmSans.variable} ${aktivGrotesk.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

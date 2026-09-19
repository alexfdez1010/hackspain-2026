import { DM_Sans } from 'next/font/google';
import localFont from 'next/font/local';

/**
 * Body, tables, links and highlighted figures.
 *
 * 400 is running text, 500 is emphasis (`font-medium`) and 600 is the
 * prominent numeric figures (`font-semibold`).
 */
export const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

/**
 * Display face for titles. Files live under `src/fonts/aktiv-grotesk/`.
 *
 * Medium is 500 (`h3`). Bold is registered as both 600 and 700 so
 * `font-semibold` and `font-bold` resolve to a real cut, not a synthetic
 * weight — the family has no SemiBold file.
 */
export const aktivGrotesk = localFont({
  src: [
    {
      path: '../fonts/aktiv-grotesk/AktivGrotesk-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/aktiv-grotesk/AktivGrotesk-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/aktiv-grotesk/AktivGrotesk-Bold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/aktiv-grotesk/AktivGrotesk-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-aktiv',
  display: 'swap',
});

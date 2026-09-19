import localFont from 'next/font/local';

/**
 * The single family of the product: headings, body, tables and figures.
 *
 * Haffer SQ XH is the grotesque embat.io sets its whole site in, self-hosted
 * from the two cuts that site ships: 400 for running text and 500 for
 * labels, emphasis and headings. The 600 the type scale names resolves to
 * the 500 file on purpose, so the browser never synthesises a faux bold;
 * there is no 700 anywhere in the design.
 */
export const haffer = localFont({
  variable: '--font-haffer',
  display: 'swap',
  src: [
    { path: '../fonts/haffer-sqxh-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/haffer-sqxh-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/haffer-sqxh-500.woff2', weight: '600', style: 'normal' },
  ],
});

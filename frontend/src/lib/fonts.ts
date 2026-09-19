import { Inter } from 'next/font/google';

/**
 * The single family of the product: headings, body, tables and figures.
 *
 * The brand stack is Aeonik → General Sans → Inter; Inter is the cut the
 * design prototype loads and the only one licensed here. Three weights are
 * enough for the whole scale: 400 running text, 500 labels and emphasis, 600
 * headings and figures. There is no bold: 700 never appears in the design.
 */
export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

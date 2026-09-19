import { redirect } from 'next/navigation';

/**
 * Legacy entry point of the portfolio, kept so bookmarks and the links written
 * before the portfolio moved to `/` keep working.
 *
 * @returns Never; the request is redirected to the portfolio.
 */
export default function PulseIndexPage(): never {
  redirect('/');
}

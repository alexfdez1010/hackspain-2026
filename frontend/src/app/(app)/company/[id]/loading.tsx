import { PageSkeleton } from '@/components/layout/page-skeleton';

/**
 * Streamed under the product nav while any page of a company reads its
 * data, so a slow route shows the shape of the page at once instead of a
 * blank screen or the previous page frozen.
 *
 * It sits under the company layout on purpose: the layout answers 404 for
 * an unknown company before this boundary flushes, so the status code of
 * the response stays honest.
 *
 * @returns The page skeleton.
 */
export default function Loading() {
  return <PageSkeleton />;
}

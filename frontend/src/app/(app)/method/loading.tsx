import { PageSkeleton } from '@/components/layout/page-skeleton';

/**
 * Streamed under the product nav while the method page reads the export,
 * so the route never looks frozen while it loads.
 *
 * @returns The page skeleton.
 */
export default function Loading() {
  return <PageSkeleton />;
}

/**
 * Entry point of the PULSE Advisor data layer.
 *
 * Pages import `getAdvisorDataSource()` from here and never touch the
 * filesystem or `fetch` directly: with `PULSE_API_URL` (or the legacy
 * `XRAY_API_URL`) set, `/api/pulse/recommendations` is read from the FastAPI
 * service; otherwise the JSON bundled in `src/data/pulse/recommendations`.
 */
export {
  createAdvisorDataSource,
  getAdvisorDataSource,
} from '@/lib/advisor/source/factory';
export { ApiAdvisorSource } from '@/lib/advisor/source/api';
export { StaticAdvisorSource } from '@/lib/advisor/source/static-json';
export type { AdvisorDataSource } from '@/lib/advisor/source/types';
export type * from '@/lib/advisor/types';

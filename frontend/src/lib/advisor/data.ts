/**
 * Entry point of the PULSE Advisor data layer.
 *
 * Pages import `getAdvisorDataSource()` from here and never touch the
 * filesystem directly. The store is always the JSON export bundled in
 * `src/data/pulse/recommendations`, regenerated from the backend pipeline.
 */
export {
  createAdvisorDataSource,
  getAdvisorDataSource,
} from '@/lib/advisor/source/factory';
export { StaticAdvisorSource } from '@/lib/advisor/source/static-json';
export type { AdvisorDataSource } from '@/lib/advisor/source/types';
export type * from '@/lib/advisor/types';

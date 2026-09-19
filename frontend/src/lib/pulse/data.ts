/**
 * Entry point of the PULSE data layer.
 *
 * Pages import `getPulseDataSource()` from here and never touch the filesystem
 * directly. The store is always the JSON export bundled in `src/data/pulse`,
 * regenerated from the backend pipeline, so nothing runs at request time.
 */
export {
  createPulseDataSource,
  getPulseDataSource,
} from '@/lib/pulse/source/factory';
export { StaticPulseSource } from '@/lib/pulse/source/static-json';
export type { PulseDataSource } from '@/lib/pulse/source/types';
export type {
  PulseCompany,
  PulseCompanyRow,
  PulseForecastBand,
  PulseForecastPoint,
  PulseMeta,
  PulsePillarMeta,
  PulseSeriesPoint,
  PulseSummary,
  PulseVariableMeta,
} from '@/lib/pulse/types';

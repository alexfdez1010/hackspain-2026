/**
 * Entry point of the PULSE data layer.
 *
 * Pages import `getPulseDataSource()` from here and never touch the filesystem
 * or `fetch` directly, so the backing store is an environment decision: set
 * `PULSE_API_URL` to read `/api/pulse` from the FastAPI service, leave it unset
 * to read the JSON files bundled in `src/data/pulse`.
 */
export {
  createPulseDataSource,
  getPulseDataSource,
} from '@/lib/pulse/source/factory';
export { ApiPulseSource } from '@/lib/pulse/source/api';
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

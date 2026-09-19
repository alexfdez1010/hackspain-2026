/**
 * Entry point of the X-Ray data layer.
 *
 * Pages and route handlers import `getDataSource()` from here and never touch
 * the filesystem or `fetch` directly, so the backing store is an environment
 * decision: set `XRAY_API_URL` to read from the FastAPI service, leave it unset
 * to read the JSON files bundled in `src/data/xray`.
 */
export { createDataSource, getDataSource } from '@/lib/xray/source/factory';
export { ApiSource } from '@/lib/xray/source/api';
export { StaticJsonSource } from '@/lib/xray/source/static-json';
export type {
  AlertQuery,
  CompanyDetail,
  EvaluationReport,
  MoversQuery,
  OfferDetail,
  OfferQuery,
  OfferRow,
  PillarHeatRow,
  PortfolioSummary,
  XrayDataSource,
  XrayMeta,
} from '@/lib/xray/source/types';

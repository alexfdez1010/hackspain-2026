import type { AdvisorDataSource } from '@/lib/advisor/data';
import { companyName } from '@/lib/company/names';
import type { PulseCompanyDetails } from '@/lib/pulse/details/types';
import type { PulseDataSource } from '@/lib/pulse/data';
import type { PulseCompany, PulseMeta } from '@/lib/pulse/types';
import type { AdvisorCompany } from '@/lib/advisor/types';

/** The adapters the tools read; the same ones the pages use. */
export interface ToolSources {
  pulse: Pick<PulseDataSource, 'getCompany' | 'getCompanyDetails'>;
  advisor: Pick<AdvisorDataSource, 'getCompany'>;
}

/** The metadata the tools read: labels, weights and units. */
export type ToolMeta = Pick<PulseMeta, 'pillars' | 'variables'>;

/** Everything a tool run knows: the company of the conversation and the metadata. */
export interface ToolContext {
  /** Company of the page or the question; `undefined` outside a company. */
  companyId: string | undefined;
  /** Pillars and variables of the export, with their labels and weights. */
  meta: ToolMeta;
  sources: ToolSources;
}

/** A company loaded once per request, with its name. */
export interface LoadedCompany {
  company: PulseCompany;
  name: string;
}

/** Text returned to the model when no company is in scope. */
export const NO_COMPANY_ERROR =
  'No hay ninguna empresa en la conversación: abre una empresa en la aplicación para consultar sus cifras.';

/** Text returned when the identifier is unknown to the export. */
export const UNKNOWN_COMPANY_ERROR =
  'La empresa no está en el export de PULSE, así que no hay cifras que consultar.';

/**
 * Memoises the reads of one request so several tool calls share one load.
 *
 * The tools of one reply may ask for the company four or five times; the
 * adapters already cache on disk, but the API adapter does not, and one
 * request should never hit the backend more than once per resource.
 */
export class ToolRuntime {
  private company: Promise<PulseCompany | null> | null = null;
  private details: Promise<PulseCompanyDetails | null> | null = null;
  private advisor: Promise<AdvisorCompany | null> | null = null;

  /** @param context - The company, the metadata and the adapters. */
  constructor(readonly context: ToolContext) {}

  /** Score metadata of the export. */
  get meta(): ToolMeta {
    return this.context.meta;
  }

  /**
   * Loads the company of the conversation.
   *
   * @returns The company and its name, or the reason there is none.
   */
  async loadCompany(): Promise<LoadedCompany | { error: string }> {
    const id = this.context.companyId;
    if (!id) return { error: NO_COMPANY_ERROR };
    this.company ??= this.context.sources.pulse.getCompany(id);
    const company = await this.company;
    if (!company) return { error: UNKNOWN_COMPANY_ERROR };
    return { company, name: companyName(company.companyId) };
  }

  /** @returns The detail of every variable, or `null` when it is not exported. */
  async loadDetails(): Promise<PulseCompanyDetails | null> {
    const id = this.context.companyId;
    if (!id) return null;
    this.details ??= this.context.sources.pulse.getCompanyDetails(id);
    return this.details;
  }

  /** @returns The recommendation of the company, or `null` when it has none. */
  async loadAdvisor(): Promise<AdvisorCompany | null> {
    const id = this.context.companyId;
    if (!id) return null;
    this.advisor ??= this.context.sources.advisor.getCompany(id);
    return this.advisor;
  }
}

/**
 * Tells whether a load failed.
 *
 * @param loaded - Result of {@link ToolRuntime.loadCompany}.
 * @returns `true` when the result carries an error.
 */
export function isLoadError(
  loaded: LoadedCompany | { error: string },
): loaded is { error: string } {
  return 'error' in loaded;
}

/**
 * Rounds a figure for the model, so a tool output stays short and readable.
 *
 * @param value - Figure to round; `null` stays `null`.
 * @param digits - Fraction digits to keep.
 * @returns The rounded figure.
 */
export function round(value: number | null, digits = 1): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

import {
  buildConfidenceSegments,
  buildMethodExample,
} from '@/lib/method/example';
import type {
  MethodConfidenceSegment,
  MethodExample,
} from '@/lib/method/example';
import { buildIdeaPanels, type MethodIdeaPanel } from '@/lib/method/idea';
import { buildPipelineExamples } from '@/lib/method/pipeline';
import { buildWorkedRow, type MethodWorkedRow } from '@/lib/method/worked';
import { getPulseDataSource } from '@/lib/pulse/data';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import type { PulseMeta } from '@/lib/pulse/types';
import { PULSE_FORECAST_MONTHS } from '@/lib/pulse/types';

/** Everything the method page renders, read once from the export. */
export interface MethodPageData {
  meta: PulseMeta;
  /** Company carried by the query; `null` when the page has no context. */
  contextId: string | null;
  /** Company whose month the page works: the context, or the demo one. */
  companyId: string;
  companies: number;
  example: MethodExample | null;
  coverage: MethodConfidenceSegment[];
  lastHorizon: number;
  idea: MethodIdeaPanel[];
  worked: MethodWorkedRow | null;
  pipelineExamples: (string | null)[];
}

/**
 * Reads the export and works the month the method page explains.
 *
 * The context company is worked when it exists; otherwise the demo company
 * is, so the page always has a real month to add by hand.
 *
 * @param contextId - Company carried by `?company=`, already validated.
 * @returns The data of the page.
 */
export async function loadMethodPage(
  contextId: string | null,
): Promise<MethodPageData> {
  const pulse = getPulseDataSource();
  const [summary, requested] = await Promise.all([
    pulse.getSummary(),
    pulse.getCompany(contextId ?? PULSE_DEMO_COMPANY_ID),
  ]);
  const { meta } = summary;
  const company =
    requested ??
    (contextId ? await pulse.getCompany(PULSE_DEMO_COMPANY_ID) : null);
  const example = buildMethodExample(company, meta.variables, meta.pillars);
  const lastHorizon = Math.min(
    meta.horizons[meta.horizons.length - 1] ?? PULSE_FORECAST_MONTHS,
    PULSE_FORECAST_MONTHS,
  );
  const worked = buildWorkedRow(example);
  return {
    meta,
    contextId,
    companyId: company?.companyId ?? PULSE_DEMO_COMPANY_ID,
    companies: summary.companies.length,
    example,
    coverage: buildConfidenceSegments(
      meta.variables,
      company?.series[company.series.length - 1] ?? null,
    ),
    lastHorizon,
    idea: buildIdeaPanels(meta, example, summary.companies.length),
    worked,
    pipelineExamples: buildPipelineExamples(
      example,
      worked,
      meta.variables.length,
    ),
  };
}

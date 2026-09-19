import {
  buildCashChart,
  buildDriversChart,
  buildRankingChart,
} from '@/lib/assistant/charts/build-detail';
import {
  buildPillarsChart,
  buildPointsChart,
  buildTrajectoryChart,
  buildVariablesChart,
  type ChartInputs,
} from '@/lib/assistant/charts/build-score';
import {
  buildCompareChart,
  buildVariableChart,
} from '@/lib/assistant/charts/build-variable';
import type {
  ChartModelOutput,
  ChartRequest,
  ChartResult,
} from '@/lib/assistant/charts/types';
import { isLoadError, type ToolRuntime } from '@/lib/assistant/tools/context';

/**
 * Builds the chart the model asked for from the export of the company.
 *
 * The model chooses the kind and the parameters; every number in the chart
 * comes from the same adapters the pages read, never from the model.
 *
 * @param runtime - Tool runtime of the request.
 * @param request - Kind and parameters of the chart.
 * @returns The chart specification, or the reason it could not be built.
 */
export async function buildChart(
  runtime: ToolRuntime,
  request: ChartRequest,
): Promise<ChartResult> {
  const loaded = await runtime.loadCompany();
  if (isLoadError(loaded)) return { kind: 'error', error: loaded.error };
  const inputs: ChartInputs = { ...loaded, meta: runtime.meta };
  switch (request.kind) {
    case 'trayectoria':
      return buildTrajectoryChart(inputs);
    case 'pilares':
      return buildPillarsChart(inputs);
    case 'variables':
      return buildVariablesChart(inputs, request.month);
    case 'puntos':
      return buildPointsChart(inputs, request.month);
    case 'variable':
      return buildVariableChart(inputs, request.variable);
    case 'comparar':
      return buildCompareChart(inputs, request.variables);
    case 'impulsores':
      return buildDriversChart(inputs, request.horizon);
    case 'caja':
      return buildCashChart(
        inputs,
        await runtime.loadDetails(),
        request.variable,
      );
    case 'ranking':
      return buildRankingChart(
        inputs,
        await runtime.loadDetails(),
        request.ranking,
      );
    default:
      return { kind: 'error', error: 'Tipo de gráfico desconocido.' };
  }
}

/**
 * Reduces a chart to what the model needs to know: that it was drawn, and
 * one sentence with its key figures. The data points stay in the browser.
 *
 * @param result - Chart specification or error.
 * @returns The compact output for the model.
 */
export function chartModelOutput(result: ChartResult): ChartModelOutput {
  if (result.kind === 'error')
    return { shown: false, kind: 'error', title: null, summary: result.error };
  return {
    shown: true,
    kind: result.kind,
    title: result.title,
    summary: result.summary,
  };
}

import { jsonSchema, tool, type InferUITools } from 'ai';
import { buildChart, chartModelOutput } from '@/lib/assistant/charts/build';
import {
  CHART_KINDS,
  RANKING_KINDS,
  type ChartRequest,
  type RankingKind,
} from '@/lib/assistant/charts/types';
import { ToolRuntime, type ToolContext } from '@/lib/assistant/tools/context';
import { readFinancing } from '@/lib/assistant/tools/read-advisor';
import {
  readForecast,
  readHistory,
  readMonth,
  readSignals,
} from '@/lib/assistant/tools/read-company';
import {
  readVariable,
  readVariableDetail,
} from '@/lib/assistant/tools/read-variable';

const MONTH = { type: 'string', pattern: '^\\d{4}-\\d{2}$' } as const;
const VARIABLE = {
  type: 'string',
  description:
    'Clave de la variable, tal como aparece en el contexto (por ejemplo cash_days).',
} as const;
const NO_INPUT = jsonSchema<Record<string, never>>({
  type: 'object',
  properties: {},
  additionalProperties: false,
});

/**
 * Builds the read-only tools of one request, bound to its company.
 *
 * Every tool reads through the same adapters as the pages and returns rounded
 * figures; none of them writes, calls the internet or leaves the company of
 * the conversation. The chart tool hands the browser a full specification and
 * the model only a summary.
 *
 * @param context - Company, metadata and adapters of the request.
 * @returns The tool set for `streamText`.
 */
export function createAssistantTools(context: ToolContext) {
  const runtime = new ToolRuntime(context);
  return {
    get_history: tool({
      description:
        'Historial mensual del PULSE de la empresa: score, confianza, caja al cierre y pilares de cada mes observado.',
      inputSchema: jsonSchema<{ months?: number }>({
        type: 'object',
        properties: {
          months: {
            type: 'integer',
            minimum: 1,
            maximum: 24,
            description: 'Últimos N meses; todos por defecto.',
          },
        },
        additionalProperties: false,
      }),
      execute: (input) => readHistory(runtime, input),
    }),
    get_month: tool({
      description:
        'Las once variables de un mes observado: score, cifra en bruto con su unidad, peso y puntos aportados al PULSE.',
      inputSchema: jsonSchema<{ month?: string }>({
        type: 'object',
        properties: {
          month: {
            ...MONTH,
            description: 'Mes YYYY-MM; el último por defecto.',
          },
        },
        additionalProperties: false,
      }),
      execute: (input) => readMonth(runtime, input),
    }),
    get_forecast: tool({
      description:
        'Previsión del PULSE a +1…+6 meses con banda p10-p90 y los impulsores de cada horizonte.',
      inputSchema: NO_INPUT,
      execute: () => readForecast(runtime),
    }),
    get_signals: tool({
      description:
        'Alertas y señales de la empresa: meses en que el score se movió de verdad, sus impulsores, probabilidad de que dure y desenlace.',
      inputSchema: NO_INPUT,
      execute: () => readSignals(runtime),
    }),
    get_financing: tool({
      description:
        'Productos financieros recomendados con importe, tipo, descomposición del precio, motivos, descartados y palancas de mejora.',
      inputSchema: NO_INPUT,
      execute: () => readFinancing(runtime),
    }),
    get_variable: tool({
      description:
        'Historial de una variable: score, cifra en bruto y puntos aportados cada mes, estadísticas y su peso en la previsión.',
      inputSchema: jsonSchema<{ variable: string }>({
        type: 'object',
        properties: { variable: VARIABLE },
        required: ['variable'],
        additionalProperties: false,
      }),
      execute: (input) => readVariable(runtime, input),
    }),
    get_variable_detail: tool({
      description:
        'Detalle detrás de una variable: rankings de clientes, proveedores, morosos, líneas, deuda o antigüedad, y la caja diaria.',
      inputSchema: jsonSchema<{ variable?: string; ranking?: RankingKind }>({
        type: 'object',
        properties: {
          variable: VARIABLE,
          ranking: { type: 'string', enum: [...RANKING_KINDS] },
        },
        additionalProperties: false,
      }),
      execute: (input) => readVariableDetail(runtime, input),
    }),
    show_chart: tool({
      description:
        'Dibuja un gráfico interactivo en la conversación con los datos reales de la empresa. Úsalo cuando pidan ver, dibujar, comparar o la evolución de algo. Tipos: trayectoria (PULSE mensual y previsión), pilares (cuatro sparklines), variables (las once en un mes), puntos (ganados y perdidos por variable), variable (una variable mes a mes), comparar (2-4 variables), impulsores (qué mueve la previsión), caja (saldo diario), ranking (contrapartes, líneas, deuda o antigüedad).',
      inputSchema: jsonSchema<ChartRequest>({
        type: 'object',
        properties: {
          kind: { type: 'string', enum: [...CHART_KINDS] },
          variable: {
            ...VARIABLE,
            description: 'Para variable y caja (cash_days o cash_min).',
          },
          variables: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 4,
            description: 'Para comparar.',
          },
          horizon: {
            type: 'integer',
            minimum: 1,
            maximum: 12,
            description: 'Para impulsores.',
          },
          month: {
            ...MONTH,
            description: 'Para variables y puntos; el último mes por defecto.',
          },
          ranking: {
            type: 'string',
            enum: [...RANKING_KINDS],
            description: 'Para ranking.',
          },
        },
        required: ['kind'],
        additionalProperties: false,
      }),
      execute: (input) => buildChart(runtime, input),
      toModelOutput: ({ output }) => ({
        type: 'json',
        value: chartModelOutput(output),
      }),
    }),
  };
}

export type AssistantTools = ReturnType<typeof createAssistantTools>;

/** The tool parts the browser receives, typed per tool. */
export type AssistantUITools = InferUITools<AssistantTools>;

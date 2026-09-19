/**
 * Names of the tools Nexo can call, shared by the server that runs them and
 * the browser that renders their parts; no data source is imported here.
 */
export const ASSISTANT_TOOL_NAMES = [
  'get_history',
  'get_month',
  'get_forecast',
  'get_signals',
  'get_financing',
  'get_variable',
  'get_variable_detail',
  'show_chart',
] as const;

export type AssistantToolName = (typeof ASSISTANT_TOOL_NAMES)[number];

/** The UI part type of each tool, as the AI SDK names it. */
export type AssistantToolPartType = `tool-${AssistantToolName}`;

/** Spanish label of what each data tool reads, shown while it runs and after. */
export const TOOL_LABELS: Record<AssistantToolName, string> = {
  get_history: 'Historial mensual',
  get_month: 'Variables del mes',
  get_forecast: 'Previsión y sus impulsores',
  get_signals: 'Alertas y señales',
  get_financing: 'Productos y precio',
  get_variable: 'Historial de la variable',
  get_variable_detail: 'Detalle de la variable',
  show_chart: 'Gráfico',
};

/**
 * Tells whether a UI part type names one of Nexo's tools.
 *
 * @param type - Part type such as `tool-get_history`.
 * @returns `true` for the tools of this assistant only.
 */
export function isAssistantToolPartType(
  type: string,
): type is AssistantToolPartType {
  return (
    type.startsWith('tool-') &&
    (ASSISTANT_TOOL_NAMES as readonly string[]).includes(type.slice(5))
  );
}

/**
 * Reads the tool name out of a part type.
 *
 * @param type - Part type such as `tool-show_chart`.
 * @returns The tool name.
 */
export function toolNameOf(type: AssistantToolPartType): AssistantToolName {
  return type.slice(5) as AssistantToolName;
}

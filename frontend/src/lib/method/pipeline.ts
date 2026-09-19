/** One step of the pipeline that turns raw files into a published score. */
export interface MethodPipelineStep {
  /** Position of the step, printed as its marker. */
  number: number;
  title: string;
  /** What the step does, in one or two sentences. */
  detail: string;
  /** `true` on the step the confidence illustration expands. */
  illustrated?: boolean;
}

/**
 * The eight steps between a bank statement and a published PULSE.
 *
 * The order is the order of execution in the backend, so a figure of the page
 * can always be traced back to the step that produced it.
 */
export const METHOD_PIPELINE: readonly MethodPipelineStep[] = [
  {
    number: 1,
    title: 'Datos',
    detail:
      'Extractos bancarios, facturas del ERP y productos de deuda de cada empresa, mes a mes.',
  },
  {
    number: 2,
    title: 'Limpieza',
    detail:
      'Divisas con tabla fija, duplicados, importes centinela y fechas imposibles. Cada corrección queda en un registro de auditoría.',
  },
  {
    number: 3,
    title: 'Componentes mensuales',
    detail:
      'Cada componente se calcula por empresa y mes sobre ventanas de 3 y 6 meses, con su variación.',
  },
  {
    number: 4,
    title: 'Normalización',
    detail:
      'Cada componente pasa a su percentil empírico 0-100 en la población de entrenamiento, orientado a «más alto, más sano». Una variable es la media de sus componentes conocidos.',
  },
  {
    number: 5,
    title: 'Pesos fijos',
    detail:
      'pulse_raw es la media ponderada de las variables conocidas con los pesos renormalizados: una variable sin datos ni suma ni resta.',
    illustrated: true,
  },
  {
    number: 6,
    title: 'Confianza',
    detail:
      'Puntos de los 100 respaldados por datos. Una variable cubierta solo por proxy bancario cuenta 0,5 × la cobertura de su peso; por debajo del 5 % de cobertura queda «sin datos».',
    illustrated: true,
  },
  {
    number: 7,
    title: 'Calibración',
    detail:
      'PULSE es el percentil de pulse_raw en la población: un 80 está más sano que el 80 % de las empresas.',
  },
  {
    number: 8,
    title: 'Contribuciones',
    detail:
      'Puntos de pulse_raw que aporta cada variable. Suman pulse_raw exactamente, así que el score se reconstruye a mano.',
  },
];

/** One step of the calculation that turns raw files into a published score. */
export interface MethodPipelineStep {
  /** Position of the step, printed as its marker. */
  number: number;
  title: string;
  /** What the step does, in plain words. */
  detail: string;
}

/**
 * The four steps between the data a company shares and its PULSE of the month,
 * in the order the backend runs them and in words that need no finance.
 */
export const METHOD_PIPELINE: readonly MethodPipelineStep[] = [
  {
    number: 1,
    title: 'Reunimos los datos',
    detail:
      'Lo que la empresa ya comparte con Embat: movimientos del banco, facturas y deudas, mes a mes.',
  },
  {
    number: 2,
    title: 'Cada variable recibe una nota',
    detail:
      'De 0 a 100, comparando a la empresa con el resto: 100 es lo mejor que se ha visto y 0 lo peor. Más alto siempre es más sano.',
  },
  {
    number: 3,
    title: 'Cada nota vale sus puntos',
    detail:
      'Una variable de 12 puntos con nota 50 aporta 6. Se suman los aportes de las variables con datos y esa suma es el PULSE.',
  },
  {
    number: 4,
    title: 'Contamos con qué datos se ha hecho',
    detail:
      'La confianza dice cuántos de los 100 puntos tienen datos detrás. Una variable sin datos no baja la nota: simplemente no cuenta.',
  },
];

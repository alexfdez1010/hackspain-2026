/** The chain that turns raw bank movements into a score, in order. */
const STEPS = [
  {
    title: 'Señal mensual',
    detail:
      'Extractos bancarios, facturas emitidas y recibidas y deuda viva de 24 meses se agregan por empresa y mes en 28 variables de liquidez, flujo, pago, cobro, deuda y actividad.',
  },
  {
    title: 'Objetivo auto-supervisado',
    detail:
      'No hay etiqueta de impago: se marca como estrés el mes con descubierto prolongado, recibos devueltos, embargo o impago de nóminas e impuestos, y el modelo aprende a predecirlo con seis meses de antelación.',
  },
  {
    title: 'Modelo y validación',
    detail:
      'LightGBM con validación cruzada por grupos: ninguna empresa del mismo grupo aparece a la vez en entrenamiento y validación, de modo que el AUROC se mide siempre sobre empresas nunca vistas.',
  },
  {
    title: 'Mezcla nivel / futuro / riesgo',
    detail:
      'El compuesto combina el nivel actual de los pilares, la señal prospectiva del modelo y la probabilidad de estrés, para que una empresa sana con deterioro reciente no puntúe como una empresa sana estable.',
  },
  {
    title: 'Escalado PDO y suavizado',
    detail:
      'El compuesto se lleva a una escala 0-100 de tipo scorecard (puntos por duplicar la razón de probabilidades) y se suaviza con una media exponencial, para que el score no salte con el ruido de un solo mes.',
  },
  {
    title: 'Trayectoria y régimen',
    detail:
      'La pendiente de seis meses se estima con Theil-Sen, robusta a valores extremos, y PELT detecta los cambios de nivel que distinguen un bache pasajero de una caída estructural.',
  },
  {
    title: 'Explicación',
    detail:
      'Los valores SHAP se traducen a puntos de score y a etiquetas en español, y se comparan entre meses para explicar qué ha movido el score desde el mes anterior.',
  },
] as const;

/**
 * Describes how the score is built, one step per transformation.
 *
 * @returns The ordered pipeline as a definition list.
 */
export function PipelineSteps() {
  return (
    <ol className="grid max-w-5xl gap-x-10 gap-y-6 sm:grid-cols-2">
      {STEPS.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">
            <span className="tabular-nums text-muted">{index + 1}. </span>
            {step.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}

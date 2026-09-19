/** What the score is not, in the words the disclaimer of the offer uses. */
const LIMITS: readonly { key: string; text: string }[] = [
  {
    key: 'registros',
    text: 'No consulta registros externos, ni ratings, ni información pública: solo los datos que la empresa ya comparte con Embat.',
  },
  {
    key: 'pd',
    text: 'No es una probabilidad de impago. Es una media ponderada de once variables de salud financiera; la probabilidad la estima aparte el modelo de estrés que fija la prima de riesgo.',
  },
  {
    key: 'precio',
    text: 'El precio es indicativo: el importe y el tipo definitivos dependen de la aprobación del banco que aporta el balance.',
  },
  {
    key: 'prevision',
    text: 'La previsión es un aviso temprano, no un compromiso: ve venir las caídas mucho mejor que las recuperaciones.',
  },
];

/**
 * States the four limits of the score, so the page cannot be read as promising
 * more than it measures.
 *
 * @returns The list of limits.
 */
export function MethodScopeList() {
  return (
    <ul className="flex max-w-3xl flex-col gap-2 text-sm">
      {LIMITS.map((limit) => (
        <li key={limit.key} className="flex gap-3">
          <span aria-hidden className="text-muted">
            ·
          </span>
          {limit.text}
        </li>
      ))}
    </ul>
  );
}

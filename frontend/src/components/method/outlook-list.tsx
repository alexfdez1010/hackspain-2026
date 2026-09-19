import {
  describeAnticipation,
  describeHits,
  pickOutlookHorizon,
} from '@/lib/method/outlook';
import type {
  PulseAnticipationHorizon,
  PulseForecastHorizonEvaluation,
} from '@/lib/pulse/types';
import { formatNumber } from '@/lib/format';

interface MethodOutlookListProps {
  /** Evaluated forecast horizons; empty when the export publishes none. */
  forecast: readonly PulseForecastHorizonEvaluation[];
  /** Furthest month the forecast reaches. */
  lastHorizon: number;
  /** Evaluated anticipation horizons; empty when the export publishes none. */
  anticipation?: readonly PulseAnticipationHorizon[];
}

/**
 * Says in four plain sentences what the score does beyond the month: the
 * forecast, the signals, the price and the limits.
 *
 * The figures it quotes, how many large falls the model saw coming and how
 * many coming cash squeezes an alert catches, are the honest summaries: the
 * score warns of declines far better than it promises recoveries.
 *
 * @param props - The evaluated horizons and the furthest one.
 * @returns The list of four items.
 */
export function MethodOutlookList({
  forecast,
  lastHorizon,
  anticipation = [],
}: MethodOutlookListProps) {
  const horizon = pickOutlookHorizon(forecast);
  const hits = describeHits(horizon?.recallDeclines ?? null);
  const early = describeAnticipation(anticipation);
  const items = [
    {
      key: 'prevision',
      title: 'Previsión',
      text: `Con la historia de la empresa estimamos hacia dónde irá la nota en los próximos ${formatNumber(lastHorizon)} meses, con su margen de error. Es un aviso, no una promesa: acierta más cuando la nota va a bajar que cuando va a subir.${
        hits && horizon
          ? ` A ${formatNumber(horizon.horizon)} meses ve venir ${hits} caídas grandes.`
          : ''
      }`,
    },
    {
      key: 'senales',
      title: 'Señales',
      text: `Cuando la nota se aleja 6 puntos o más de su media de los tres meses anteriores y dos pilares se mueven a la vez, la página levanta la mano. Con lo que se sabe ese mes dice si será un bache que pasa o una caída que dura, y tres meses después cuenta qué fue.${early ? ` ${early}` : ''}`,
    },
    {
      key: 'precio',
      title: 'Precio',
      text: 'Cuanto mejor la nota, más barato el producto. Al tipo de referencia se suma un margen fijo del producto y una prima que crece con el riesgo de la empresa, siempre dentro de una banda acotada.',
    },
    {
      key: 'limites',
      title: 'Límites',
      text: 'No es una probabilidad de impago ni un precio definitivo: el banco tiene la última palabra. Solo usa los datos que la empresa ya comparte con Embat, nada externo.',
    },
  ];
  return (
    <dl className="grid max-w-3xl gap-x-8 gap-y-5 sm:grid-cols-[8rem_1fr]">
      {items.map((item) => (
        <div key={item.key} className="contents">
          <dt className="text-sm font-semibold">{item.title}</dt>
          <dd className="text-sm text-muted">{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}

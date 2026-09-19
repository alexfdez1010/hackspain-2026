import { Panel } from '@/components/ui/panel';
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
 * @returns The four panels.
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
      title: 'Alertas',
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
    <div className="grid gap-5 lg:grid-cols-2">
      {items.map((item) => (
        <Panel key={item.key}>
          <h3 className="text-xl font-semibold leading-[1.3]">{item.title}</h3>
          <p className="mt-3 text-[15px] leading-[1.55] text-ink-secondary">
            {item.text}
          </p>
        </Panel>
      ))}
    </div>
  );
}

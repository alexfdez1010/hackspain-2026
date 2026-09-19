import { MethodAurocBars } from '@/components/method/auroc-bars';
import { StatGrid, type StatItem } from '@/components/ui/stat-grid';
import type {
  PulseScoreEvaluation,
  PulseVariableMeta,
} from '@/lib/pulse/types';
import { formatNumber, formatPercent } from '@/lib/format';

interface MethodScoreEvaluationProps {
  score: PulseScoreEvaluation;
  variables: readonly PulseVariableMeta[];
}

/**
 * Publishes what the score anticipates and what it does not.
 *
 * The three AUROC figures are the same measure asked three ways: on everything,
 * on companies that are healthy today, and on the most recent months. The gap
 * between them is the honest size of the claim.
 *
 * @param props - The published evaluation and the variable labels.
 * @returns The figures, the per-variable chart and the caveat.
 */
export function MethodScoreEvaluation({
  score,
  variables,
}: MethodScoreEvaluationProps) {
  const hasBars = Object.keys(score.aurocByVariable).length > 0;
  if (score.auroc === null && !hasBars) {
    return (
      <p className="text-sm text-muted">
        El export no publica la evaluación del score.
      </p>
    );
  }
  const items: StatItem[] = [
    {
      key: 'auroc',
      label: 'AUROC global',
      value: formatNumber(score.auroc, 3),
      hint: `${formatNumber(score.rows)} meses-empresa · ${formatPercent(score.stressRate, 1)} seguidos de un episodio de estrés`,
    },
    {
      key: 'clean',
      label: 'Excluyendo las ya tensionadas',
      value: formatNumber(score.aurocExcludingCurrentStress, 3),
      hint: 'Solo empresas sin estrés el mes de la medición',
    },
    {
      key: 'temporal',
      label: 'Meses más recientes',
      value: formatNumber(score.aurocTemporal, 3),
      hint: 'Desde septiembre de 2025, sin reentrenar',
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <StatGrid items={items} columns={3} />
      <MethodAurocBars
        byVariable={score.aurocByVariable}
        variables={variables}
        emptyText="El export no publica el AUROC por variable."
      />
      <p className="max-w-3xl text-sm text-muted">
        En este conjunto la anticipación vive en las dos variables de liquidez,
        las únicas que se despegan del 0,5. Las variables que vienen del ERP y
        los proxies bancarios se quedan en la línea: los 36 puntos de calidad de
        cobro y los 12 de comportamiento de pago son una decisión de diseño
        —miden salud financiera y explican el score ante un comité—, no un
        resultado medido de anticipación. Los proxies bancarios añaden una
        mediana de 6 puntos de confianza, porque los nombres de los pagadores
        del conjunto son en su mayoría marcadores de posición.
      </p>
    </div>
  );
}

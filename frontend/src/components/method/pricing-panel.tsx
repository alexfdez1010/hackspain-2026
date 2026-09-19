import { MethodPricingStack } from '@/components/method/pricing-stack';
import { MethodProductTable } from '@/components/method/product-table';
import { StatGrid, type StatItem } from '@/components/ui/stat-grid';
import type { AdvisorCatalogue } from '@/lib/advisor/types';
import { buildPriceSteps } from '@/lib/method/pricing';
import { formatNumber, formatPercent } from '@/lib/format';

interface MethodPricingPanelProps {
  catalogue: AdvisorCatalogue;
}

/**
 * Explains how a score becomes an annual rate: the stack of the price, the
 * model behind the risk premium, the catalogue it is applied to and the rule
 * that decides which products are offered.
 *
 * @param props - The published catalogue.
 * @returns The pricing section.
 */
export function MethodPricingPanel({ catalogue }: MethodPricingPanelProps) {
  const { riskModel } = catalogue;
  const items: StatItem[] = [
    {
      key: 'auroc',
      label: 'AUROC del modelo de estrés',
      value: formatNumber(riskModel.auroc, 3),
      hint: 'Fuera de muestra, por grupo de empresa',
    },
    {
      key: 'rows',
      label: 'Meses-empresa entrenados',
      value: formatNumber(riskModel.rows),
      hint: 'Cada uno con seis meses de futuro observable',
    },
    {
      key: 'rate',
      label: 'Tasa de estrés de la población',
      value: formatPercent(riskModel.stressRate, 1),
      hint: 'Punto de partida de la PD antes de leer la empresa',
    },
  ];
  return (
    <div className="flex flex-col gap-8">
      <MethodPricingStack
        steps={buildPriceSteps(
          catalogue.pricingParameters,
          catalogue.referenceRate,
          catalogue.products,
        )}
      />
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold">
          Modelo que estima la probabilidad de estrés
        </h3>
        <StatGrid items={items} columns={3} />
        <p className="max-w-3xl text-sm text-muted">
          Regresión logística sobre los cuatro pilares, la confianza y log(meses
          observados). La prima de riesgo es su PD anualizada por la parte que
          acaba en impago y por la severidad del producto.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Catálogo y sus constantes</h3>
        <MethodProductTable
          products={catalogue.products}
          emptyText="El export no publica el catálogo de productos."
        />
        <p className="max-w-3xl text-sm text-muted">
          El encaje de un producto parte de 30 y suma los puntos de cada razón
          leída en las variables; se ofrece a partir de 40 y se muestran como
          máximo tres. Los umbrales viven en la configuración del backend, no en
          esta página.
        </p>
      </div>
    </div>
  );
}

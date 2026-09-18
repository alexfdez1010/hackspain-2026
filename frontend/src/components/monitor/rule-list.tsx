/** Rules the monitor evaluates every month over the 1.286 companies. */
const RULES = [
  {
    type: 'liquidity_squeeze',
    label: 'Tensión de liquidez',
    detail:
      'La caja deja de cubrir un mes de salidas y el saldo mínimo se hunde.',
  },
  {
    type: 'score_drop',
    label: 'Caída del score',
    detail:
      'El score pierde varios puntos en un solo mes sobre su nivel reciente.',
  },
  {
    type: 'structural_decline',
    label: 'Deterioro estructural',
    detail:
      'PELT confirma un cambio de nivel a la baja que se mantiene: no es un bache.',
  },
  {
    type: 'stress_risk_high',
    label: 'Riesgo de impago elevado',
    detail: 'La probabilidad de tensión a seis meses entra en la cola alta.',
  },
  {
    type: 'payment_stress',
    label: 'Estrés en pagos',
    detail:
      'Se alarga el pago a proveedores, crecen los vencidos o aparecen devoluciones.',
  },
  {
    type: 'improvement',
    label: 'Mejora sostenida',
    detail:
      'El score sube de forma consistente: la señal también sirve para ampliar límites.',
  },
] as const;

/**
 * Lists the monitoring rules behind the feed, so a filtered or empty feed still
 * tells the reader what the monitor is watching for.
 *
 * @returns The rule list as a definition list.
 */
export function RuleList() {
  return (
    <dl className="grid max-w-5xl gap-x-10 gap-y-4 sm:grid-cols-2">
      {RULES.map((rule) => (
        <div key={rule.type} className="flex flex-col gap-0.5">
          <dt className="text-sm font-medium">{rule.label}</dt>
          <dd className="text-sm text-muted">{rule.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

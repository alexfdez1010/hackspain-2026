/** The plan of one variable: what to do, what it costs and when it shows. */
export interface PulsePlan {
  /** What the company does, in one imperative sentence. */
  title: string;
  /** Three moves a finance director can order this week. */
  steps: readonly string[];
  /** Financial cost of the measure, in the words of the treasury. */
  cost: string;
  /** When the measure reaches the score. */
  horizon: string;
}

/** Plan fallen back on when the export publishes a variable with no plan. */
export const FALLBACK_PLAN_KEY = 'cash_min';

/**
 * A concrete plan per variable, keyed by the variable key of the export.
 *
 * The two variables read from the credit lines (`loc_util`, `loc_accel`) have
 * no plan of their own: while they carry no data there is nothing to order, so
 * they fall back to the plan of the intramonth minimum.
 *
 * `maturities` asks for the amortisation table instead of renegotiating it: the
 * export reads no maturity for most months, so the first move is to let the
 * model see the debt calendar, and only then is there a tranche to spread.
 */
export const PLANS: Readonly<Record<string, PulsePlan>> = {
  cash_min: {
    title: 'Reordena el calendario de pagos dentro del mes',
    steps: [
      'Mueve las domiciliaciones grandes a después del día 20, cuando entran los cobros del mes.',
      'Fija un colchón mínimo equivalente a 30 días de salidas y no bajes de ahí sin aprobación.',
      'Reprograma los pagos a proveedores que ya te conceden más de 30 días de plazo.',
    ],
    cost: '0 €',
    horizon: 'Próximo cierre',
  },
  cash_days: {
    title: 'Sube los días de caja sin pedir circulante',
    steps: [
      'Barre la caja de las filiales a la cuenta principal antes de cada cierre.',
      'Valora el anticipo de las facturas con vencimiento a más de 60 días.',
      'Retén los pagos no críticos hasta después del cobro del cliente principal.',
    ],
    cost: '0 €',
    horizon: 'Dos cierres',
  },
  maturities: {
    title: 'Conecta tu calendario de deuda',
    steps: [
      'Sube el cuadro de amortización de tus préstamos al módulo de deuda.',
      'Comprueba si hay vencimientos en los próximos seis meses que el modelo no esté viendo.',
      'Si se concentran en un mismo mes, valora con la entidad repartirlos en tramos.',
    ],
    cost: '0 €',
    horizon: 'Próximo cierre',
  },
  top_client: {
    title: 'Reduce la dependencia del cliente principal',
    steps: [
      'Cierra un acuerdo de volumen con el cliente principal antes del siguiente trimestre.',
      'Abre dos cuentas en el mismo sector para repartir la concentración.',
      'Exige anticipo del 30 % en los pedidos del cliente principal.',
    ],
    cost: '0 €',
    horizon: 'Dos trimestres',
  },
  terms: {
    title: 'Gana plazo con tus proveedores',
    steps: [
      'Renegocia a 45 días los tres proveedores con más volumen.',
      'Valora ofrecer confirming a cambio de plazo.',
      'Agrupa pedidos para tener poder de negociación.',
    ],
    cost: '0 €',
    horizon: 'Un trimestre',
  },
  dso: {
    title: 'Cobra antes sin cambiar de cliente',
    steps: [
      'Factura el día del servicio, no a fin de mes.',
      'Activa recordatorio automático a los siete días del vencimiento.',
      'Aplica recargo por demora a partir de 15 días.',
    ],
    cost: '0 €',
    horizon: 'Dos cierres',
  },
  network: {
    title: 'Vigila la salud de tus contrapartes',
    steps: [
      'Revisa los diez clientes con más exposición y su propio PULSE.',
      'Fija límite de crédito por cliente y bloquea al superarlo.',
      'Valora un seguro de crédito para la cola de riesgo.',
    ],
    cost: 'Prima del seguro',
    horizon: 'Un trimestre',
  },
  ar90: {
    title: 'Limpia la cartera vencida',
    steps: [
      'Pasa a recobro todo lo que supere 90 días.',
      'Provisiona lo que supere 120 días.',
      'Bloquea nuevos pedidos a clientes con saldo vencido.',
    ],
    cost: '0 €',
    horizon: 'Un cierre',
  },
  dpo: {
    title: 'Ordena el pago a proveedores',
    steps: [
      'Centraliza los pagos en dos fechas al mes.',
      'Alarga el pago solo donde no cueste relación comercial.',
      'No pagues antes de vencimiento salvo descuento por pronto pago.',
    ],
    cost: '0 €',
    horizon: 'Próximo cierre',
  },
};

/**
 * Reads the plan of a variable.
 *
 * @param variableKey - Variable key of the export, such as `cash_min`.
 * @returns Its plan, or the plan of the intramonth minimum when there is none.
 */
export function planFor(variableKey: string): PulsePlan {
  return PLANS[variableKey] ?? PLANS[FALLBACK_PLAN_KEY];
}

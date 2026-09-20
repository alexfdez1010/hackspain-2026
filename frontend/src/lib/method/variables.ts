/** Direction that reads as healthier in the raw figure of a variable. */
export type MethodDirection = 'alto' | 'bajo';

/** Static documentation of one of the eleven variables of the score. */
export interface MethodVariableDoc {
  /** The question the variable answers, in words that need no finance. */
  plain: string;
  /** What the components of the variable measure, in one sentence. */
  measures: string;
  /** `alto` when a higher raw figure is healthier. */
  better: MethodDirection;
  /** Where the evidence comes from when the company is fully connected. */
  source: string;
  /** What the bank proxy reads when the ERP is missing; `null` when none. */
  proxy: string | null;
}

/**
 * What each variable asks, what it measures, its direction and its source.
 *
 * Weights, labels and units are never written here: they come from the export
 * (`meta.variables`), so a change of the specification in the backend cannot be
 * contradicted by this page.
 */
export const METHOD_VARIABLES: Readonly<Record<string, MethodVariableDoc>> = {
  cash_days: {
    plain:
      'Si mañana dejara de cobrar, ¿cuántos días podría seguir pagando con lo que hay en el banco?',
    measures:
      'Caja a fin de mes dividida entre la salida operativa diaria de los últimos 90 días, con tope en 365 días.',
    better: 'alto',
    source: 'Extractos bancarios',
    proxy: null,
  },
  cash_min: {
    plain:
      '¿Cómo de vacía se quedó la hucha en el peor día del mes, comparado con lo que gasta al mes?',
    measures:
      'Mínimo diario de caja del mes dividido entre la salida mensual media: mide el peor día, no el cierre.',
    better: 'alto',
    source: 'Extractos bancarios',
    proxy: null,
  },
  loc_util: {
    plain:
      '¿Cuánto tiene gastado de lo que el banco le deja usar, como una tarjeta de crédito?',
    measures:
      'Dispuesto entre límite de las líneas de crédito, junto con su variación a 3 meses.',
    better: 'bajo',
    source: 'Productos de deuda y movimientos de las líneas',
    proxy: null,
  },
  loc_accel: {
    plain: '¿Tira de esa tarjeta cada vez más deprisa?',
    measures:
      'Variación a 3 meses de la propia variación a 3 meses de la utilización: distingue tirar de la línea de acelerar el tirón.',
    better: 'bajo',
    source: 'Productos de deuda y movimientos de las líneas',
    proxy: null,
  },
  dpo: {
    plain:
      '¿Cuántos días tarda en pagar a sus proveedores, y va a más o a menos?',
    measures:
      'Días entre emisión y pago de las facturas de proveedor, ponderados a 3 meses, y su variación a 3 meses.',
    better: 'bajo',
    source: 'ERP, cuentas a pagar',
    proxy: null,
  },
  terms: {
    plain: '¿Cuántos días de plazo le dan sus proveedores para pagar?',
    measures:
      'Días entre emisión y vencimiento en las facturas de proveedor a 6 meses, y su variación a 6 meses.',
    better: 'alto',
    source: 'ERP, cuentas a pagar',
    proxy: null,
  },
  dso: {
    plain: '¿Cuántos días tarda en cobrar lo que vende?',
    measures:
      'Días entre emisión y cobro de las facturas de cliente, ponderados a 3 meses.',
    better: 'bajo',
    source: 'ERP, cuentas a cobrar',
    proxy: null,
  },
  ar90: {
    plain:
      '¿Qué parte de lo que le deben lleva más de tres meses sin cobrarse?',
    measures:
      'Cartera de clientes vencida más de 90 días entre cartera abierta, y su variación a 3 meses.',
    better: 'bajo',
    source: 'ERP, cuentas a cobrar',
    proxy: 'Devoluciones de cobros en el extracto bancario',
  },
  top_client: {
    plain:
      '¿Su cliente más importante le compra más o menos que el trimestre anterior?',
    measures:
      'Crecimiento de la facturación al cliente principal, 3 meses contra los 3 anteriores, acotado a ±1.',
    better: 'alto',
    source: 'ERP, cuentas a cobrar',
    proxy: 'Cobros atribuidos a ese pagador en el extracto bancario',
  },
  maturities: {
    plain:
      '¿Cuánto tiene que devolver de deuda pronto, comparado con el dinero que hay en caja?',
    measures:
      'Dos veces el servicio de deuda de los próximos 3 meses entre la caja a fin de mes; el óptimo es 0.',
    better: 'bajo',
    source: 'Productos de deuda y extractos bancarios',
    proxy: null,
  },
  network: {
    plain: '¿Sus clientes andan bien de dinero y pagan mejor o peor que antes?',
    measures:
      'Suma del peso de cada cliente por la variación a 3 meses de su puntualidad de pago.',
    better: 'alto',
    source: 'ERP, cuentas a cobrar',
    proxy: 'Lo que esos pagadores pagan a otras empresas del conjunto',
  },
};

/**
 * Reads the documentation of a variable.
 *
 * @param key - Variable key of the export, such as `cash_days`.
 * @returns Its documentation, or `null` when the export publishes a variable
 * this page does not describe yet.
 */
export function methodVariableDoc(key: string): MethodVariableDoc | null {
  return METHOD_VARIABLES[key] ?? null;
}

/**
 * Renders the direction of a variable as a sentence.
 *
 * @param better - Direction that reads as healthier.
 * @returns A phrase such as `Más alto, más sano`.
 */
export function directionText(better: MethodDirection): string {
  return better === 'alto' ? 'Más alto, más sano' : 'Más bajo, más sano';
}

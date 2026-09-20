/** Plain-words explanation of one pillar, for the cards of the method page. */
export interface MethodPillarDoc {
  /** The question the pillar answers, such as `¿Hay dinero en el banco?`. */
  question: string;
  /** What it looks at, told with an everyday comparison. */
  plain: string;
  /** One line that lands the idea in daily life. */
  example: string;
  /** Drawing that goes with the card. */
  art: 'jar' | 'card' | 'calendar' | 'invoice';
}

/**
 * What each of the four pillars asks, in words that need no finance.
 *
 * Labels and weights are never written here: they come from the export, so
 * the cards cannot contradict the specification the backend applies.
 */
export const METHOD_PILLARS: Readonly<Record<string, MethodPillarDoc>> = {
  liquidez: {
    question: '¿Hay dinero en el banco?',
    plain:
      'Es la hucha. Cuenta cuántos días podría seguir pagando la empresa si mañana dejara de cobrar, y cómo de vacía se quedó en su peor día del mes.',
    example: 'Como una familia que mira si el sueldo aguanta hasta fin de mes.',
    art: 'jar',
  },
  deuda: {
    question: '¿Debe mucho y le toca pagar pronto?',
    plain:
      'Es la tarjeta de crédito. Mira cuánto tiene usado de lo que el banco le deja, si tira de ella cada vez más deprisa y cuánto tiene que devolver en los próximos meses comparado con lo que hay en caja.',
    example:
      'Tener la tarjeta al límite y una cuota grande el mes que viene es mala señal.',
    art: 'card',
  },
  pago: {
    question: '¿Paga a sus proveedores a tiempo?',
    plain:
      'Es devolver lo prestado cuando se prometió. Mira cuántos días tarda en pagar sus facturas y cuántos días de plazo le dan.',
    example:
      'Si un amigo te presta algo y cada vez tardas más en devolverlo, algo pasa.',
    art: 'calendar',
  },
  cobro: {
    question: '¿Le pagan sus clientes a tiempo?',
    plain:
      'Es el tema que más pesa: si no le pagan, no puede pagar. Mira cuántos días tarda en cobrar, cuánto lleva más de tres meses sin cobrarse, si su cliente principal compra menos y si sus clientes andan bien de dinero.',
    example: 'Vender mucho no sirve de nada si el dinero no llega.',
    art: 'invoice',
  },
};

/**
 * Reads the plain explanation of a pillar.
 *
 * @param key - Pillar key of the export, such as `liquidez`.
 * @returns Its explanation, or `null` when the export publishes a pillar this
 * page does not describe yet.
 */
export function methodPillarDoc(key: string): MethodPillarDoc | null {
  return METHOD_PILLARS[key] ?? null;
}

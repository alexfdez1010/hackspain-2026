/** One word of finance and what it means in everyday words. */
export interface MethodGlossaryEntry {
  term: string;
  meaning: string;
}

/**
 * The words of the method page that a reader may not know, translated.
 *
 * Alphabetical, so a reader can look one up while reading the other sections.
 */
export const METHOD_GLOSSARY: readonly MethodGlossaryEntry[] = [
  { term: 'Caja', meaning: 'El dinero que hay en el banco hoy.' },
  {
    term: 'Cartera de clientes',
    meaning: 'Todo lo que los clientes deben a la empresa y aún no han pagado.',
  },
  {
    term: 'Confianza',
    meaning: 'Cuántos de los 100 puntos tenían datos detrás ese mes.',
  },
  {
    term: 'DPO',
    meaning: 'Días que tarda la empresa en pagar a sus proveedores.',
  },
  { term: 'DSO', meaning: 'Días que tarda la empresa en cobrar lo que vende.' },
  {
    term: 'ERP',
    meaning:
      'El programa donde la empresa apunta sus facturas, sus cobros y sus pagos.',
  },
  {
    term: 'Línea de crédito',
    meaning:
      'Dinero que el banco deja usar hasta un tope, como una tarjeta de crédito para empresas.',
  },
  {
    term: 'Liquidez',
    meaning: 'Cuánto dinero disponible hay para pagar lo que toca pronto.',
  },
  {
    term: 'Pilar',
    meaning:
      'Cada uno de los cuatro temas en que se agrupan las once variables.',
  },
  {
    term: 'Proxy bancario',
    meaning:
      'Cuando falta el ERP, la misma pista leída solo en los movimientos del banco.',
  },
  {
    term: 'Tensión de caja',
    meaning: 'Un mes en que el dinero no llega para pagar lo que toca.',
  },
  {
    term: 'Vencimiento',
    meaning: 'El día en que toca pagar una deuda o una factura.',
  },
];

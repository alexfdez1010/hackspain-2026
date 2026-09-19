import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

import { PulseVariableDetail } from '@/components/pulse/variable/variable-detail';
import { counterpartyName } from '@/lib/company/names';
import { formatEuro } from '@/lib/format';
import type {
  PulseCompanyDetails,
  PulseVariableDetails,
} from '@/lib/pulse/details/types';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';

/** Every block empty, as the export publishes a company with no evidence. */
const EMPTY_BLOCKS: PulseVariableDetails = {
  cash_days: { daily: [], dailyOutflow: null, accounts: [], months: [] },
  cash_min: { daily: [], minDay: null, months: [] },
  loc_util: { lines: [], months: [] },
  loc_accel: { months: [] },
  dpo: { suppliers: [], months: [] },
  terms: { suppliers: [], months: [] },
  dso: { customers: [], months: [] },
  ar90: { aging: [], debtors: [], months: [] },
  top_client: { customers: [], months: [] },
  maturities: { products: [], months: [] },
  network: { customers: [], months: [] },
};

const EMPTY_DETAILS: PulseCompanyDetails = {
  companyId: 'COMP_EMPTY',
  month: '2026-08',
  variables: EMPTY_BLOCKS,
};

let simple: PulseCompanyDetails;
let leveraged: PulseCompanyDetails;

/**
 * Renders one element to static markup.
 *
 * @param element - Element under test.
 * @returns Its HTML.
 */
function html(element: ReactElement | null): string {
  return element === null ? '' : renderToStaticMarkup(element);
}

/**
 * Strips the tags of a markup, leaving what a reader actually sees.
 *
 * @param markup - Rendered HTML.
 * @returns Its text content.
 */
function text(markup: string): string {
  return markup.replace(/<[^>]*>/g, ' ');
}

/**
 * Renders the drill-down of one variable.
 *
 * @param key - Variable key of the export.
 * @param details - Details of the company.
 * @returns The HTML of the section body.
 */
function render(key: string, details: PulseCompanyDetails): string {
  return html(<PulseVariableDetail variableKey={key} details={details} />);
}

beforeAll(async () => {
  const source = new StaticPulseSource();
  simple = (await source.getCompanyDetails('COMP_0001'))!;
  leveraged = (await source.getCompanyDetails('COMP_0051'))!;
});

describe('the dispatcher', () => {
  it('renders a body for every variable of the export and nothing else', () => {
    for (const key of Object.keys(EMPTY_BLOCKS)) {
      expect(render(key, simple).length).toBeGreaterThan(0);
    }
    expect(render('not_a_variable', simple)).toBe('');
    expect(
      PulseVariableDetail({ variableKey: 'pulse', details: simple }),
    ).toBeNull();
  });

  it('never prints a raw counterparty identifier or a NaN', () => {
    for (const details of [simple, leveraged]) {
      for (const key of Object.keys(EMPTY_BLOCKS)) {
        const markup = render(key, details);
        expect(text(markup)).not.toContain('COUNTERPARTY_');
        expect(markup).not.toContain('NaN');
      }
    }
  });
});

describe('the liquidity drill-downs', () => {
  it('puts the daily cash next to a month of operating outflow', () => {
    const markup = render('cash_days', simple);
    expect(markup).toContain('un mes de salidas');
    expect(markup).toContain(formatEuro(2636.46));
    expect(markup).toContain(formatEuro(2636.46 * 30));
    expect(markup).toContain('Salida operativa');
    expect(markup).toContain('iberCaja · CHECKING_01');
    expect(markup).toContain('Banco Santander Empresas · CHECKING_02');
    expect(markup).toContain(formatEuro(36300.52));
  });

  it('marks the worst day of the month and repeats it month by month', () => {
    const markup = render('cash_min', simple);
    expect(markup).toContain('mínimo: 1 ago 2026');
    expect(markup).toContain('Peor día de ago 2026: 1 ago 2026');
    expect(markup).toContain(formatEuro(8888.36));
    expect(markup).toContain('0,11 salidas mensuales');
    expect(markup).toContain('Barra: caja al cierre del mes.');
  });
});

describe('the debt drill-downs', () => {
  it('lists every credit line with what is drawn on it', () => {
    const markup = render('loc_util', leveraged);
    expect(markup).toContain('Banca March · LINEOFCREDIT_03');
    expect(markup).toContain('98 %');
    expect(markup).toContain(formatEuro(977691.03));
    expect(markup).toContain(formatEuro(1_000_000));
    expect(markup).toContain('cerca del límite');
    expect(markup).toContain(`Total en ago 2026: ${formatEuro(2889662.98)}`);
  });

  it('reads the utilisation move and its pace in points', () => {
    const markup = render('loc_accel', leveraged);
    expect(markup).toContain('La utilización sube 27,0 puntos en 3 meses');
    expect(markup).toContain('se acelera 32,0 puntos');
    expect(markup).toContain('Aceleración');
  });

  it('puts the debt products next to the service and the cash', () => {
    const markup = render('maturities', leveraged);
    expect(markup).toContain('Banco Sabadell · LOAN_01');
    expect(markup).toContain(formatEuro(3610098.62));
    expect(markup).toContain('sin calendario');
    expect(markup).toContain('4,28');
    expect(markup).toContain('dos veces el servicio de 3 meses entre la caja');
  });
});

describe('the payment drill-downs', () => {
  it('ranks the suppliers by what was paid and how late', () => {
    const markup = render('dpo', simple);
    expect(markup).toContain(counterpartyName('COUNTERPARTY_09820'));
    expect(markup).toContain(formatEuro(43560));
    expect(markup).toContain('Se le paga 20,0 días pronto');
    expect(markup).toContain('DPO ponderado de ago 2026: 24,4 días, −14,9');
  });

  it('ranks the suppliers by the term each one grants', () => {
    const markup = render('terms', simple);
    expect(markup).toContain(counterpartyName('COUNTERPARTY_09820'));
    expect(markup).toContain(formatEuro(95351.29));
    expect(markup).toContain('30,0 días');
    expect(markup).toContain('Plazo medio de ago 2026: 16,8 días, −6,6');
  });

  it('ranks the customers by what they paid and how late', () => {
    const markup = render('dso', simple);
    expect(markup).toContain(counterpartyName('COUNTERPARTY_03903'));
    expect(markup).toContain('Paga 31,7 días tarde');
    expect(markup).toContain('DSO ponderado de ago 2026: 31,9 días');
  });
});

describe('the receivable drill-downs', () => {
  it('ages the open portfolio and names who owes the oldest part', () => {
    const markup = render('ar90', simple);
    expect(markup).toContain('+90 días');
    expect(markup).toContain('28,1 mil €');
    expect(markup).toContain('6 fras.');
    expect(markup).toContain(counterpartyName('COUNTERPARTY_03903'));
    expect(markup).toContain(formatEuro(26983));
    expect(markup).toContain('llevan más de 90 días vencidos');
  });

  it('shows the weight of the main customer and its growth', () => {
    const markup = render('top_client', simple);
    expect(markup).toContain('Principal');
    expect(markup).toContain('−37 %');
    expect(markup).toContain(formatEuro(136902.53));
    expect(markup).toContain(
      `El cliente principal, ${counterpartyName('COUNTERPARTY_03903')}, es el 83 % de la facturación de 12 meses`,
    );
    expect(render('top_client', leveraged)).toContain('sin base');
  });

  it('ranks the customers by weight and by the health of their payments', () => {
    const markup = render('network', leveraged);
    expect(markup).toContain(counterpartyName('COUNTERPARTY_04270'));
    expect(markup).toContain('Salud de pago');
    expect(markup).toContain('Empresas que le facturan');
    expect(markup).toContain('86 %');
    expect(markup).toContain('Crítico (&lt;35)');
    expect(markup).toContain(formatEuro(462395));
    expect(markup).toContain('Exposición de ago 2026');
    expect(markup).toContain('45 clientes comparables');
  });
});

describe('a company with nothing behind a variable', () => {
  it('says what is missing instead of drawing an empty figure', () => {
    const cases: Record<string, string> = {
      cash_days: 'Sin saldos diarios en los dos últimos meses.',
      cash_min: 'Sin caja mensual registrada.',
      loc_util: 'Sin líneas de crédito registradas: la variable no se calcula.',
      loc_accel: 'Sin utilización mensual registrada.',
      dpo: 'Sin facturas de proveedor en los últimos 3 meses.',
      terms: 'Sin facturas de proveedor en los últimos 6 meses.',
      dso: 'Sin cobros de cliente en los últimos 3 meses.',
      ar90: 'Sin cartera abierta al cierre del mes.',
      top_client: 'Sin clientes facturados en el último año.',
      maturities: 'Sin deuda bancaria registrada.',
      network: 'Sin clientes con salud de pago comparable este mes.',
    };
    for (const [key, sentence] of Object.entries(cases)) {
      expect(render(key, EMPTY_DETAILS)).toContain(sentence);
    }
  });

  it('keeps the credit-line empty state on a real company without lines', () => {
    expect(render('loc_util', simple)).toContain(
      'Sin líneas de crédito registradas',
    );
    expect(render('maturities', simple)).toContain(
      'Sin deuda bancaria registrada.',
    );
  });
});

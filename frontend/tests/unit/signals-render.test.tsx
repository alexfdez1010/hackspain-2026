import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CompanySignalsPage, {
  generateMetadata,
} from '@/app/(app)/company/[id]/signals/page';
import { PulseSignalAlert } from '@/components/pulse/signal-alert';
import { PulseSignalTimeline } from '@/components/pulse/signal-timeline';
import { PulseSignalsHeader } from '@/components/pulse/signals-header';
import { buildSignalsView } from '@/lib/pulse/signals-view';
import { makeSignal } from './pulse-fixtures';

describe('PulseSignalAlert', () => {
  it('raises the recent signal with its kind, age, status and a link', () => {
    const markup = renderToStaticMarkup(
      <PulseSignalAlert
        company={{
          month: '2026-08',
          signals: [
            makeSignal({
              month: '2026-07',
              kind: 'bache',
              outcome: null,
              pPersistent: 0.39,
              headline: 'Bache de 7 puntos en julio de 2026',
            }),
          ],
        }}
        href="/company/COMP_0001/signals"
      />,
    );
    expect(markup).toContain('role="status"');
    expect(markup).toContain('Bache');
    expect(markup).toContain('hace 1 mes · abierta, 39 % de que dure');
    expect(markup).toContain('Bache de 7 puntos en julio de 2026');
    expect(markup).toContain('href="/company/COMP_0001/signals"');
  });

  it('stays silent when the recent history is quiet', () => {
    expect(
      renderToStaticMarkup(
        <PulseSignalAlert
          company={{
            month: '2026-08',
            signals: [makeSignal({ month: '2025-12' })],
          }}
          href="/x"
        />,
      ),
    ).toBe('');
  });
});

describe('PulseSignalTimeline', () => {
  it('lists signals newest first with outcome and drivers', () => {
    const markup = renderToStaticMarkup(
      <PulseSignalTimeline
        signals={[
          makeSignal(),
          makeSignal({
            month: '2026-07',
            kind: 'repunte',
            direction: 'up',
            outcome: null,
            pPersistent: 0.2,
            headline: 'Repunte de 9 puntos en julio de 2026',
            drivers: [],
          }),
        ]}
      />,
    );
    expect(markup.indexOf('jul 2026')).toBeLessThan(markup.indexOf('abr 2026'));
    expect(markup).toContain('confirmada tres meses después');
    expect(markup).toContain('abierta, 20 % de que dure');
    expect(markup).toContain('deuda y servicio −46');
    expect(markup).toContain('54 → 47');
  });

  it('explains the rule when nothing ever fired', () => {
    expect(
      renderToStaticMarkup(<PulseSignalTimeline signals={[]} />),
    ).toContain('6 puntos o más');
  });
});

describe('PulseSignalsHeader', () => {
  it('prints the four counts', () => {
    const view = buildSignalsView([
      makeSignal(),
      makeSignal({ month: '2026-07', outcome: null }),
    ]);
    const markup = renderToStaticMarkup(
      <PulseSignalsHeader
        company={{ month: '2026-08', pulse: 40, monthsObserved: 8 }}
        view={view}
      />,
    );
    expect(markup).toContain('Alertas abiertas');
    expect(markup).toContain('1 de 1');
    expect(markup).toContain('Último cierre, ago 2026');
  });
});

describe('the company signals page', () => {
  it('shows the open alert, the history and the legend for COMP_0001', async () => {
    const markup = renderToStaticMarkup(
      await CompanySignalsPage({
        params: Promise.resolve({ id: 'COMP_0001' }),
      }),
    );
    expect(markup).toContain('Alertas de Atresmedia Labs');
    expect(markup).toContain(
      'Una alerta abierta hasta ago 2026; la nota se movió de verdad en 2 meses.',
    );
    expect(markup).toContain('Bache de 7 puntos en julio de 2026');
    expect(markup).toContain('Caída de 7 puntos en abril de 2026');
    expect(markup).toContain('bajada que va a durar');
    expect(markup).not.toContain('NaN');
  });

  it('titles the tab and answers 404 for an unknown company', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'COMP_0001' }),
    });
    expect(metadata.title).toBe('Atresmedia Labs — Alertas · Embat Pulse');
    await expect(
      CompanySignalsPage({ params: Promise.resolve({ id: 'COMP_9999' }) }),
    ).rejects.toThrow();
  });
});

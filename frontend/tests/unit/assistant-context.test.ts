import { describe, expect, it, vi } from 'vitest';
import { getAssistantContext } from '@/lib/assistant/context';
import { getMockReply } from '@/lib/assistant/mock';

/** Supplies deterministic data adapters; no filesystem or backend is consulted. */
function sources() {
  const rows = [
    {
      id: 'COMP_0001',
      score: 40,
      pStress: 0.3,
      regime: 'steady',
      direction: 'deteriorating',
      delta6m: -12,
    },
    {
      id: 'COMP_0002',
      score: 50,
      pStress: 0.1,
      regime: 'steady',
      direction: 'stable',
      delta6m: -2,
    },
  ];
  const xray = {
    kind: 'static' as const,
    getSummary: vi.fn().mockResolvedValue({ rows, stats: { total: 2 } }),
    getCompany: vi.fn().mockResolvedValue(null),
  };
  const pulse = {
    getSummary: vi.fn().mockResolvedValue({
      meta: { lastMonth: '2026-08', pillars: [], variables: [] },
      companies: [],
    }),
    getCompany: vi.fn().mockResolvedValue(null),
  };
  return { xray, pulse, rows };
}

describe('trusted assistant context', () => {
  it('uses a portfolio row when optional company exports are absent, without inventing an offer', async () => {
    const { xray, pulse, rows } = sources();
    const context = await getAssistantContext(
      '/',
      'Revisa COMP_0001',
      xray,
      pulse,
    );
    expect(context.company).toMatchObject({
      id: 'COMP_0001',
      score: 40,
      offer: null,
    });
    expect(
      context.sources.some((source) => source.href.includes('/empresa/')),
    ).toBe(false);
    expect(getMockReply('Revisa COMP_0001', context)).toContain(
      'no puedo atribuirle un límite',
    );
    expect(rows.map((row) => row.id)).toEqual(['COMP_0001', 'COMP_0002']);
    expect(pulse.getSummary).not.toHaveBeenCalled();
  });
  it('gives an explicitly mentioned company precedence over the page', async () => {
    const { xray, pulse } = sources();
    await getAssistantContext(
      '/empresa/COMP_0001',
      'Revisa comp_0002',
      xray,
      pulse,
    );
    expect(xray.getCompany).toHaveBeenCalledWith('COMP_0002');
  });
  it('keeps PULSE separate from X-Ray and does not link missing company detail', async () => {
    const { xray, pulse } = sources();
    const context = await getAssistantContext(
      '/pulse/COMP_0001',
      'Resume esta empresa',
      xray,
      pulse,
    );
    expect(pulse.getCompany).toHaveBeenCalledWith('COMP_0001');
    expect(xray.getCompany).not.toHaveBeenCalled();
    expect(context.company).toBeNull();
    expect(context.pulse?.month).toBe('2026-08');
    expect(context.sources[0].href).toBe('/pulse');
  });
});

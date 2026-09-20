import { describe, expect, it } from 'vitest';

import { BAND_MEANINGS, buildBandSpans } from '@/lib/method/bands';
import { buildMethodExample } from '@/lib/method/example';
import { METHOD_GLOSSARY } from '@/lib/method/glossary';
import { buildIdeaPanels } from '@/lib/method/idea';
import { loadMethodPage } from '@/lib/method/page-data';
import { METHOD_PILLARS, methodPillarDoc } from '@/lib/method/pillars';
import { buildPipelineExamples, METHOD_PIPELINE } from '@/lib/method/pipeline';
import { variableInfo } from '@/lib/method/variable-info';
import { METHOD_VARIABLES } from '@/lib/method/variables';
import { buildWorkedRow } from '@/lib/method/worked';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import { formatPercent } from '@/lib/format';

const source = new StaticPulseSource();
const { meta, companies } = await source.getSummary();
const company = await source.getCompany(PULSE_DEMO_COMPANY_ID);
const example = buildMethodExample(company, meta.variables, meta.pillars);

describe('the plain copy of the method covers what the export publishes', () => {
  it('has a question for every pillar and every variable of the export', () => {
    for (const pillar of meta.pillars) {
      expect(methodPillarDoc(pillar.key), pillar.key).not.toBeNull();
    }
    for (const variable of meta.variables) {
      const doc = METHOD_VARIABLES[variable.key];
      expect(doc, variable.key).toBeDefined();
      expect(doc.plain).toMatch(/\?$/);
    }
    expect(methodPillarDoc('nope')).toBeNull();
    expect(Object.keys(METHOD_PILLARS)).toHaveLength(4);
  });

  it('carries the plain question into the info of a variable', () => {
    const info = variableInfo('cash_days', 'Días de caja', 12);
    expect(info?.plain).toContain('cuántos días podría seguir pagando');
    expect(info?.measures).toContain('Caja a fin de mes');
  });

  it('gives every band a meaning on the drawn scale', () => {
    const spans = buildBandSpans();
    expect(spans.map((span) => span.meaning)).toEqual(
      spans.map((span) => BAND_MEANINGS[span.key]),
    );
    expect(spans[1].meaning).toContain('poco margen');
  });

  it('keeps the glossary alphabetical and plain', () => {
    const terms = METHOD_GLOSSARY.map((entry) => entry.term);
    expect(terms).toEqual(
      [...terms].sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' }),
      ),
    );
    expect(terms).toContain('DSO');
    expect(terms).toContain('Vencimiento');
    for (const entry of METHOD_GLOSSARY) {
      expect(entry.meaning).toMatch(/\.$/);
    }
  });
});

describe('the worked month feeds the drawings and the steps', () => {
  it('works the arithmetic of the variable that added most', () => {
    const worked = buildWorkedRow(example);
    expect(worked).not.toBeNull();
    expect(worked?.label).toBe('Tramo +90 días');
    expect(worked?.weight).toBe(12);
    expect(worked?.knownWeight).toBe(82);
    expect(worked?.share).toBeCloseTo(12 / 82, 6);
    expect(worked?.score).toBeCloseTo(71.83, 2);
    expect(worked?.contribution).toBeCloseTo(
      (worked!.score * worked!.weight) / worked!.knownWeight,
      1,
    );
    expect(worked?.others).toBe(8);
    expect(buildWorkedRow(null)).toBeNull();
  });

  it('tells the three drawings with the figures of the month', () => {
    const panels = buildIdeaPanels(meta, example, companies.length);
    expect(panels.map((panel) => panel.art)).toEqual([
      'eleven',
      'report',
      'gauge',
    ]);
    expect(panels[0].title).toBe('Miramos 11 cosas');
    expect(panels[0].example).toContain('9 de las 11');
    expect(panels[1].text).toContain(`${companies.length}`);
    expect(panels[1].example).toBe(
      'Días de caja de Atresmedia Labs: 14,0 días → nota 39,0.',
    );
    expect(panels[2].example).toContain('PULSE de 45,6: Frágil');
    const empty = buildIdeaPanels(meta, null, 0);
    expect(empty.every((panel) => panel.example === null)).toBe(true);
  });

  it('tells every step with the same month', () => {
    const worked = buildWorkedRow(example);
    const told = buildPipelineExamples(example, worked, meta.variables.length);
    expect(told).toHaveLength(METHOD_PIPELINE.length);
    expect(told[0]).toBe(
      'Atresmedia Labs, ago 2026: 9 de las 11 variables tenían datos.',
    );
    expect(told[1]).toBe(
      `Tramo +90 días: ${formatPercent(0.1, 1)} de la cartera → nota 71,8.`,
    );
    expect(told[2]).toContain('12 de los 82 puntos con datos');
    expect(told[2]).toContain('aporta 10,5 al PULSE');
    expect(told[3]).toContain(
      `PULSE 45,6, Frágil, con ${formatPercent(0.82, 0)} de los puntos`,
    );
    expect(buildPipelineExamples(null, null, 11)).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });

  it('loads the page for the context company and falls back to the demo', async () => {
    const context = await loadMethodPage('COMP_0051');
    expect(context.contextId).toBe('COMP_0051');
    expect(context.companyId).toBe('COMP_0051');
    expect(context.example?.companyId).toBe('COMP_0051');
    expect(context.lastHorizon).toBe(6);
    expect(context.pipelineExamples[0]).toContain('Atlassian Global');

    const unknown = await loadMethodPage('COMP_9999');
    expect(unknown.contextId).toBe('COMP_9999');
    expect(unknown.companyId).toBe(PULSE_DEMO_COMPANY_ID);

    const none = await loadMethodPage(null);
    expect(none.companyId).toBe(PULSE_DEMO_COMPANY_ID);
    expect(none.idea).toHaveLength(3);
  });
});

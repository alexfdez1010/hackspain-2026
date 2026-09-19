import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AssistantChart } from '@/components/assistant/charts/assistant-chart';
import { CompareLines } from '@/components/assistant/charts/compare-lines';
import { PointsBars } from '@/components/assistant/charts/points-bars';
import { RankingBars } from '@/components/assistant/charts/ranking-bars';
import { ScoreBars } from '@/components/assistant/charts/score-bars';
import { groupParts } from '@/components/assistant/message-parts';
import { ToolStatus } from '@/components/assistant/tool-status';
import type { ChartSpec, VariableBar } from '@/lib/assistant/charts/types';
import { getMockChart } from '@/lib/assistant/mock';
import { parseAssistantRequest } from '@/lib/assistant/request';
import {
  compactMessage,
  hasContent,
  hasPendingTool,
  type AssistantChartPart,
  type AssistantMessage,
} from '@/lib/assistant/types';
import type { AssistantContext } from '@/lib/assistant/context';

const rows: VariableBar[] = [
  {
    key: 'cash_days',
    label: 'Días de caja',
    pillarLabel: 'Liquidez',
    score: 38.96,
    rawText: '14,0 días',
    weight: 12,
    contribution: 5.7,
    known: true,
  },
  {
    key: 'loc_util',
    label: 'Utilización de líneas',
    pillarLabel: 'Deuda',
    score: null,
    rawText: 'sin datos',
    weight: 14,
    contribution: null,
    known: false,
  },
];

const spec: ChartSpec = {
  kind: 'puntos',
  company: 'Atresmedia Labs',
  month: '2026-08',
  title: 'Puntos ganados y perdidos en ago 2026',
  summary: 'PULSE 40,0 de 100.',
  href: '/company/COMP_0001/detail',
  rows,
  pulse: 40,
};

/** A chart tool part in the given state. */
function chartPart(
  state: AssistantChartPart['state'],
  output?: AssistantChartPart['output'],
): AssistantChartPart {
  return {
    type: 'tool-show_chart',
    toolCallId: 'c1',
    state,
    input: { kind: 'puntos' },
    output,
  } as AssistantChartPart;
}

describe('message parts', () => {
  it('groups prose around the tools in the order the model produced them', () => {
    const blocks = groupParts([
      { type: 'step-start' },
      { type: 'text', text: 'Hola ' },
      { type: 'text', text: 'mundo' },
      chartPart('output-available', spec),
      { type: 'text', text: '  ' },
      { type: 'text', text: 'Lectura.' },
    ]);
    expect(blocks.map((block) => block.kind)).toEqual(['text', 'tool', 'text']);
    expect(blocks[0]).toMatchObject({ text: 'Hola mundo' });
  });
  it('knows when a reply has content and when a tool is still running', () => {
    const reply: AssistantMessage = {
      id: 'a',
      role: 'assistant',
      parts: [chartPart('input-available')],
    };
    expect(hasContent(reply)).toBe(false);
    expect(hasPendingTool(reply)).toBe(true);
    const done: AssistantMessage = {
      id: 'b',
      role: 'assistant',
      parts: [chartPart('output-available', spec)],
    };
    expect(hasContent(done)).toBe(true);
    expect(hasPendingTool(done)).toBe(false);
  });
  it('sends the chart back as a sentence, never as data', () => {
    const compact = compactMessage({
      id: 'b',
      role: 'assistant',
      parts: [chartPart('output-available', spec), { type: 'text', text: 'x' }],
    });
    expect(compact.parts[0]).toMatchObject({
      output: { shown: true, kind: 'puntos', summary: 'PULSE 40,0 de 100.' },
    });
    expect(JSON.stringify(compact)).not.toContain('Días de caja');
    expect(compact.parts[1]).toEqual({ type: 'text', text: 'x' });
  });
});

describe('history with tool parts', () => {
  const user = {
    id: 'u',
    role: 'user',
    parts: [{ type: 'text', text: 'Sigue' }],
  };
  it('keeps finished tool calls of known tools and drops everything else', () => {
    const parsed = parseAssistantRequest({
      messages: [
        {
          id: 'a',
          role: 'assistant',
          parts: [
            { type: 'step-start' },
            {
              type: 'tool-get_month',
              toolCallId: 't1',
              state: 'output-available',
              input: {},
              output: { pulse: 40 },
            },
            {
              type: 'tool-show_chart',
              toolCallId: 't2',
              state: 'input-available',
              input: { kind: 'puntos' },
            },
            {
              type: 'tool-delete_everything',
              toolCallId: 't3',
              state: 'output-available',
              input: {},
              output: {},
            },
            {
              type: 'tool-get_history',
              toolCallId: 't4',
              state: 'output-available',
              input: {},
              output: 'x'.repeat(13_000),
            },
            { type: 'text', text: 'Leído.' },
          ],
        },
        user,
      ],
    });
    expect(parsed.messages[0].parts.map((part) => part.type)).toEqual([
      'tool-get_month',
      'text',
    ]);
  });
  it('accepts a reply made only of a chart and rejects tool parts from the user', () => {
    const chartOnly = parseAssistantRequest({
      messages: [
        {
          id: 'a',
          role: 'assistant',
          parts: [
            {
              type: 'tool-show_chart',
              toolCallId: 't2',
              state: 'output-available',
              input: { kind: 'puntos' },
              output: {
                shown: true,
                kind: 'puntos',
                title: null,
                summary: 's',
              },
            },
          ],
        },
        user,
      ],
    });
    expect(chartOnly.messages[0].parts).toHaveLength(1);
    expect(() =>
      parseAssistantRequest({
        messages: [
          {
            ...user,
            parts: [
              {
                type: 'tool-get_month',
                toolCallId: 't1',
                state: 'output-available',
                input: {},
                output: {},
              },
            ],
          },
        ],
      }),
    ).toThrow();
  });
});

describe('demo charts', () => {
  const context = {
    company: { name: 'Atresmedia Labs' },
  } as unknown as AssistantContext;
  it('picks a chart for visual questions on a company and none elsewhere', () => {
    expect(getMockChart('Dibuja la trayectoria del PULSE', context)).toEqual({
      kind: 'trayectoria',
    });
    expect(getMockChart('¿Qué variables restan más puntos?', context)).toEqual({
      kind: 'puntos',
    });
    expect(getMockChart('Muestra los pilares en gráficos', context)).toEqual({
      kind: 'pilares',
    });
    expect(getMockChart('Resume esta empresa', context)).toBeNull();
    expect(
      getMockChart('Dibuja la trayectoria', {
        company: null,
      } as unknown as AssistantContext),
    ).toBeNull();
  });
});

describe('chart rendering', () => {
  it('renders the placeholder, the error and the framed figure', () => {
    expect(
      renderToStaticMarkup(
        <AssistantChart
          part={chartPart('input-streaming')}
          onNavigate={() => {}}
        />,
      ),
    ).toContain('Preparando el gráfico');
    expect(
      renderToStaticMarkup(
        <AssistantChart
          part={chartPart('output-available', {
            kind: 'error',
            error: 'Sin datos.',
          })}
          onNavigate={() => {}}
        />,
      ),
    ).toContain('Sin datos.');
    const figure = renderToStaticMarkup(
      <AssistantChart
        part={chartPart('output-available', spec)}
        onNavigate={() => {}}
      />,
    );
    expect(figure).toContain('<figure');
    expect(figure).toContain('Atresmedia Labs · ago 2026');
    expect(figure).toContain('href="/company/COMP_0001/detail"');
    expect(figure).toContain('pierde 6,3');
  });
  it('keeps unknown variables without a bar and labels every bar for readers', () => {
    const score = renderToStaticMarkup(<ScoreBars rows={rows} />);
    expect(score).toContain('Días de caja: 39,0 sobre 100, Frágil');
    expect(score).toContain('Utilización de líneas: sin datos');
    expect(score).toContain('width:38.96%');
    const points = renderToStaticMarkup(<PointsBars rows={rows} pulse={40} />);
    expect(points).toContain('5,7 de 12 puntos');
    expect(points).toContain('14 puntos sin respaldo');
  });
  it('renders rankings and comparisons with legends, not colour alone', () => {
    const ranking = renderToStaticMarkup(
      <RankingBars
        rows={[
          {
            id: 'a',
            label: 'Acme S.L.',
            value: 55,
            valueText: '55,0 días',
            detail: 'Paga tarde',
            color: null,
          },
          {
            id: 'b',
            label: 'Beta S.A.',
            value: null,
            valueText: 'sin datos',
            detail: '',
            color: null,
          },
        ]}
      />,
    );
    expect(ranking).toContain('Acme S.L.: 55,0 días, Paga tarde');
    expect(ranking).toContain('width:0%');
    const compare = renderToStaticMarkup(
      <CompareLines
        series={[
          {
            key: 'a',
            label: 'Días de caja',
            points: [
              { month: '2026-07', value: 30 },
              { month: '2026-08', value: null },
            ],
          },
          {
            key: 'b',
            label: 'DSO',
            points: [
              { month: '2026-07', value: 50 },
              { month: '2026-08', value: 60 },
            ],
          },
          {
            key: 'c',
            label: 'DPO',
            points: [
              { month: '2026-07', value: 40 },
              { month: '2026-08', value: 45 },
            ],
          },
        ]}
      />,
    );
    expect(compare).toContain(
      'Días de caja, DSO, DPO desde jul 2026 hasta ago 2026',
    );
    expect(compare).toContain('stroke-dasharray');
    expect(compare).toContain('60,0');
  });
  it('describes a data read in its three states', () => {
    expect(
      renderToStaticMarkup(
        <ToolStatus name="get_month" state="input-available" />,
      ),
    ).toContain('Consultando variables del mes');
    expect(
      renderToStaticMarkup(
        <ToolStatus name="get_month" state="output-available" />,
      ),
    ).toContain('Variables del mes consultado');
    expect(
      renderToStaticMarkup(
        <ToolStatus name="get_month" state="output-error" errorText="caído" />,
      ),
    ).toContain('Variables del mes: caído');
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MessageContent } from '@/components/assistant/message-content';
import { getMockReply } from '@/lib/assistant/mock';
import type { AssistantContext } from '@/lib/assistant/context';

const context: AssistantContext = {
  page: 'Radar de cartera',
  sources: [],
  companyId: undefined,
  provenance: 'Dataset local X-Ray',
  stats: {
    total: 10,
    medianScore: 44.5,
    deteriorating: 3,
    structuralDecline: 2,
    highStress: 1,
  },
  worstMovers: [],
  company: null,
  pulse: null,
  pulseCompany: null,
};

describe('honest demo answers', () => {
  it('uses supplied numbers and explains overlapping groups', () => {
    const reply = getMockReply('Resume mi cartera', context);
    expect(reply).toContain('10 empresas');
    expect(reply).toContain('44,5/100');
    expect(reply).toContain('solaparse');
  });
  it('does not invent evidence when the dataset is empty', () => {
    expect(
      getMockReply('Resume mi cartera', {
        ...context,
        stats: { ...context.stats, total: 0 },
      }),
    ).toContain('no hay empresas');
    expect(getMockReply('¿Qué empresas revisaría primero?', context)).toContain(
      'No hay suficiente historial',
    );
  });
  it('names unavailable company data without fabricating a score', () => {
    expect(
      getMockReply('Resume esta empresa', {
        ...context,
        companyId: 'COMP_9999',
      }),
    ).toContain('No hay datos disponibles');
  });
  it('distinguishes absent PULSE values from zero', () => {
    const reply = getMockReply('Resume esta empresa', {
      ...context,
      companyId: 'COMP_0001',
      pulseCompany: {
        id: 'COMP_0001',
        score: null,
        previous: null,
        confidence: null,
        pillars: {},
        forecast: [],
      },
    });
    expect(reply).toContain('sin datos');
    expect(reply).not.toContain('0/100');
  });
  it('answers AI questions and labels unsupported free-form questions honestly', () => {
    expect(getMockReply('¿Cómo puede ayudarme la IA?', context)).toContain(
      'modelo de lenguaje',
    );
    expect(getMockReply('¿Lloverá mañana?', context)).toContain(
      'todavía no tiene una respuesta simulada',
    );
  });
});

describe('safe streamed text rendering', () => {
  it('formats emphasis and lists without interpreting HTML or unsafe links', () => {
    const markup = renderToStaticMarkup(
      <MessageContent
        text={
          '**Resumen**\n\n• Uno\n• Dos\n\n<script>alert(1)</script> [ir](javascript:alert(1))'
        }
      />,
    );
    expect(markup).toContain('<strong');
    expect(markup).toContain('<ul');
    expect(markup).toContain('&lt;script&gt;');
    expect(markup).not.toContain('<script>');
    expect(markup).not.toContain('href=');
  });
  it('keeps incomplete emphasis visible during streaming', () => {
    expect(
      renderToStaticMarkup(<MessageContent text="**Todavía escribiendo" />),
    ).toContain('Todavía escribiendo');
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MessageContent } from '@/components/assistant/message-content';
import { getMockReply } from '@/lib/assistant/mock';
import type { AssistantContext } from '@/lib/assistant/context';

const context: AssistantContext = {
  page: 'Elegir empresa',
  sources: [],
  companyId: undefined,
  provenance: 'Dataset local PULSE',
  month: '2026-08',
  scoreName: 'PULSE',
  horizons: [1, 6],
  pillars: [],
  variables: [],
  company: null,
  advisor: null,
};

describe('honest demo answers', () => {
  it('refuses to summarise a portfolio the app never shows', () => {
    const reply = getMockReply('Resume mi cartera', context);
    expect(reply).toContain('una empresa cada vez');
    expect(reply).not.toMatch(/\d+ empresas/);
  });
  it('explains products in general without a company in context', () => {
    expect(getMockReply('¿Qué productos puede recomendar?', context)).toContain(
      'empresa a empresa',
    );
  });
  it('names unavailable company data without fabricating a score', () => {
    expect(
      getMockReply('Resume esta empresa', {
        ...context,
        companyId: 'COMP_9999',
      }),
    ).toContain('No hay datos de');
  });
  it('distinguishes absent PULSE values from zero', () => {
    const reply = getMockReply('Resume esta empresa', {
      ...context,
      companyId: 'COMP_0001',
      company: {
        id: 'COMP_0001',
        name: 'Atresmedia Labs',
        month: '2026-08',
        monthsObserved: 1,
        pulse: null,
        pulsePrev: null,
        change: null,
        confidence: null,
        pillars: {},
        unknownVariables: [],
        forecast: [],
        signals: [],
        activeSignal: null,
      },
    });
    expect(reply).toContain('sin datos');
    expect(reply).not.toContain('0/100');
  });
  it('says when a company has no product that fits and lists what unlocks one', () => {
    const reply = getMockReply('¿Qué productos me recomiendas?', {
      ...context,
      companyId: 'COMP_0007',
      company: {
        id: 'COMP_0007',
        name: 'Mercedes-Benz Labs',
        month: '2026-08',
        monthsObserved: 12,
        pulse: 45,
        pulsePrev: 44,
        change: 1,
        confidence: 0.59,
        pillars: {},
        unknownVariables: [],
        forecast: [],
        signals: [],
        activeSignal: null,
      },
      advisor: {
        summary: 'No hay hoy un producto que encaje.',
        pStress6m: 0.11,
        baseRate: 0.22,
        referenceRate: {
          label: 'Euríbor 12 m',
          value: 0.021,
          source: 'default',
        },
        offers: [],
        declined: [],
        unlocks: [
          'Préstamo a plazo: se desbloquea con un PULSE de 60 (hoy 45).',
        ],
        leverStory: [],
      },
    });
    expect(reply).toContain('sin producto que encaje hoy');
    expect(reply).toContain('PULSE de 60');
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
  it('renders numbered lists, headings and inline code as plain structure', () => {
    const markup = renderToStaticMarkup(
      <MessageContent
        text={
          '### Prioridades\n\n1. `COMP_0001` primero\n2. Después **COMP_0002**'
        }
      />,
    );
    expect(markup).toContain('<ol');
    expect(markup).toContain('COMP_0001 primero');
    expect(markup).not.toContain('`');
    expect(markup).not.toContain('###');
    expect(markup).toContain('font-semibold');
  });
  it('renders a bold caption followed by bullets as text plus a list', () => {
    const markup = renderToStaticMarkup(
      <MessageContent
        text={'**Pilares:**\n* Actividad: 74\n* Cobros: 38 (*débil*)\nCierre.'}
      />,
    );
    expect(markup).toMatch(/<p[^>]*><strong[^>]*>Pilares:<\/strong><\/p><ul/);
    expect(markup).toContain('<em>débil</em>');
    expect(markup).toContain('<p class="whitespace-pre-wrap">Cierre.</p>');
    expect(markup).not.toContain('* Actividad');
  });
  it('keeps incomplete emphasis visible during streaming', () => {
    expect(
      renderToStaticMarkup(<MessageContent text="**Todavía escribiendo" />),
    ).toContain('Todavía escribiendo');
  });
});

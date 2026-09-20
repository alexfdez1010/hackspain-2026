import { Section } from '@/components/layout/page-shell';
import { MethodIdeaStrip } from '@/components/method/idea-strip';
import { MethodPillarCards } from '@/components/method/pillar-cards';
import { MethodPipelineFlow } from '@/components/method/pipeline-flow';
import { MethodScoreScale } from '@/components/method/score-scale';
import { MethodWeightMap } from '@/components/method/weight-map';
import { companyName } from '@/lib/company/names';
import type { MethodPageData } from '@/lib/method/page-data';
import { formatMonth, formatNumber } from '@/lib/format';

interface MethodBasicsSectionsProps {
  data: MethodPageData;
}

/**
 * The first half of the method page: the idea in three drawings, what the
 * number means, the four pillars, the 100 points and the four steps. Nothing
 * sits in a panel: the overline of each section and the space between them
 * do the separating, so no border wraps a drawing or a paragraph.
 *
 * @param props - The data of the page.
 * @returns The five sections.
 */
export function MethodBasicsSections({ data }: MethodBasicsSectionsProps) {
  const { meta, example, idea, pipelineExamples } = data;
  const marker =
    example && example.pulse !== null
      ? {
          value: example.pulse,
          label: `${companyName(example.companyId)}, ${formatMonth(example.month)}`,
        }
      : null;
  return (
    <>
      <Section title="La idea en tres dibujos">
        <MethodIdeaStrip panels={idea} pulse={example?.pulse ?? null} />
      </Section>

      <Section
        title="Qué significa el número"
        note="Las mismas cuatro bandas en toda la app"
      >
        <MethodScoreScale marker={marker} />
      </Section>

      <Section
        title={`Los ${formatNumber(meta.pillars.length)} temas que miramos`}
      >
        <MethodPillarCards pillars={meta.pillars} variables={meta.variables} />
      </Section>

      <Section
        title="Los 100 puntos, uno a uno"
        note="Cuanto más grande el trozo, más pesa. Pulsa una variable para ver qué pregunta responde"
      >
        <MethodWeightMap pillars={meta.pillars} variables={meta.variables} />
      </Section>

      <Section title="Cómo se hace la cuenta, paso a paso">
        <MethodPipelineFlow examples={pipelineExamples} />
      </Section>
    </>
  );
}

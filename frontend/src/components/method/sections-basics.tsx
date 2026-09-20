import { Section } from '@/components/layout/page-shell';
import { MethodIdeaStrip } from '@/components/method/idea-strip';
import { MethodPillarCards } from '@/components/method/pillar-cards';
import { MethodPipelineFlow } from '@/components/method/pipeline-flow';
import { MethodScoreScale } from '@/components/method/score-scale';
import { MethodWeightMap } from '@/components/method/weight-map';
import { Panel } from '@/components/ui/panel';
import { companyName } from '@/lib/company/names';
import type { MethodPageData } from '@/lib/method/page-data';
import { formatMonth, formatNumber } from '@/lib/format';

interface MethodBasicsSectionsProps {
  data: MethodPageData;
}

/**
 * The first half of the method page: the idea in three drawings, what the
 * number means, the four pillars, the 100 points and the four steps.
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
      <Section
        title="La idea en tres dibujos"
        note="Lo que hay que saber antes de nada"
      >
        <Panel>
          <MethodIdeaStrip panels={idea} pulse={example?.pulse ?? null} />
        </Panel>
      </Section>

      <Section
        title="Qué significa el número"
        note="Las mismas cuatro bandas en toda la app"
      >
        <Panel>
          <MethodScoreScale
            marker={marker}
            caption={`Último cierre publicado: ${formatMonth(meta.lastMonth)}.`}
          />
        </Panel>
      </Section>

      <Section
        title={`Los ${formatNumber(meta.pillars.length)} temas que miramos`}
        note="Cada uno con lo que vale de los 100 puntos"
      >
        <MethodPillarCards pillars={meta.pillars} variables={meta.variables} />
      </Section>

      <Section
        title="Los 100 puntos, uno a uno"
        note="Imagina una tarta de 100 trozos: cuanto más grande el trozo, más pesa esa variable. Pulsa una para ver qué pregunta responde"
      >
        <Panel>
          <MethodWeightMap pillars={meta.pillars} variables={meta.variables} />
        </Panel>
      </Section>

      <Section
        title="Cómo se hace la cuenta, paso a paso"
        note="Lo que ocurre cada mes, en ese orden, con un mes real"
      >
        <Panel>
          <MethodPipelineFlow examples={pipelineExamples} />
        </Panel>
      </Section>
    </>
  );
}

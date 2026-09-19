import { Accordion } from '@heroui/react';

import { ImprovementPlanPanel } from '@/components/advisor/improvement-plan';
import { InputsPanel } from '@/components/advisor/inputs-panel';
import { RiskPanel } from '@/components/advisor/risk-panel';
import { Section } from '@/components/layout/page-shell';
import { Panel } from '@/components/ui/panel';
import type { AdvisorCompany } from '@/lib/advisor/types';
import { formatMonth } from '@/lib/format';

interface AdvisorDetailProps {
  company: Pick<
    AdvisorCompany,
    'improvementPlan' | 'risk' | 'inputs' | 'month'
  >;
}

/**
 * Everything that justifies the page but is not a decision: which pillars
 * would unlock the rest of the catalogue, what drives the risk premium and
 * which figures the rules read. Folded by default, so the action and the
 * offers are what the reader sees; still in the document for search and
 * assistive technology.
 *
 * @param props - Improvement plan, risk, inputs and close of the company.
 * @returns The detail section with its accordion, all collapsed.
 */
export function AdvisorDetail({ company }: AdvisorDetailProps) {
  const { improvementPlan } = company;
  const panels = [
    {
      id: 'plan',
      title: 'Plan de mejora: qué desbloquearía el resto del catálogo',
      body: <ImprovementPlanPanel plan={improvementPlan} />,
      show:
        improvementPlan.unlocks.length > 0 || improvementPlan.levers.length > 0,
    },
    {
      id: 'risk',
      title: 'Riesgo: aportes al modelo de tensión a seis meses',
      body: <RiskPanel risk={company.risk} />,
      show: true,
    },
    {
      id: 'inputs',
      title: `Datos usados, cierre de ${formatMonth(company.month)}`,
      body: <InputsPanel inputs={company.inputs} />,
      show: true,
    },
  ].filter((panel) => panel.show);
  return (
    <Section
      title="Más detalle"
      note="Palancas, modelo de riesgo y cifras leídas por las reglas"
    >
      <Panel>
        <Accordion allowsMultipleExpanded variant="surface">
          {panels.map((panel) => (
            <Accordion.Item key={panel.id} id={`detail-${panel.id}`}>
              <Accordion.Heading>
                <Accordion.Trigger>
                  {panel.title}
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="pb-2">{panel.body}</Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Panel>
    </Section>
  );
}

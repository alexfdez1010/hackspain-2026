import { Section } from '@/components/layout/page-shell';
import { MethodConfidenceBar } from '@/components/method/confidence-bar';
import { MethodExamplePanel } from '@/components/method/example-panel';
import { MethodFormulaPanel } from '@/components/method/formula-panel';
import { MethodGlossary } from '@/components/method/glossary';
import { MethodOutlookList } from '@/components/method/outlook-list';
import { MethodWorkedRow } from '@/components/method/worked-row';
import { companyName } from '@/lib/company/names';
import type { MethodPageData } from '@/lib/method/page-data';
import { formatMonth } from '@/lib/format';

interface MethodDetailSectionsProps {
  data: MethodPageData;
}

/**
 * The second half of the method page: what a missing datum does, one real
 * month added by hand, what the score does after the month, the formula for
 * whoever wants it and the glossary. No panels either: every figure and
 * sentence here was already said once, so nothing gets a frame to say it
 * louder.
 *
 * @param props - The data of the page.
 * @returns The five sections.
 */
export function MethodDetailSections({ data }: MethodDetailSectionsProps) {
  const { meta, example, coverage, lastHorizon, worked } = data;
  return (
    <>
      <Section
        title="¿Y si falta algún dato?"
        note="Los 100 puntos, según su evidencia"
      >
        <MethodConfidenceBar
          segments={coverage}
          confidence={example?.confidence ?? null}
          caption={
            example
              ? `Datos de ${companyName(example.companyId)} en ${formatMonth(example.month)}.`
              : 'Sin mes observado para ilustrar la cobertura.'
          }
        />
      </Section>

      <Section
        title="Un mes real, sumado a mano"
        note={
          example
            ? `${companyName(example.companyId)} · cierre de ${formatMonth(example.month)}`
            : 'Sin empresa de ejemplo'
        }
      >
        <div className="flex flex-col gap-8">
          {worked && <MethodWorkedRow worked={worked} />}
          {example ? (
            <MethodExamplePanel example={example} />
          ) : (
            <p className="text-[15px] leading-[1.55] text-ink-secondary">
              El export no trae ninguna empresa con meses observados.
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Y después del mes"
        note="Lo que el PULSE hace con el futuro, y lo que no"
      >
        <MethodOutlookList
          forecast={meta.evaluation.forecast}
          lastHorizon={lastHorizon}
          anticipation={meta.evaluation.signals.anticipation}
        />
      </Section>

      <Section title="La fórmula, para quien la quiera">
        <MethodFormulaPanel />
      </Section>

      <Section title="Palabras raras, traducidas">
        <MethodGlossary />
      </Section>
    </>
  );
}

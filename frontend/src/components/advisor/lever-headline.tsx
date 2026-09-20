import { ActionArrow } from '@/components/actions/action-arrow';
import { InfoTip } from '@/components/ui/info-tip';
import {
  buildLeverHeadline,
  type LeverTile,
  type LeverTileTone,
} from '@/lib/advisor/lever-view';
import type { AdvisorCompany } from '@/lib/advisor/types';
import { companyRoutes } from '@/lib/routes';

/**
 * Colour of a figure over navy. Always the dark-theme hex of the state
 * tokens, because the block is navy in both themes and the light-theme
 * greens and ambers do not hold on it.
 */
const TONE_COLOR: Record<LeverTileTone, string> = {
  plain: '#FFFFFF',
  good: '#3DD68C',
  bad: '#F7B955',
  sky: 'var(--brand-sky)',
};

/**
 * One figure of the strip: the value in its tone, the label under it and
 * the info button that defines it.
 *
 * @param props - The tile and whether it is the first of the row.
 * @returns The tile.
 */
function LeverTileCell({ tile, first }: { tile: LeverTile; first: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-2.5 px-5 text-center ${first ? '' : 'border-l border-white/12'}`.trim()}
    >
      <b
        className="text-[32px] leading-[1.1] font-semibold tracking-[-0.01em] whitespace-nowrap tabular-nums"
        style={{ color: TONE_COLOR[tile.tone] }}
      >
        {tile.value}
      </b>
      <span className="flex max-w-[20ch] items-start justify-center gap-1.5 text-[15px] leading-[1.45] text-white/75 [text-wrap:balance]">
        {tile.label}
        <InfoTip
          label={tile.label}
          className="mt-0.5 text-white/60 hover:text-white"
        >
          {tile.tip}
        </InfoTip>
      </span>
    </div>
  );
}

interface LeverHeadlineProps {
  company: AdvisorCompany;
}

/**
 * The navy block of the financing page: the pillar whose move would cut the
 * risk premium most, written as one sentence with the company's figures,
 * the three numbers that frame the price and the way to the method.
 *
 * It sits between the offers and the products left out, as the prototype
 * places it: the reader has just seen the prices, and this is the sentence
 * that says what they are paying for. The hairline over the figures is the
 * one line of the block: it separates the sentence from its numbers.
 *
 * @param props - The company being advised.
 * @returns The block, or nothing when no lever lowers the premium.
 */
export function LeverHeadline({ company }: LeverHeadlineProps) {
  const view = buildLeverHeadline(company);
  if (!view) return null;
  return (
    <section
      aria-label="Palanca del precio"
      className="bg-gradient-hero rounded-2xl px-5 py-7 text-center text-white sm:p-10"
    >
      <h2 className="mx-auto max-w-[720px] text-[26px] leading-[1.25] font-semibold tracking-[-0.01em] [text-wrap:balance] sm:text-[34px] sm:leading-[1.2]">
        {view.headline}
      </h2>
      {view.note && (
        <p className="mx-auto mt-4 max-w-[720px] text-[17px] leading-[1.6] text-white/75">
          {view.note}
        </p>
      )}
      <div className="mx-auto mt-8 grid max-w-[840px] grid-cols-1 gap-y-6 border-t border-white/12 pt-7 sm:grid-cols-3 sm:gap-y-0">
        {view.tiles.map((tile, index) => (
          <LeverTileCell key={tile.key} tile={tile} first={index === 0} />
        ))}
      </div>
      <ActionArrow
        link={{
          href: companyRoutes(company.companyId).method,
          label: 'Cómo se calcula',
        }}
        className="mt-8 text-[17px]"
      />
    </section>
  );
}

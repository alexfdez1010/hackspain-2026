'use client';

import { Button } from '@heroui/react';

import { PulseShowcaseAnimation } from '@/components/layout/pulse-showcase-animation';
import { bandShowcaseFor } from '@/lib/landing/band-showcase-svg';
import { SCORE_BANDS, type ScoreBandKey } from '@/lib/score';

interface PulseBandShowcaseProps {
  /** Band whose trajectory is drawn. */
  band: ScoreBandKey;
  /** Called when the reader hovers, focuses or presses a level. */
  onBandChange: (band: ScoreBandKey) => void;
}

/**
 * Range of a band as the legend prints it, taken from its label.
 *
 * @param label - Legend label such as `Frágil (35-50)`.
 * @returns The part in parentheses, or an empty string.
 */
export function bandRange(label: string): string {
  return /\(([^)]+)\)/.exec(label)?.[1] ?? '';
}

/**
 * The landing chart: the four score levels in their colour, and the
 * trajectory of the selected band.
 *
 * The strip is controlled by the parent so a cell and a level cannot
 * disagree. Hover, focus or press preview; the parent keeps the choice.
 * The column fills its cell: the four levels span the width of the pane
 * and the SVG grows into the remaining height.
 *
 * @param props - The band shown and the callback that selects another.
 * @returns The level strip and the animated chart.
 */
export function PulseBandShowcase({
  band,
  onBandChange,
}: PulseBandShowcaseProps) {
  const showcase = bandShowcaseFor(band);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div
        role="group"
        aria-label="Niveles del score"
        className="grid w-full grid-cols-2 lg:grid-cols-4"
      >
        {SCORE_BANDS.map((level) => {
          const pressed = level.key === band;
          return (
            <Button
              key={level.key}
              variant="tertiary"
              size="sm"
              aria-pressed={pressed}
              data-band={level.key}
              onHoverStart={() => onBandChange(level.key)}
              onFocus={() => onBandChange(level.key)}
              onPress={() => onBandChange(level.key)}
              className={`showcase-level h-auto min-w-0 w-full justify-start gap-2 rounded-lg bg-transparent px-1 py-1.5 text-[13px] font-medium shadow-none [--button-bg-hover:transparent] [--button-bg-pressed:transparent] hover:bg-transparent ${
                pressed ? 'text-foreground' : 'text-muted'
              }`}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: level.color }}
              />
              <span>{level.name}</span>
              <span className="font-normal text-muted">
                {bandRange(level.label)}
              </span>
            </Button>
          );
        })}
      </div>
      <PulseShowcaseAnimation key={showcase.band} svg={showcase.svg} />
    </div>
  );
}

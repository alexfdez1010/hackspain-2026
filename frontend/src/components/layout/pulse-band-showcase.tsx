'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';

import { PulseShowcaseAnimation } from '@/components/layout/pulse-showcase-animation';
import { bandShowcaseFor } from '@/lib/landing/band-showcase-svg';
import { SCORE_BANDS, type ScoreBandKey } from '@/lib/score';

interface PulseBandShowcaseProps {
  /** Band drawn before the reader hovers any level. */
  initialBand: ScoreBandKey;
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
 * trajectory of whichever level the reader hovers, focuses or taps.
 *
 * Each level swaps the chart for a trajectory that closes inside that band,
 * drawn in the band's colour, so the palette of the product is read as
 * severity before the product is opened. The strip is a group of toggle
 * buttons: hover previews, press keeps.
 *
 * @param props - The band shown first.
 * @returns The level strip and the animated chart.
 */
export function PulseBandShowcase({ initialBand }: PulseBandShowcaseProps) {
  const [band, setBand] = useState<ScoreBandKey>(initialBand);
  const showcase = bandShowcaseFor(band);

  return (
    <div className="flex flex-col gap-5">
      <div
        role="group"
        aria-label="Niveles del score"
        className="flex flex-wrap gap-x-1 gap-y-1"
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
              onHoverStart={() => setBand(level.key)}
              onFocus={() => setBand(level.key)}
              onPress={() => setBand(level.key)}
              className={`showcase-level h-auto min-w-0 gap-2 rounded-lg bg-transparent px-2.5 py-1.5 text-[13px] font-medium shadow-none [--button-bg-hover:transparent] [--button-bg-pressed:transparent] hover:bg-transparent ${
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

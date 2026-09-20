'use client';

import { PillarShift } from '@/components/advisor/pillar-shift';
import { PulseShowcaseAnimation } from '@/components/layout/pulse-showcase-animation';
import { formatEuroExact } from '@/lib/advisor/format';
import { formatNumber } from '@/lib/format';
import { bandShowcase } from '@/lib/landing/band-showcase-svg';
import {
  DIAGNOSIS_PREVIEW,
  FINANCING_PREVIEW,
  SIGNAL_PREVIEW,
} from '@/lib/landing/feature-previews';
import type { LandingFeatureId } from '@/lib/landing/landing-features';
import { bandTint } from '@/lib/pulse/band';
import { describeSignalAge, SIGNAL_KINDS } from '@/lib/pulse/signals';
import { scoreBand } from '@/lib/score';

/** Light-band ink that does not interpolate when the landing pages. */
const LIGHT_SECONDARY = '#6e7488';
const LIGHT_MUTED = '#9aa1b4';

/** Mosaic rest wash: the same 12 % the diagnosis cells use. */
const DIAGNOSIS_TINT = 12;

/** PULSE marketing chart, built once so the landing does not serialise twice. */
const PULSE_SHOWCASE = bandShowcase('critical');

interface LandingFeaturePreviewProps {
  /** Page whose figure should fill the lower-left pane. */
  featureId: LandingFeatureId;
}

/**
 * Trajectory of the last close and the twelve-month forecast, in the colour
 * of a company that is still sliding.
 *
 * @returns The animated PULSE chart.
 */
function PulsePreview() {
  return (
    <div data-preview="pulse" className="h-full min-h-0">
      <PulseShowcaseAnimation svg={PULSE_SHOWCASE.svg} />
    </div>
  );
}

/**
 * What Diagnóstico answers: the variables that drag the score, washed with
 * their band, and one sentence of what is happening this month.
 *
 * @returns The diagnosis notice.
 */
function DiagnosisPreview() {
  return (
    <aside
      data-preview="diagnosis"
      aria-label="Qué mueve el PULSE"
      className="flex h-full min-h-0 flex-col justify-center gap-4"
    >
      <ul className="flex flex-col gap-2">
        {DIAGNOSIS_PREVIEW.variables.map((variable) => {
          const band = scoreBand(variable.score);
          return (
            <li
              key={variable.label}
              className="flex items-baseline justify-between gap-4 rounded-lg px-3.5 py-3"
              style={{ background: bandTint(variable.score, DIAGNOSIS_TINT) }}
            >
              <span className="text-sm font-medium leading-tight">
                {variable.label}
              </span>
              <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                <span className="text-xl font-semibold leading-none tracking-[-0.01em]">
                  {formatNumber(variable.score, 1)}
                </span>
                <span className="text-[13px] text-ink-secondary">
                  {band.name}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-[15px] leading-[1.55] text-ink-secondary">
        {DIAGNOSIS_PREVIEW.notice}
      </p>
    </aside>
  );
}

/**
 * What Alertas answers: one open signal with its kind, age and headline.
 *
 * Ink is the light-band gray, hardcoded, so paging cannot retint the block
 * blue. The product chip stays off this surface: it mixes feedback tokens.
 * The block sits at mid-pane like the other figures and uses the same 4 %
 * ink veil as a hovered 2×2 cell, without radii.
 *
 * @returns The signal notice.
 */
function SignalPreview() {
  const kind = SIGNAL_KINDS[SIGNAL_PREVIEW.kind];
  return (
    <aside
      data-preview="signals"
      role="status"
      aria-label={`Señal: ${SIGNAL_PREVIEW.headline}`}
      className="flex h-full min-h-0 flex-col justify-center"
    >
      <div
        className="flex shrink-0 flex-col gap-2 px-3.5 py-3"
        style={{
          background: 'color-mix(in srgb, #0d1130 4%, transparent)',
          color: LIGHT_SECONDARY,
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-2 text-xs font-medium leading-[1.2]">
            <i
              aria-hidden
              className="size-2 shrink-0"
              style={{ background: LIGHT_SECONDARY }}
            />
            {kind.label}
          </span>
          <span
            className="text-[13px] leading-[1.45]"
            style={{ color: LIGHT_MUTED }}
          >
            {describeSignalAge(SIGNAL_PREVIEW, SIGNAL_PREVIEW.lastMonth)} ·{' '}
            {SIGNAL_PREVIEW.status}
          </span>
        </div>
        <p className="text-[15px] font-medium leading-[1.55]">
          {SIGNAL_PREVIEW.headline}
        </p>
        <p
          className="text-[15px] leading-[1.55]"
          style={{ color: LIGHT_MUTED }}
        >
          {SIGNAL_PREVIEW.detail}
        </p>
      </div>
    </aside>
  );
}

/**
 * What Financiación answers: the amount the model would approve and the
 * pillar that amount would move on the 0-100 scale.
 *
 * @returns The financing figure and shift.
 */
function FinancingPreview() {
  return (
    <figure
      data-preview="advisor"
      className="flex h-full min-h-0 flex-col justify-center gap-5"
    >
      <div className="flex flex-col gap-1">
        <p className="font-display text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
          {formatEuroExact(FINANCING_PREVIEW.amount)}
        </p>
        <p className="text-[15px] leading-[1.55] text-ink-secondary">
          {FINANCING_PREVIEW.product} que el modelo aprueba hoy.
        </p>
      </div>
      <PillarShift
        current={FINANCING_PREVIEW.current}
        target={FINANCING_PREVIEW.target}
        label={FINANCING_PREVIEW.pillar}
      />
    </figure>
  );
}

/**
 * Figure of the selected product page in the light landing band.
 *
 * Each page keeps its own reading: a trajectory, a diagnosis notice, an
 * alert or an approved line. Unknown ids fall back to PULSE.
 *
 * @param props - The page being previewed.
 * @returns The matching figure.
 */
export function LandingFeaturePreview({
  featureId,
}: LandingFeaturePreviewProps) {
  switch (featureId) {
    case 'diagnosis':
      return <DiagnosisPreview />;
    case 'signals':
      return <SignalPreview />;
    case 'advisor':
      return <FinancingPreview />;
    default:
      return <PulsePreview />;
  }
}

import { Art, ART_ACCENT, ART_SURFACE } from '@/components/method/art';
import type { MethodPipelineStep } from '@/lib/method/pipeline';

/** Documents dropping into a tray: the data gathered. */
function ArtInbox() {
  return (
    <Art>
      <path
        d="M12 54v22a6 6 0 0 0 6 6h60a6 6 0 0 0 6-6V54H64l-6 8H38l-6-8z"
        fill={ART_SURFACE}
      />
      <line
        x1={48}
        y1={10}
        x2={48}
        y2={42}
        stroke={ART_ACCENT}
        strokeWidth={3}
      />
      <path d="M38 32l10 10l10-10" stroke={ART_ACCENT} strokeWidth={3} />
    </Art>
  );
}

/** Three columns of a race: the company against the rest. */
function ArtPodium() {
  return (
    <Art>
      <rect x={12} y={50} width={20} height={36} rx={3} fill={ART_SURFACE} />
      <rect
        x={38}
        y={30}
        width={20}
        height={56}
        rx={3}
        fill={ART_ACCENT}
        fillOpacity={0.25}
      />
      <rect x={64} y={64} width={20} height={22} rx={3} fill={ART_SURFACE} />
      <circle cx={48} cy={18} r={6} fill={ART_ACCENT} stroke="none" />
    </Art>
  );
}

/** A balance with a heavy and a light weight: points that count more. */
function ArtBalance() {
  return (
    <Art>
      <line x1={24} y1={86} x2={72} y2={86} />
      <line x1={48} y1={86} x2={48} y2={26} />
      <line x1={14} y1={38} x2={82} y2={28} />
      <line x1={14} y1={38} x2={14} y2={52} />
      <line x1={82} y1={28} x2={82} y2={46} />
      <circle cx={14} cy={62} r={10} fill={ART_ACCENT} fillOpacity={0.25} />
      <circle cx={82} cy={52} r={6} fill={ART_SURFACE} />
    </Art>
  );
}

/** A calculator: the sum of the contributions. */
function ArtCalculator() {
  return (
    <Art>
      <rect x={22} y={8} width={52} height={80} rx={8} fill="white" />
      <rect x={30} y={16} width={36} height={14} rx={3} fill={ART_SURFACE} />
      {[40, 54, 68].map((y) =>
        [36, 48, 60].map((x) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y + 6}
            r={4}
            fill={ART_SURFACE}
          />
        )),
      )}
      <line
        x1={56}
        y1={74}
        x2={64}
        y2={74}
        stroke={ART_ACCENT}
        strokeWidth={3}
      />
      <line
        x1={60}
        y1={70}
        x2={60}
        y2={78}
        stroke={ART_ACCENT}
        strokeWidth={3}
      />
    </Art>
  );
}

/** Sun, cloud and rain: a forecast with its margin. */
export function ArtWeather() {
  return (
    <Art>
      <circle cx={64} cy={30} r={12} fill={ART_ACCENT} fillOpacity={0.25} />
      <path
        d="M28 66h38a12 12 0 0 0 0-24a16 16 0 0 0-30-4a11 11 0 0 0-8 28z"
        fill="white"
      />
      <line x1={36} y1={76} x2={32} y2={86} />
      <line x1={50} y1={76} x2={46} y2={86} />
      <line x1={64} y1={76} x2={60} y2={86} />
    </Art>
  );
}

/** A bell: the alert that rings when the score moves. */
export function ArtBell() {
  return (
    <Art>
      <path
        d="M48 14a20 20 0 0 1 20 20v18l8 12H20l8-12V34a20 20 0 0 1 20-20z"
        fill={ART_SURFACE}
      />
      <line x1={48} y1={8} x2={48} y2={14} />
      <path d="M40 72a8 8 0 0 0 16 0" fill={ART_ACCENT} stroke="none" />
    </Art>
  );
}

/** A price tag. */
export function ArtTag() {
  return (
    <Art>
      <path d="M12 52L46 18h34v34L46 86z" fill={ART_SURFACE} />
      <circle cx={68} cy={30} r={5} fill="white" />
      <line
        x1={36}
        y1={48}
        x2={52}
        y2={64}
        stroke={ART_ACCENT}
        strokeWidth={3}
      />
    </Art>
  );
}

/** A fence: where the score stops. */
export function ArtFence() {
  return (
    <Art>
      {[18, 44, 70].map((x) => (
        <path key={x} d={`M${x} 86V32l4-8l4 8v54`} fill={ART_SURFACE} />
      ))}
      <rect
        x={8}
        y={46}
        width={80}
        height={6}
        rx={2}
        fill={ART_ACCENT}
        fillOpacity={0.25}
      />
      <rect
        x={8}
        y={66}
        width={80}
        height={6}
        rx={2}
        fill={ART_ACCENT}
        fillOpacity={0.25}
      />
    </Art>
  );
}

const STEP_ART: Record<MethodPipelineStep['art'], () => React.JSX.Element> = {
  inbox: ArtInbox,
  podium: ArtPodium,
  balance: ArtBalance,
  calculator: ArtCalculator,
};

interface MethodStepArtProps {
  art: MethodPipelineStep['art'];
}

/**
 * Picks the drawing of a step of the calculation.
 *
 * @param props - Which drawing the step asks for.
 * @returns The drawing.
 */
export function MethodStepArt({ art }: MethodStepArtProps) {
  const Drawing = STEP_ART[art];
  return <Drawing />;
}

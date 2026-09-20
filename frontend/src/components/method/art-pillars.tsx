import { Art, ART_ACCENT, ART_SURFACE } from '@/components/method/art';
import type { MethodPillarDoc } from '@/lib/method/pillars';

/** A jar with its level: the cash in the bank. */
function ArtJar() {
  return (
    <Art>
      <rect x={30} y={12} width={36} height={10} rx={3} fill={ART_SURFACE} />
      <rect x={22} y={22} width={52} height={64} rx={10} fill="white" />
      <path
        d="M22 52h52v24a10 10 0 0 1-10 10H32a10 10 0 0 1-10-10z"
        fill={ART_ACCENT}
        fillOpacity={0.25}
        stroke="none"
      />
      <line x1={22} y1={52} x2={74} y2={52} stroke={ART_ACCENT} />
      <circle cx={40} cy={70} r={6} fill="white" />
      <circle cx={56} cy={66} r={6} fill="white" />
    </Art>
  );
}

/** A credit card with how much of its limit is used. */
function ArtCard() {
  return (
    <Art>
      <rect x={8} y={22} width={80} height={52} rx={8} fill="white" />
      <rect
        x={8}
        y={32}
        width={80}
        height={9}
        fill="currentColor"
        stroke="none"
      />
      <rect x={18} y={54} width={60} height={9} rx={4} fill={ART_SURFACE} />
      <rect
        x={18}
        y={54}
        width={44}
        height={9}
        rx={4}
        fill={ART_ACCENT}
        stroke="none"
      />
    </Art>
  );
}

/** A calendar with a tick: paid on the promised day. */
function ArtCalendar() {
  return (
    <Art>
      <rect x={12} y={18} width={72} height={68} rx={8} fill="white" />
      <rect x={12} y={18} width={72} height={16} rx={8} fill={ART_SURFACE} />
      <line x1={12} y1={34} x2={84} y2={34} />
      <line x1={32} y1={10} x2={32} y2={26} />
      <line x1={64} y1={10} x2={64} y2={26} />
      <path d="M32 60l11 11l22-24" stroke={ART_ACCENT} strokeWidth={4} />
    </Art>
  );
}

/** An invoice with a clock: money owed and the days it takes to arrive. */
function ArtInvoice() {
  return (
    <Art>
      <path d="M16 10h38l14 14v60H16z" fill="white" />
      <path d="M54 10v14h14" fill={ART_SURFACE} />
      <line x1={26} y1={40} x2={52} y2={40} />
      <line x1={26} y1={52} x2={46} y2={52} />
      <line x1={26} y1={64} x2={40} y2={64} />
      <circle cx={70} cy={68} r={16} fill="white" />
      <path d="M70 58v10l7 5" stroke={ART_ACCENT} strokeWidth={3} />
    </Art>
  );
}

const ART: Record<MethodPillarDoc['art'], () => React.JSX.Element> = {
  jar: ArtJar,
  card: ArtCard,
  calendar: ArtCalendar,
  invoice: ArtInvoice,
};

interface MethodPillarArtProps {
  art: MethodPillarDoc['art'];
}

/**
 * Picks the drawing of a pillar.
 *
 * @param props - Which drawing the pillar asks for.
 * @returns The drawing.
 */
export function MethodPillarArt({ art }: MethodPillarArtProps) {
  const Drawing = ART[art];
  return <Drawing />;
}

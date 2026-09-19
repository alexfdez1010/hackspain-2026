import type { ActionContext, ActionOffer } from '@/lib/actions/context';
import { formatEuroExact, formatRate, formatTenor } from '@/lib/advisor/format';
import { formatNumber, formatPercent } from '@/lib/format';
import type { CompanyAction } from '@/lib/actions/types';
import { MAX_ACTIONS } from '@/lib/actions/types';
import { SIGNAL_KINDS } from '@/lib/pulse/signals';
import type { PulseSignalKind } from '@/lib/pulse/types';

/** The first offer as an action: take it, with its amount and tenor. */
function offerAction(offer: ActionOffer): CompanyAction {
  const tenor =
    offer.tenorMonths === null ? '' : ` a ${formatTenor(offer.tenorMonths)}`;
  const instalment =
    offer.monthlyInstalment === null
      ? ''
      : ` Cuota de ${formatEuroExact(offer.monthlyInstalment)} al mes.`;
  return {
    title: `Contrata ${offer.label.toLowerCase()} de ${formatEuroExact(offer.amount)}${tenor}`,
    detail: `${offer.why[0] ?? offer.headline} Tipo ${formatRate(offer.annualRate)} anual.${instalment}`,
    target: 'advisor',
  };
}

/** A recent fall or dip as an action: explain it before negotiating. */
function signalAction(
  signal: NonNullable<ActionContext['signal']>,
): CompanyAction | null {
  const meta = SIGNAL_KINDS[signal.kind as PulseSignalKind];
  if (!meta || meta.tone !== 'negative') return null;
  const article = signal.kind === 'bache' ? 'el' : 'la';
  return {
    title: `Explica ${article} ${meta.label.toLowerCase()} del PULSE antes de negociar`,
    detail: signal.detail,
    target: 'signals',
  };
}

/** The best lever of the first offer as an action on its weakest variable. */
function leverAction(offer: ActionOffer): CompanyAction | null {
  const lever = offer.bestLever;
  const variable = lever?.variables[0];
  if (!lever || !variable || lever.premiumSavingBps === null) return null;
  if (lever.premiumSavingBps <= 0) return null;
  const pillar = lever.label.replace(/^Pilar /, '').toLowerCase();
  return {
    title: `Sube ${variable.label.toLowerCase()} (${formatNumber(variable.score)}/100) para llevar ${pillar} a ${formatNumber(lever.target)}`,
    detail: `La prima bajaría ${formatNumber(lever.premiumSavingBps)} pb y la tensión a seis meses pasaría del ${formatPercent(lever.pStressNow)} al ${formatPercent(lever.pStressThen)}.`,
    target: `variable:${variable.key}`,
  };
}

/** The heaviest variable without data as an action: connect its source. */
function dataAction(context: ActionContext): CompanyAction | null {
  const variable = context.unknownVariables[0];
  if (!variable) return null;
  return {
    title: `Aporta los datos de ${variable.label.toLowerCase()} (${formatNumber(variable.weight)} puntos sin respaldo)`,
    detail: `La confianza es del ${formatPercent(context.confidence)}; sin esa variable el score no la puntúa y el precio cobra prima por incertidumbre.`,
    target: `variable:${variable.key}`,
  };
}

/** The first unlock as an action when nothing is offered today. */
function unlockAction(context: ActionContext): CompanyAction | null {
  const unlock = context.unlocks[0];
  if (!unlock) return null;
  return {
    title: unlock.replace(/: se desbloquea con/, ': llega a'),
    detail: `Hoy el PULSE es ${formatNumber(context.pulse)} y ningún producto supera el encaje mínimo.`,
    target: 'advisor',
  };
}

/**
 * Writes up to three actions without a model, from the same figures the
 * model would read: the offer, the open signal, the best lever, the missing
 * data and the unlock, in that order of importance.
 *
 * Used in demo mode and whenever the model call fails, so the page always
 * answers «qué hacer».
 *
 * @param context - Compact company context.
 * @returns At most {@link MAX_ACTIONS} actions.
 */
export function fallbackActions(context: ActionContext): CompanyAction[] {
  const offer = context.offers[0];
  const candidates: (CompanyAction | null)[] = [
    offer ? offerAction(offer) : unlockAction(context),
    context.signal ? signalAction(context.signal) : null,
    offer ? leverAction(offer) : null,
    dataAction(context),
  ];
  return candidates
    .filter((action): action is CompanyAction => action !== null)
    .slice(0, MAX_ACTIONS);
}

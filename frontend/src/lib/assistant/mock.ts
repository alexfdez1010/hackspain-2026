import type { AssistantContext } from '@/lib/assistant/context';
import { formatRate } from '@/lib/advisor/format';
import { formatEuro, formatNumber, formatPercent } from '@/lib/format';

type ContextCompany = NonNullable<AssistantContext['company']>;
type ContextAdvisor = NonNullable<AssistantContext['advisor']>;

/** Strips accents and case so a question matches regardless of how it is typed. */
function normalise(question: string): string {
  return question.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Renders the six-month forecast of the company in the context. */
function forecastLine(company: ContextCompany): string {
  const last = company.forecast[company.forecast.length - 1];
  if (!last || last.pulsePred === null) {
    return 'No hay previsión disponible para esta empresa, así que no puedo anticipar su recorrido.';
  }
  const band =
    last.pulseP10 === null || last.pulseP90 === null
      ? 'sin banda de incertidumbre'
      : `banda ${formatNumber(last.pulseP10, 1)}–${formatNumber(last.pulseP90, 1)}`;
  return `La previsión a ${formatNumber(last.horizon)} meses es **${formatNumber(last.pulsePred, 1)}/100** (${band}). Es una estimación, no una garantía.`;
}

/** Summarises the observed score of the company in the context. */
function companyReply(company: ContextCompany): string {
  const change =
    company.change === null
      ? 'sin mes anterior con el que comparar'
      : `${formatNumber(company.change, 1)} puntos frente al mes anterior`;
  const unknown = company.unknownVariables.length
    ? `${formatNumber(company.unknownVariables.length)} de las once variables no tienen datos este mes, así que parte de los 100 puntos no está respaldada.`
    : 'Las once variables tienen datos este mes.';
  return `**${company.name} · PULSE**\n\nScore observado de ${company.month}: **${company.pulse === null ? 'sin datos' : `${formatNumber(company.pulse, 1)}/100`}** (${change}). Confianza: ${company.confidence === null ? 'sin datos' : formatPercent(company.confidence, 0)}, con ${formatNumber(company.monthsObserved)} meses observados.\n\n${forecastLine(company)}\n\n${unknown} Revisa los pilares y las variables antes de interpretar el movimiento.`;
}

/** Lists the recommended products of the company, or why there is none. */
function advisorReply(id: string, advisor: ContextAdvisor): string {
  const stress =
    advisor.pStress6m === null
      ? ''
      : ` La probabilidad de tensión de tesorería a seis meses es ${formatPercent(advisor.pStress6m, 0)}.`;
  if (!advisor.offers.length) {
    const unlocks = advisor.unlocks.length
      ? `\n\n${advisor.unlocks.map((line) => `• ${line}`).join('\n')}`
      : '';
    return `**${id} · sin producto que encaje hoy**\n\n${advisor.summary}${stress}${unlocks}\n\nLa página de recomendaciones detalla qué haría falta para desbloquear cada producto.`;
  }
  const offers = advisor.offers
    .map(
      (offer) =>
        `• **${offer.label}**: ${offer.amount === null ? 'importe sin fijar' : formatEuro(offer.amount)} al ${formatRate(offer.annualRate)} anual, encaje ${formatNumber(offer.fit)}/100. ${offer.why[0] ?? ''}`,
    )
    .join('\n');
  return `**${id} · productos recomendados**\n\n${offers}\n\n${stress.trim()} Los tipos son orientativos sobre el ${advisor.referenceRate.label || 'tipo de referencia'} y quedan sujetos a la aprobación de la entidad.`;
}

/** Produces deterministic demo answers grounded in the current dataset, never a fake model call. */
export function getMockReply(
  question: string,
  context: AssistantContext,
): string {
  const query = normalise(question);
  if (/\bia\b|inteligencia|machine learning|llm|prompt/.test(query)) {
    return '**La IA puede ayudarte a pasar del dato a la explicación.**\n\nEn Pulse, puedes usarla para entender qué significa el score de tu empresa, por qué se te recomienda un producto y preparar preguntas antes de hablar con tu entidad.\n\nUn modelo de lenguaje redacta e interpreta; los cálculos y las previsiones los aporta el modelo financiero de la aplicación. Conviene contrastar siempre la explicación con esos datos.\n\nPrueba con: «Resume esta empresa» o «Explícame el score». Esta respuesta está preparada para la demostración.';
  }
  if (/score|metod|significa|funciona|pilar|variable|confianza/.test(query)) {
    return '**PULSE resume la salud financiera en una escala de 0 a 100.** Cuanto mayor es, más sólida es la situación según el modelo. No es una probabilidad de impago.\n\n• Menos de 35: crítico.\n• De 35 a menos de 50: frágil.\n• De 50 a menos de 65: neutro.\n• Desde 65: sólido.\n\nLos 100 puntos se reparten entre once variables agrupadas en cuatro pilares, con pesos fijos y publicados. La confianza indica cuántos de esos puntos descansan en datos observados: cuando una variable no tiene evidencia, no cuenta como cero, simplemente no puntúa. La página Método lo explica pieza a pieza.';
  }
  if (
    /prevision|forecast|futuro|banda|p10|p90/.test(query) &&
    !context.company
  ) {
    return '**La previsión se lee aparte del dato observado.**\n\nCada empresa tiene horizontes de +1 a +12 meses. El valor previsto viene acompañado de una banda p10–p90 que refleja la incertidumbre del modelo; cuanto más ancha, menos concluyente es la estimación.\n\nAbre una empresa para ver su trayectoria observada, la previsión y el desglose de los aportes que la explican.';
  }
  if (context.companyId) {
    if (!context.company) {
      return `No hay datos de **${context.companyId}** en el export de PULSE. No puedo atribuirle un score, una previsión ni productos. Elige otra empresa en el selector de la cabecera.`;
    }
    if (
      /producto|recomend|credito|linea|factoring|confirming|prestamo|deposito|tipo|precio|financ/.test(
        query,
      )
    ) {
      return context.advisor
        ? advisorReply(context.company.name, context.advisor)
        : `No hay recomendaciones publicadas para **${context.company.name}**. Solo puedo hablar de su score y de su previsión.`;
    }
    return companyReply(context.company);
  }
  if (
    /producto|recomend|credito|linea|factoring|confirming|prestamo|deposito/.test(
      query,
    )
  ) {
    return '**Las recomendaciones se calculan empresa a empresa.**\n\nSiete productos —línea de crédito, ampliación, factoring, confirming, préstamo a plazo, reestructuración y depósito— se evalúan con reglas ligadas a las variables del score; los que encajan se dimensionan y se les pone precio sobre el Euríbor a 12 meses.\n\nAbre una empresa y pregúntame por sus productos: te diré cuáles encajan, por cuánto y por qué.';
  }
  if (/empresa|cartera|resum|situacion|hola/.test(query)) {
    return '**Esta aplicación muestra una empresa cada vez, nunca la cartera.**\n\nElige una empresa en el selector de la cabecera para abrir su PULSE mes a mes, su previsión a un año y los productos financieros que encajan. Cuando estés en una empresa, pregúntame «Resume esta empresa» o «¿Qué productos me recomiendas?».';
  }
  return 'Estoy en **modo demostración**, con respuestas preparadas sobre la aplicación. Esta pregunta todavía no tiene una respuesta simulada.\n\nPuedes probar «Resume esta empresa», «¿Qué productos me recomiendas?», «Explícame el score» o «¿Cómo puede ayudarme la IA?». Con el asistente conectado podrás hacer preguntas abiertas y continuar la conversación.';
}

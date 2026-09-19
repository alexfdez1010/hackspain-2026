import type { AssistantContext } from '@/lib/assistant/context';
import { formatNumber, formatPercent, formatEuro } from '@/lib/xray/format';
import { REGIME_LABELS } from '@/lib/xray/score';

/** Produces deterministic demo answers grounded in the current dataset, never a fake model call. */
export function getMockReply(
  question: string,
  context: AssistantContext,
): string {
  const query = question
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/\bia\b|inteligencia|machine learning|llm|prompt/.test(query)) {
    return '**La IA puede ayudarte a pasar del dato a la explicación.**\n\nEn Pulse, puedes usarla para resumir cambios en la cartera, entender qué significa un score y preparar preguntas para revisar una empresa.\n\nUn modelo de lenguaje redacta e interpreta; los cálculos y las previsiones los aporta el modelo financiero de la aplicación. Conviene contrastar siempre la explicación con esos datos.\n\nPrueba con: «Resume mi cartera» o «Explícame el score». Esta respuesta está preparada para la demostración.';
  }
  if (
    /score|metod|significa|funciona|pilar/.test(query) &&
    !context.companyId
  ) {
    return '**El score resume la salud financiera en una escala de 0 a 100.** Cuanto mayor es, más sólida es la situación según el modelo. No es una probabilidad de impago.\n\n• Menos de 35: crítico.\n• De 35 a menos de 50: frágil.\n• De 50 a menos de 65: neutro.\n• Desde 65: sólido.\n\nPara interpretarlo, mira también la trayectoria, el régimen y los pilares. Un mismo score puede esconder una mejora reciente o un deterioro sostenido. X-Ray y PULSE son modelos distintos; consulta la metodología de cada uno.';
  }
  if (context.companyId) {
    if (context.pulseCompany) {
      const c = context.pulseCompany;
      return `**${c.id} · PULSE**\n\nScore observado: ${c.score === null ? 'sin datos' : `${formatNumber(c.score, 1)}/100`}. Confianza: ${c.confidence === null ? 'sin datos' : formatPercent(c.confidence, 1)}.\n\nLa previsión se muestra aparte del valor observado, con su banda p10–p90. Esa banda refleja incertidumbre; no es una garantía. Revisa los pilares y las variables antes de interpretar el movimiento.`;
    }
    if (!context.company)
      return `No hay datos disponibles para **${context.companyId}** en esta vista. No puedo atribuirle un score ni una previsión. Puedes consultar otra empresa del radar.`;
    const c = context.company;
    const offer = c.offer
      ? `La línea calculada en la demo es ${formatEuro(c.offer.limit)}, con estado «${c.offer.status}». Es una simulación de la aplicación, no una concesión de crédito.`
      : 'No hay detalle de la línea de crédito disponible para esta empresa; no puedo atribuirle un límite.';
    return `**${c.id} · lectura de X-Ray**\n\nSu score es **${formatNumber(c.score, 1)}/100** y el régimen detectado es «${REGIME_LABELS[c.regime]}». La probabilidad de estrés a seis meses es ${formatPercent(c.stress6m, 1)}.\n\n${offer}\n\nRevisa la trayectoria y los pilares de la radiografía para entender qué explica ese nivel.`;
  }
  if (/revis|prior|riesgo|deterior|empresa|alert/.test(query)) {
    if (!context.worstMovers.length)
      return 'No hay suficiente historial para ordenar movimientos a seis meses. Cuando llegue, podremos comparar cambios sin confundir ausencia de datos con estabilidad.';
    const rows = context.worstMovers
      .map(
        (row) =>
          `• **${row.id}**: ${formatNumber(row.delta6m!, 1)} puntos en seis meses; score actual ${formatNumber(row.score, 1)}/100.`,
      )
      .join('\n');
    return `**Estas son las tres menores variaciones a seis meses** de la cartera disponible:\n\n${rows}\n\nUsa este orden como punto de partida. Comprueba si el cambio es estructural, qué pilares lo explican y si hay alertas recientes; el score por sí solo no basta para decidir.`;
  }
  if (/capital|credito|limite|circulante/.test(query))
    return '**Capital traduce el score en una línea de circulante simulada.**\n\nEl cálculo combina el score X-Ray, el régimen y el ingreso mensual medio. El precio incorpora la probabilidad de estrés.\n\nAbre la radiografía de una empresa y pregúntame por su línea: podré mostrarte el límite y el estado calculados con los datos de esa empresa.';
  if (/cartera|resum|situacion|hola/.test(query)) {
    if (context.pulse)
      return `**Tu cartera PULSE tiene ${formatNumber(context.pulse.count)} empresas**, con último mes observado ${context.pulse.month}.\n\nCompara el score y su variación mensual junto con la confianza. La previsión a seis meses y su banda de incertidumbre se leen por separado del dato observado.\n\nAbre una empresa para revisar sus pilares y sus once variables.`;
    const s = context.stats;
    if (!s.total)
      return 'Ahora mismo no hay empresas disponibles en la fuente de datos. No puedo resumir una cartera vacía. Vuelve a intentarlo cuando se hayan cargado los datos.';
    return `**Tu cartera, en una lectura.**\n\nHay **${formatNumber(s.total)} empresas** puntuadas y el score mediano es **${formatNumber(s.medianScore, 1)}/100**.\n\n• ${formatNumber(s.deteriorating)} empresas se están deteriorando.\n• ${formatNumber(s.structuralDecline)} presentan una caída estructural.\n• ${formatNumber(s.highStress)} tienen una probabilidad de estrés de al menos el 35 % a seis meses.\n\nEstos grupos pueden solaparse. Para empezar, cruza el deterioro reciente con el régimen y revisa las alertas de cada empresa.`;
  }
  return 'Estoy en **modo demostración**, con respuestas preparadas sobre la aplicación. Esta pregunta todavía no tiene una respuesta simulada.\n\nPuedes probar «Resume mi cartera», «¿Qué empresas revisaría primero?», «Explícame el score» o «¿Cómo puede ayudarme la IA?». Con el asistente conectado podrás hacer preguntas abiertas y continuar la conversación.';
}

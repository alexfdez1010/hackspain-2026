# Nexo

Nexo explica la aplicación y permite preguntas abiertas al conectar Gateway.
El modo local utiliza respuestas preparadas, identificadas como demo y basadas
en el dataset disponible. No pretende simular comprensión de cualquier pregunta.

## Uso e integración

`AssistantWidget({ mode })`, montado una sola vez en el layout, mantiene la
conversación al navegar. `NexoMascot({ mood, className })` es el renderer decorativo.
Ejemplo: `<NexoMascot mood="thinking" className="size-32" />`.

`useAssistant()` encapsula envío, cancelación, reintento, reinicio y contexto de
ruta. `getAssistantContext(pathname, question, pulse?, advisor?)` admite inyección
de los adaptadores de lectura para pruebas aisladas. `getMockReply(question,
context)` es determinista. `parseAssistantRequest(value)` valida JSON ya leído;
`readAssistantRequest(request)` añade límite de bytes y comprobación de origen.

Ejemplo sin clave, con `bun run dev`:

```bash
curl -N http://localhost:3000/api/assistant \
  -H 'Content-Type: application/json' \
  -d '{"pathname":"/empresa/COMP_0001","messages":[{"id":"demo-1","role":"user","parts":[{"type":"text","text":"Resume esta empresa"}]}]}'
```

`AI_GATEWAY_API_KEY` se lee sólo en el servidor. La constante de modelo es
`google/gemini-3.8-flash`, comprobada en el catálogo público de Gateway el
19 de septiembre de 2026. No existe selector de modelo ni fallback silencioso.
El modo automático usa la clave si existe; `ASSISTANT_MODE=mock` evita llamadas
externas aun con clave. El modo `gateway` sin clave responde 503.

El endpoint usa AI SDK 7: `streamText`, `toUIMessageStream` y
`createUIMessageStreamResponse`. Los mocks emiten el mismo protocolo mediante
`createUIMessageStream`. La clave se obtiene con el proveedor Gateway por defecto
del SDK; no hay un cliente Google ni una segunda clave. Máximo 10.000 tokens de
salida, dos reintentos y cancelación del modelo a los 55 segundos
(`maxDuration = 60`) o al abortar el cliente. Se omite el razonamiento interno
del stream.

Gemini 3.x razona antes de escribir y ese razonamiento consume el presupuesto
de salida. Con el nivel por defecto, una respuesta corta gastaba unos 900 de los
1.000 tokens en razonamiento y se cortaba a mitad de frase
(`finishReason: length`). Por eso `ASSISTANT_PROVIDER_OPTIONS` fija
`thinkingConfig.thinkingLevel = 'low'` (el nivel `minimal` no existe para este
modelo). El servidor añade `finishReason` a la metadata del mensaje al terminar;
si vale `length`, la interfaz lo indica bajo la respuesta en lugar de dejar el
corte sin explicar.

Las instrucciones incluyen un glosario construido desde `DIRECTION_LABELS` y
`REGIME_LABELS` para que el modelo no repita identificadores del dataset
(`pStress`, `structural_decline`) y use formato numérico español.

Sólo se envían al modelo los metadatos del score y, cuando la ruta o la
pregunta nombran una, una única empresa con su PULSE y sus recomendaciones;
la aplicación nunca muestra la cartera y el asistente tampoco la recibe. La metadata de fuentes son rutas internas construidas por el
servidor. No se renderizan HTML ni enlaces generados por el modelo. No hay
persistencia de chats, herramientas de escritura ni acciones financieras.
Esta app de demostración no tiene autenticación: antes de exposición pública de
la ruta de pago, deben aplicarse los controles de acceso y cuota del despliegue.

El layout se resuelve por petición para que el indicador de modo no quede
congelado en una build sin clave si se configura Gateway al arrancar el servidor.
React y React DOM se actualizan sólo dentro de 19.1 (19.1.9 en los lockfiles)
para satisfacer el peer dependency del SDK actual.

## Herramientas y gráficos (2026-09-19)

Nexo es un agente con herramientas de sólo lectura, definidas en
`src/lib/assistant/tools` con `tool()` y `jsonSchema` de AI SDK 7 y pasadas a
`streamText` con `stopWhen: stepCountIs(ASSISTANT_MAX_STEPS)` (seis pasos).
Todas leen la empresa de la conversación a través de los mismos adaptadores
que las páginas (`PulseDataSource`, `AdvisorDataSource`), memorizados por
petición en `ToolRuntime`; ninguna escribe, sale a internet ni recibe la
cartera. Las cifras se redondean antes de llegar al modelo.

| Herramienta           | Qué lee                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `get_history`         | Score, confianza, caja al cierre y pilares de cada mes observado (últimos N)                    |
| `get_month`           | Las once variables de un mes: score, cifra en bruto con unidad, peso y puntos aportados         |
| `get_forecast`        | Horizontes +1…+6 con banda p10-p90 y los cuatro impulsores mayores de cada uno                  |
| `get_signals`         | Señales con impulsores, probabilidad de que dure y desenlace; la alerta viva                    |
| `get_financing`       | Ofertas con importe, tipo, componentes del precio y motivos; descartados, desbloqueos, palancas |
| `get_variable`        | Historial de una variable, estadísticas y su peso en la previsión                               |
| `get_variable_detail` | Rankings del detalle (clientes, proveedores, morosos, líneas, deuda, antigüedad) y caja diaria  |
| `show_chart`          | Dibuja un gráfico interactivo en el chat                                                        |

`show_chart` recibe `{ kind, variable?, variables?, horizon?, month?, ranking? }`
con `kind` en `trayectoria`, `pilares`, `variables`, `puntos`, `variable`,
`comparar`, `impulsores`, `caja` o `ranking`, y devuelve un `ChartSpec`
(`src/lib/assistant/charts/types.ts`) construido en el servidor con los datos
del export: el modelo elige el gráfico, nunca sus números. El navegador recibe
la especificación completa en la parte `tool-show_chart` y la dibuja con
`AssistantChart` (`src/components/assistant/charts`) reutilizando los SVG del
producto (`PulseTrajectoryChart`, `PillarSpark`, `VariableScoreChart`,
`DailyBalanceChart`) y cuatro listas de barras apiladas propias del panel
(`ScoreBars`, `PointsBars`, `DriverBars`, `RankingBars`) más `CompareLines`. El
modelo sólo recibe `{ shown, kind, title, summary }` (`toModelOutput`), y el
navegador devuelve esa misma versión compacta en el historial
(`compactMessage`), así que los puntos del gráfico nunca vuelven a pagarse en
tokens. Cada figura enlaza a la página de la aplicación donde vive la misma
lectura.

El historial admite ahora partes de herramienta en los mensajes del asistente:
sólo las de herramientas conocidas, en estado `output-available`, con entrada
objeto y menos de 12.000 caracteres serializados; el resto se descarta sin
error. El cuerpo admite 256 KiB y 32 partes por mensaje.

En modo `mock`, `getMockChart` decide si la pregunta pide un gráfico
(«dibuja», «trayectoria», «pilares», «restan puntos», «impulsores») y la ruta
ejecuta el mismo constructor con los datos reales, emitiendo
`tool-input-start`, `tool-input-available` y `tool-output-available` antes del
texto. La demo dibuja gráficos verdaderos con prosa preparada.

Comprobado el 19 de septiembre de 2026 con Gateway: «Dibuja la trayectoria del
PULSE y dime qué variables restan más puntos» llama en paralelo a `show_chart`
y `get_month` y escribe la lectura en 5 s; una pregunta con comparación y
ranking encadena `get_month`, `get_variable_detail` y dos `show_chart` en 6 s.
Pruebas: 481 unitarias (herramientas, constructores, renderizado, historial),
7 de integración (ruta con herramientas y demo con gráfico) y 8 de navegador.

Ejemplo de parte de gráfico en el stream:

```json
{
  "type": "tool-output-available",
  "toolCallId": "c1",
  "output": {
    "kind": "puntos",
    "company": "Atresmedia Labs",
    "month": "2026-08",
    "title": "Puntos ganados y perdidos en ago 2026",
    "summary": "PULSE 45,6 de 100. Mínimo intramensual de caja pierde 8,8 de 14; …",
    "href": "/company/COMP_0001/detail",
    "pulse": 45.64,
    "rows": [
      {
        "key": "cash_min",
        "label": "Mínimo intramensual de caja",
        "score": 30.1,
        "weight": 14,
        "contribution": 5.2,
        "known": true,
        "rawText": "0,11 x salidas mensuales",
        "pillarLabel": "Liquidez"
      }
    ]
  }
}
```

## Diseño y decisiones conservadas

2026-09-19: se toma de Quitapón la separación entre ilustración inmutable,
expresiones SVG y animación CSS; no se reutiliza su personaje. SOLID: el renderer
no conoce el chat, el hook no conoce las fuentes financieras, los adaptadores de
datos existentes se inyectan en el contexto y el SDK comparte un contrato entre
mock y Gateway. Cada módulo tiene una responsabilidad acotada.

El traje azul noche, camisa y corbata fueron pedidos explícitamente. Nexo tiene
seis expresiones persistentes que se funden suavemente: idle, listening, thinking,
speaking, happy y error. Respiración y parpadeo son CSS; el puntero sólo actualiza
variables de mirada, sin repintados de React. Reduced motion desactiva animación,
transición y desplazamiento de la mirada. No hay sonidos ni apertura automática.

Los controles usan HeroUI v3. El diálogo gestiona foco, Escape y retorno al
disparador. La conversación no fuerza el desplazamiento si se están leyendo
mensajes anteriores. El editor respeta composición IME y el área segura móvil.

2026-09-19 (revisión): el acceso flotante queda reducido a la mascota y un
bocadillo «¿Necesitas ayuda? Escríbeme»; el botón de HeroUI se mantiene por
accesibilidad pero sin fondo. La cabecera del panel reúne mascota, nombre, una
línea de estado en texto (escucho, reviso, escribo, error, demo) y la página
consultada; desaparecen el chip «CONECTADO», la fila de estado con mini mascota
y el pie repetido. Los mensajes del usuario van en burbuja de acento a la
derecha; las respuestas de Nexo ocupan el ancho sin avatar, con fuentes, marca
DEMO y copia debajo. El renderizador de Markdown agrupa líneas: un título en
negrita seguido de viñetas se muestra como texto más lista, y admite listas
numeradas, cabeceras `#`, cursiva y código en línea como texto plano.

## Arte original

Generado con la herramienta integrada ImageGen; sin API ni clave local.
Archivo utilizado: `public/mascot/nexo-suit.png` (1254 × 1254, alpha real).
El cuerpo sin traje queda como referencia en `public/mascot/nexo-body.png`.

Prompt original: “Create an original premium collectible character called Nexo:
one small friendly floating ceramic robot, a plump rounded pebble head joined
to a compact rounded body, pearlescent ice-blue ceramic material, tiny relaxed
flipper arms, two rounded feet and a cobalt-blue antenna. Large blank dark navy
visor, no eyes or mouth, subtle pulse-wave on lower belly. Front-facing, full
body centered, soft studio lighting, genuinely transparent RGBA background,
no floor, shadow, text or watermark.”

Prompt final de edición (literal):

> Use case: precise-object-edit. Edit target: this original Nexo assistant mascot.
> The user wants it wearing a serious, professional suit. Add a beautifully
> tailored midnight-navy business suit jacket with fine realistic wool fabric,
> crisp pale white shirt, and a slim understated cobalt-blue tie to its LOWER
> BODY only. Tailor the suit to the little round mascot, with clean lapels, one
> discreet button, and tiny sleeve cuffs around the arms. The existing blue
> pulse-wave can become a tiny enamel lapel pin. Keep EXACTLY its ceramic ice-blue
> head, blue antenna, dark navy BLANK face visor, pose, proportions, arms, feet,
> lighting, scale and position. Do NOT add eyes, mouth, eyebrows, or anything onto
> the blank visor: the face is animated by code. The suit should make it look like
> a polished finance companion, refined and warm, not a caricature. Preserve the
> genuinely transparent alpha background and full-body square framing. No
> background, floor, checkerboard, shadow, props, text or watermark. Change only
> the outfit.

Documentación oficial consultada: [AI SDK](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot),
[transporte](https://ai-sdk.dev/docs/ai-sdk-ui/transport),
[Gateway](https://vercel.com/docs/ai-gateway/getting-started),
[HeroUI Modal](https://heroui.com/en/docs/react/components/modal),
[TextArea](https://heroui.com/en/docs/react/components/text-area),
[Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route),
[React effects](https://react.dev/reference/react/useEffect) y
[Tailwind animation](https://tailwindcss.com/docs/animation).

## Verificación

- `bun run lint-format` y comprobación de tipos de Next.js.
- `bun run test`: 226 pruebas unitarias, 5 de integración y 7 de navegador,
  incluida build de producción. Las pruebas E2E fuerzan el modo mock.
- 2026-09-19: llamada real a Gateway comprobada en local con la clave de
  `.env`: dos preguntas (cartera y empresa) terminan con `finishReason: stop`
  en unos 4 segundos; antes del ajuste terminaban con `length` a los 300
  caracteres.
- Revisión visual de la bienvenida y la conversación en navegador, escritorio
  1280 × 720 y móvil 390 × 844, temas claro/oscuro y movimiento reducido.
- Se prueban validación del endpoint, streaming, contexto de ruta, cancelación,
  reintento, preservación al navegar, reinicio, teclado y límites del panel.
- La llamada al proveedor se verifica con un doble de prueba en el límite del
  SDK. No se ha efectuado una llamada pagada: el entorno local no tiene clave.
- Se sustituyen los E2E obsoletos de la plantilla por el radar real. La prueba
  previa de detalle X-Ray usa una fixture en el límite de archivo, porque los
  exports por empresa no están versionados. Nexo conserva los datos del resumen
  cuando falta ese detalle, sin inventar límites ni enlazar a una ficha ausente.

## Modelo de una sola empresa (2026-09-19)

La aplicación pasó a mostrar una única empresa por pantalla. Nexo sigue el
mismo principio: el contexto sale de `PulseDataSource` (score, meses observados,
variables sin datos y previsión) y de `AdvisorDataSource` (resumen, probabilidad
de tensión, ofertas con importe, tipo y motivos, descartados, desbloqueos y
palancas). Sin empresa en la ruta ni en la pregunta, sólo viajan los metadatos
del score y Nexo remite a la portada. Rutas admitidas: `/`,
`/empresa/COMP_xxxx`, `/empresa/COMP_xxxx/recomendaciones` y `/metodo`;
cualquier otra se normaliza a `/`. Las respuestas simuladas cubren: resumen de
la empresa, productos recomendados (o por qué no hay ninguno), previsión, score
y método.

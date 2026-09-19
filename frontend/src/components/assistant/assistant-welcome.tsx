import { Button } from '@heroui/react';
import { NexoMascot, type NexoMood } from '@/components/assistant/nexo-mascot';
import { AssistantIcon } from '@/components/assistant/assistant-icon';

/** Introduces Nexo with useful entry points tailored to the page, without sending automatically. */
export function AssistantWelcome({
  pathname,
  mood,
  onSelect,
}: {
  pathname: string;
  mood: NexoMood;
  onSelect: (text: string) => void;
}) {
  const company = /^\/company\/COMP_/.test(pathname);
  const suggestions = company
    ? [
        {
          title: 'Dibuja la trayectoria del PULSE',
          detail: 'Gráfico con historia, previsión y señales',
        },
        {
          title: '¿Qué variables restan más puntos?',
          detail: 'Gráfico de puntos ganados y perdidos',
        },
        {
          title: 'Muestra los pilares en gráficos',
          detail: 'Cuatro sparklines comparables',
        },
        {
          title: '¿Qué productos me recomiendas?',
          detail: 'Importe, tipo y por qué',
        },
      ]
    : [
        { title: 'Explícame el score', detail: 'Qué mide y qué no' },
        {
          title: '¿Cómo se calcula la previsión?',
          detail: 'Horizontes y banda p10-p90',
        },
        {
          title: '¿Qué productos puede recomendar?',
          detail: 'Siete productos y sus reglas',
        },
        {
          title: '¿Cómo puede ayudarme la IA?',
          detail: 'Del dato a la explicación',
        },
      ];
  return (
    <div className="flex flex-col px-5 pt-1 pb-4 sm:px-6">
      <div className="relative flex items-end justify-between gap-3 overflow-hidden rounded-2xl bg-radial-[at_85%_110%] from-accent/18 via-accent/6 to-transparent to-75% px-5 pt-5">
        <div className="pb-6">
          <h3 className="text-2xl leading-tight font-semibold tracking-tight sm:text-[26px]">
            Hola, soy Nexo.
          </h3>
          <p className="mt-2 max-w-52 text-sm leading-relaxed text-muted">
            Leo las cifras de tu empresa y las dibujo cuando me lo pides.
          </p>
        </div>
        <NexoMascot mood={mood} className="-mb-2 size-28 sm:size-32" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {suggestions.map(({ title, detail }) => (
          <Button
            key={title}
            variant="secondary"
            onPress={() => onSelect(title)}
            className="group h-auto min-h-20 w-full items-start justify-start rounded-xl bg-surface-secondary/70 px-3.5 py-3 text-left [--button-bg-hover:var(--accent-soft)] [--button-bg-pressed:var(--accent-soft)]"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1.5 whitespace-normal">
              <span className="text-xs leading-snug font-medium text-foreground">
                {title}
              </span>
              <span className="text-[11px] leading-snug font-normal text-muted">
                {detail}
              </span>
            </span>
            <AssistantIcon
              name="chevron"
              className="mt-0.5 size-3 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Button>
        ))}
      </div>
    </div>
  );
}

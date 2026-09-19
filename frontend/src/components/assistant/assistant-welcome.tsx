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
  const company = /\/(empresa|pulse)\/COMP_/.test(pathname);
  const suggestions = [
    {
      title: company ? 'Resume esta empresa' : 'Resume mi cartera',
      detail: company ? 'Score y trayectoria' : 'Los últimos datos',
    },
    {
      title: '¿Qué empresas revisaría primero?',
      detail: 'Cambios a seis meses',
    },
    { title: 'Explícame el score', detail: 'Qué mide el modelo' },
    {
      title: '¿Cómo puede ayudarme la IA?',
      detail: 'Ideas para tu análisis',
    },
  ];
  return (
    <div className="flex flex-col px-6 pt-2 pb-4 sm:px-8">
      <div className="flex items-center justify-between gap-3 py-2">
        <div className="max-w-48">
          <h3 className="text-[26px] leading-tight font-semibold tracking-tight">
            Hola, soy Nexo.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Te ayudo a interpretar tus datos.
          </p>
        </div>
        <div className="relative flex size-32 shrink-0 items-center justify-center">
          <div className="absolute inset-3 rounded-full bg-accent/6" />
          <NexoMascot mood={mood} className="relative size-32" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {suggestions.map(({ title, detail }) => (
          <Button
            key={title}
            variant="secondary"
            onPress={() => onSelect(title)}
            className="group relative h-auto min-h-22 w-full items-start justify-start rounded-xl bg-surface-secondary/65 px-3.5 py-3 text-left hover:bg-accent/8"
          >
            <span className="min-w-0 whitespace-normal">
              <span className="block pr-2 text-xs leading-snug font-medium text-foreground">
                {title}
              </span>
              <span className="mt-1.5 block pr-2 text-[10px] leading-relaxed font-normal text-muted">
                {detail}
              </span>
            </span>
            <AssistantIcon
              name="chevron"
              className="absolute right-2 bottom-3 size-3 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Button>
        ))}
      </div>
    </div>
  );
}

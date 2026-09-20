'use client';

import { useRef, type MouseEvent } from 'react';

interface RequestProposalButtonProps {
  /** Name of the product, as the row prints it. */
  productLabel: string;
  /** Amount already formatted, such as `45.000 €`. */
  amount: string;
  /** Tenor already formatted, such as `12 meses`. */
  tenor: string;
}

const CTA_CLASS =
  'w-full rounded-lg bg-[var(--brand-blue)] px-5 py-[15px] text-center text-[16px] leading-none font-medium whitespace-nowrap text-white transition-colors hover:bg-[var(--interactive-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:w-auto';

const CLOSE_CLASS =
  'flex h-10 items-center rounded-lg border border-hairline-strong px-4 text-[15px] leading-none font-medium text-ink transition-colors hover:border-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/**
 * The call to action of an offer row and the confirmation it opens.
 *
 * The demo has no bank behind it, so pressing the button does not send
 * anything: it opens a small centred dialog that says the request is on its
 * way and who moves next. The dialog repeats the product, the amount and
 * the tenor so the reader can check what they asked for, and nothing else:
 * one heading, two sentences, one way out. It is the only place the product
 * uses the brand blue as a filled button, as the design reserves it for the
 * action.
 *
 * The dialog is the native `<dialog>` opened with `showModal()`, not the
 * HeroUI `Modal`: rendered from a page instead of the layout, that overlay
 * makes the production bundle resolve a second copy of react-aria's overlay
 * state and every server-rendered route fails. The native element gives
 * the focus trap, Escape and the backdrop on its own; a click on the
 * backdrop closes it too.
 *
 * @param props - Product, amount and tenor of the offer.
 * @returns The button with its dialog.
 */
export function RequestProposalButton({
  productLabel,
  amount,
  tenor,
}: RequestProposalButtonProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialog.current) dialog.current?.close();
  };
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={CTA_CLASS}
      >
        Solicitar propuesta
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={`proposal-sent-${productLabel}`}
        onClick={closeOnBackdrop}
        className="m-auto w-[calc(100%-2rem)] max-w-[440px] rounded-2xl bg-raised p-0 text-ink shadow-none backdrop:bg-black/15 backdrop:backdrop-blur-[2px]"
      >
        <div className="p-8">
          <h2
            id={`proposal-sent-${productLabel}`}
            className="text-[20px] leading-[1.35] font-semibold"
          >
            Propuesta enviada
          </h2>
          <p className="mt-3 text-[15px] leading-[1.55] text-ink-secondary">
            {productLabel} de {amount} a {tenor}. La entidad la está revisando y
            te avisaremos en cuanto haya respuesta.
          </p>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={CLOSE_CLASS}
            >
              Entendido
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

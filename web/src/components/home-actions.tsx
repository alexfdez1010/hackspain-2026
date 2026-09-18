'use client';

import { Button } from '@heroui/react';

const HEROUI_DOCS_URL =
  'https://heroui.com/en/docs/react/getting-started/quick-start';

/**
 * Opens the official HeroUI Quick Start in a new browser tab.
 *
 * The function is only called in the browser by HeroUI's accessible press
 * handler, so it never runs during server rendering.
 *
 * @returns Nothing. The browser opens the documentation in a new tab.
 * @sideEffects Calls `window.open`; popup blockers may prevent navigation.
 */
function openHeroUIDocs(): void {
  window.open(HEROUI_DOCS_URL, '_blank', 'noopener,noreferrer');
}

/**
 * Renders the primary documentation action for the starter page.
 *
 * @returns A HeroUI button that opens the official documentation.
 */
export function HomeActions() {
  return <Button onPress={openHeroUIDocs}>Read HeroUI docs</Button>;
}

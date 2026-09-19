import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { PulseFeatureDither } from '@/components/layout/pulse-feature-dither';
import { FEATURE_DITHER } from '@/lib/landing/landing-feature-dither';

vi.mock('@paper-design/shaders-react', () => ({
  ImageDithering: ({
    image,
    'aria-hidden': ariaHidden,
  }: {
    image: string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }) => <div data-dither="" data-image={image} aria-hidden={ariaHidden} />,
  Heatmap: () => <div data-heatmap="" />,
}));

describe('PulseFeatureDither', () => {
  it('mounts one decorative ImageDithering of the hero sparkle', () => {
    const html = renderToStaticMarkup(<PulseFeatureDither />);

    expect(html).toContain('data-dither');
    expect(html).toContain('aria-hidden');
    expect(html).toContain(`data-image="${FEATURE_DITHER.image}"`);
    expect(html).toContain('hero-dither.webp');
    expect(html).not.toContain('pulse-wordmark');
    expect(html).not.toContain('data-heatmap');
  });
});

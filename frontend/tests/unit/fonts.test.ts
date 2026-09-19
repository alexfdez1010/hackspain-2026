import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('font tokens', () => {
  it('map sans to DM Sans and display to Aktiv Grotesk', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toContain('--font-sans: var(--font-dm-sans)');
    expect(css).toContain('--font-display: var(--font-aktiv)');
    expect(css).toContain('font-family: var(--font-dm-sans)');
    expect(css).toContain(
      'font-family: var(--font-aktiv), var(--font-dm-sans)',
    );
    expect(css).not.toContain('--font-inter');

    const fonts = readFileSync(
      resolve(process.cwd(), 'src/lib/fonts.ts'),
      'utf8',
    );
    expect(fonts).toContain("variable: '--font-dm-sans'");
    expect(fonts).toContain("variable: '--font-aktiv'");
    expect(fonts).not.toContain('Inter');

    const layout = readFileSync(
      resolve(process.cwd(), 'src/app/layout.tsx'),
      'utf8',
    );
    expect(layout).toContain('dmSans.variable');
    expect(layout).toContain('aktivGrotesk.variable');
  });

  it('keeps the Aktiv Grotesk files next to the localFont loader', () => {
    const dir = resolve(process.cwd(), 'src/fonts/aktiv-grotesk');
    expect(existsSync(resolve(dir, 'AktivGrotesk-Regular.woff2'))).toBe(true);
    expect(existsSync(resolve(dir, 'AktivGrotesk-Medium.woff2'))).toBe(true);
    expect(existsSync(resolve(dir, 'AktivGrotesk-Bold.woff2'))).toBe(true);
  });
});

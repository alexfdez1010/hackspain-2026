import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('the product typeface', () => {
  it('self-hosts Haffer SQ XH in 400 and 500 and maps 600 to the medium cut', () => {
    expect(
      existsSync(resolve(process.cwd(), 'src/fonts/haffer-sqxh-400.woff2')),
    ).toBe(true);
    expect(
      existsSync(resolve(process.cwd(), 'src/fonts/haffer-sqxh-500.woff2')),
    ).toBe(true);
    const fonts = readFileSync(
      resolve(process.cwd(), 'src/lib/fonts.ts'),
      'utf8',
    );
    expect(fonts).toContain("from 'next/font/local'");
    expect(fonts).toContain("variable: '--font-haffer'");
    expect(fonts).toContain("weight: '400'");
    expect(fonts).toContain("weight: '500'");
    expect(fonts).toMatch(/haffer-sqxh-500\.woff2', weight: '600'/);
    expect(fonts).not.toContain('next/font/google');
  });

  it('resolves every font token to the same family', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toContain('--font-sans: var(--font-haffer)');
    expect(css).toContain('--font-display: var(--font-haffer)');
    expect(css).toContain('font-family: var(--font-haffer), system-ui');
    expect(css).not.toContain('--font-inter');
    const layout = readFileSync(
      resolve(process.cwd(), 'src/app/layout.tsx'),
      'utf8',
    );
    expect(layout).toContain('haffer.variable');
  });
});

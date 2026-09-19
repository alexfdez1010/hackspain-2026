import type { CSSProperties, ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  /** Inline surface overrides, such as the wash of a score band. */
  style?: CSSProperties;
  /** Extra utilities for the panel, such as its place in the page grid. */
  className?: string;
  /**
   * `default` is the brand inset of 24 px. `none` hands the padding to the
   * content, for panels that hold a table or a header of their own.
   */
  padding?: 'default' | 'none';
}

/**
 * The one surface of the product: a hairline, a radius of 12 px and a fixed
 * inset. Nothing floats and nothing casts a shadow, so the page separates
 * with lines and space instead of depth.
 *
 * @param props - The content, extra utilities, the inset variant and styles.
 * @returns The panel surface.
 */
export function Panel({
  children,
  className = '',
  padding = 'default',
  style,
}: PanelProps) {
  const inset = padding === 'none' ? '' : 'p-6';
  return (
    <div
      className={`border-hairline bg-raised rounded-xl border ${inset} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

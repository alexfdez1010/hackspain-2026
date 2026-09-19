import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { VariableInfoLayer } from '@/components/charts/variable-info-layer';
import { variableInfo } from '@/lib/method/variable-info';
import { METHOD_VARIABLES } from '@/lib/method/variables';

describe('variableInfo', () => {
  it('explains a documented variable with its direction and source', () => {
    const info = variableInfo('cash_days', 'Días de caja', 12);
    expect(info?.buttonLabel).toBe('Qué mide Días de caja');
    expect(info?.title).toBe('Días de caja · 12 de 100 puntos');
    expect(info?.measures).toContain('Caja a fin de mes');
    expect(info?.direction).toBe('Más alto, más sano');
    expect(info?.source).toBe('Extractos bancarios');
    expect(info?.proxy).toBeNull();
  });

  it('names the bank proxy when the variable has one', () => {
    expect(variableInfo('ar90', 'Tramo +90 días', 12)?.proxy).toContain(
      'Devoluciones',
    );
    expect(variableInfo('unknown', 'Otra', 1)).toBeNull();
  });
});

describe('VariableInfoLayer', () => {
  it('places one button per documented cell as a percentage of the map', () => {
    const cells = Object.keys(METHOD_VARIABLES).map((key, index) => ({
      key,
      label: key,
      weight: 5,
      x: index * 50,
      y: 10,
      width: 50,
      height: 40,
    }));
    const markup = renderToStaticMarkup(
      <VariableInfoLayer cells={cells} width={1000} height={100} />,
    );
    expect(markup.match(/aria-label="Qué mide /g)).toHaveLength(11);
    expect(markup).toContain('left:5%;top:10%;width:5%');
    expect(markup).toContain('pointer-events-auto');
  });

  it('skips a cell of a variable the method does not document', () => {
    const markup = renderToStaticMarkup(
      <VariableInfoLayer
        cells={[
          {
            key: 'ghost',
            label: 'X',
            weight: 1,
            x: 0,
            y: 0,
            width: 1,
            height: 1,
          },
        ]}
        width={10}
        height={10}
      />,
    );
    expect(markup).not.toContain('aria-label');
  });
});

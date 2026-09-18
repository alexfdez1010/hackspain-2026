/**
 * Explains who pays for Embat Capital and why each party wins.
 *
 * The jury asks for an identified buyer, so this text names the three revenue
 * streams instead of describing the product again.
 *
 * @returns The business-model paragraph and the rule summary.
 */
export function BusinessModel() {
  return (
    <div className="grid max-w-5xl gap-8 lg:grid-cols-2">
      <p className="leading-relaxed">
        Embat vende la línea embebida en su plataforma junto a bancos socios: el
        banco aporta el balance y paga a Embat una comisión de originación sobre
        el límite dispuesto más una cuota mensual de monitorización por empresa
        vigilada. A cambio recibe un límite que se estrecha antes del impago
        —cuando PELT confirma una caída estructural, el multiplicador se reduce
        a la mitad— y que se amplía un 15 % cuando la mejora es estructural, de
        modo que el riesgo no se corrige a posteriori con un expediente, sino
        cada mes con los extractos. La misma señal se vende a aseguradoras de
        crédito: la prima y el límite asegurado se mueven con el score en lugar
        de revisarse una vez al año.
      </p>
      <dl className="flex flex-col gap-3 text-sm">
        <div>
          <dt className="font-medium">Límite</dt>
          <dd className="text-muted">
            k(score) × cobros medios mensuales, con tope de 2.000.000 €. k vale
            0 por debajo de 35, 0,25 hasta 50, 0,5 hasta 65, 0,8 hasta 80 y 1 a
            partir de 80.
          </dd>
        </div>
        <div>
          <dt className="font-medium">Ajuste por régimen</dt>
          <dd className="text-muted">
            ×0,5 en caída estructural y ×1,15 en mejora estructural, sin superar
            nunca un mes de cobros.
          </dd>
        </div>
        <div>
          <dt className="font-medium">Precio</dt>
          <dd className="text-muted">
            250 pb + 1.200 × probabilidad de estrés a seis meses, es decir de
            250 a 1.450 pb.
          </dd>
        </div>
        <div>
          <dt className="font-medium">Estado</dt>
          <dd className="text-muted">
            Preaprobada con score ≥ 50 y estrés &lt; 35 %; en vigilancia entre
            35 y 50 de score o con estrés entre 35 % y 60 %; cerrada en el
            resto.
          </dd>
        </div>
      </dl>
    </div>
  );
}

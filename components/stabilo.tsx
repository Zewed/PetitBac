/**
 * Le vrai trait de stabilo de l'accueil (ticket 31, maquette .aeom/direction/accueil-griffon/) : trois filtres SVG
 * partagés par tous les traits, jamais par le texte. Stries du feutre dans le sens du trait (bruit très étiré),
 * encre qui sèche là où elle est déjà maigre, bords tremblés puis grenus. Trois réglages pour que les traits
 * ne se ressemblent pas tous.
 */
export function FiltresStabilo() {
  const filtres = [
    { id: "stabilo-a", bruit: "0.004 0.35", s1: 3, alpha: "0.62 0 0 0 0.6", seche: "0 0.07 0.42 0.8 1", vague: "0.008 0.03", s2: 5, v: 11, grain: "0.08 0.16", s3: 9, g: 5 },
    { id: "stabilo-b", bruit: "0.005 0.28", s1: 11, alpha: "0.62 0 0 0 0.6", seche: "0 0.06 0.4 0.79 1", vague: "0.006 0.025", s2: 6, v: 12, grain: "0.1 0.18", s3: 12, g: 5 },
    { id: "stabilo-c", bruit: "0.003 0.42", s1: 23, alpha: "0.66 0 0 0 0.58", seche: "0 0.08 0.44 0.8 1", vague: "0.01 0.035", s2: 8, v: 10, grain: "0.09 0.14", s3: 15, g: 6 },
  ];
  return (
    <svg className="filtres" width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      {filtres.map((f) => (
        <filter key={f.id} id={f.id} x="-6%" y="-14%" width="112%" height="128%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={f.bruit} numOctaves={2} seed={f.s1} result="bruit" />
          <feColorMatrix in="bruit" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${f.alpha}`} result="stries" />
          <feComposite in="SourceGraphic" in2="stries" operator="in" result="encre" />
          <feComponentTransfer in="encre" result="seche">
            <feFuncA type="table" tableValues={f.seche} />
          </feComponentTransfer>
          <feTurbulence type="fractalNoise" baseFrequency={f.vague} numOctaves={1} seed={f.s2} result="vague" />
          <feDisplacementMap in="seche" in2="vague" scale={f.v} xChannelSelector="G" yChannelSelector="R" result="tremble" />
          <feTurbulence type="fractalNoise" baseFrequency={f.grain} numOctaves={2} seed={f.s3} result="grain" />
          <feDisplacementMap in="tremble" in2="grain" scale={f.g} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      ))}
    </svg>
  );
}

/** Le fond de l'accueil : de grands lavis de surligneur pâles qui se chevauchent. */
export function Lavis() {
  return (
    <div className="lavis" aria-hidden="true">
      <i className="lavis--b" />
      <i className="lavis--p" />
      <i className="lavis--y" />
      <i className="lavis--g" />
      <i className="lavis--p2" />
    </div>
  );
}

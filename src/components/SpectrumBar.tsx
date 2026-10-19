/** Barra do Espectro (TDD §6.3): 6 segmentos sólidos, 4px, sem gradiente.
 *  Único elemento multicolor da interface. Fixa no topo de cada tela. */
export function SpectrumBar() {
  const cores = [
    "var(--spec-1)", "var(--spec-2)", "var(--spec-3)",
    "var(--spec-4)", "var(--spec-5)", "var(--spec-6)",
  ];
  return (
    <div style={{ display: "flex", height: 4, width: "100%" }} aria-hidden="true">
      {cores.map((c, i) => (
        <div key={i} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}

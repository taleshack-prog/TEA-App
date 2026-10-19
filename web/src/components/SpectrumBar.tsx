/** Barra do Espectro — assinatura de marca (TEA). 6 faixas, cantos arredondados. */
export function SpectrumBar({ rounded = false }: { rounded?: boolean }) {
  const cores = ["var(--spec-1)", "var(--spec-2)", "var(--spec-3)",
                 "var(--spec-4)", "var(--spec-5)", "var(--spec-6)"];
  return (
    <div aria-hidden="true"
      style={{ display: "flex", height: 6, width: "100%",
               borderRadius: rounded ? "var(--r-pill)" : 0, overflow: "hidden" }}>
      {cores.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
    </div>
  );
}

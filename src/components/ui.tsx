/** Componentes base do design system Swiss Clinical (TDD §6.6).
 *  Retangulares, raio 2px, caixa alta nos rótulos, sem emojis, sem sombras. */
import type { CSSProperties, ReactNode } from "react";

/* -------- Button: primário invertido (fundo tinta, texto papel) -------- */
export function Button({
  children, onClick, variant = "primary", disabled, type = "button", full = true,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  full?: boolean;
}) {
  const base: CSSProperties = {
    height: 54,
    width: full ? "100%" : undefined,
    padding: "0 24px",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-ui)",
    fontWeight: 700,
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "opacity 150ms",
  };
  const skin: CSSProperties =
    variant === "primary"
      ? { background: "var(--text-primary)", color: "var(--bg)", border: "none" }
      : { background: "transparent", color: "var(--text-primary)",
          border: "1px solid var(--hairline)" };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...skin }}>
      {children}
    </button>
  );
}

/* -------- MoodSelector: 7 opções tipográficas, selecionado = bloco invertido -------- */
export const HUMORES = [
  "CALMO", "AGITADO", "TRISTE", "EUFÓRICO", "INTROSPECTIVO", "TENSO", "ALEGRE",
] as const;

const HUMOR_VALOR: Record<string, string> = {
  CALMO: "calmo", AGITADO: "agitado", TRISTE: "triste", "EUFÓRICO": "euforico",
  INTROSPECTIVO: "introspectivo", TENSO: "tenso", ALEGRE: "alegre",
};

export function MoodSelector({
  value, onChange,
}: { value: string | null; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
                  background: "var(--hairline)", border: "1px solid var(--hairline)" }}>
      {HUMORES.map((h) => {
        const val = HUMOR_VALOR[h];
        const sel = value === val;
        return (
          <button
            key={h}
            onClick={() => onChange(val)}
            aria-pressed={sel}
            style={{
              minHeight: 48, border: "none", cursor: "pointer",
              fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13,
              letterSpacing: "0.05em",
              background: sel ? "var(--text-primary)" : "var(--surface)",
              color: sel ? "var(--bg)" : "var(--text-primary)",
            }}
          >
            {h}
          </button>
        );
      })}
    </div>
  );
}

/* -------- EnergyBar: 5 blocos segmentados preenchidos em tinta -------- */
export function EnergyBar({
  value, onChange,
}: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-label={`Energia ${n} de 5`}
            style={{
              flex: 1, height: 36, border: "1px solid var(--hairline)",
              borderRadius: "var(--radius)", cursor: "pointer",
              background: n <= value ? "var(--text-primary)" : "transparent",
            }}
          />
        ))}
      </div>
      <span className="t-mono" style={{ fontSize: 15, minWidth: 34 }}>{value}/5</span>
    </div>
  );
}

/* -------- SegmentedControl: texto em caixa alta -------- */
export function SegmentedControl({
  options, value, onChange,
}: {
  options: { label: string; value: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius)", overflow: "hidden" }}>
      {options.map((o, i) => {
        const sel = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1, minHeight: 44, cursor: "pointer",
              borderLeft: i ? "1px solid var(--hairline)" : "none", border: "none",
              borderLeftWidth: i ? 1 : 0,
              fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 12,
              letterSpacing: "0.05em", textTransform: "uppercase",
              background: sel ? "var(--text-primary)" : "transparent",
              color: sel ? "var(--bg)" : "var(--text-primary)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------- SleepStepper: horas em stepper mono + qualidade em 5 blocos -------- */
export function SleepStepper({
  horas, qualidade, onHoras, onQualidade,
}: {
  horas: number; qualidade: number;
  onHoras: (h: number) => void; onQualidade: (q: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <StepBtn onClick={() => onHoras(Math.max(0, horas - 0.5))}>−</StepBtn>
        <span className="t-mono" style={{ fontSize: 22, minWidth: 64, textAlign: "center" }}>
          {horas}H
        </span>
        <StepBtn onClick={() => onHoras(Math.min(24, horas + 0.5))}>+</StepBtn>
        <span className="t-label" style={{ marginLeft: 4 }}>horas de sono</span>
      </div>
      <EnergyBar value={qualidade} onChange={onQualidade} />
    </div>
  );
}

function StepBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44, height: 44, border: "1px solid var(--hairline)",
        borderRadius: "var(--radius)", background: "transparent",
        color: "var(--text-primary)", fontSize: 22, cursor: "pointer",
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </button>
  );
}

/* -------- Label de campo -------- */
export function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span className="t-label">{titulo}</span>
      {children}
    </div>
  );
}

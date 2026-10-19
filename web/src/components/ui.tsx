/** Kit de interface — acolhedor: cantos macios, cor calma, rótulos em frase. */
import type { CSSProperties, ReactNode } from "react";

/* ---------------- Button ---------------- */
export function Button({
  children, onClick, variant = "primary", disabled, type = "button", full = true,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "soft" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  full?: boolean;
}) {
  const base: CSSProperties = {
    minHeight: 52,
    width: full ? "100%" : undefined,
    padding: "0 22px",
    borderRadius: "var(--r)",
    fontFamily: "var(--font-ui)",
    fontWeight: 800,
    fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "transform 120ms, background 150ms",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  };
  const skins: Record<string, CSSProperties> = {
    primary: { background: "var(--primary)", color: "var(--on-primary)",
               border: "none", boxShadow: "var(--shadow)" },
    soft: { background: "var(--primary-tint)", color: "var(--primary-dark)", border: "none" },
    ghost: { background: "transparent", color: "var(--ink)",
             border: "1.5px solid var(--line)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...skins[variant] }}>
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({ children, style, onClick }: {
  children: ReactNode; style?: CSSProperties; onClick?: () => void;
}) {
  return (
    <div onClick={onClick}
      style={{
        background: "var(--surface)", borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow)", padding: "var(--s5)",
        cursor: onClick ? "pointer" : undefined, ...style,
      }}>
      {children}
    </div>
  );
}

/* ---------------- Field ---------------- */
export function Field({ label, hint, children }: {
  label: string; hint?: string; children: ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontWeight: 700, fontSize: 15 }}>{label}</span>
      {children}
      {hint && <span className="t-small">{hint}</span>}
    </label>
  );
}

export const inputStyle: CSSProperties = {
  height: 52, padding: "0 16px", border: "1.5px solid var(--line)",
  borderRadius: "var(--r-sm)", background: "var(--surface)",
  color: "var(--ink)", fontFamily: "var(--font-ui)", fontSize: 16, width: "100%",
};

/* ---------------- MoodSelector ---------------- */
export const HUMORES = [
  { v: "calmo", l: "Calmo" }, { v: "agitado", l: "Agitado" },
  { v: "triste", l: "Triste" }, { v: "euforico", l: "Eufórico" },
  { v: "introspectivo", l: "Introspectivo" }, { v: "tenso", l: "Tenso" },
  { v: "alegre", l: "Alegre" },
];

export function MoodSelector({ value, onChange }: {
  value: string | null; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {HUMORES.map((h) => {
        const sel = value === h.v;
        return (
          <button key={h.v} type="button" onClick={() => onChange(h.v)}
            aria-pressed={sel}
            style={{
              minHeight: 46, padding: "0 18px", borderRadius: "var(--r-pill)",
              border: sel ? "1.5px solid var(--primary)" : "1.5px solid var(--line)",
              background: sel ? "var(--primary)" : "var(--surface)",
              color: sel ? "var(--on-primary)" : "var(--ink)",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              transition: "background 150ms",
            }}>
            {h.l}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- EnergyBar (1–5) ---------------- */
export function EnergyBar({ value, onChange }: {
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flex: 1 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            aria-label={`Nível ${n} de 5`}
            style={{
              flex: 1, height: 44, borderRadius: "var(--r-sm)", cursor: "pointer",
              border: "1.5px solid " + (n <= value ? "var(--primary)" : "var(--line)"),
              background: n <= value ? "var(--primary)" : "var(--surface)",
              transition: "background 120ms",
            }} />
        ))}
      </div>
      <span style={{ fontWeight: 800, minWidth: 34, textAlign: "right",
        color: "var(--primary-dark)" }}>{value}/5</span>
    </div>
  );
}

/* ---------------- SegmentedControl ---------------- */
export function SegmentedControl({ options, value, onChange }: {
  options: { label: string; value: string }[];
  value: string | null; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, background: "var(--surface-2)",
      padding: 4, borderRadius: "var(--r-pill)", flexWrap: "wrap" }}>
      {options.map((o) => {
        const sel = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            style={{
              flex: "1 1 auto", minHeight: 42, padding: "0 14px",
              borderRadius: "var(--r-pill)", border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 14,
              background: sel ? "var(--surface)" : "transparent",
              color: sel ? "var(--primary-dark)" : "var(--ink-soft)",
              boxShadow: sel ? "var(--shadow)" : "none",
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- SleepStepper ---------------- */
export function SleepStepper({ horas, qualidade, onHoras, onQualidade }: {
  horas: number; qualidade: number;
  onHoras: (h: number) => void; onQualidade: (q: number) => void;
}) {
  const btn: CSSProperties = {
    width: 46, height: 46, borderRadius: "var(--r-sm)",
    border: "1.5px solid var(--line)", background: "var(--surface)",
    color: "var(--ink)", fontSize: 22, cursor: "pointer", fontWeight: 700,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" style={btn}
          onClick={() => onHoras(Math.max(0, horas - 0.5))}>−</button>
        <span style={{ fontWeight: 800, fontSize: 20, minWidth: 72, textAlign: "center" }}>
          {horas}h
        </span>
        <button type="button" style={btn}
          onClick={() => onHoras(Math.min(24, horas + 0.5))}>+</button>
        <span className="t-sub" style={{ marginLeft: 2 }}>de sono</span>
      </div>
      <div>
        <span className="t-sub" style={{ display: "block", marginBottom: 6 }}>
          Qualidade do sono
        </span>
        <EnergyBar value={qualidade} onChange={onQualidade} />
      </div>
    </div>
  );
}

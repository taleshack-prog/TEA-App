/** Moldura do app: título + barra do espectro (fixa no topo) + navegação inferior.
 *  Barra de navegação em texto caixa alta; aba ativa no acento azul TEA. */
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { SpectrumBar } from "./SpectrumBar";
import { useAuth } from "../lib/auth";

export function Shell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const { perfil } = useAuth();

  // "RESUMO" só para quem vê a análise da IA (pais) — espelha o RBAC do backend.
  const abas = [
    { to: "/", label: "HOJE" },
    { to: "/timeline", label: "LINHA" },
    ...(perfil?.ve_analise_ia ? [{ to: "/digest", label: "RESUMO" }] : []),
    { to: "/config", label: "AJUSTES" },
  ];
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column",
                  background: "var(--bg)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8,
                      padding: "14px 16px 10px" }}>
          <span className="t-h2">Ponte Visual</span>
          <span className="t-label" style={{ fontSize: 11 }}>2.0</span>
        </div>
        <SpectrumBar />
      </header>

      <main style={{ flex: 1, padding: "16px", maxWidth: 480, width: "100%",
                     margin: "0 auto" }}>
        {children}
      </main>

      <nav style={{ position: "sticky", bottom: 0, display: "flex",
                    borderTop: "1px solid var(--hairline)", background: "var(--bg)" }}>
        {abas.map((a) => {
          const ativa = loc.pathname === a.to;
          return (
            <Link
              key={a.to}
              to={a.to}
              style={{
                flex: 1, textAlign: "center", padding: "14px 0",
                textDecoration: "none", fontFamily: "var(--font-ui)",
                fontWeight: 700, fontSize: 12, letterSpacing: "0.05em",
                color: ativa ? "var(--accent)" : "var(--text-secondary)",
                borderTop: ativa ? "2px solid var(--accent)" : "2px solid transparent",
                marginTop: -1,
              }}
            >
              {a.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

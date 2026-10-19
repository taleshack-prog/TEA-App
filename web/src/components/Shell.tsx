/** Moldura do app. Navegação lateral no desktop e inferior no celular.
 *  "Resumo" (análise da IA) só aparece para quem é Mãe/Pai (RBAC no UI). */
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { SpectrumBar } from "./SpectrumBar";
import { IconHome, IconTimeline, IconAlbum, IconResumo, IconGear } from "./icons";
import { useAuth } from "../lib/auth";

export function Shell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const { perfil } = useAuth();

  const abas = [
    { to: "/", label: "Hoje", Icon: IconHome },
    { to: "/album", label: "Álbum", Icon: IconAlbum },
    { to: "/timeline", label: "Linha", Icon: IconTimeline },
    ...(perfil?.ve_analise_ia
      ? [{ to: "/resumo", label: "Resumo", Icon: IconResumo }] : []),
    { to: "/ajustes", label: "Ajustes", Icon: IconGear },
  ];

  return (
    <div className="pv-layout">
      {/* Lateral — desktop */}
      <aside className="pv-sidebar" style={{ flexDirection: "column", width: 232,
        borderRight: "1px solid var(--line)", background: "var(--surface)",
        padding: "22px 14px", position: "sticky", top: 0, height: "100vh", gap: 6 }}>
        <div style={{ padding: "0 10px 14px" }}>
          <div className="t-h2" style={{ fontSize: 21, marginBottom: 10 }}>Ponte Visual</div>
          <SpectrumBar rounded />
        </div>
        {abas.map(({ to, label, Icon }) => {
          const ativa = loc.pathname === to;
          return (
            <Link key={to} to={to}
              style={{ display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: "var(--r)", textDecoration: "none",
                fontWeight: ativa ? 800 : 600,
                color: ativa ? "var(--primary-dark)" : "var(--ink-soft)",
                background: ativa ? "var(--primary-tint)" : "transparent" }}>
              <Icon size={22} /><span>{label}</span>
            </Link>
          );
        })}
      </aside>

      <div className="pv-main">
        {/* Cabeçalho — celular */}
        <header className="pv-mobilehead" style={{ position: "sticky", top: 0, zIndex: 10,
          background: "var(--bg)", paddingBottom: 6 }}>
          <div style={{ padding: "16px 20px 10px", maxWidth: 560, margin: "0 auto",
            width: "100%" }}>
            <span className="t-h2" style={{ fontSize: 22 }}>Ponte Visual</span>
          </div>
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px", width: "100%" }}>
            <SpectrumBar rounded />
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px 20px", maxWidth: 620, width: "100%",
          margin: "0 auto" }}>
          {children}
        </main>

        {/* Inferior — celular */}
        <nav className="pv-bottomnav" style={{ position: "sticky", bottom: 0,
          background: "var(--surface)", borderTop: "1px solid var(--line)",
          boxShadow: "0 -2px 12px rgba(44,42,39,.05)" }}>
          <div style={{ display: "flex", maxWidth: 560, margin: "0 auto" }}>
            {abas.map(({ to, label, Icon }) => {
              const ativa = loc.pathname === to;
              return (
                <Link key={to} to={to}
                  style={{ flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 3, padding: "10px 0 12px",
                    textDecoration: "none",
                    color: ativa ? "var(--primary)" : "var(--ink-soft)" }}>
                  <Icon size={24} />
                  <span style={{ fontSize: 12, fontWeight: ativa ? 800 : 600 }}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

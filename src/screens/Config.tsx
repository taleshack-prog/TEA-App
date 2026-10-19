/** T6 — Ajustes: horários de check-in, permissão de alarme e tema. */
import { useState } from "react";
import { Button, Campo } from "../components/ui";
import { agendarCheckins, pedirPermissao } from "../lib/alarmes";
import { useAuth } from "../lib/auth";

const HORARIOS = ["08:00", "12:00", "17:00", "21:00"];

export function Config() {
  const { perfil, sair } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [tema, setTema] = useState<string>(
    document.documentElement.getAttribute("data-theme") ?? "sistema",
  );

  async function ativarAlarmes() {
    const perm = await pedirPermissao();
    if (perm !== "granted") {
      setStatus("Permissão de notificação negada.");
      return;
    }
    const modo = await agendarCheckins(HORARIOS);
    setStatus(
      modo === "triggers" ? "Alarmes agendados no sistema."
      : modo === "timeout" ? "Alarmes ativos com o app aberto (limitação do PWA)."
      : "Não foi possível agendar.",
    );
  }

  function trocarTema(t: string) {
    setTema(t);
    if (t === "sistema") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 className="t-h1">Ajustes</h1>

      <Campo titulo="Horários de check-in">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {HORARIOS.map((h) => (
            <span key={h} className="t-mono"
                  style={{ padding: "8px 12px", border: "1px solid var(--hairline)",
                           borderRadius: "var(--radius)", fontSize: 15 }}>{h}</span>
          ))}
        </div>
      </Campo>

      <Campo titulo="Alarmes">
        <Button variant="ghost" onClick={ativarAlarmes}>Ativar notificações</Button>
        {status && <p className="t-mono" style={{ fontSize: 12,
          color: "var(--text-secondary)", marginTop: 8 }}>{status}</p>}
      </Campo>

      <Campo titulo="Tema">
        <div style={{ display: "flex", gap: 8 }}>
          {["sistema", "light", "dark"].map((t) => (
            <button key={t} onClick={() => trocarTema(t)}
              style={{ flex: 1, minHeight: 44, cursor: "pointer",
                border: "1px solid var(--hairline)", borderRadius: "var(--radius)",
                fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 12,
                letterSpacing: "0.05em", textTransform: "uppercase",
                background: tema === t ? "var(--text-primary)" : "transparent",
                color: tema === t ? "var(--bg)" : "var(--text-primary)" }}>
              {t === "sistema" ? "Auto" : t === "light" ? "Claro" : "Escuro"}
            </button>
          ))}
        </div>
      </Campo>

      <hr className="hairline" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p className="t-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {perfil?.email}
        </p>
        <Button variant="ghost" onClick={sair}>Sair</Button>
      </div>
    </div>
  );
}

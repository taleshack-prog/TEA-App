/** Ajustes — alarmes dos check-ins, tema e sair. */
import { useState } from "react";
import { Button, Card, Field } from "../components/ui";
import { agendarCheckins, pedirPermissao } from "../lib/alarmes";
import { useAuth } from "../lib/auth";

const HORARIOS = ["08:00", "12:00", "17:00", "21:00"];

export function Config() {
  const { perfil, sair } = useAuth();
  const [status, setStatus] = useState<string | null>(null);

  async function ativarAlarmes() {
    const perm = await pedirPermissao();
    if (perm !== "granted") { setStatus("Permissão de notificação negada."); return; }
    const modo = await agendarCheckins(HORARIOS);
    setStatus(modo === "triggers" ? "Alarmes agendados."
      : modo === "timeout" ? "Lembretes ativos com o app aberto."
      : "Não foi possível agendar os alarmes.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 className="t-h1">Ajustes</h1>

      <Card>
        <Field label="Horários dos check-ins">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {HORARIOS.map((h) => (
              <span key={h} style={{ padding: "8px 16px", background: "var(--primary-tint)",
                color: "var(--primary-dark)", borderRadius: "var(--r-pill)", fontWeight: 700 }}>
                {h}
              </span>
            ))}
          </div>
        </Field>
      </Card>

      <Card>
        <h2 className="t-h2" style={{ marginBottom: 6 }}>Lembretes</h2>
        <p className="t-small" style={{ marginBottom: 14 }}>
          Receba um aviso na hora do check-in.
        </p>
        <Button variant="soft" onClick={ativarAlarmes}>Ativar lembretes</Button>
        {status && <p className="t-small" style={{ marginTop: 10 }}>{status}</p>}
      </Card>

      <Card style={{ background: "var(--surface-2)" }}>
        <div className="t-small">Conectado como</div>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>{perfil?.email}</div>
        <Button variant="ghost" onClick={sair}>Sair</Button>
      </Card>
    </div>
  );
}

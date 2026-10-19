/** T1 — Home "Hoje": contagem regressiva do próximo check-in (numeral gigante
 *  mono no acento), botão grande "Registrar agora", atalho de evento e status
 *  de sincronização offline. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { proximoHorario } from "../lib/alarmes";
import { pendentes } from "../lib/sync";
import { useAuth } from "../lib/auth";

// Horários padrão (depois vêm de /config/checkins).
const HORARIOS = ["08:00", "12:00", "17:00", "21:00"];

function proximo(): { label: string; alvo: Date } {
  const candidatos = HORARIOS.map((h) => ({ label: h, alvo: proximoHorario(h) }));
  candidatos.sort((a, b) => a.alvo.getTime() - b.alvo.getTime());
  return candidatos[0];
}

function formatar(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function Home() {
  const nav = useNavigate();
  const { perfil } = useAuth();
  const [alvo] = useState(proximo());
  const [agora, setAgora] = useState(Date.now());
  const [fila, setFila] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { void pendentes().then(setFila); }, [agora > 0]);

  const restante = alvo.alvo.getTime() - agora;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingTop: 12 }}>
      <div>
        <p className="t-label">Próximo check-in · {alvo.label}</p>
        <div className="t-mono"
             style={{ fontSize: 72, fontWeight: 600, color: "var(--accent)",
                      lineHeight: 1, letterSpacing: "-0.03em" }}>
          {formatar(restante)}
        </div>
      </div>

      <Button onClick={() => nav("/checkin")}>Registrar agora</Button>

      <hr className="hairline" />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span className="t-label">Aconteceu algo?</span>
        <Button variant="ghost" onClick={() => nav("/evento")}>+ Evento</Button>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <p className="t-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {perfil?.nome?.toUpperCase()} · {navigator.onLine ? "ONLINE" : "OFFLINE"}
          {fila > 0 && ` · ${fila} PENDENTE(S) P/ ENVIAR`}
        </p>
      </div>
    </div>
  );
}

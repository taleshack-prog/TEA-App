/** T2 — Check-in rápido (<60s, ≤3 passos).
 *  Passo 1: humor + energia (essenciais). Passo 2: sono + alimentação.
 *  Passo 3 (opcional): observação + medicação. Envio offline-aware. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button, Campo, EnergyBar, MoodSelector, SegmentedControl, SleepStepper,
} from "../components/ui";
import { registrarCheckin } from "../lib/sync";
import type { SinalIn } from "../lib/api";

export function Checkin() {
  const nav = useNavigate();
  const [passo, setPasso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Estado do sinal
  const [humor, setHumor] = useState<string | null>(null);
  const [energia, setEnergia] = useState(3);
  const [horasSono, setHorasSono] = useState(8);
  const [qualidadeSono, setQualidadeSono] = useState(3);
  const [alimentacao, setAlimentacao] = useState<string | null>(null);
  const [obs, setObs] = useState("");
  const [medicacao, setMedicacao] = useState<string | null>(null);

  const podeAvancar = passo > 1 || humor !== null; // essenciais: humor + energia

  async function concluir() {
    if (!humor) return;
    setEnviando(true);
    setMsg(null);
    const sinal: SinalIn = {
      humor,
      energia_1_5: energia,
      horas_sono: horasSono,
      qualidade_sono_1_5: qualidadeSono,
      alimentacao,
      medicacao: medicacao === "sim",
      observacao_livre: obs || null,
    };
    try {
      const r = await registrarCheckin({ tipo: "livre", sinal });
      setMsg(r.enviado ? "Registrado." : "Salvo offline — enviará ao reconectar.");
      setTimeout(() => nav("/"), 700);
    } catch {
      setMsg("Erro ao registrar.");
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 className="t-h1">Check-in</h1>
        <span className="t-mono" style={{ color: "var(--text-secondary)" }}>
          {passo}/3
        </span>
      </div>

      {passo === 1 && (
        <>
          <Campo titulo="Como ele está">
            <MoodSelector value={humor} onChange={setHumor} />
          </Campo>
          <Campo titulo="Energia">
            <EnergyBar value={energia} onChange={setEnergia} />
          </Campo>
        </>
      )}

      {passo === 2 && (
        <>
          <Campo titulo="Sono">
            <SleepStepper
              horas={horasSono} qualidade={qualidadeSono}
              onHoras={setHorasSono} onQualidade={setQualidadeSono}
            />
          </Campo>
          <Campo titulo="Alimentação">
            <SegmentedControl
              options={[
                { label: "Normal", value: "normal" },
                { label: "Alterada", value: "alterada" },
                { label: "Recusa", value: "recusa" },
              ]}
              value={alimentacao} onChange={setAlimentacao}
            />
          </Campo>
        </>
      )}

      {passo === 3 && (
        <>
          <Campo titulo="Observação (opcional)">
            <textarea
              value={obs} onChange={(e) => setObs(e.target.value)} rows={3}
              placeholder="O que chamou atenção?"
              style={{
                padding: 12, border: "1px solid var(--hairline)",
                borderRadius: "var(--radius)", background: "var(--surface)",
                color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: 16,
                resize: "vertical",
              }}
            />
          </Campo>
          <Campo titulo="Tomou medicação?">
            <SegmentedControl
              options={[{ label: "Sim", value: "sim" }, { label: "Não", value: "nao" }]}
              value={medicacao} onChange={setMedicacao}
            />
          </Campo>
        </>
      )}

      {msg && <p className="t-mono" style={{ fontSize: 13, color: "var(--accent)" }}>{msg}</p>}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        {passo > 1 && (
          <Button variant="ghost" full={false} onClick={() => setPasso(passo - 1)}>
            Voltar
          </Button>
        )}
        {passo < 3 ? (
          <Button disabled={!podeAvancar} onClick={() => setPasso(passo + 1)}>
            Continuar
          </Button>
        ) : (
          <Button disabled={enviando || !humor} onClick={concluir}>
            {enviando ? "Salvando…" : "Concluir"}
          </Button>
        )}
      </div>

      {passo === 1 && (
        <button
          onClick={concluir}
          disabled={!humor || enviando}
          style={{
            background: "none", border: "none", cursor: humor ? "pointer" : "default",
            color: "var(--text-secondary)", fontFamily: "var(--font-ui)",
            fontSize: 13, fontWeight: 700, letterSpacing: "0.05em",
            textTransform: "uppercase", textDecoration: "underline",
            opacity: humor ? 1 : 0.4,
          }}
        >
          Salvar só o essencial
        </button>
      )}
    </div>
  );
}

/** Check-in rápido — 3 passos. Humor + energia são o essencial. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button, Field, EnergyBar, MoodSelector, SegmentedControl, SleepStepper, inputStyle,
} from "../components/ui";
import { IconBack } from "../components/icons";
import { registrarCheckin } from "../lib/sync";
import type { SinalIn } from "../lib/api";

export function Checkin() {
  const nav = useNavigate();
  const [passo, setPasso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [humor, setHumor] = useState<string | null>(null);
  const [energia, setEnergia] = useState(3);
  const [horasSono, setHorasSono] = useState(8);
  const [qualidadeSono, setQualidadeSono] = useState(3);
  const [alimentacao, setAlimentacao] = useState<string | null>(null);
  const [obs, setObs] = useState("");
  const [medicacao, setMedicacao] = useState<string | null>(null);

  async function concluir() {
    if (!humor) return;
    setEnviando(true); setMsg(null);
    const sinal: SinalIn = {
      humor, energia_1_5: energia, horas_sono: horasSono,
      qualidade_sono_1_5: qualidadeSono, alimentacao,
      medicacao: medicacao === "sim", observacao_livre: obs || null,
    };
    try {
      const r = await registrarCheckin({ tipo: "livre", sinal });
      setMsg(r.enviado ? "Registrado. Obrigado." : "Salvo — enviaremos quando voltar a conexão.");
      setTimeout(() => nav("/"), 800);
    } catch {
      setMsg("Não deu para salvar. Tente de novo."); setEnviando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => passo > 1 ? setPasso(passo - 1) : nav("/")}
          style={{ background: "none", border: "none", cursor: "pointer",
            color: "var(--ink)", padding: 4, display: "flex" }}>
          <IconBack />
        </button>
        <h1 className="t-h1" style={{ flex: 1 }}>Check-in</h1>
        <span className="t-sub">{passo} de 3</span>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ flex: 1, height: 6, borderRadius: 3,
            background: n <= passo ? "var(--primary)" : "var(--line)" }} />
        ))}
      </div>

      {passo === 1 && (
        <>
          <Field label="Como ele está?">
            <MoodSelector value={humor} onChange={setHumor} />
          </Field>
          <Field label="Nível de energia">
            <EnergyBar value={energia} onChange={setEnergia} />
          </Field>
        </>
      )}

      {passo === 2 && (
        <>
          <Field label="Sono"><SleepStepper horas={horasSono} qualidade={qualidadeSono}
            onHoras={setHorasSono} onQualidade={setQualidadeSono} /></Field>
          <Field label="Alimentação">
            <SegmentedControl value={alimentacao} onChange={setAlimentacao}
              options={[{ label: "Normal", value: "normal" },
                { label: "Alterada", value: "alterada" }, { label: "Recusa", value: "recusa" }]} />
          </Field>
        </>
      )}

      {passo === 3 && (
        <>
          <Field label="Quer anotar algo?" hint="Opcional — o que chamou sua atenção.">
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3}
              style={{ ...inputStyle, height: "auto", padding: 14, resize: "vertical" }} />
          </Field>
          <Field label="Tomou medicação?">
            <SegmentedControl value={medicacao} onChange={setMedicacao}
              options={[{ label: "Sim", value: "sim" }, { label: "Não", value: "nao" }]} />
          </Field>
        </>
      )}

      {msg && <div style={{ background: "var(--primary-tint)", color: "var(--primary-dark)",
        borderRadius: "var(--r-sm)", padding: "12px 14px", fontWeight: 700 }}>{msg}</div>}

      <div style={{ display: "flex", gap: 12 }}>
        {passo < 3 ? (
          <Button disabled={passo === 1 && !humor} onClick={() => setPasso(passo + 1)}>
            Continuar
          </Button>
        ) : (
          <Button disabled={enviando || !humor} onClick={concluir}>
            {enviando ? "Salvando…" : "Concluir"}
          </Button>
        )}
      </div>

      {passo === 1 && humor && (
        <Button variant="ghost" onClick={concluir} disabled={enviando}>
          Salvar só o essencial
        </Button>
      )}
    </div>
  );
}

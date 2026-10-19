/** Registrar um momento — crise, euforia, introspecção, alegria. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, EnergyBar, SegmentedControl, inputStyle } from "../components/ui";
import { IconBack } from "../components/icons";
import { registrarEvento } from "../lib/sync";

const TIPOS = [
  { value: "crise", label: "Crise", cor: "var(--crise)" },
  { value: "euforia", label: "Euforia", cor: "var(--euforia)" },
  { value: "introspeccao", label: "Introspecção", cor: "var(--introspeccao)" },
  { value: "alegria_intensa", label: "Alegria intensa", cor: "var(--alegria)" },
];

export function Evento() {
  const nav = useNavigate();
  const [tipo, setTipo] = useState<string | null>(null);
  const [intensidade, setIntensidade] = useState(3);
  const [gatilho, setGatilho] = useState("");
  const [intervencao, setIntervencao] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function salvar() {
    if (!tipo) return;
    setEnviando(true);
    try {
      const r = await registrarEvento({
        tipo, inicio: new Date().toISOString(), intensidade_1_5: intensidade,
        gatilho_percebido: gatilho || null, intervencao_tentada: intervencao || null,
        resultado,
      });
      setMsg(r.enviado ? "Momento registrado." : "Salvo — enviaremos quando voltar a conexão.");
      setTimeout(() => nav("/"), 800);
    } catch { setMsg("Não deu para salvar."); setEnviando(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => nav("/")} style={{ background: "none", border: "none",
          cursor: "pointer", color: "var(--ink)", padding: 4, display: "flex" }}>
          <IconBack />
        </button>
        <h1 className="t-h1">Um momento</h1>
      </div>

      <Field label="O que foi?">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TIPOS.map((t) => {
            const sel = tipo === t.value;
            return (
              <button key={t.value} type="button" onClick={() => setTipo(t.value)}
                style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 56,
                  padding: "0 18px", cursor: "pointer", borderRadius: "var(--r)",
                  border: sel ? "2px solid " + t.cor : "1.5px solid var(--line)",
                  background: sel ? "var(--surface)" : "var(--surface)",
                  boxShadow: sel ? "var(--shadow)" : "none", textAlign: "left" }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.cor }} />
                <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </Field>

      {tipo && (
        <>
          <Field label="Intensidade"><EnergyBar value={intensidade} onChange={setIntensidade} /></Field>
          <Field label="O que você acha que provocou?" hint="Opcional.">
            <input value={gatilho} onChange={(e) => setGatilho(e.target.value)}
              placeholder="Ex.: barulho, mudança de rotina" style={inputStyle} />
          </Field>
          <Field label="O que você tentou?" hint="Opcional.">
            <input value={intervencao} onChange={(e) => setIntervencao(e.target.value)}
              placeholder="Ex.: levar para um lugar calmo" style={inputStyle} />
          </Field>
          <Field label="E como ficou depois?">
            <SegmentedControl value={resultado} onChange={setResultado}
              options={[{ label: "Melhorou", value: "melhorou" },
                { label: "Igual", value: "igual" }, { label: "Piorou", value: "piorou" }]} />
          </Field>
        </>
      )}

      {msg && <div style={{ background: "var(--primary-tint)", color: "var(--primary-dark)",
        borderRadius: "var(--r-sm)", padding: "12px 14px", fontWeight: 700 }}>{msg}</div>}

      {tipo && <Button disabled={enviando} onClick={salvar}>
        {enviando ? "Salvando…" : "Registrar momento"}</Button>}
    </div>
  );
}

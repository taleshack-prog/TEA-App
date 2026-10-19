/** T3 — Registrar evento (crise, euforia, introspecção, alegria intensa).
 *  Tipo → detalhes (intensidade, gatilho, intervenção, resultado). Offline-aware.
 *  O tipo mostra seu filete semântico de 3px (cor informativa, nunca decorativa). */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Campo, EnergyBar, SegmentedControl } from "../components/ui";
import { registrarEvento } from "../lib/sync";

const TIPOS = [
  { value: "crise", label: "CRISE", cor: "var(--sem-crise)" },
  { value: "euforia", label: "EUFORIA", cor: "var(--sem-euforia)" },
  { value: "introspeccao", label: "INTROSPECÇÃO", cor: "var(--sem-introspeccao)" },
  { value: "alegria_intensa", label: "ALEGRIA", cor: "var(--sem-alegria)" },
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
        tipo,
        inicio: new Date().toISOString(),
        intensidade_1_5: intensidade,
        gatilho_percebido: gatilho || null,
        intervencao_tentada: intervencao || null,
        resultado,
      });
      setMsg(r.enviado ? "Evento registrado." : "Salvo offline — enviará ao reconectar.");
      setTimeout(() => nav("/"), 700);
    } catch {
      setMsg("Erro ao registrar.");
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 className="t-h1">Registrar evento</h1>

      <Campo titulo="O que foi?">
        <div style={{ display: "flex", flexDirection: "column",
                      border: "1px solid var(--hairline)" }}>
          {TIPOS.map((t, i) => {
            const sel = tipo === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, minHeight: 52,
                  padding: "0 14px", cursor: "pointer", border: "none",
                  borderTop: i ? "1px solid var(--hairline)" : "none",
                  background: sel ? "var(--surface)" : "transparent",
                  textAlign: "left",
                }}
              >
                <span style={{ width: 3, height: 24, background: t.cor }} />
                <span style={{
                  fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14,
                  letterSpacing: "0.05em", color: "var(--text-primary)",
                }}>{t.label}</span>
                {sel && <span className="t-mono"
                  style={{ marginLeft: "auto", color: "var(--accent)" }}>●</span>}
              </button>
            );
          })}
        </div>
      </Campo>

      {tipo && (
        <>
          <Campo titulo="Intensidade">
            <EnergyBar value={intensidade} onChange={setIntensidade} />
          </Campo>
          <Campo titulo="Gatilho percebido (opcional)">
            <input value={gatilho} onChange={(e) => setGatilho(e.target.value)}
                   style={inputStyle} placeholder="Ex.: barulho, mudança de rotina" />
          </Campo>
          <Campo titulo="Intervenção tentada (opcional)">
            <input value={intervencao} onChange={(e) => setIntervencao(e.target.value)}
                   style={inputStyle} placeholder="Ex.: ambiente calmo" />
          </Campo>
          <Campo titulo="Resultado">
            <SegmentedControl
              options={[
                { label: "Melhorou", value: "melhorou" },
                { label: "Igual", value: "igual" },
                { label: "Piorou", value: "piorou" },
              ]}
              value={resultado} onChange={setResultado}
            />
          </Campo>
        </>
      )}

      {msg && <p className="t-mono" style={{ fontSize: 13, color: "var(--accent)" }}>{msg}</p>}

      <div style={{ display: "flex", gap: 12 }}>
        <Button variant="ghost" full={false} onClick={() => nav("/")}>Cancelar</Button>
        <Button disabled={!tipo || enviando} onClick={salvar}>
          {enviando ? "Salvando…" : "Registrar"}
        </Button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 48, padding: "0 12px", border: "1px solid var(--hairline)",
  borderRadius: "var(--radius)", background: "var(--surface)",
  color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: 16,
};

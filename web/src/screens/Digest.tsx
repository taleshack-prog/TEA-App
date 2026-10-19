/** Resumo — a leitura da IA (Nível 0: estatística). Linguagem de hipótese,
 *  nunca diagnóstico. Abaixo do mínimo de dados, não afirma nada. */
import { useEffect, useState } from "react";
import { Card, SegmentedControl } from "../components/ui";
import { analiseDescritiva, ApiError, type AnaliseDescritiva } from "../lib/api";

const HUMOR_L: Record<string, string> = {
  calmo: "Calmo", agitado: "Agitado", triste: "Triste", euforico: "Eufórico",
  introspectivo: "Introspectivo", tenso: "Tenso", alegre: "Alegre",
};
const EVT_L: Record<string, string> = {
  crise: "crise(s)", euforia: "euforia(s)",
  introspeccao: "introspecção", alegria_intensa: "alegria(s) intensa(s)",
};

function narrativa(a: AnaliseDescritiva, dias: number): string {
  const n = a.n_checkins_preenchidos;
  const partes = [`Nos últimos ${dias} dias, ${n} check-ins foram preenchidos.`];
  if (a.humor.predominante) {
    const f = a.humor.frequencias[a.humor.predominante];
    partes.push(`O estado mais frequente foi ${HUMOR_L[a.humor.predominante]} (${f} de ${n}).`);
  }
  if (a.energia_media_1_5 != null) {
    let s = `A energia média ficou em ${a.energia_media_1_5}/5`;
    if (a.sono.horas_media != null) s += ` e o sono em ${a.sono.horas_media}h`;
    partes.push(s + ".");
  }
  if (a.eventos.total > 0) {
    const t = Object.entries(a.eventos.por_tipo)
      .map(([k, c]) => `${c} ${EVT_L[k] ?? k}`).join(", ");
    partes.push(`Houve ${a.eventos.total} momento(s) registrado(s): ${t}.`);
  } else partes.push("Nenhum momento marcante foi registrado no período.");
  return partes.join(" ");
}

export function Digest() {
  const [dias, setDias] = useState(7);
  const [dado, setDado] = useState<AnaliseDescritiva | null>(null);
  const [estado, setEstado] = useState<"load" | "ok" | "proibido" | "erro">("load");

  useEffect(() => {
    let vivo = true; setEstado("load");
    analiseDescritiva(dias)
      .then((d) => { if (vivo) { setDado(d); setEstado("ok"); } })
      .catch((e) => { if (vivo) setEstado(e instanceof ApiError && e.status === 403 ? "proibido" : "erro"); });
    return () => { vivo = false; };
  }, [dias]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 className="t-h1">Resumo</h1>
      <SegmentedControl value={String(dias)} onChange={(v) => setDias(Number(v))}
        options={[{ label: "7 dias", value: "7" }, { label: "30 dias", value: "30" }]} />

      {estado === "load" && <p className="t-sub">Preparando o resumo…</p>}
      {estado === "proibido" && <p className="t-sub">O resumo é visível apenas para os pais.</p>}
      {estado === "erro" && <p className="t-sub">Sem conexão com o servidor agora.</p>}

      {estado === "ok" && dado && (dado.dados_suficientes
        ? <Pronto a={dado} dias={dias} />
        : <Guardrail aviso={dado.aviso} />)}
    </div>
  );
}

function Pronto({ a, dias }: { a: AnaliseDescritiva; dias: number }) {
  const total = Object.values(a.humor.frequencias).reduce((s, n) => s + n, 0) || 1;
  return (
    <>
      <Card>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 19, lineHeight: 1.5 }}>
          {narrativa(a, dias)}
        </p>
      </Card>

      <Card>
        <h2 className="t-h2" style={{ marginBottom: 12 }}>Como foi o humor</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(a.humor.frequencias).sort((x, y) => y[1] - x[1]).map(([h, c]) => (
            <div key={h} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ minWidth: 112, fontWeight: 600 }}>{HUMOR_L[h] ?? h}</span>
              <div style={{ flex: 1, height: 12, background: "var(--surface-2)",
                borderRadius: "var(--r-pill)", overflow: "hidden" }}>
                <div style={{ width: `${(c / total) * 100}%`, height: "100%",
                  background: "var(--primary)", borderRadius: "var(--r-pill)" }} />
              </div>
              <span style={{ minWidth: 22, textAlign: "right", fontWeight: 700,
                color: "var(--ink-soft)" }}>{c}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ background: "var(--surface-2)" }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <Dado titulo="Energia média" valor={`${a.energia_media_1_5 ?? "—"}/5`} />
          <Dado titulo="Sono médio" valor={`${a.sono.horas_media ?? "—"}h`} />
          <Dado titulo="Momentos" valor={`${a.eventos.total}`} />
          <Dado titulo="Base" valor={`${a.n_checkins_preenchidos} check-ins`} />
        </div>
        <p className="t-small" style={{ marginTop: 16, borderTop: "1px solid var(--line)",
          paddingTop: 12 }}>
          Isto é um retrato dos números do período, não um diagnóstico. Correlações e
          nível de confiança aparecem quando houver mais dados (por volta de 30 dias).
        </p>
      </Card>
    </>
  );
}

function Dado({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600,
        color: "var(--primary-dark)" }}>{valor}</div>
      <div className="t-small">{titulo}</div>
    </div>
  );
}

function Guardrail({ aviso }: { aviso: string | null }) {
  return (
    <Card style={{ background: "var(--primary-tint)" }}>
      <h2 className="t-h2" style={{ color: "var(--primary-dark)" }}>
        Ainda juntando dados
      </h2>
      <p style={{ marginTop: 8 }}>
        Com poucos check-ins não dá para apontar padrões com honestidade.
        Continue registrando — o resumo aparece assim que houver dados suficientes.
      </p>
      {aviso && <p className="t-small" style={{ marginTop: 10 }}>{aviso}</p>}
    </Card>
  );
}

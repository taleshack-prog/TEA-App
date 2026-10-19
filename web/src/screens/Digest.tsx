/** T5 — Digest (Nível 0). Lê /analises/descritiva (só pais) e monta um card
 *  editorial: narrativa em linguagem de hipótese + números em mono + disclaimer.
 *
 *  Honestidade estatística: no Nível 0 NÃO há confiança calibrada nem detecção
 *  de padrão causal. Mostramos os números do período e, abaixo do mínimo de
 *  check-ins, exibimos o guardrail anti-apofenia em vez de afirmar qualquer coisa.
 *  Correlações (sono×crise) e confiança só entram no Nível 1 (~30 dias). */
import { useEffect, useState } from "react";
import { SegmentedControl } from "../components/ui";
import { analiseDescritiva, ApiError, type AnaliseDescritiva } from "../lib/api";

const HUMOR_LABEL: Record<string, string> = {
  calmo: "CALMO", agitado: "AGITADO", triste: "TRISTE", euforico: "EUFÓRICO",
  introspectivo: "INTROSPECTIVO", tenso: "TENSO", alegre: "ALEGRE",
};
const EVENTO_LABEL: Record<string, string> = {
  crise: "crise(s)", euforia: "euforia(s)",
  introspeccao: "introspecção", alegria_intensa: "alegria(s) intensa(s)",
};

function narrativa(a: AnaliseDescritiva, dias: number): string {
  const n = a.n_checkins_preenchidos;
  const humor = a.humor.predominante ? HUMOR_LABEL[a.humor.predominante] : null;
  const freqHumor = a.humor.predominante
    ? a.humor.frequencias[a.humor.predominante] : 0;

  const partes: string[] = [];
  partes.push(`Nos últimos ${dias} dias foram ${n} check-ins preenchidos.`);
  if (humor) {
    partes.push(
      `O estado mais frequente foi ${humor} (${freqHumor} de ${n}).`,
    );
  }
  if (a.energia_media_1_5 != null) {
    partes.push(`A energia média ficou em ${a.energia_media_1_5}/5`);
  }
  if (a.sono.horas_media != null) {
    partes[partes.length - 1] += ` e o sono em ${a.sono.horas_media}h.`;
  } else if (partes.length) {
    partes[partes.length - 1] += ".";
  }
  if (a.eventos.total > 0) {
    const tipos = Object.entries(a.eventos.por_tipo)
      .map(([t, c]) => `${c} ${EVENTO_LABEL[t] ?? t}`).join(", ");
    partes.push(`Houve ${a.eventos.total} evento(s): ${tipos}.`);
  } else {
    partes.push("Nenhum evento registrado no período.");
  }
  return partes.join(" ");
}

export function Digest() {
  const [dias, setDias] = useState(7);
  const [dado, setDado] = useState<AnaliseDescritiva | null>(null);
  const [estado, setEstado] = useState<"carregando" | "ok" | "proibido" | "erro">(
    "carregando",
  );

  useEffect(() => {
    let vivo = true;
    setEstado("carregando");
    analiseDescritiva(dias)
      .then((d) => { if (vivo) { setDado(d); setEstado("ok"); } })
      .catch((e) => {
        if (!vivo) return;
        setEstado(e instanceof ApiError && e.status === 403 ? "proibido" : "erro");
      });
    return () => { vivo = false; };
  }, [dias]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 className="t-h1">Resumo</h1>

      <SegmentedControl
        options={[{ label: "7 dias", value: "7" }, { label: "30 dias", value: "30" }]}
        value={String(dias)} onChange={(v) => setDias(Number(v))}
      />

      {estado === "carregando" && (
        <p className="t-mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Calculando…
        </p>
      )}
      {estado === "proibido" && (
        <p className="t-mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Apenas os pais têm acesso ao resumo.
        </p>
      )}
      {estado === "erro" && (
        <p className="t-mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Sem conexão com a API.
        </p>
      )}

      {estado === "ok" && dado && (
        dado.dados_suficientes
          ? <Card a={dado} dias={dias} />
          : <Guardrail aviso={dado.aviso} />
      )}
    </div>
  );
}

/* Card editorial do digest (TDD §6.6: narrativa 20-22px, dados mono, disclaimer). */
function Card({ a, dias }: { a: AnaliseDescritiva; dias: number }) {
  const total = Object.values(a.humor.frequencias).reduce((s, n) => s + n, 0) || 1;
  return (
    <article style={{ display: "flex", flexDirection: "column", gap: 20,
                      borderTop: "1px solid var(--hairline)", paddingTop: 20 }}>
      <p style={{ fontSize: 21, lineHeight: 1.45, fontWeight: 400 }}>
        {narrativa(a, dias)}
      </p>

      {/* Distribuição de humor — barras segmentadas em tinta, rótulo mono */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="t-label">Distribuição de humor</span>
        {Object.entries(a.humor.frequencias)
          .sort((x, y) => y[1] - x[1])
          .map(([h, c]) => (
            <div key={h} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="t-mono" style={{ fontSize: 11, minWidth: 108,
                color: "var(--text-secondary)" }}>{HUMOR_LABEL[h] ?? h}</span>
              <div style={{ flex: 1, height: 10, background: "var(--hairline)" }}>
                <div style={{ width: `${(c / total) * 100}%`, height: "100%",
                  background: "var(--text-primary)" }} />
              </div>
              <span className="t-mono" style={{ fontSize: 12, minWidth: 20,
                textAlign: "right" }}>{c}</span>
            </div>
          ))}
      </div>

      {/* Linha de dados em mono */}
      <div className="t-mono" style={{ fontSize: 12, lineHeight: 1.9,
        color: "var(--text-secondary)" }}>
        <div>BASE: {a.n_checkins_preenchidos} CHECK-INS</div>
        <div>ENERGIA MÉDIA: {a.energia_media_1_5 ?? "—"}/5</div>
        <div>SONO MÉDIO: {a.sono.horas_media ?? "—"}H · QUALIDADE {a.sono.qualidade_media_1_5 ?? "—"}/5</div>
        <div>EVENTOS: {a.eventos.total}
          {a.eventos.intensidade_media_1_5 != null
            && ` · INTENSIDADE MÉDIA ${a.eventos.intensidade_media_1_5}/5`}</div>
      </div>

      <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 12 }}>
        <p className="t-mono" style={{ fontSize: 11, letterSpacing: "0.05em",
          color: "var(--text-secondary)" }}>
          HIPÓTESE ESTATÍSTICA — NÃO É DIAGNÓSTICO
        </p>
        <p className="t-mono" style={{ fontSize: 11, marginTop: 4,
          color: "var(--text-secondary)" }}>
          CORRELAÇÕES E CONFIANÇA ENTRAM NO NÍVEL 1 (~30 DIAS DE DADOS)
        </p>
      </div>
    </article>
  );
}

/* Guardrail anti-apofenia: abaixo do mínimo, não afirma nada. */
function Guardrail({ aviso }: { aviso: string | null }) {
  return (
    <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 20,
                  display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ width: 3, height: 28, background: "var(--accent)" }} />
      <p style={{ fontSize: 18, lineHeight: 1.45 }}>
        Ainda não há dados suficientes para apontar padrões.
      </p>
      {aviso && <p className="t-mono" style={{ fontSize: 12,
        color: "var(--text-secondary)" }}>{aviso.toUpperCase()}</p>}
      <p className="t-mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
        CONTINUE REGISTRANDO — O RESUMO APARECE AO CRUZAR O MÍNIMO.
      </p>
    </div>
  );
}

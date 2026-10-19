/** T4 — Linha do tempo (tabela suíça: horário mono + filete + descrição). */
import { useEffect, useState } from "react";
import { timeline, type ItemTimeline } from "../lib/api";

const COR_EVENTO: Record<string, string> = {
  crise: "var(--sem-crise)", euforia: "var(--sem-euforia)",
  introspeccao: "var(--sem-introspeccao)", alegria_intensa: "var(--sem-alegria)",
};

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function Timeline() {
  const [itens, setItens] = useState<ItemTimeline[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    timeline("dia").then((r) => setItens(r.itens)).catch(() => setErro(true));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="t-h1">Hoje</h1>
      {erro && <p className="t-mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Sem conexão com a API.
      </p>}
      {itens && itens.length === 0 && (
        <p className="t-mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Nenhum registro hoje ainda.
        </p>
      )}
      <div>
        {itens?.map((it) => {
          const cor = it.tipo_item === "evento"
            ? COR_EVENTO[String(it.evento)] ?? "var(--accent)"
            : "var(--hairline)";
          return (
            <div key={`${it.tipo_item}-${it.id}`}
                 style={{ display: "flex", gap: 12, alignItems: "center",
                          padding: "12px 0", borderTop: "1px solid var(--hairline)" }}>
              <span className="t-mono" style={{ fontSize: 13, minWidth: 48,
                color: "var(--text-secondary)" }}>{hora(it.quando)}</span>
              <span style={{ width: 3, alignSelf: "stretch", background: cor }} />
              <span style={{ fontSize: 15 }}>
                {it.tipo_item === "checkin" && `Check-in — ${String(it.humor ?? "").toUpperCase()}`}
                {it.tipo_item === "evento" && `${String(it.evento).toUpperCase()} · I${it.intensidade_1_5}`}
                {it.tipo_item === "midia" && `Mídia (${it.midia})`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

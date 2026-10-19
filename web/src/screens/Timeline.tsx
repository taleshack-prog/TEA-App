/** Linha — o que foi registrado hoje, em cartões calorosos. */
import { useEffect, useState } from "react";
import { Card } from "../components/ui";
import { timeline, type ItemTimeline } from "../lib/api";

const HUMOR_L: Record<string, string> = {
  calmo: "Calmo", agitado: "Agitado", triste: "Triste", euforico: "Eufórico",
  introspectivo: "Introspectivo", tenso: "Tenso", alegre: "Alegre",
};
const EVT: Record<string, { l: string; c: string }> = {
  crise: { l: "Crise", c: "var(--crise)" },
  euforia: { l: "Euforia", c: "var(--euforia)" },
  introspeccao: { l: "Introspecção", c: "var(--introspeccao)" },
  alegria_intensa: { l: "Alegria intensa", c: "var(--alegria)" },
};
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function Timeline() {
  const [itens, setItens] = useState<ItemTimeline[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    timeline("dia").then((r) => setItens(r.itens)).catch(() => setErro(true));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="t-h1">Hoje</h1>

      {erro && <p className="t-sub">Sem conexão com o servidor agora.</p>}
      {itens && itens.length === 0 && (
        <Card style={{ background: "var(--surface-2)" }}>
          <p style={{ fontWeight: 700 }}>Ainda não há registros hoje.</p>
          <p className="t-small" style={{ marginTop: 4 }}>
            Comece por um check-in na tela inicial.
          </p>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {itens?.map((it) => {
          const evt = it.tipo_item === "evento" ? EVT[String(it.evento)] : null;
          const cor = evt?.c ?? "var(--primary)";
          return (
            <Card key={`${it.tipo_item}-${it.id}`} style={{ padding: 16, display: "flex",
              alignItems: "center", gap: 14 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: cor,
                flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>
                  {it.tipo_item === "checkin" && `Check-in · ${HUMOR_L[String(it.humor)] ?? ""}`}
                  {it.tipo_item === "evento" && `${evt?.l ?? "Momento"} · intensidade ${it.intensidade_1_5}`}
                  {it.tipo_item === "midia" && "Foto ou vídeo"}
                </div>
                <div className="t-small">{hora(String(it.quando))}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

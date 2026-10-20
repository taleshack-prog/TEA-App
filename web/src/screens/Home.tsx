/** Hoje — acolhe, mostra o próximo check-in e os caminhos principais.
 *  Para os pais, um cartão de Resumo (análise da IA) sempre à mão. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { IconPlus, IconCamera, IconResumo, IconGuia, IconExternal } from "../components/icons";

const DAPP_URL = "https://neuro-art-d-app.vercel.app/";
import { proximoHorario } from "../lib/alarmes";
import { pendentes } from "../lib/sync";
import { useAuth } from "../lib/auth";

const HORARIOS = ["08:00", "12:00", "17:00", "21:00"];

function proximo() {
  const c = HORARIOS.map((h) => ({ label: h, alvo: proximoHorario(h) }));
  c.sort((a, b) => a.alvo.getTime() - b.alvo.getTime());
  return c[0];
}
function faltam(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(m / 60);
  return h > 0 ? `em ${h}h${String(m % 60).padStart(2, "0")}` : `em ${m} min`;
}
function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export function Home() {
  const nav = useNavigate();
  const { perfil } = useAuth();
  const [alvo] = useState(proximo());
  const [agora, setAgora] = useState(Date.now());
  const [fila, setFila] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { void pendentes().then(setFila); }, [agora]);

  const primeiro = (perfil?.nome || "").split(" ")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="t-display">{saudacao()}{primeiro ? `, ${primeiro}` : ""}.</h1>
        <p className="t-sub" style={{ marginTop: 4 }}>Como ele está agora?</p>
      </div>

      <Card style={{ background: "var(--primary-tint)", display: "flex",
        alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div className="t-small" style={{ color: "var(--primary-dark)", fontWeight: 700 }}>
            Próximo check-in
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26,
            color: "var(--primary-dark)", fontWeight: 600 }}>
            {alvo.label} <span style={{ fontSize: 16 }}>· {faltam(alvo.alvo.getTime() - agora)}</span>
          </div>
        </div>
      </Card>

      <Button onClick={() => nav("/checkin")}>Registrar agora</Button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card onClick={() => nav("/evento")} style={{ padding: 18, display: "flex",
          flexDirection: "column", gap: 8 }}>
          <IconPlus /><span style={{ fontWeight: 800 }}>Aconteceu algo</span>
          <span className="t-small">Crise, euforia, um momento marcante</span>
        </Card>
        <Card onClick={() => nav("/album")} style={{ padding: 18, display: "flex",
          flexDirection: "column", gap: 8 }}>
          <IconCamera /><span style={{ fontWeight: 800 }}>Foto ou vídeo</span>
          <span className="t-small">Guarde uma imagem com um recado</span>
        </Card>
      </div>

      {perfil?.ve_analise_ia && (
        <Card onClick={() => nav("/resumo")} style={{ display: "flex",
          alignItems: "center", gap: 14, background: "var(--accent-tint)" }}>
          <div style={{ color: "#9a6a22" }}><IconResumo /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>Resumo da IA</div>
            <div className="t-small" style={{ color: "#9a6a22" }}>
              Padrões que apareceram nos registros
            </div>
          </div>
          <span style={{ color: "#9a6a22", fontWeight: 800, fontSize: 20 }}>›</span>
        </Card>
      )}

      <h2 className="t-h2" style={{ marginTop: 8 }}>Descubra</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Card onClick={() => nav("/guia")} style={{ display: "flex", gap: 14,
          alignItems: "center" }}>
          <div style={{ color: "var(--primary-dark)" }}><IconGuia /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>Como funciona</div>
            <div className="t-small" style={{ marginTop: 2 }}>O fluxo do app, passo a passo</div>
          </div>
          <span style={{ color: "var(--ink-soft)", fontWeight: 800, fontSize: 20 }}>›</span>
        </Card>

        <Card onClick={() => nav("/livro")} style={{ display: "flex", gap: 14,
          alignItems: "center" }}>
          <img src="/img/livro-capa.jpg" alt="Capa do livro Antifrágil Blindado"
            style={{ width: 48, height: 72, objectFit: "cover", borderRadius: 8,
              flexShrink: 0, boxShadow: "var(--shadow)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>Antifrágil Blindado</div>
            <div className="t-small" style={{ marginTop: 2 }}>O audiolivro, narrado</div>
          </div>
          <span style={{ color: "var(--ink-soft)", fontWeight: 800, fontSize: 20 }}>›</span>
        </Card>

        <a href={DAPP_URL} target="_blank" rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "inherit" }}>
          <Card style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 12,
              background: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "var(--shadow)" }}>
              <img src="/img/neuroart-logo.jpg" alt="NeuroArt DApp"
                style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 7 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>NeuroArt DApp</div>
              <div className="t-small" style={{ marginTop: 2 }}>Arte neurodivergente na web3</div>
            </div>
            <span style={{ color: "var(--ink-soft)" }}><IconExternal size={18} /></span>
          </Card>
        </a>
      </div>

      <p className="t-small" style={{ marginTop: 4 }}>
        {navigator.onLine ? "Tudo sincronizado." : "Você está offline — salvamos aqui e enviamos depois."}
        {fila > 0 && ` ${fila} registro(s) aguardando envio.`}
      </p>
    </div>
  );
}

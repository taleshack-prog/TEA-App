/** Guia — "Como funciona": manual curto do fluxo do app, do livro e da NeuroArt.
 *  Pensado para que qualquer cuidador entenda o caminho sem explicação externa. */
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui";
import { IconExternal, IconGuia } from "../components/icons";

const DAPP_URL = "https://neuro-art-d-app.vercel.app/";

const PASSOS = [
  { n: "1", t: "Check-in do momento", d: "Em “Hoje”, registre como ele está agora — humor, energia, sono. Leva segundos e é o alicerce de tudo." },
  { n: "2", t: "Aconteceu algo?", d: "Marque um momento marcante (uma crise, uma euforia, um pico de alegria), com o gatilho percebido e o que ajudou." },
  { n: "3", t: "Guarde no Álbum", d: "Uma foto, um vídeo ou um áudio junto de um recado: “o que ele quis dizer com isso”. É aqui que a expressão dele vira registro." },
  { n: "4", t: "Analise com a IA", d: "Nos registros dos pais, a IA oferece uma leitura possível do que a mídia pode comunicar — por hipótese, nunca diagnóstico." },
  { n: "5", t: "Veja o Resumo", d: "Com alguns dias de registros, o Resumo mostra padrões do período. Quanto mais você anota, mais honesta fica a leitura." },
];

export function Guia() {
  const nav = useNavigate();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--primary-dark)" }}>
        <IconGuia /><h1 className="t-h1" style={{ color: "var(--primary-dark)" }}>Como funciona</h1>
      </div>

      <Card style={{ background: "var(--primary-tint)" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.55 }}>
          O Ponte Visual é uma ponte de comunicação, não um leitor de mentes.
        </p>
        <p style={{ marginTop: 10 }}>
          Ele reúne o dia a dia e o que a criança produz e compartilha, e ajuda os
          cuidadores a enxergar o que aquilo pode estar comunicando. A criança é a
          autora; o app só ajuda a entender — sempre em linguagem de hipótese.
        </p>
      </Card>

      <h2 className="t-h2">O fluxo do dia</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PASSOS.map((p) => (
          <Card key={p.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
              background: "var(--primary-tint)", color: "var(--primary-dark)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 700 }}>{p.n}</span>
            <div>
              <div style={{ fontWeight: 800 }}>{p.t}</div>
              <div className="t-small" style={{ marginTop: 3, lineHeight: 1.5 }}>{p.d}</div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="t-h2" style={{ marginTop: 4 }}>Quem vê o quê</h2>
      <Card>
        <p style={{ lineHeight: 1.6 }}>
          <strong>Mãe e pai</strong> veem a análise da IA e o Resumo — são quem conhece
          o contexto completo. <strong>Avó, tias e amigos</strong> contribuem com o que
          percebem ao receber a arte. Essa separação é de propósito: cada olhar entra
          sem ser “contaminado” pelo outro, e é isso que, lá na frente, permite medir se
          a comunicação está chegando como ele quis dizer.
        </p>
      </Card>

      <h2 className="t-h2" style={{ marginTop: 4 }}>Mais no app</h2>

      <Card onClick={() => nav("/livro")} style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <img src="/img/livro-capa.jpg" alt="Capa do livro Antifrágil Blindado"
          style={{ width: 54, height: 81, objectFit: "cover", borderRadius: 8,
            flexShrink: 0, boxShadow: "var(--shadow)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Antifrágil Blindado</div>
          <div className="t-small" style={{ marginTop: 2 }}>
            O audiolivro, narrado — guia para famílias neurodivergentes.
          </div>
        </div>
        <span style={{ color: "var(--ink-soft)", fontWeight: 800, fontSize: 20 }}>›</span>
      </Card>

      <a href={DAPP_URL} target="_blank" rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit" }}>
        <Card style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 54, height: 54, flexShrink: 0, borderRadius: 12,
            background: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "var(--shadow)" }}>
            <img src="/img/neuroart-logo.jpg" alt="NeuroArt DApp"
              style={{ width: 46, height: 46, objectFit: "contain", borderRadius: 8 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>NeuroArt DApp</div>
            <div className="t-small" style={{ marginTop: 2 }}>
              O projeto de arte neurodivergente na web3. Abre em nova aba.
            </div>
          </div>
          <span style={{ color: "var(--ink-soft)" }}><IconExternal size={18} /></span>
        </Card>
      </a>

      <Card style={{ background: "var(--surface-2)" }}>
        <h2 className="t-h2" style={{ marginBottom: 8 }}>Privacidade e respeito</h2>
        <p className="t-small" style={{ lineHeight: 1.6 }}>
          Os dados são da criança e da família. Ela é a autora da própria expressão;
          o app é uma ponte, nunca um diagnóstico. As leituras são sempre hipóteses,
          para serem conversadas — não conclusões sobre quem ele é.
        </p>
      </Card>
    </div>
  );
}

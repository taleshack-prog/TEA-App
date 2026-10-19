/** Biblioteca — audiolivro "Antifrágil Blindado".
 *  Voz do navegador (Web Speech API): grátis, offline, sem custo de API.
 *  A frase sendo lida fica destacada. Quando escalar, trocamos por ElevenLabs. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Button } from "../components/ui";
import { IconBook, IconPlay, IconPause, IconStop, IconBack } from "../components/icons";
import livro from "../data/livro.json";

type Capitulo = { id: number; titulo: string; texto: string };
const CAPITULOS = livro.capitulos as Capitulo[];

/** Quebra o texto em frases para ler uma de cada vez (destaque + limite de voz). */
function emFrases(texto: string): string[] {
  const limpo = texto.replace(/\s+/g, " ").trim();
  const bruto = limpo.match(/[^.!?…]+[.!?…]+|\S[^.!?…]*$/g) ?? [limpo];
  // Junta fragmentos muito curtos ao anterior (ex.: "Dr.", siglas).
  const frases: string[] = [];
  for (const f of bruto) {
    const t = f.trim();
    if (!t) continue;
    if (frases.length && (t.length < 12 || frases[frases.length - 1].length < 12)) {
      frases[frases.length - 1] += " " + t;
    } else frases.push(t);
  }
  return frases;
}

const temVoz = typeof window !== "undefined" && "speechSynthesis" in window;

export function Biblioteca() {
  const [abertoId, setAbertoId] = useState<number | null>(null);
  const cap = CAPITULOS.find((c) => c.id === abertoId) ?? null;

  if (cap) return <Leitor cap={cap} aoVoltar={() => setAbertoId(null)} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--primary-dark)" }}>
        <IconBook /><h1 className="t-h1" style={{ color: "var(--primary-dark)" }}>Biblioteca</h1>
      </div>

      <Card style={{ background: "var(--primary-tint)" }}>
        <h2 className="t-h2" style={{ color: "var(--primary-dark)" }}>{livro.titulo}</h2>
        <p className="t-sub" style={{ marginTop: 4 }}>{livro.subtitulo}</p>
        <p className="t-small" style={{ marginTop: 12 }}>
          Audiolivro narrado pela voz do aparelho. Toque num capítulo para ouvir.
        </p>
      </Card>

      {!temVoz && (
        <Card style={{ background: "var(--surface-2)" }}>
          <p className="t-sub">
            Este navegador não oferece narração por voz. Você ainda pode ler o texto
            dos capítulos normalmente.
          </p>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CAPITULOS.map((c) => (
          <button key={c.id} onClick={() => setAbertoId(c.id)}
            style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--line)",
              background: "var(--surface)", borderRadius: "var(--r)", padding: "16px 18px",
              display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "50%",
              background: "var(--primary-tint)", color: "var(--primary-dark)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 700 }}>
              {c.id === 0 ? "★" : c.id}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontWeight: 700 }}>{c.titulo}</span>
              <span className="t-small">{Math.max(1, Math.round(c.texto.length / 950))} min de leitura</span>
            </span>
            <IconPlay size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Leitor({ cap, aoVoltar }: { cap: Capitulo; aoVoltar: () => void }) {
  const frases = useMemo(() => emFrases(cap.texto), [cap.texto]);
  const [tocando, setTocando] = useState(false);
  const [atual, setAtual] = useState(-1);
  const [velocidade, setVelocidade] = useState(1);
  const vozRef = useRef<SpeechSynthesisVoice | null>(null);
  const idxRef = useRef(0);
  const velRef = useRef(1);
  const pararRef = useRef(false);

  useEffect(() => { velRef.current = velocidade; }, [velocidade]);

  // Escolhe uma voz pt-BR assim que a lista estiver disponível.
  useEffect(() => {
    if (!temVoz) return;
    const escolher = () => {
      const vs = window.speechSynthesis.getVoices();
      vozRef.current =
        vs.find((v) => v.lang?.toLowerCase() === "pt-br") ||
        vs.find((v) => v.lang?.toLowerCase().startsWith("pt")) || null;
    };
    escolher();
    window.speechSynthesis.onvoiceschanged = escolher;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Ao trocar de capítulo ou sair, zera e silencia.
  useEffect(() => {
    return () => { if (temVoz) { pararRef.current = true; window.speechSynthesis.cancel(); } };
  }, []);

  function falarDe(i: number) {
    if (!temVoz || i >= frases.length) { pararTudo(); return; }
    pararRef.current = false;
    idxRef.current = i;
    setAtual(i);
    const u = new SpeechSynthesisUtterance(frases[i]);
    u.lang = "pt-BR";
    if (vozRef.current) u.voice = vozRef.current;
    u.rate = velRef.current;
    u.onend = () => {
      if (pararRef.current) return;
      falarDe(idxRef.current + 1);
    };
    u.onerror = () => { if (!pararRef.current) setTocando(false); };
    window.speechSynthesis.speak(u);
  }

  function play() {
    if (!temVoz) return;
    window.speechSynthesis.cancel();
    setTocando(true);
    falarDe(idxRef.current < 0 || idxRef.current >= frases.length ? 0 : idxRef.current);
  }
  function pausar() {
    if (!temVoz) return;
    pararRef.current = true;
    window.speechSynthesis.cancel();
    setTocando(false);
  }
  function pararTudo() {
    if (temVoz) { pararRef.current = true; window.speechSynthesis.cancel(); }
    setTocando(false);
    idxRef.current = 0;
    setAtual(-1);
  }

  // Reinicia a frase atual quando muda a velocidade durante a leitura.
  function mudarVelocidade(v: number) {
    setVelocidade(v);
    if (tocando) {
      window.speechSynthesis.cancel();
      // pequeno atraso para a fila esvaziar antes de reiniciar
      setTimeout(() => falarDe(idxRef.current), 60);
    }
  }

  const VELS = [0.8, 1, 1.25, 1.5];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button onClick={() => { pararTudo(); aoVoltar(); }}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none",
          border: "none", cursor: "pointer", color: "var(--ink-soft)", fontWeight: 600,
          padding: 0 }}>
        <IconBack size={20} /> Biblioteca
      </button>

      <h1 className="t-h1" style={{ fontSize: 24 }}>{cap.titulo}</h1>

      {/* Controles de narração */}
      <Card style={{ position: "sticky", top: 8, zIndex: 5,
        background: "var(--primary-tint)" }}>
        {temVoz ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {tocando
                ? <Button onClick={pausar} full={false}>
                    <IconPause size={18} /> Pausar
                  </Button>
                : <Button onClick={play} full={false}>
                    <IconPlay size={18} /> {atual >= 0 ? "Continuar" : "Ouvir"}
                  </Button>}
              <button onClick={pararTudo} title="Parar"
                style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44, borderRadius: "var(--r)", cursor: "pointer",
                  border: "1px solid var(--line)", background: "var(--surface)",
                  color: "var(--ink-soft)" }}>
                <IconStop size={18} />
              </button>
              <div style={{ flex: 1, textAlign: "right" }} className="t-small">
                {atual >= 0 ? `${atual + 1} de ${frases.length}` : `${frases.length} trechos`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <span className="t-small">Velocidade</span>
              {VELS.map((v) => (
                <button key={v} onClick={() => mudarVelocidade(v)}
                  style={{ cursor: "pointer", padding: "5px 11px", borderRadius: "var(--r-pill)",
                    border: "1px solid " + (velocidade === v ? "var(--primary)" : "var(--line)"),
                    background: velocidade === v ? "var(--primary)" : "var(--surface)",
                    color: velocidade === v ? "#fff" : "var(--ink-soft)",
                    fontWeight: 700, fontSize: 13 }}>
                  {v}×
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="t-sub">Narração por voz indisponível neste navegador — texto abaixo.</p>
        )}
      </Card>

      {/* Texto com a frase atual destacada */}
      <Card>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.7 }}>
          {frases.map((f, i) => (
            <span key={i}
              onClick={() => { idxRef.current = i; if (tocando) { window.speechSynthesis.cancel(); setTimeout(() => falarDe(i), 60); } else setAtual(i); }}
              style={{ cursor: "pointer",
                background: i === atual ? "var(--accent)" : "transparent",
                color: i === atual ? "#2c2a27" : "inherit",
                borderRadius: 4, padding: "0 2px",
                boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
              {f}{" "}
            </span>
          ))}
        </p>
      </Card>
    </div>
  );
}

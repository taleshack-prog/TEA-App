/** Biblioteca — audiolivro "Antifrágil Blindado".
 *  Primário: MP3 narrado (Google TTS), servido de /audio/cap-<id>.mp3.
 *  Fallback: voz do navegador (Web Speech API) quando o MP3 ainda não existe.
 *  Os textos ficam sempre visíveis para leitura. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Button, inputStyle } from "../components/ui";
import { IconBook, IconPlay, IconPause, IconStop, IconBack, IconResumo } from "../components/icons";
import { perguntarLivro, type RespostaLivro } from "../lib/api";
import livro from "../data/livro.json";

type Capitulo = { id: number; titulo: string; texto: string };
const CAPITULOS = livro.capitulos as Capitulo[];

const mmss = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
};

function paragrafos(texto: string): string[] {
  const ps = texto.split(/\n{2,}/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  return ps.length ? ps : [texto.replace(/\s+/g, " ").trim()];
}

const VELS = [0.8, 1, 1.25, 1.5];

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
          Audiolivro narrado. Toque num capítulo para ouvir e acompanhar o texto.
        </p>
      </Card>

      <PergunteAoLivro />

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
              <span className="t-small">
                {Math.max(1, Math.round(c.texto.length / 950))} min de leitura
              </span>
            </span>
            <IconPlay size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Pergunte ao livro: ajuda da IA sobre o conteúdo ---------- */
function PergunteAoLivro() {
  const [pergunta, setPergunta] = useState("");
  const [resp, setResp] = useState<RespostaLivro | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (pergunta.trim().length < 3) return;
    setCarregando(true); setResp(null);
    try { setResp(await perguntarLivro(pergunta)); }
    catch { setResp({ configurada: true, resposta: "Não consegui responder agora.", capitulos: [] }); }
    setCarregando(false);
  }

  return (
    <Card style={{ background: "var(--accent-tint)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
        color: "#9a6a22" }}>
        <IconResumo /><h2 className="t-h2" style={{ color: "#9a6a22" }}>Pergunte ao livro</h2>
      </div>
      <p className="t-small" style={{ marginBottom: 10 }}>
        Uma dúvida sobre o dia a dia? A IA responde com base no livro, citando o capítulo.
      </p>
      <textarea value={pergunta} onChange={(e) => setPergunta(e.target.value)} rows={2}
        placeholder="Ex.: como ajudar numa crise sensorial?"
        style={{ ...inputStyle, height: "auto", padding: 12, resize: "vertical",
          background: "var(--surface)" }} />
      <div style={{ marginTop: 10 }}>
        <Button full={false} disabled={carregando} onClick={enviar}>
          {carregando ? "Procurando no livro…" : "Perguntar"}
        </Button>
      </div>

      {resp && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 17, lineHeight: 1.55,
            whiteSpace: "pre-wrap" }}>{resp.resposta}</p>
          {resp.capitulos?.length > 0 && (
            <p className="t-small" style={{ marginTop: 10 }}>
              Do livro: {resp.capitulos.join(" · ")}
            </p>
          )}
          {resp.configurada === false && (
            <p className="t-small" style={{ marginTop: 8, color: "#9a6a22" }}>
              Ative a chave da IA no servidor para usar esta ajuda.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/* ---------- Leitor: tenta MP3; se faltar, usa a voz do navegador ---------- */
function Leitor({ cap, aoVoltar }: { cap: Capitulo; aoVoltar: () => void }) {
  const [semMp3, setSemMp3] = useState(false);
  return semMp3
    ? <LeitorFala cap={cap} aoVoltar={aoVoltar} />
    : <LeitorAudio cap={cap} aoVoltar={aoVoltar} aoFalhar={() => setSemMp3(true)} />;
}

const Cabecalho = ({ cap, aoVoltar }: { cap: Capitulo; aoVoltar: () => void }) => (
  <>
    <button onClick={aoVoltar}
      style={{ display: "flex", alignItems: "center", gap: 6, background: "none",
        border: "none", cursor: "pointer", color: "var(--ink-soft)", fontWeight: 600, padding: 0 }}>
      <IconBack size={20} /> Biblioteca
    </button>
    <h1 className="t-h1" style={{ fontSize: 24 }}>{cap.titulo}</h1>
  </>
);

const TextoCap = ({ texto }: { texto: string }) => (
  <Card>
    {paragrafos(texto).map((p, i) => (
      <p key={i} style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.7,
        marginBottom: 14 }}>{p}</p>
    ))}
  </Card>
);

function LeitorAudio({ cap, aoVoltar, aoFalhar }:
  { cap: Capitulo; aoVoltar: () => void; aoFalhar: () => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [vel, setVel] = useState(1);
  const src = `/audio/cap-${cap.id}.mp3`;

  useEffect(() => { if (ref.current) ref.current.playbackRate = vel; }, [vel]);

  function toggle() {
    const a = ref.current; if (!a) return;
    if (a.paused) a.play().catch(aoFalhar); else a.pause();
  }
  function parar() {
    const a = ref.current; if (!a) return;
    a.pause(); a.currentTime = 0; setT(0);
  }
  function buscar(v: number) {
    const a = ref.current; if (!a) return;
    a.currentTime = v; setT(v);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Cabecalho cap={cap} aoVoltar={aoVoltar} />

      <audio ref={ref} src={src} preload="metadata"
        onLoadedMetadata={(e) => { setDur(e.currentTarget.duration); e.currentTarget.playbackRate = vel; }}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => { setTocando(false); setT(0); }}
        onError={aoFalhar} />

      <Card style={{ position: "sticky", top: 8, zIndex: 5, background: "var(--primary-tint)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button onClick={toggle} full={false}>
            {tocando ? <><IconPause size={18} /> Pausar</> : <><IconPlay size={18} /> Ouvir</>}
          </Button>
          <button onClick={parar} title="Voltar ao início"
            style={{ display: "flex", alignItems: "center", justifyContent: "center",
              width: 44, height: 44, borderRadius: "var(--r)", cursor: "pointer",
              border: "1px solid var(--line)", background: "var(--surface)",
              color: "var(--ink-soft)" }}>
            <IconStop size={18} />
          </button>
          <span className="t-small" style={{ flex: 1, textAlign: "right" }}>
            {mmss(t)} / {mmss(dur)}
          </span>
        </div>

        <input type="range" min={0} max={dur || 0} step={0.1} value={t}
          onChange={(e) => buscar(Number(e.target.value))}
          style={{ width: "100%", marginTop: 14, accentColor: "var(--primary)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <span className="t-small">Velocidade</span>
          {VELS.map((v) => (
            <button key={v} onClick={() => setVel(v)}
              style={{ cursor: "pointer", padding: "5px 11px", borderRadius: "var(--r-pill)",
                border: "1px solid " + (vel === v ? "var(--primary)" : "var(--line)"),
                background: vel === v ? "var(--primary)" : "var(--surface)",
                color: vel === v ? "#fff" : "var(--ink-soft)", fontWeight: 700, fontSize: 13 }}>
              {v}×
            </button>
          ))}
        </div>
      </Card>

      <TextoCap texto={cap.texto} />
    </div>
  );
}

/* ---------- Fallback: voz do navegador, frase a frase, com destaque ---------- */
const temVoz = typeof window !== "undefined" && "speechSynthesis" in window;

function emFrases(texto: string): string[] {
  const limpo = texto.replace(/\s+/g, " ").trim();
  const bruto = limpo.match(/[^.!?…]+[.!?…]+|\S[^.!?…]*$/g) ?? [limpo];
  const out: string[] = [];
  for (const f of bruto) {
    const x = f.trim();
    if (!x) continue;
    if (out.length && (x.length < 12 || out[out.length - 1].length < 12)) out[out.length - 1] += " " + x;
    else out.push(x);
  }
  return out;
}

function LeitorFala({ cap, aoVoltar }: { cap: Capitulo; aoVoltar: () => void }) {
  const frases = useMemo(() => emFrases(cap.texto), [cap.texto]);
  const [tocando, setTocando] = useState(false);
  const [atual, setAtual] = useState(-1);
  const [vel, setVel] = useState(1);
  const vozRef = useRef<SpeechSynthesisVoice | null>(null);
  const idxRef = useRef(0);
  const velRef = useRef(1);
  const pararRef = useRef(false);

  useEffect(() => { velRef.current = vel; }, [vel]);

  useEffect(() => {
    if (!temVoz) return;
    const escolher = () => {
      const vs = window.speechSynthesis.getVoices();
      vozRef.current = vs.find((v) => v.lang?.toLowerCase() === "pt-br")
        || vs.find((v) => v.lang?.toLowerCase().startsWith("pt")) || null;
    };
    escolher();
    window.speechSynthesis.onvoiceschanged = escolher;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => () => { if (temVoz) { pararRef.current = true; window.speechSynthesis.cancel(); } }, []);

  function falarDe(i: number) {
    if (!temVoz || i >= frases.length) { pararTudo(); return; }
    pararRef.current = false; idxRef.current = i; setAtual(i);
    const u = new SpeechSynthesisUtterance(frases[i]);
    u.lang = "pt-BR";
    if (vozRef.current) u.voice = vozRef.current;
    u.rate = velRef.current;
    u.onend = () => { if (!pararRef.current) falarDe(idxRef.current + 1); };
    u.onerror = () => { if (!pararRef.current) setTocando(false); };
    window.speechSynthesis.speak(u);
  }
  function play() {
    if (!temVoz) return;
    window.speechSynthesis.cancel(); setTocando(true);
    falarDe(idxRef.current < 0 || idxRef.current >= frases.length ? 0 : idxRef.current);
  }
  function pausar() { if (temVoz) { pararRef.current = true; window.speechSynthesis.cancel(); } setTocando(false); }
  function pararTudo() {
    if (temVoz) { pararRef.current = true; window.speechSynthesis.cancel(); }
    setTocando(false); idxRef.current = 0; setAtual(-1);
  }
  function mudarVel(v: number) {
    setVel(v);
    if (tocando) { window.speechSynthesis.cancel(); setTimeout(() => falarDe(idxRef.current), 60); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Cabecalho cap={cap} aoVoltar={() => { pararTudo(); aoVoltar(); }} />

      <Card style={{ position: "sticky", top: 8, zIndex: 5, background: "var(--primary-tint)" }}>
        {temVoz ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {tocando
                ? <Button onClick={pausar} full={false}><IconPause size={18} /> Pausar</Button>
                : <Button onClick={play} full={false}><IconPlay size={18} /> {atual >= 0 ? "Continuar" : "Ouvir"}</Button>}
              <button onClick={pararTudo} title="Parar"
                style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44, borderRadius: "var(--r)", cursor: "pointer",
                  border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-soft)" }}>
                <IconStop size={18} />
              </button>
              <span className="t-small" style={{ flex: 1, textAlign: "right" }}>
                {atual >= 0 ? `${atual + 1} de ${frases.length}` : `${frases.length} trechos`}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <span className="t-small">Velocidade</span>
              {VELS.map((v) => (
                <button key={v} onClick={() => mudarVel(v)}
                  style={{ cursor: "pointer", padding: "5px 11px", borderRadius: "var(--r-pill)",
                    border: "1px solid " + (vel === v ? "var(--primary)" : "var(--line)"),
                    background: vel === v ? "var(--primary)" : "var(--surface)",
                    color: vel === v ? "#fff" : "var(--ink-soft)", fontWeight: 700, fontSize: 13 }}>
                  {v}×
                </button>
              ))}
            </div>
            <p className="t-small" style={{ marginTop: 12, color: "var(--primary-dark)" }}>
              Narração offline pela voz do aparelho (o áudio gravado aparece quando publicado).
            </p>
          </>
        ) : <p className="t-sub">Narração por voz indisponível neste navegador — texto abaixo.</p>}
      </Card>

      <Card>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.7 }}>
          {frases.map((f, i) => (
            <span key={i}
              onClick={() => { idxRef.current = i;
                if (tocando) { window.speechSynthesis.cancel(); setTimeout(() => falarDe(i), 60); }
                else setAtual(i); }}
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

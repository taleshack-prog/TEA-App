/** Álbum (T9) — fotos, vídeos e áudios com descrição ("o que ele quis dizer").
 *  Para os pais, cada item tem "Analisar com IA": uma leitura por hipótese do
 *  que a criança pode estar comunicando (visão para imagem/vídeo, transcrição
 *  para áudio). Há também um campo para analisar um texto escrito. */
import { useEffect, useRef, useState } from "react";
import { Button, Card, inputStyle } from "../components/ui";
import { IconCamera, IconPlay, IconResumo } from "../components/icons";
import { useAuth } from "../lib/auth";
import {
  analisarMidia, analisarTexto, arquivoBlobUrl, listarMidias, patchMidia,
  uploadMidia, type AnaliseMidia, type Midia,
} from "../lib/api";

function tipoDoArquivo(f: File): "video" | "audio" | "foto" {
  if (f.type.startsWith("video")) return "video";
  if (f.type.startsWith("audio")) return "audio";
  return "foto";
}

export function Album() {
  const { perfil } = useAuth();
  const ehPai = !!perfil?.ve_analise_ia;
  const [itens, setItens] = useState<Midia[]>([]);
  const [blobs, setBlobs] = useState<Record<number, string>>({});
  const [carregando, setCarregando] = useState(true);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function carregarBlob(id: number) {
    try { const u = await arquivoBlobUrl(id); setBlobs((b) => ({ ...b, [id]: u })); }
    catch { /* ignora item que falhar */ }
  }

  useEffect(() => {
    listarMidias()
      .then((lista) => { setItens(lista); lista.forEach((m) => carregarBlob(m.id)); })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setArquivo(f);
    setPreview(URL.createObjectURL(f));
    setDesc("");
  }

  async function guardar() {
    if (!arquivo) return;
    setSalvando(true);
    try {
      const nova = await uploadMidia(arquivo, tipoDoArquivo(arquivo), desc);
      setItens((xs) => [nova, ...xs]);
      await carregarBlob(nova.id);
      setArquivo(null); setPreview(null); setDesc("");
      if (inputRef.current) inputRef.current.value = "";
    } catch { /* mantém para tentar de novo */ }
    setSalvando(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 className="t-h1">Álbum</h1>
        <p className="t-sub" style={{ marginTop: 2 }}>
          Guarde uma foto, vídeo ou áudio com o que você entendeu.
        </p>
      </div>

      <input ref={inputRef} type="file" accept="image/*,video/*,audio/*"
        onChange={escolher} style={{ display: "none" }} />

      {!arquivo && (
        <Button variant="soft" onClick={() => inputRef.current?.click()}>
          <IconCamera size={20} /> Adicionar foto, vídeo ou áudio
        </Button>
      )}

      {arquivo && preview && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Previa tipo={tipoDoArquivo(arquivo)} url={preview} />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
            placeholder="O que ele quis dizer com isso? O que é essa imagem/som?"
            style={{ ...inputStyle, height: "auto", padding: 14, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="ghost" full={false} onClick={() => {
              setArquivo(null); setPreview(null);
              if (inputRef.current) inputRef.current.value = "";
            }}>Cancelar</Button>
            <Button disabled={salvando} onClick={guardar}>
              {salvando ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </Card>
      )}

      {ehPai && <AnalisarTexto />}

      {carregando && <p className="t-sub">Abrindo o álbum…</p>}
      {!carregando && itens.length === 0 && !arquivo && (
        <Card style={{ background: "var(--surface-2)" }}>
          <p style={{ fontWeight: 700 }}>O álbum está vazio.</p>
          <p className="t-small" style={{ marginTop: 4 }}>
            Adicione a primeira foto, vídeo ou áudio com um recado.
          </p>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {itens.map((m) => (
          <ItemMidia key={m.id} midia={m} url={blobs[m.id]} ehPai={ehPai} />
        ))}
      </div>
    </div>
  );
}

function Previa({ tipo, url }: { tipo: string; url: string }) {
  if (tipo === "video") return <video src={url} controls style={midiaStyle} />;
  if (tipo === "audio") return <audio src={url} controls style={{ width: "100%" }} />;
  return <img src={url} alt="prévia" style={midiaStyle} />;
}

function ItemMidia({ midia, url, ehPai }:
  { midia: Midia; url?: string; ehPai: boolean }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(midia.descricao ?? "");
  const [salvando, setSalvando] = useState(false);

  const [leitura, setLeitura] = useState<AnaliseMidia | null>(null);
  const [analisando, setAnalisando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try { await patchMidia(midia.id, texto); setEditando(false); }
    catch { /* ignora */ }
    setSalvando(false);
  }

  async function analisar() {
    setAnalisando(true); setLeitura(null);
    try { setLeitura(await analisarMidia(midia.id)); }
    catch { setLeitura({ configurada: true, suficiente: false, hipoteses: [],
      leitura: "Não consegui falar com a IA agora." }); }
    setAnalisando(false);
  }

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ background: "var(--surface-2)", position: "relative" }}>
        {url ? (
          midia.tipo === "video" ? <video src={url} controls style={midiaStyle} />
          : midia.tipo === "audio" ? (
            <div style={{ padding: 16 }}><audio src={url} controls style={{ width: "100%" }} /></div>
          ) : <img src={url} alt={midia.descricao ?? "mídia"} style={midiaStyle} />
        ) : (
          <div style={{ height: 120, display: "flex", alignItems: "center",
            justifyContent: "center", color: "var(--ink-soft)" }}>
            {midia.tipo === "foto" ? <IconCamera /> : <IconPlay />}
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {editando ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2}
              style={{ ...inputStyle, height: "auto", padding: 12, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" full={false} onClick={() => setEditando(false)}>Cancelar</Button>
              <Button full={false} disabled={salvando} onClick={salvar}>Salvar</Button>
            </div>
          </div>
        ) : (
          <div onClick={() => setEditando(true)} style={{ cursor: "pointer" }}>
            <p style={{ fontWeight: midia.descricao ? 600 : 400,
              color: midia.descricao ? "var(--ink)" : "var(--ink-soft)" }}>
              {midia.descricao || "Toque para descrever o que é / o que ele quis dizer."}
            </p>
            <p className="t-small" style={{ marginTop: 4 }}>
              {new Date(midia.criado_em).toLocaleString("pt-BR",
                { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}

        {ehPai && (
          <div style={{ marginTop: 14 }}>
            <Button variant="soft" full={false} disabled={analisando} onClick={analisar}>
              <IconResumo size={18} /> {analisando ? "Lendo…" : "Analisar com IA"}
            </Button>
            {leitura && <LeituraMidiaCard a={leitura} />}
          </div>
        )}
      </div>
    </Card>
  );
}

function AnalisarTexto() {
  const [texto, setTexto] = useState("");
  const [leitura, setLeitura] = useState<AnaliseMidia | null>(null);
  const [analisando, setAnalisando] = useState(false);

  async function analisar() {
    if (texto.trim().length < 3) return;
    setAnalisando(true); setLeitura(null);
    try { setLeitura(await analisarTexto(texto)); }
    catch { setLeitura({ configurada: true, suficiente: false, hipoteses: [],
      leitura: "Não consegui falar com a IA agora." }); }
    setAnalisando(false);
  }

  return (
    <Card style={{ background: "var(--primary-tint)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
        color: "var(--primary-dark)" }}>
        <IconResumo /><h2 className="t-h2" style={{ color: "var(--primary-dark)" }}>Analisar um texto</h2>
      </div>
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3}
        placeholder="Escreva um recado, uma fala, algo que ele expressou…"
        style={{ ...inputStyle, height: "auto", padding: 14, resize: "vertical",
          background: "var(--surface)" }} />
      <div style={{ marginTop: 10 }}>
        <Button full={false} disabled={analisando} onClick={analisar}>
          {analisando ? "Lendo…" : "Analisar"}
        </Button>
      </div>
      {leitura && <LeituraMidiaCard a={leitura} />}
    </Card>
  );
}

function LeituraMidiaCard({ a }: { a: AnaliseMidia }) {
  return (
    <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 17, lineHeight: 1.5 }}>
        {a.leitura}
      </p>

      {a.transcricao && (
        <p className="t-small" style={{ marginTop: 10, fontStyle: "italic" }}>
          Transcrição: “{a.transcricao}”
        </p>
      )}

      {a.hipoteses?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {a.hipoteses.map((h, i) => (
            <div key={i} style={{ borderLeft: "3px solid var(--primary)", paddingLeft: 12 }}>
              <p style={{ fontWeight: 600 }}>{h.texto}</p>
              {h.apoia_se_em && (
                <p className="t-small" style={{ marginTop: 3 }}>Apoia-se em: {h.apoia_se_em}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1, height: 7, background: "var(--surface-2)",
                  borderRadius: "var(--r-pill)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((h.confianca || 0) * 100)}%`,
                    height: "100%", background: "var(--primary)" }} />
                </div>
                <span className="t-small">{Math.round((h.confianca || 0) * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="t-small" style={{ marginTop: 12, color: "var(--primary-dark)" }}>
        É uma leitura por hipótese, não um diagnóstico.
        {a.configurada === false && " Ative a chave da IA no servidor para leituras completas."}
      </p>
    </div>
  );
}

const midiaStyle: React.CSSProperties = {
  width: "100%", maxHeight: 300, objectFit: "cover", display: "block",
  background: "var(--surface-2)",
};

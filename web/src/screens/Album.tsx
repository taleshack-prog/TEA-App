/** Álbum (T9) — fotos e vídeos com descrição. Guarda uma imagem/vídeo junto do
 *  recado: "o que ele quis dizer com isso". */
import { useEffect, useRef, useState } from "react";
import { Button, Card, inputStyle } from "../components/ui";
import { IconCamera, IconPlay } from "../components/icons";
import {
  arquivoBlobUrl, listarMidias, patchMidia, uploadMidia, type Midia,
} from "../lib/api";

export function Album() {
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
    const tipo = arquivo.type.startsWith("video") ? "video" : "foto";
    try {
      const nova = await uploadMidia(arquivo, tipo, desc);
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
          Guarde uma foto ou vídeo com o que você entendeu dela.
        </p>
      </div>

      <input ref={inputRef} type="file" accept="image/*,video/*"
        onChange={escolher} style={{ display: "none" }} />

      {!arquivo && (
        <Button variant="soft" onClick={() => inputRef.current?.click()}>
          <IconCamera size={20} /> Adicionar foto ou vídeo
        </Button>
      )}

      {arquivo && preview && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {arquivo.type.startsWith("video")
            ? <video src={preview} controls style={midiaStyle} />
            : <img src={preview} alt="prévia" style={midiaStyle} />}
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
            placeholder="O que ele quis dizer com isso? O que é essa imagem?"
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

      {carregando && <p className="t-sub">Abrindo o álbum…</p>}
      {!carregando && itens.length === 0 && !arquivo && (
        <Card style={{ background: "var(--surface-2)" }}>
          <p style={{ fontWeight: 700 }}>O álbum está vazio.</p>
          <p className="t-small" style={{ marginTop: 4 }}>
            Adicione a primeira foto ou vídeo com um recado.
          </p>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {itens.map((m) => (
          <ItemMidia key={m.id} midia={m} url={blobs[m.id]} />
        ))}
      </div>
    </div>
  );
}

function ItemMidia({ midia, url }: { midia: Midia; url?: string }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(midia.descricao ?? "");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try { await patchMidia(midia.id, texto); setEditando(false); }
    catch { /* ignora */ }
    setSalvando(false);
  }

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ background: "var(--surface-2)", position: "relative" }}>
        {url ? (
          midia.tipo === "video"
            ? <video src={url} controls style={midiaStyle} />
            : <img src={url} alt={midia.descricao ?? "mídia"} style={midiaStyle} />
        ) : (
          <div style={{ height: 180, display: "flex", alignItems: "center",
            justifyContent: "center", color: "var(--ink-soft)" }}>
            {midia.tipo === "video" ? <IconPlay /> : <IconCamera />}
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
      </div>
    </Card>
  );
}

const midiaStyle: React.CSSProperties = {
  width: "100%", maxHeight: 300, objectFit: "cover", display: "block",
  background: "var(--surface-2)",
};

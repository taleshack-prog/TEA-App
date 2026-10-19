/** Cadastro — cria a conta e já entra. Os cuidadores se cadastram aqui com
 *  e-mail e senha próprios (nada de credencial fixa). O papel escolhido define
 *  o RBAC: só Mãe/Pai veem a análise da IA. */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SpectrumBar } from "../components/SpectrumBar";
import { Button, Campo } from "../components/ui";
import { useAuth } from "../lib/auth";
import { ApiError, registrar } from "../lib/api";

const PAPEIS = [
  { label: "Mãe", papel: "mae", tipo: "nucleo", ve: true },
  { label: "Pai", papel: "pai", tipo: "nucleo", ve: true },
  { label: "Amigo da família", papel: "amigo_familia", tipo: "nucleo", ve: false },
  { label: "Avó", papel: "avo", tipo: "periferia", ve: false },
  { label: "Tia", papel: "tia", tipo: "periferia", ve: false },
  { label: "Amigo do pai", papel: "amigo_pai", tipo: "periferia", ve: false },
];

export function Register() {
  const { entrar } = useAuth();
  const nav = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [idx, setIdx] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (idx === null) {
      setErro("Escolha quem é você.");
      return;
    }
    setErro(null);
    setCarregando(true);
    const p = PAPEIS[idx];
    try {
      await registrar({
        nome: nome.trim(),
        papel: p.papel,
        tipo: p.tipo,
        ve_analise_ia: p.ve,
        email: email.trim(),
        senha,
      });
      await entrar(email.trim(), senha); // entra direto após cadastrar
      nav("/");
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 409
          ? "Esse e-mail já tem cadastro. Faça login."
          : "Não foi possível criar a conta.",
      );
      setCarregando(false);
    }
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column",
                  background: "var(--bg)" }}>
      <SpectrumBar />
      <form onSubmit={submeter}
            style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22,
                     justifyContent: "center", padding: 24, maxWidth: 440,
                     width: "100%", margin: "0 auto" }}>
        <div>
          <h1 className="t-h1">Criar conta</h1>
          <p className="t-label" style={{ marginTop: 6 }}>Ponte Visual</p>
        </div>

        <Campo titulo="Quem é você?">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
                        background: "var(--hairline)", border: "1px solid var(--hairline)" }}>
            {PAPEIS.map((p, i) => {
              const sel = idx === i;
              return (
                <button type="button" key={p.papel} onClick={() => setIdx(i)}
                  style={{ minHeight: 48, border: "none", cursor: "pointer",
                    fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13,
                    letterSpacing: "0.03em", padding: "0 8px",
                    background: sel ? "var(--text-primary)" : "var(--surface)",
                    color: sel ? "var(--bg)" : "var(--text-primary)" }}>
                  {p.label.toUpperCase()}
                </button>
              );
            })}
          </div>
        </Campo>

        <Campo titulo="Nome">
          <input value={nome} onChange={(e) => setNome(e.target.value)}
                 required style={inputStyle} />
        </Campo>
        <Campo titulo="E-mail">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="username" required style={inputStyle} />
        </Campo>
        <Campo titulo="Senha (mínimo 6)">
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                 autoComplete="new-password" minLength={6} required style={inputStyle} />
        </Campo>

        {erro && <p className="t-mono" style={{ color: "var(--sem-crise)", fontSize: 13 }}>
          {erro}
        </p>}

        <Button type="submit" disabled={carregando}>
          {carregando ? "Criando…" : "Criar conta e entrar"}
        </Button>

        <p className="t-mono" style={{ fontSize: 12, color: "var(--text-secondary)",
          textAlign: "center" }}>
          Já tem conta? <Link to="/login" style={{ color: "var(--accent)" }}>Entrar</Link>
        </p>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 52, padding: "0 14px", border: "1px solid var(--hairline)",
  borderRadius: "var(--radius)", background: "var(--surface)",
  color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: 17,
};

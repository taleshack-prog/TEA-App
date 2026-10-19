/** Entrada — Entrar e Criar conta na mesma tela, em abas bem visíveis.
 *  Acolhe primeiro, depois pede os dados. */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SpectrumBar } from "../components/SpectrumBar";
import { Button, Field, SegmentedControl, inputStyle } from "../components/ui";
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

export function Login() {
  const { entrar } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [modo, setModo] = useState(loc.pathname === "/cadastro" ? "criar" : "entrar");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [idx, setIdx] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      if (modo === "criar") {
        if (idx === null) { setErro("Conte pra gente quem é você."); setCarregando(false); return; }
        const p = PAPEIS[idx];
        await registrar({ nome: nome.trim(), papel: p.papel, tipo: p.tipo,
          ve_analise_ia: p.ve, email: email.trim(), senha });
      }
      await entrar(email.trim(), senha);
      nav("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409)
        setErro("Esse e-mail já tem conta. Troque para Entrar.");
      else if (err instanceof ApiError && err.status === 401)
        setErro("E-mail ou senha incorretos.");
      else setErro("Não foi possível conectar. Tente de novo em instantes.");
      setCarregando(false);
    }
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column",
      background: "var(--bg)", padding: "28px 22px", justifyContent: "center",
      maxWidth: 460, margin: "0 auto", width: "100%" }}>
      <div style={{ width: 120, marginBottom: 20 }}><SpectrumBar rounded /></div>
      <h1 className="t-display" style={{ fontSize: 38 }}>Ponte Visual</h1>
      <p className="t-sub" style={{ fontSize: 16, marginTop: 8, marginBottom: 24 }}>
        Entenda melhor o que ele comunica — um dia de cada vez.
      </p>

      <SegmentedControl
        options={[{ label: "Entrar", value: "entrar" },
                  { label: "Criar conta", value: "criar" }]}
        value={modo} onChange={(v) => { setModo(v); setErro(null); }} />

      <form onSubmit={submeter}
        style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>
        {modo === "criar" && (
          <>
            <Field label="Quem é você?">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {PAPEIS.map((p, i) => {
                  const sel = idx === i;
                  return (
                    <button type="button" key={p.papel} onClick={() => setIdx(i)}
                      style={{ minHeight: 44, padding: "0 16px", borderRadius: "var(--r-pill)",
                        border: sel ? "1.5px solid var(--primary)" : "1.5px solid var(--line)",
                        background: sel ? "var(--primary)" : "var(--surface)",
                        color: sel ? "var(--on-primary)" : "var(--ink)",
                        fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Seu nome">
              <input value={nome} onChange={(e) => setNome(e.target.value)}
                required style={inputStyle} />
            </Field>
          </>
        )}

        <Field label="E-mail">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="username" required style={inputStyle} />
        </Field>
        <Field label="Senha" hint={modo === "criar" ? "Mínimo 6 caracteres." : undefined}>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
            autoComplete={modo === "criar" ? "new-password" : "current-password"}
            minLength={6} required style={inputStyle} />
        </Field>

        {erro && (
          <div style={{ background: "var(--accent-tint)", color: "#8a5a1e",
            borderRadius: "var(--r-sm)", padding: "12px 14px", fontSize: 14,
            fontWeight: 600 }}>{erro}</div>
        )}

        <Button type="submit" disabled={carregando}>
          {carregando ? "Um instante…"
            : modo === "criar" ? "Criar conta e entrar" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

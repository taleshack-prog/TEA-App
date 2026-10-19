/** Login simples (JWT). Credenciais do seed no backend. */
import { useState } from "react";
import { SpectrumBar } from "../components/SpectrumBar";
import { Button, Campo } from "../components/ui";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await entrar(email.trim(), senha);
    } catch (err) {
      setErro(err instanceof ApiError && err.status === 401
        ? "E-mail ou senha incorretos." : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column",
                  background: "var(--bg)" }}>
      <SpectrumBar />
      <form onSubmit={submeter}
            style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24,
                     justifyContent: "center", padding: 24, maxWidth: 420,
                     width: "100%", margin: "0 auto" }}>
        <div>
          <h1 className="t-display">Ponte Visual</h1>
          <p className="t-label" style={{ marginTop: 6 }}>Diário comportamental</p>
        </div>

        <Campo titulo="E-mail">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="username" required style={inputStyle}
          />
        </Campo>
        <Campo titulo="Senha">
          <input
            type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password" required style={inputStyle}
          />
        </Campo>

        {erro && <p className="t-mono" style={{ color: "var(--sem-crise)", fontSize: 13 }}>
          {erro}
        </p>}

        <Button type="submit" disabled={carregando}>
          {carregando ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 52, padding: "0 14px", border: "1px solid var(--hairline)",
  borderRadius: "var(--radius)", background: "var(--surface)",
  color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: 17,
};

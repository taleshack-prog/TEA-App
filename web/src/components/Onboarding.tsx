/** Onboarding — aparece uma única vez, no primeiro acesso (por dispositivo).
 *  Explica o essencial em poucos segundos e oferece o guia completo.
 *  A marca de "já viu" fica no localStorage (conveniência local; tolera falha). */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui";

const CHAVE = "pv_onboarded_v1";

const PASSOS = [
  { e: "📝", t: "Registre o momento", d: "Check-ins rápidos e o que acontece no dia." },
  { e: "🎨", t: "Guarde a expressão", d: "Fotos, vídeos ou áudios com um recado." },
  { e: "💡", t: "Entenda junto", d: "A IA sugere leituras possíveis — por hipótese, nunca diagnóstico." },
];

export function Onboarding() {
  const nav = useNavigate();
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem(CHAVE)) setMostrar(true); } catch { /* ok */ }
  }, []);

  function fechar(irGuia = false) {
    try { localStorage.setItem(CHAVE, "1"); } catch { /* ok */ }
    setMostrar(false);
    if (irGuia) nav("/guia");
  }

  if (!mostrar) return null;

  return (
    <div onClick={() => fechar(false)}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(44,42,39,.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow)", padding: "26px 22px", maxWidth: 420, width: "100%",
          maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <img src="/icon-192.png" alt="" width={64} height={64}
            style={{ borderRadius: 16, boxShadow: "var(--shadow)" }} />
        </div>

        <h2 className="t-h1" style={{ fontSize: 24, textAlign: "center" }}>
          Bem-vindo ao Ponte Visual
        </h2>
        <p className="t-sub" style={{ textAlign: "center", marginTop: 6 }}>
          Uma ponte para entender como ele se comunica — você não está sozinho nisso.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "20px 0" }}>
          {PASSOS.map((p) => (
            <div key={p.t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, lineHeight: 1.2 }}>{p.e}</span>
              <div>
                <div style={{ fontWeight: 800 }}>{p.t}</div>
                <div className="t-small" style={{ marginTop: 2, lineHeight: 1.45 }}>{p.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button onClick={() => fechar(false)}>Começar</Button>
          <Button variant="ghost" onClick={() => fechar(true)}>Ver como funciona</Button>
        </div>
      </div>
    </div>
  );
}

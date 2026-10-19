/** Roteamento + guarda de autenticação. */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { AuthProvider, useAuth } from "./lib/auth";
import { Login } from "./screens/Login";
import { Register } from "./screens/Register";
import { Home } from "./screens/Home";
import { Checkin } from "./screens/Checkin";
import { Evento } from "./screens/Evento";
import { Timeline } from "./screens/Timeline";
import { Digest } from "./screens/Digest";
import { Config } from "./screens/Config";

function Protegido() {
  const { perfil, carregando } = useAuth();
  if (carregando) {
    return <div className="t-mono" style={{ padding: 24,
      color: "var(--text-secondary)" }}>Carregando…</div>;
  }
  if (!perfil) return <Navigate to="/login" replace />;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/evento" element={<Evento />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/digest" element={<Digest />} />
        <Route path="/config" element={<Config />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/*" element={<Protegido />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

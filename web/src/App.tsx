/** Roteamento + guarda de autenticação. */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { AuthProvider, useAuth } from "./lib/auth";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { Checkin } from "./screens/Checkin";
import { Evento } from "./screens/Evento";
import { Timeline } from "./screens/Timeline";
import { Album } from "./screens/Album";
import { Biblioteca } from "./screens/Biblioteca";
import { Digest } from "./screens/Digest";
import { Config } from "./screens/Config";

function Protegido() {
  const { perfil, carregando } = useAuth();
  if (carregando) {
    return <div style={{ padding: 28, color: "var(--ink-soft)" }}>Carregando…</div>;
  }
  if (!perfil) return <Navigate to="/login" replace />;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/evento" element={<Evento />} />
        <Route path="/album" element={<Album />} />
        <Route path="/livro" element={<Biblioteca />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/resumo" element={<Digest />} />
        <Route path="/ajustes" element={<Config />} />
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
          <Route path="/cadastro" element={<Login />} />
          <Route path="/*" element={<Protegido />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

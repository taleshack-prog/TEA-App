import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { iniciarAutoSync } from "./lib/sync";
import "./styles/theme.css";

// Dispara o envio da fila offline ao abrir e sempre que a conexão voltar.
iniciarAutoSync();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

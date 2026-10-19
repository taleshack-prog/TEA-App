/** Contexto de autenticação. Mantém o perfil logado e expõe login/logout. */
import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react";
import { getToken, limparToken, login as apiLogin, me, type Perfil } from "./api";

interface AuthCtx {
  perfil: Perfil | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setCarregando(false);
      return;
    }
    me().then(setPerfil).catch(() => limparToken()).finally(() => setCarregando(false));
  }, []);

  async function entrar(email: string, senha: string) {
    setPerfil(await apiLogin(email, senha));
  }
  function sair() {
    limparToken();
    setPerfil(null);
  }

  return (
    <Ctx.Provider value={{ perfil, carregando, entrar, sair }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

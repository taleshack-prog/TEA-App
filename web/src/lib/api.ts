/** Cliente da API Ponte Visual. Base configurável por VITE_API_URL.
 *  Guarda o token JWT em localStorage; expõe helpers tipados por endpoint. */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "pv_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function limparToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function req<T>(rota: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const tok = getToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;

  const r = await fetch(`${BASE}${rota}`, { ...init, headers });
  if (!r.ok) {
    const txt = await r.text();
    throw new ApiError(r.status, txt);
  }
  return (r.status === 204 ? undefined : await r.json()) as T;
}

export class ApiError extends Error {
  constructor(public status: number, public corpo: string) {
    super(`API ${status}`);
  }
}

/* -------- Auth -------- */
export interface Perfil {
  id: number;
  nome: string;
  papel: string;
  tipo: string;
  ve_analise_ia: boolean;
  email: string;
}

export async function login(email: string, senha: string): Promise<Perfil> {
  // OAuth2PasswordRequestForm espera form-urlencoded (username/password).
  const body = new URLSearchParams({ username: email, password: senha });
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new ApiError(r.status, await r.text());
  const data = (await r.json()) as { access_token: string; perfil: Perfil };
  setToken(data.access_token);
  return data.perfil;
}

export const me = () => req<Perfil>("/auth/eu");

/* -------- Check-ins -------- */
export interface SinalIn {
  humor: string;
  energia_1_5: number;
  horas_sono?: number | null;
  qualidade_sono_1_5?: number | null;
  alimentacao?: string | null;
  medicacao?: boolean;
  medicacao_obs?: string | null;
  observacao_livre?: string | null;
}
export interface CheckinBody {
  id_checkin?: number | null;
  tipo?: string;
  sinal: SinalIn;
}
export const enviarCheckin = (b: CheckinBody) =>
  req("/checkins", { method: "POST", body: JSON.stringify(b) });

export const gerarCheckinsDia = () =>
  req<unknown[]>("/checkins/gerar-dia", { method: "POST" });

/* -------- Eventos -------- */
export interface EventoBody {
  tipo: string;
  inicio: string;
  fim?: string | null;
  intensidade_1_5: number;
  gatilho_percebido?: string | null;
  intervencao_tentada?: string | null;
  resultado?: string | null;
}
export const enviarEvento = (b: EventoBody) =>
  req("/eventos", { method: "POST", body: JSON.stringify(b) });

/* -------- Timeline -------- */
export interface ItemTimeline {
  tipo_item: "checkin" | "evento" | "midia";
  id: number;
  quando: string;
  [k: string]: unknown;
}
export const timeline = (escopo: "dia" | "semana" | "mes" = "dia") =>
  req<{ itens: ItemTimeline[] }>(`/timeline?escopo=${escopo}`);

/* -------- Análise Nível 0 (só pais / RBAC) -------- */
export interface AnaliseDescritiva {
  periodo: { inicio: string; fim: string };
  n_checkins_preenchidos: number;
  dados_suficientes: boolean;
  aviso: string | null;
  humor: { frequencias: Record<string, number>; predominante: string | null };
  energia_media_1_5: number | null;
  sono: { horas_media: number | null; qualidade_media_1_5: number | null };
  eventos: {
    total: number;
    por_tipo: Record<string, number>;
    intensidade_media_1_5: number | null;
  };
}

export function analiseDescritiva(dias: number): Promise<AnaliseDescritiva> {
  const fim = new Date();
  const inicio = new Date(fim.getTime() - dias * 24 * 3600 * 1000);
  const q = `inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`;
  return req<AnaliseDescritiva>(`/analises/descritiva?${q}`);
}

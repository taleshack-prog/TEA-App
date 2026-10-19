# Ponte Visual 2.0 — PWA (TEA-App)

Frontend do **Diário Comportamental Estruturado** (PRD v2.0 / TDD v2.2 · Hack Tech Farm).
PWA instalável, offline-first, com o design system **Swiss Clinical v2.3**.
Fala com o backend FastAPI (repo separado).

## Stack
Vite · React 18 · TypeScript · React Router · Dexie (IndexedDB) · vite-plugin-pwa.

## Rodar
```bash
npm install
cp .env.example .env          # ajuste VITE_API_URL (padrão: http://localhost:8000)
npm run dev                   # http://localhost:5173
```
Suba o backend antes (`uvicorn app.main:app --reload`) e rode o `seed.py` dele.
Login de teste: `mae@pontevisual.app` / `pai@pontevisual.app` · senha `mudar123`.

## Deploy no Vercel
1. Importe o repo `TEA-App` no Vercel (framework detectado: **Vite**).
2. Build: `npm run build` · Output: `dist`.
3. Variável de ambiente: `VITE_API_URL` = URL pública da API no Railway.
4. SPA: o `vite-plugin-pwa` já configura o fallback para `index.html`.

## O que já funciona (fluxo crítico)
- **Login JWT** e guarda de rotas.
- **T1 Home "Hoje":** contagem regressiva do próximo check-in (numeral mono no acento),
  "Registrar agora", atalho "+ Evento", status online/offline e fila pendente.
- **T2 Check-in <60s:** 3 passos (humor+energia → sono+alimentação → observação+medicação),
  com atalho "salvar só o essencial" já no passo 1.
- **T3 Evento:** tipo (crise/euforia/introspecção/alegria) com filete semântico 3px →
  intensidade, gatilho, intervenção, resultado.
- **T4 Timeline:** registros do dia em tabela suíça (horário mono + filete + descrição).
- **T6 Ajustes:** horários, ativar alarmes, tema (auto/claro/escuro), sair.
- **Offline-first:** todo registro entra numa fila no IndexedDB (Dexie) e sobe sozinho
  quando a conexão volta (`src/lib/sync.ts`).

## Limitação conhecida (PWA) e como está isolada
Notificação **agendada em segundo plano** não é garantida em PWA, sobretudo no iOS.
Toda essa lógica está em **um único arquivo** — `src/lib/alarmes.ts` — em camadas:
Notification Triggers (Chromium) → timers em primeiro plano → fallback visual na Home.
Quando migrarmos para push nativo/servidor, troca-se só esse arquivo.

## Estrutura
```
src/
  components/   SpectrumBar, ui (Button, MoodSelector, EnergyBar…), Shell
  screens/      Login, Home(T1), Checkin(T2), Evento(T3), Timeline(T4), Config(T6)
  lib/          api (cliente+auth), db (Dexie), sync (fila offline), alarmes, auth (contexto)
  styles/       theme.css (tokens Swiss Clinical v2.3, claro/escuro)
```

## Próximos passos
- Config de horários vinda de `/config/checkins` (hoje fixa no cliente).
- T5 Digest (Nível 0 legível para os pais) consumindo `/analises/descritiva`.
- T9 Galeria de mídia + upload real (S3 via URL pré-assinada).
- Reativação do canal de arte (T7) quando o menino retomar a produção.

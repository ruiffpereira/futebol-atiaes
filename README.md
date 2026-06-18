# Torneio «Atiães em Movimento» — App Next.js (full-stack)

Placar ao vivo + backoffice para um torneio de Futebol 5. **Tempo real** para todos os
dispositivos, **notificações no telemóvel** (Web Push) e **sem base de dados** — o estado
vive num ficheiro JSON num volume persistente. Pronto para **Coolify**.

> Next.js 14 (App Router) · React 18 · TypeScript · **React Query + SSE** · **Web Push (VAPID)** · Docker.

---

## O que faz

**Placar público (`/`)** — só leitura, sem login:
- Classificação por grupo (critérios de desempate do regulamento), **tabela provisória ao vivo**.
- Jogos **ao vivo** sem cronómetro (só *1ª parte / Intervalo / 2ª parte*).
- Calendário e resultados · Estatísticas (melhores marcadores + guarda-redes) · Quadro da fase final.
- **Vista FlashScore**: toca num jogo para o lance-a-lance (golos/cartões) + equipas.
- **Regras**: regulamento completo num clique.
- Barra de navegação inferior no telemóvel.
- **Notificações**: golos, resultados e cartões, com **vibração no Android**.

**Backoffice (`/admin`)** — protegido por palavra-passe:
- Equipas e jogadores (nomes editáveis), **capitão**, **guarda-redes (GR)** e **treinador**; equipas **sem grupo** (só amigáveis).
- Calendário **manual** com **horários**, **reordenar** (↑/↓), **jogos amigáveis** (não contam para nada).
- Registo ao vivo: golos por jogador, **auto-golos**, **cartões** (amarelo/vermelho), **editar/corrigir** golos.
- Controlo do jogo: Iniciar 1ª → Intervalo → 2ª → Terminar.
- **Fase final automática**: cria-se sozinha (1ºA-2ºB / 1ºB-2ºA / 3º-4º / Final) e preenche as equipas **só quando cada grupo terminar** (100% certo).
- **Bloqueio de edição**: golos/cartões só se editam com o jogo a decorrer; fora disso é preciso desbloquear (✏️) e **as correções não notificam ninguém**.

---

## Tempo real (React Query + SSE)

- Cada cliente abre `GET /api/stream` (**Server-Sent Events**). Quando o backoffice grava
  (`POST /api/state`), o servidor empurra o estado novo e o cliente faz `setQueryData`
  **instantâneo** (sem refetch). Ao voltar ao separador, o React Query refaz a query.
- **Sem polling.** Funciona em qualquer número de dispositivos.

## Notificações no telemóvel (Web Push)

- O servidor compara o estado anterior com o novo e envia um **push** (VAPID) para todos
  os dispositivos subscritos — **funciona com o site fechado**.
- **Android (Chrome):** notificação + **vibração**, no browser.
- **iPhone (iOS 16.4+):** só funciona depois de **«Adicionar ao ecrã principal»** (abrir como app).
  A **vibração não é suportada** pelo iOS (limitação da Apple).
- Se não definires as chaves VAPID, a app funciona na mesma — só não envia push (o tempo real por SSE continua).

### Gerar as chaves VAPID
```bash
npx web-push generate-vapid-keys
```
Põe `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` nas variáveis de ambiente.

---

## Segurança

- **Leitura é pública** (`GET /api/state`, `/api/stream`). **Escrita exige sessão de admin** (`POST /api/state` → 401 sem cookie).
- Login compara `ADMIN_PASSWORD` e devolve um **cookie httpOnly assinado com HMAC** (`AUTH_SECRET`). Sem a palavra-passe, ninguém altera nada — mesmo chamando a API diretamente.

---

## Deploy no Coolify

1. **New Resource → Docker Compose** e cola o `docker-compose.yml` (ou aponta para o repositório Git).
2. **Environment Variables** (obrigatório mudar):
   | Variável | Para quê |
   |---|---|
   | `ADMIN_PASSWORD` | Palavra-passe do backoffice |
   | `AUTH_SECRET` | Segredo dos cookies (string longa aleatória) |
   | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push (opcional mas recomendado) |
   | `VAPID_SUBJECT` | `mailto:teu@email` |
   | `DATA_DIR` | `/data` (já definido) |
3. **Persistent Storage**: volume montado em **`/data`** (guarda `state.json` e as subscrições de push).
4. Liga o teu **domínio** com HTTPS (o Coolify trata do certificado) — necessário para cookies seguros, service worker e Web Push.
5. O **QR code** aponta para o domínio. Toda a gente que o abrir vê o placar ao vivo.

Healthcheck: `GET /api/health`.

## Correr localmente
```bash
cp .env.example .env     # preenche ADMIN_PASSWORD, AUTH_SECRET (e VAPID se quiseres push)
npm install
npm run dev              # http://localhost:3000
```

---

## Estrutura

```
app/
  page.tsx            Placar público (React Query + SSE)
  Rules.tsx           Modal do regulamento
  MatchDetail.tsx     Vista FlashScore (lance-a-lance + equipas)
  admin/page.tsx      Backoffice (login + gestão + registo ao vivo)
  providers.tsx       QueryClientProvider
  layout.tsx          Fontes, manifest, theme
  globals.css         Reset + responsivo (bottom nav)
  api/
    state/route.ts    GET público · POST protegido
    stream/route.ts   SSE (tempo real)
    login|session     auth (cookie HMAC)
    push/route.ts     GET chave VAPID · POST subscrever
    health/route.ts   healthcheck Coolify
lib/
  types.ts            modelo de dados
  tournament.ts       classificação, marcadores/GR, fase final automática
  actions.ts          mutações (puras)
  store.ts            estado em memória + ficheiro + SSE + envio de push
  push.ts             Web Push (VAPID) + deteção de eventos
  auth.ts             cookie assinado + palavra-passe
  useTournament.ts    hook React Query + SSE + mutações
  useNotifications.ts regista SW, pede permissão, subscreve push
public/
  sw.js               service worker (push + vibração)
  manifest.json       PWA (necessário p/ push no iOS)
  icon.png
design-reference/     protótipo HTML (fonte de verdade do visual) + regulamento (regras.txt)
```

> **`design-reference/`** tem o protótipo original (`Torneio.dc.html`). Abre-o no navegador
> para ver o look & feel exato. As páginas React recriam esse design ligado à API e ao tempo real.

## Regras já implementadas
- Pontos: V=3, E=1, D/ausência=0. Desempate de grupo: confronto direto → diferença de golos → golos marcados (→ média de idades, manual).
- Top 2 de cada grupo apuram-se. **Penáltis só na fase a eliminar** (empate decidido por séries de 3); **nunca na fase de grupos**.

> Nota: o código não foi compilado neste ambiente. Ao montar, corre `npm install && npm run build`
> e avisa se aparecer algum aviso de tipos para afinar.

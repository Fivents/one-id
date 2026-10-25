# ONE-ID Project Memory

> This document is automatically maintained to provide context about the project.
> Updated: 2026-04-02

## 🎯 Project Overview

**ONE-ID** is a comprehensive event management and attendee check-in platform built with Next.js 16+, featuring facial recognition, QR code scanning, and manual code entry for seamless event check-ins via physical totems (kiosks).

### Core Purpose

- **Event organizers** can manage events, participants, and check-ins
- **Physical totems** serve as self-service check-in stations at event venues
- **Multi-tenant SaaS** architecture supporting multiple organizations
- **AI-powered facial recognition** for fast, contactless check-ins

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 16.1.6, React 19.2.3, TypeScript 5+
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI)
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: MediaPipe (face detection), ArcFace (embeddings), pgvector (similarity search)
- **Auth**: Custom JWT-based sessions + OAuth providers

### Folder Structure

```
src/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (saas)/          # Main SaaS dashboard
│   ├── (totem)/         # Totem check-in pages ⭐
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── shared/          # Shared components
│   ├── admin/           # Admin-specific components
│   └── organizations/   # Organization components
├── core/                # Business logic layer
├── generated/           # Prisma client
├── hooks/               # Custom React hooks
├── i18n/                # Internationalization
└── lib/                 # Utilities
```

## 📊 Data Model (Prisma Schema)

### Core Entities

#### Organization (Multi-tenant Root)

- Owns events, members, totems, and people
- Has subscription plan with feature limits
- Contains audit trail of all actions

#### User & Membership

- Users authenticate via multiple providers (email, OAuth)
- Memberships link users to organizations with roles (SUPER_ADMIN, ORG_OWNER, EVENT_MANAGER)
- Role-based access control (RBAC)

#### Event

- Belongs to an organization
- Has check-in methods: `faceEnabled`, `qrEnabled`, `codeEnabled`
- Contains AI configuration (EventAIConfig) for face recognition tuning
- Status flow: DRAFT → PUBLISHED → ACTIVE → COMPLETED/CANCELED

#### Person & PersonFace

- Person: Contact within organization (name, email, document)
- PersonFace: Facial embedding (512D vector via ArcFace)
- Supports multi-template facial recognition
- pgvector for efficient similarity search

#### EventParticipant

- Links Person to Event
- Has QR code and access code for check-in
- Tracks all check-ins

#### Totem (Physical Kiosk)

- Self-service check-in station
- Authenticates with access code
- Linked to organization via TotemOrganizationSubscription
- Linked to event via TotemEventSubscription
- Tracks performance metrics (latency, confidence, success rate)

#### CheckIn

- Records each check-in attempt
- Methods: FACE_RECOGNITION, QR_CODE, MANUAL
- Stores confidence score for face matches

### Key Relationships

```
Organization
├── Memberships → Users
├── Events
│   ├── EventAIConfig
│   ├── EventParticipants → People → PersonFaces
│   └── TotemEventSubscriptions → CheckIns
├── TotemOrganizationSubscriptions → Totems
└── Subscription → Plan → Features
```

## 📱 Totem Application Flow

### Navigation Flow

```
/totem (Login)
  ↓ [validates totem access key]
/totem/method (Method Selector)
  ↓ [auto-redirect if only 1 method enabled]
  ├── /totem/face (Facial Recognition)
  ├── /totem/qr (QR Code Scanner)
  └── /totem/code (Manual Code Entry)

  After success/error → Returns to /totem/method after 3s
```

### Facial Recognition Pipeline

```
Camera → MediaPipe BlazeFace → Face Crop → Quality Check →
ArcFace (112x112) → 512D Embedding → API → pgvector Search →
Match Participant → Check-in Record
```

### Session Management

- Totem authenticates once with access code
- JWT token stored in localStorage
- Session includes: totem info, active event, AI config
- Token expires after configured duration

## 🎨 Design System

### Components (shadcn/ui)

- Button, Card, Input, Badge, Dialog, Sheet, Select, Table, Tabs, etc.
- Custom variants and sizes defined in CVA (Class Variance Authority)

### Color System (oklch)

```css
/* Light */
--primary: oklch(0.558 0.228 300) /* Violet */ --success: oklch(0.63 0.18 155) /* Green */
  --destructive: oklch(0.577 0.245 27) /* Red */ /* Dark (Totem default) */ --background: oklch(0.141 0.048 270)
  /* Slate-950 */ --primary: oklch(0.62 0.228 300) /* Lighter violet */;
```

### Totem-Specific Styling

- Always dark mode
- High contrast for outdoor/bright environments
- Large touch targets (h-20 buttons minimum)
- Clear visual feedback (success green, error red)

## 🔧 AI Configuration

### Per-Event Settings (EventAIConfig)

- `confidenceThreshold`: Minimum match confidence (default: 0.62)
- `detectionIntervalMs`: Capture loop interval (default: 500ms)
- `maxFaces`: Maximum faces per frame (default: 1)
- `minFaceSize`: Minimum face size in pixels (default: 80)
- `livenessDetection`: Enable anti-spoofing (default: true)
- `cooldownSeconds`: Prevent rapid re-scans (default: 8)

### Per-Totem Settings (TotemEventSubscription)

- Adaptive confidence thresholds
- Exponential cooldown strategy
- Performance metrics tracking

## 🔒 Security Considerations

### Multi-tenant Isolation

- All queries filter by organizationId
- Totem sessions scoped to specific events
- Audit logs track all sensitive actions

### Face Data

- Embeddings stored as binary (not images)
- L2 normalized vectors
- No raw biometric storage on client

### Kiosk Mode

- Disable browser navigation
- Block keyboard shortcuts
- Prevent context menus
- Server-side validation of all actions

## 📈 Performance Patterns

### Client-Side

- React Compiler for auto-memoization
- Lazy model loading (ArcFace, MediaPipe)
- WASM optimization (SIMD enabled)
- Abort signals for request timeouts

### Database

- pgvector HNSW index for embedding search
- Composite indexes on frequent queries
- Hourly metrics aggregation

## 🌐 Internationalization

- next-intl for translations
- Currently supports: pt-BR, en-US
- All user-facing text externalized

## 📝 Key Implementation Notes

1. **Face check-in loops every 1.2s** - automatic capture without button press
2. **6 consecutive failures** trigger error state and return to menu
3. **QR scanner uses dual fallback**: BarcodeDetector API → jsQR library
4. **All check-ins return participant info** for personalized greeting
5. **Metrics track latency, confidence, failure reasons** per totem/event
6. **Cooldown system prevents duplicate check-ins** within configured window

## 🎨 Totem UI Design System (Updated 2025-04-02)

### Visual Language

- **Background**: Dark mode only (`slate-950`) for outdoor/bright environments
- **Cards**: Glassmorphism with gradient borders (`from-color-500/40 via-slate-700/30`)
- **Glows**: Ambient colored glows behind key elements (`blur-[60px]`)
- **Colors by method**:
  - Face: `violet-500` theme
  - QR Code: `cyan-500` theme
  - Access Code: `emerald-500` theme

### Animations (Custom in globals.css)

- `animate-totem-scan`: Vertical scan line for camera views (2.5s)
- `animate-totem-shake`: Error shake animation (0.5s)
- `animate-totem-glow`: Pulsing glow effect (2s)
- `animate-totem-success-pulse`: Success celebration (1.5s)
- `animate-totem-error-pulse`: Error attention (1s)
- Viewfinder corner utilities: `.viewfinder-corner-*`

### Feedback States

- **Full-screen overlays** for success/error (not inline cards)
- **3-second countdown** visible to user before auto-redirect
- **Participant name** displayed on success for personalization
- **Large touch targets** (64px+ buttons) for kiosk use

### Components Pattern

```tsx
// Success state pattern
<div className="relative">
  <div className="absolute inset-0 bg-emerald-500/20 blur-[60px]" />
  <div className="animate-in zoom-in-75 relative">
    <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 p-10 ring-1 ring-emerald-500/30">
      <CheckCircle2 className="h-14 w-14" />
      <h1>{title}</h1>
      <span className="tabular-nums">{countdown}s</span>
    </div>
  </div>
</div>
```

## 🔌 Integração Sympla — Decisões de Arquitetura (P0, 2026-09-18)

### Escopo entregue (P0 — Fundação)

Conexão por organização, cliente HTTP, fila de jobs e tooling de testes. A ingestão de
participantes (P1) e o espelhamento de check-in (P2) ainda não existem.

### Decisões

- **`EventParticipant` é o ingresso.** Não haverá tabela `Ticket`. `Person` vira identidade
  opcional por cima do slot. A compra em lote (1 pedido → N ingressos repetindo e-mail/CPF do
  comprador) é o motivo: o modelo atual proíbe isso via `Person @@unique([email, organizationId])`,
  `@@unique([document, organizationId])` e `EventParticipant @@unique([personId, eventId])`.
- **O desacoplamento `Person`↔`EventParticipant` é fase própria (P1a)**, a ser mergeada e
  verificada antes da ingestão. Raio de impacto: ~44 arquivos tocam `personId`, e o
  `INNER JOIN event_participants ON person_id` do `postgres-vector-db.repository.ts` passa a
  poder devolver N linhas por face.
- **Fila no Postgres, não worker.** `BackgroundJob` + claim com `FOR UPDATE SKIP LOCKED`,
  drenada por `POST/GET /api/cron` (Vercel Cron, 1/min). Escolhido por ser serverless-safe e
  não exigir infra nova.
- **Token cifrado com AES-256-GCM** (`SecretCipherService`), mesmo envelope do
  `EmbeddingEncryptionService`, mas com chave própria (`SYMPLA_TOKEN_KEY`) — rotacionar a chave
  de token nunca toca biometria.
- **`SymplaConnectionEntity.toJSON()` omite o token de propósito.** Controllers retornam
  `entity.toJSON()` verbatim, então manter o segredo fora do `toJSON()` é a única garantia
  confiável de que ele não vaza numa resposta HTTP.
- **Env vars são opcionais no schema** (`SYMPLA_TOKEN_KEY`, `CRON_SECRET`): `validateEnv()` faz
  `process.exit(1)`, então torná-las obrigatórias quebraria todo deploy que ainda não adotou a
  integração. A ausência vira `SymplaNotConfiguredError` no momento do uso.

### Armadilha registrada

`resolveDerivedCode` (`src/core/utils/derived-code.ts`) dá prioridade à política da org/evento
**sobre** o valor explícito. No caminho Sympla o QR precisa ser passado com
`sourceField: 'NONE'` — caso contrário uma org com `qrCodeSource=DOCUMENT` sobrescreve o
`ticket_num_qr_code`, quebrando a compatibilidade com os leitores da Sympla.

### Estado do repositório descoberto no caminho

- Não há `Either`/`Result` no backend: use-cases **lançam** `AppError` tipado.
- i18n é custom (`useI18n`, `src/i18n/translations.ts`), **não next-intl**, com 5 locales
  (`pt en fr es zh`) e paridade garantida pelo type `TranslationSchema`.
- `pnpm typecheck` (novo) passava com **zero** erros no baseline — o gate é zero.
- `pnpm lint` **já falhava antes** desta integração, em arquivos pré-existentes
  (`label-print-confirmation-modal.tsx`, `face-embedding.client.ts`, `(saas)/layout.tsx` e outros).
- O union `AuditAction` do domínio estava dessincronizado do enum Prisma (faltavam
  `EVENT_AUTO_LINK_BACKFILL` e `PEOPLE_CODE_RECALCULATED`) — ressincronizado.
- O banco Neon tem uma migration ausente do repositório:
  `20260526233827_add_email_settings_and_logs`.

## 👤 P1a — Person desacoplado de EventParticipant (2026-09-22)

`EventParticipant` passou a ser **o ingresso**: um slot de participação autônomo.
`Person` virou identidade **opcional** por cima dele.

### O que mudou no banco (migration aplicada, 3772 participantes backfillados)

- `people.email` nullable e **sem unique**; `people.document` **sem unique**. Índices simples
  (`organization_id, email` / `organization_id, document`) substituem os únicos.
- `event_participants.person_id` nullable; `@@unique([personId, eventId])` removido.
- `event_participants` ganhou snapshot próprio: `attendee_full_name`, `attendee_email`,
  `attendee_document`, `attendee_document_type`.

### Regra de identidade (`src/core/utils/participant-identity.ts`)

**Person vence quando está vinculada**; o snapshot é o fallback e o registro durável do que o
ingresso declarou. Isso preserva o comportamento atual (editar uma Person continua refletindo
nos participantes) e fica correto para a Sympla, porque a política de ingestão do P1b só vincula
um slot a uma Person quando ela de fato é o participante.

**Todo caminho de criação escreve o snapshot** (`buildAttendeeSnapshot`): POST manual, import
XLSX do evento, import de pessoas da org, auto-link, vínculo pessoa→evento, backfill e
self-register do totem. Um slot que não sabe dizer quem é seu participante sem um join não é
autônomo, e snapshots pela metade fariam features de identidade funcionarem para um tipo de
participante e silenciosamente pularem o outro.

### Dois bugs encontrados no caminho

1. `findParticipantByCredential` (totem) filtrava por `person: { deletedAt: null }`. Filtro de
   relação to-one **exclui linhas cuja relação é nula** — todo ingresso sem identidade ficaria
   impossível de creditar. Agora aceita as duas formas, combinado com `AND` (os dois são `OR`;
   espalhar um sobre o outro descartava silenciosamente o primeiro).
2. O import XLSX gravava `email: ''` para contatos sem e-mail. Sob o unique antigo, só **uma**
   pessoa por organização podia ter `''` — importar a segunda colidia. Agora grava `null`.

### Ainda pendente (P1c)

A busca vetorial (`postgres-vector-db.repository.ts`) faz
`INNER JOIN event_participants ep ON ep.person_id = p.id` e particiona por `p.id`. Com N
ingressos por Person no mesmo evento, o `ROW_NUMBER` escolhe **um slot arbitrário**. Nenhum dado
tem N ainda, mas isso precisa da regra de desambiguação do P1c antes da ingestão Sympla entrar
em produção.

## 🎟️ P1b — Catálogo Sympla e ingestão de ingressos (2026-09-22)

Ingressos vendidos na Sympla viram slots de participação no ONE-ID, com tipo, setor, lugar,
pedido e as respostas do formulário de compra.

### Modelos novos

`SymplaEventLink`, `Presentation`, `Sector`, `TicketType`, `SymplaOrder`. `Event.symplaLinked`
é denormalizado para a UI e listagens não precisarem de join. `EventParticipant` ganhou o
ingresso em si + `customFields` + **`@@unique([eventId, ticketNumber])`** como âncora de
idempotência (NULLs distintos no Postgres — validado contra os 3773 participantes existentes).

### Decisões que evitam dano silencioso

1. **Credenciais só na criação.** O `update` do sync não toca `accessCode`/`qrCodeValue`.
   Rederivar a cada sync rotacionaria o código de um ingresso cujo crachá já foi impresso e cujo
   QR já está na carteira do participante.
2. **O QR da Sympla entra como valor explícito `MANUAL` com `sourceField: 'NONE'`.**
   `resolveDerivedCode` dá prioridade à política da org sobre o valor explícito — uma org com
   `qrCodeSource=DOCUMENT` sobrescreveria o `ticket_num_qr_code` e quebraria os leitores da
   própria Sympla.
3. **Datas:** toda requisição fixa `timezone=UTC`, então timestamp ingênuo é UTC por construção.
   Sem aritmética de fuso IANA na entrada. Formatos com offset explícito continuam respeitados.
4. **Status do evento não é forçado.** Cancelamento na Sympla vira `cancelledOnSympla` + aviso na
   UI; dirigir a máquina de status do ONE-ID daqui poderia jogar um evento para um estado final
   e deixar os totems órfãos.

### Agendamento sem estado novo

O job é enfileirado sob `dedupeKey` por evento com um `runAt`, e a chave só é liberada quando o
job encerra — então **o atraso escolhido É o intervalo**. Evento dentro da janela de ±7 dias
sincroniza a cada tick do cron; os demais a cada 15 min.

### Política de identidade na ingestão

Reusa uma `Person` só quando **e-mail E nome** batem. E-mail repetido sob outro nome gera
identidade própria — senão o totem saudaria três pessoas com o nome do comprador. Ingresso sem
nome nenhum fica como slot puro, sem criar `Person` anônima poluindo a base de contatos.

Erros são por ingresso, registrados em `lastSyncResult`; uma linha malformada não aborta as
outras milhares nem dispara o alerta de reconexão.

## 🔁 P2 — Bidirecionalidade de check-in (2026-09-22)

### Espelhamento

Job `sympla.checkin.mirror`, nunca inline: a portaria não pode esperar por terceiro, e uma
oscilação de rede na porta não pode custar um check-in. **Os 5 pontos que criam `CheckIn`**
(totem credencial, totem facial, app/manual, bulk, self-register) chamam o mesmo
`enqueueMirrorCheckIn`, que **nunca lança**. Nos dois caminhos dentro de transação, o enfileiramento
acontece **após o commit** — dentro dela deixaria jobs apontando para check-ins que um rollback apagou.

**Decisão de retry:** 429/5xx/rede são relançados para a fila fazer backoff; 404/422 **resolvem**
em vez de lançar. Retentar rejeição definitiva para sempre manteria a linha quente sem nunca
suceder — vira divergência auditada, entregue ao reconciliador.

### Reconciliação

Compara colunas locais (o sync já mantém `symplaCheckedIn` fresco), mas **força um passe completo
antes**: o sync incremental filtra por `ticket_updated_at` e não há garantia de que um check-in do
lado da Sympla altere esse timestamp. Check-in importado carrega o **timestamp da Sympla** — o
check-in mais antigo é o verdadeiro, e inventar "agora" reportaria a chegada errada.

Diariedade não pode vir do `dedupeKey` (liberado quando o job encerra), então a trava é
"já terminou uma reconciliação hoje?".

### Fallback na portaria

Credencial desconhecida em evento vinculado → consulta a Sympla uma vez (3s, sem retry) e persiste.
**Limite documentado honestamente:** a Sympla busca por `ticket_number`, mas um QR escaneado carrega
`ticket_num_qr_code` — campos diferentes. Só resolve quando o valor escaneado É o número do
ingresso. Fechar essa lacuna exige o payload QR assinado da Sympla, que um leitor comum não produz.

### Estado do credenciamento (contexto do usuário, set/2026)

**Facial NÃO está em uso** — só QR code e código de acesso. Por isso:
- Ingresso cancelado/reembolsado **não abre a portaria** (checado nos caminhos ativos).
- Overlay e crachá mostram tipo de ingresso, setor e lugar.
- O facial ficou **protegido, não concluído**: com N ingressos sob uma identidade a busca vetorial
  devolve slot arbitrário, então resolve para o único ingresso em aberto quando há exatamente um e
  recusa com `CHECKIN_AMBIGUOUS_TICKET` quando há mais. A UX completa de desambiguação fica aberta
  até o facial ser ligado.

## 🚪 P3 — Restrição de portaria e métricas (2026-10-02)

### Restrição por portaria

Allow-lists de setor e tipo de ingresso em **`TotemEventSubscription`**, não em `Totem`.
O plano original dizia `Totem`, e isso estava errado: um totem serve eventos diferentes ao longo
do tempo e setores pertencem a um evento, então regra no device vazaria entre eventos e passaria a
recusar as pessoas erradas no momento em que o totem fosse reatribuído. A subscription já carrega
`locationName` — ela **é** a portaria.

- Casamento **por nome**, não id: é o que o slot carrega (`sectorName`/`ticketName`, denormalizados
  da Sympla por participante). Sem join, e nomes sobrevivem a re-sync. Comparação ignora caixa e
  espaços porque a própria Sympla varia entre catálogo e ingresso.
- **Direções de falha opostas, de propósito:** allow-list malformada lê como "sem restrição"
  (config ruim não pode virar parede para quem tem ingresso válido); ingresso **sem setor** falha
  uma restrição de setor (senão a restrição não restringe nada, já que ingresso não sincronizado
  não tem setor).
- A decisão é **uma função pura** (`src/core/domain/value-objects/gate-policy.ts`) compartilhada
  por QR, código e facial. Regra que vale numa porta e não na outra seria péssima de depurar no
  meio do evento, então não existe segunda implementação para divergir.
- O seletor de setores lê nomes do catálogo **e dos próprios ingressos**: um ingresso pode nomear
  setor que nenhuma apresentação declarou.

### Métricas

Taxa de check-in por tipo de ingresso e setor, receita, e atribuição UTM ligada ao comparecimento
real.

**Não é gráfico, de propósito:** magnitude por linha nomeada sobre poucas categorias lê mais rápido
como tabela com medidor inline, e não exige paleta categórica nenhuma — identidade vem do rótulo,
números usam tokens de texto, medidor é a hue única do projeto.

**`EXISTS`, nunca join em `check_ins`.** Join faria fan-out de participante com 2 check-ins em 2
linhas e **dobraria silenciosamente o preço do ingresso** na soma de receita. Validado contra dado
real (3314 participantes, 1124 check-ins, 33,9%) com cross-check contra contagens independentes do
Prisma — exatamente o que quebraria se houvesse fan-out.

## ✅ Validação contra a API real da Sympla (2026-10-02)

Rodada com token de produtor real, evento publicado, 11 ingressos emitidos e check-ins
espelhados de verdade. `pnpm test:live` (opt-in, fora do CI); escritas na Sympla exigem
**`SYMPLA_ALLOW_WRITES=1`** por cima disso.

### A documentação estava errada em três pontos

1. **Datas divergem por endpoint E por campo.** `listEvents` manda `...Z`, `getEvent` manda
   `...-03:00`. Dentro de um pedido, `order_date` respeita `timezone=UTC` mas `updated_date` volta
   em hora local. Por isso `WATERMARK_OVERLAP_MS` = **15h**, maior que qualquer offset.
2. **Resposta do check-in não é `{check_in, check_in_date, check_in_id}`.** O POST devolve o
   participante inteiro com `checkin` como **array**; o GET devolve como **objeto**; nenhum traz
   `check_in_id`. O schema normaliza as duas formas.
3. **QR = `ticket_number` sem hífens.** `UVKL-LL-QDAT` → `UVKLLLQDAT`. O endpoint de busca aceita
   **só** a forma com hífens (200 vs 404, testado nos dois sentidos).

### Comportamentos medidos que mudaram o código

- **Leituras são eventualmente consistentes.** GET logo após o POST pode dizer `false`. O sync
  **não rebaixa** mais um slot já espelhado quando temos o check-in local — senão o reconciliador
  reempurrava para sempre.
- **`checkin:already_performed` (HTTP 400) é sucesso**, não divergência. Acontece quando alguém é
  creditado no app da Sympla e também escaneia no nosso totem.
- **POST às vezes responde 2xx sem confirmar**, embora registre. O job **lança** em vez de
  retornar, para a fila retentar e obter resposta definitiva em segundos.
- **Check-in na Sympla NÃO altera `ticket_updated_at`.** O sync incremental perderia mudanças de
  estado de check-in — é exatamente por isso que o reconciliador força passe completo.
- **Pedido APPROVED com zero participantes é forma real** (3 deles num evento).
- **Strings vazias** (`''`) em vez de campos ausentes; `utm: {}`.

### Bug meu encontrado por dado real

Extração de documento casava **"Cargo"** porque `'cargo'` contém `'rg'` — cargo gravado como
documento, e esse campo alimenta derivação de código de acesso e detecção de duplicidade. Agora
casa por **limite de palavra**.

### Estado do evento de teste

Org **Fivents**, evento `teste-sympla-integracao` vinculado a `s36fe08`. Conexão Sympla ativa.
Os testes live dependem desses dois. Há também `teste-sympla-ingestao`, criado e destruído pelo
próprio teste de ingestão.

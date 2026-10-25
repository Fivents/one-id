# SUPER PROMPT — Integração Sympla ↔ ONE-ID

> **Agente destinatário:** OPUS 5
> **Missão:** Implementar a integração bidirecional entre a plataforma Sympla e o sistema ONE-ID de credenciamento de eventos, transformando o ONE-ID na melhor ferramenta de credenciamento e app de eventos do mundo.
> **Idioma do código/comentários:** seguir os padrões do repositório. Mensagens de UI seguem o i18n existente (pt-BR / en-US).
> **Arquivos de base:**
> - `docs/integracao-sympla/analise.md` — pesquisa completa da API Sympla (leitura obrigatória)
> - `prisma/schema.prisma` — modelo de dados atual
> - `.claude/MEMORY.md` — memória e arquitetura do projeto
> - `src/core/` — clean architecture (domain → application → infrastructure)
> - `src/app/api/` — route handlers (Next.js App Router)

---

## 1. MISSÃO E CONTEXTO DO SISTEMA

Você atua no repositório **ONE-ID**: uma plataforma SaaS multi-tenant de gestão de eventos e credenciamento (check-in) construída com Next.js 16+, React 19, TypeScript strict, Prisma/PostgreSQL (com pgvector), Tailwind v4 + shadcn/ui.

O ONE-ID já oferece:
- **Check-in por reconhecimento facial** (MediaPipe + ArcFace → embedding 512D → busca vetorial pgvector)
- **Check-in por QR Code** (BarcodeDetector + fallback jsQR)
- **Check-in por código de acesso manual**
- **Totems físicos** (kiosks) com sessão, heartbeat, kiosk mode e impressão de etiquetas (Brother QL-810W)
- **Multi-tenancy** (Organizações), RBAC (SUPER_ADMIN / ORG_OWNER / EVENT_MANAGER), audit log completo
- **Métricas de check-in** agregadas por hora (latência, confiança, taxas de falha)
- **Plans/planos** com features e limites por organização
- **i18n** (pt-BR, en-US) via next-intl
- **Impressão de crachás/etiquetas personalizáveis** (PrintConfig)

Sua missão é **integrar o Sympla** — a maior plataforma de eventos do Brasil — de forma que:

1. Eventos criados/cadastrados na Sympla apareçam automaticamente no ONE-ID (ou seja vinculados).
2. Participantes (ingressos vendidos) sincronizem automaticamente para dentro do ONE-ID.
3. Check-ins realizados nos totems ONE-ID **retornem** para a Sympla (uma única fonte de verdade espelhada nas duas plataformas).
4. Todas as informações ricas que existem na Sympla (tipo de ingresso, setor, lugar, pedido, cupom, UTM, campos personalizados do formulário, comprador vs participante) fiquem disponíveis nos fluxos ONE-ID — sem perda de informação, com **custom fields dinâmicos** onde o Sympla não fornece schema fixo.

---

## 2. ARQUITETURA OBRIGATÓRIA

Siga fielmente a arquitetura limpa já adotada no repositório:

```
src/core/
├── domain/
│   ├── entities/            # Entidades (types) espelhando o Prisma
│   ├── contracts/           # Interfaces de repositórios/serviços (abstrações)
│   └── value-objects/       # VOs como Email, SymplaEventIdHash, SymplaTicketNumber etc.
├── application/
│   ├── use-cases/{sympla}/  # Casos de uso (sync, check-in bif, conexão, ...
│   └── controllers/{sympla}/# Controllers (orquestração HTTP-agnóstica)
└── infrastructure/
    ├── environment/env.ts   # Variáveis de ambiente
    ├── http/                # Cliente HTTP Sympla (SymplaHttpClient)
    └── factories/           # make-sympla-connection.factory.ts etc.
```

**Regras de ouro:**
- Nunca quebre a dependência do domínio; repositórios são interfaces no domain e implementadas fora dele.
- Novos módulos devem seguir os padrões de factories (`make-*.factory.ts`) já existentes.
- Multi-tenancy SEMPRE: qualquer query/filtro precisa respeitar `organizationId`.
- Auditoria: toda ação crítica (conexão criada, sync rodando, check-in espelhado) gera `AuditLog` com `action` adequada (adicionar novos valores ao enum `AuditAction` se necessário — ex: `SYMPLA_CONNECTION_CREATED`, `SYMPLA_SYNC_STARTED`, `SYMPLA_SYNC_COMPLETED`, `SYMPLA_CHECKIN_MIRRORED`, `SYMPLA_SYNC_FAILED`).
- Segredos **nunca** em logs; token criptografado em repouso.

---

## 3. BLUEPRINT DE DADOS (ADITIVO AO schema.prisma)

Adicione/adote (validando com zod nas bordas). Novos campos/modelos:

```prisma
// ── Integração Sympla ──────────────────────────────

enum SymplaSyncStatus {
  IDLE
  SYNCING
  COMPLETED
  FAILED
}

enum TicketStatus {
  PENDING        // aguardando pagamento/aprovação
  APPROVED       // pago / aprovado
  CANCELED       // cancelado
  REFUNDED       // reembolsado
  USED           // usado/check-in feito
}

model SymplaConnection {
  id          String  @id @default(uuid())
  organizationId String @unique @map("organization_id")
  tokenEncrypted String @map("token_encrypted")   // AES-256-GCM
  isActive    Boolean @default(true) @map("is_active")
  lastSyncAt  DateTime? @map("last_sync_at")
  lastSyncStatus SymplaSyncStatus @default(IDLE) @map("last_sync_status")
  lastSyncResult Json? @map("last_sync_result")   // { eventsSynced, participantsSynced, errors, durationMs }
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  @@map("sympla_connections")
}

model SymplaEventLink {
  id String @id @default(uuid())
  eventId String @unique @map("event_id")
  symplaEventIdHash String @map("sympla_event_id_hash")
  symplaUrl String? @map("sympla_url")
  imageUrl String? @map("image_url")
  referenceId Int? @map("reference_id")
  categoryPrimary String? @map("category_primary")
  categorySecondary String? @map("category_secondary")
  publishedOnSympla Boolean @default(false) @map("published_on_sympla")
  cancelledOnSympla Boolean @default(false) @map("cancelled_on_sympla")
  hostName String? @map("host_name")
  lastSeedAt DateTime? @map("last_seed_at")   // para re-sincronização
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  @@map("sympla_event_links")
}

model Presentation {
  id String @id @default(uuid())
  eventId String @map("event_id")
  symplaPresentationId Int @map("sympla_presentation_id")
  name String?                            // deriva da data se não houver
  startsAt DateTime @map("starts_at")
  endsAt DateTime? @map("ends_at")
  isClosed Boolean @default(false) @map("is_closed")
  isEnabled Boolean @default(true) @map("is_enabled")
  isPublished Boolean @default(true) @map("is_published")
  isPrivate Boolean @default(false) @map("is_private")
  presentationUrl String? @map("presentation_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  sectors Sector[]
  @@unique([eventId, symplaPresentationId])
  @@index([eventId])
  @@map("presentations")
}

model Sector {
  id String @id @default(uuid())
  eventId String @map("event_id")
  name String
  symplaSectorId Int? @map("sympla_sector_id")
  presentationSectorId Int? @map("presentation_sector_id")
  hasOnlineSale Boolean @default(false) @map("has_online_sale")
  presentationId String? @map("presentation_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  event Event? @relation(fields: [eventId], references: [id], onDelete: Cascade)
  presentation Presentation? @relation(fields: [presentationId], references: [id], onDelete: SetNull)
  @@index([eventId])
  @@index([presentationId])
  @@map("sectors")
}

model TicketType {
  id String @id @default(uuid())
  eventId String @map("event_id")
  name String
  groupId Int? @map("group_id")
  groupName String? @map("group_name")
  subgroupId Int? @map("subgroup_id")
  subgroupName String? @map("subgroup_name")
  salePrice Double @default(0)
  netValue Double? @map("net_value")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  @@unique([eventId, name])
  @@index([eventId])
  @@map("ticket_types")
}

model SymplaOrder {
  id String @id @default(uuid())
  eventId String @map("event_id")
  symplaOrderSk String @map("sympla_order_sk")
  orderStatus String?
  orderDate DateTime? @map("order_date")
  approvedDate DateTime? @map("approved_date")
  updatedDate DateTime? @map("updated_date")
  buyerFirstName String? @map("buyer_first_name")
  buyerLastName String? @map("buyer_last_name")
  buyerEmail String? @map("buyer_email")
  totalSalePrice Double @default(0) @map("total_sale_price")
  totalNetValue Double @default(0) @map("total_net_value")
  discountCode String? @map("discount_code")
  transactionType String? @map("transaction_type")
  presentationId Int? @map("presentation_id")
  invoiceInfo Json? @map("invoice_info")
  utmTracking Json? @map("utm_tracking")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  @@unique([eventId, symplaOrderSk])
  @@index([eventId])
  @@index([buyerEmail])
  @@map("sympla_orders")
}

// ── DECISÃO DE MODELO: NÃO criar tabela separada "ingressos" ──────────────
// Avaliação: toda a engine de check-in (CheckIn, PersonCheckInCooldown, PrintJob,
// CheckInMetrics) já é ancorada em EventParticipant. Criar uma tabela Ticket/Ingresso
// duplicaria a representação (ingresso == participação) e, mesmo assim, exigiria
// relaxar @@unique([personId, eventId]) — ou seja, EventParticipant degeneraria num
// clone de Ticket, com o dobro de escritas/synced/joins e mais superfície de
// inconsistência. Conclusão: EventParticipant É o ingresso (o "slot" de participação
// por ticket); Person vira identidade opcional por cima.

// Alterações em Person (RELAXAR unicidade — compra em lote repete dados):
//   REMOVER  @@unique([email, organizationId])        // e-mail repetido passa a ser permitido
//   REMOVER  @@unique([document, organizationId])     // ← CPF repetido passa a ser permitido
//   MANTER   @@index([organizationId, email])
//   MANTER   @@index([organizationId, document])
//   ADICIONAR  symplaParticipantId String? @map("sympla_participant_id")

// Alterações em EventParticipant (vira o SLOT DE INGRESSO, autônomo):
//   - personId      → torna-se OPCIONAL (String?)   // Person = identidade lazy/overlay
//   - REMOVER  @@unique([personId, eventId])          // um Person pode ter N ingressos no evento
//   - ADICIONAR  @@unique([eventId, ticketNumber])    // âncora de idempotência do ingresso
//                                                     // (NULLs múltiplos são válidos p/ regex não-Sympla)
//   - ADICIONAR  @@index([eventId, symplaParticipantId])
//   - ADICIONAR campos de snapshot do atendente (independentes do Person):
//       attendeeFullName      String?          @map("attendee_full_name")
//       attendeeEmail         String?          @map("attendee_email")
//       attendeeDocument      String?          @map("attendee_document")
//       attendeeDocumentType  DocumentType?    @map("attendee_document_type")
//   - ADICIONAR campos do ingresso (fonte Sympla):
//       symplaParticipantId   String?  @map("sympla_participant_id")
//       ticketNumber          String?  @map("ticket_number")
//       ticketStatus          String?  @map("ticket_status")
//       ticketName            String?  @map("ticket_name")
//       ticketPrice           Double?  @map("ticket_price")
//       ticketNetValue        Double?  @map("ticket_net_value")
//       sectorName            String?  @map("sector_name")
//       seatLabel             String?  @map("seat_label")            // marked_place_name
//       presentationId        String?  @map("presentation_id")
//       orderId               String?  @map("order_id")              // → SymplaOrder
//       symplaCheckedIn       Boolean? @map("sympla_checked_in")
//       symplaCheckInDate     DateTime? @map("sympla_check_in_date")
//       symplaCheckInId       Int?     @map("sympla_check_in_id")
//       customFields          Json?    @map("custom_fields")          // [{name,value}] dinâmico

// Alterações em Event (adicionar campos):
//   symplaLinked Boolean @default(false) @map("sympla_linked")
//   plus as relações: symplaEventLink Presentation[] Sector[] TicketType[] SymplaOrder[]

// Alterações em Totem:
//   allowedSectors Json?  @map("allowed_sectors")   // restrição de gate por setor
//   allowedTicketTypes Json? @map("allowed_ticket_types") // restrição por tipo de ingresso
```

**IMPORTANTE sobre custom fields:**
- `EventParticipant.customFields` é `Json` com array `[{ name, value }]` — aceita QUALQUER campo extra que a Sympla colete, sem schema fixo.
- Quando o participante é criado no ONE-ID, todos os campos do `custom_form` vêm pra cá.
- A UI de listagem de participantes deve renderizar colunas dinâmicas a partir do conjunto de nomes únicos encontrados (agrupado por evento).

### 3.1 Compra em lote (bulk purchase) — política de identidade

**Cenário:** um pedido Sympla contém N ingressos para N pessoas diferentes; o comprador geralmente repete o PRÓPRIO e-mail e/ou CPF nos N tickets (ou não preenche). Cada ingresso vira um `EventParticipant` (slot autônomo). A identidade (`Person`) é resolvida assim:

1. **Linkagem `Person` (ordem de prioridade):**
   - Se o ingresso tem e-mail **e** o e-mail + nome completo casam com um `Person` existente da org → vincula (aproveita histórico/faces).
   - Senão, se o e-mail do ingresso não está em uso → cria `Person` própria com esse e-mail.
   - Senão (e-mail repetido/ausente entre múltiplos tickets) → cria `Person` própria por ingresso, **aceitando e-mail/documento duplicados no banco** (unicidade relaxada). O `Person` pode nascer sem e-mail.
2. **`Person` = identidade lazy/overlay:** o snapshot do atendente mora no `EventParticipant` (`attendeeFullName`/`attendeeEmail`/`attendeeDocument`). O `Person` só é necessário para: reconhecimento facial, histórico multi-evento e cadastro de contato na base da org.
3. **Re-sync idempotente:** a âncora é `@@unique([eventId, ticketNumber])` — re-rodar o sync NUNCA duplica slots, independentemente de e-mail/CPF repetidos.
4. **Alerta de duplicidade (anti-fraude):** na listagem de participantes, aviso visual quando dois `EventParticipant` do mesmo evento compartilham CPF ou e-mail ("Possível compra em lote / mesmo titular") — visível ao staff, sem bloquear.

### 3.2 Check-in por multiplicidade (lote)

| Método | Comportamento com lote |
|--------|------------------------|
| **QR do ingresso** | **PRIMÁRIO** — cada ticket tem `ticket_num_qr_code`/`ticketNumber` únicos → cai direto no slot certo, mesmo com e-mail/CPF repetidos |
| **Código de acesso** | Por ingresso — DERIVED de `ticket_number` ou RANDOM por ticket; se o evento usa `accessCodeSource=DOCUMENT` e o CPF se repete, `resolveDerivedCodeUnique` (já existente em `src/core/utils/derived-code.ts`) cai para RANDOM em vez de quebrar |
| **Recurso facial** | Subsidiário — só quando o `Person` tem **1 ingresso** no evento (identidade inequívoca). Se tiver N ingressos, o totem orienta "use QR ou código" e o staff resolve o slot na tela de participantes |

**Fluxo de ambiguidade facial (Person com N ingressos no evento):**
1. Match facial → identifica o `Person`.
2. Se apenas 1 dos ingressos do Person está apto (os demais cancelados/reembolsados) → check-in nesse.
3. Senão → overlay amigável "Identificamos mais de um ingresso neste nome. Use o QR ou o código do ingresso para validar." (staff pode resolver manualmente listando os slots do Person).

---

## 4. CAMADAS DE INTEGRAÇÃO (implementação)

### 4.1 Cliente HTTP (`src/core/infrastructure/http/sympla-http.client.ts`)

- Base URL: `https://api.sympla.com.br/public/v1.6.0`
- Header de auth: `s_token`
- Timeout configurável, `AbortSignal`
- Retry com **exponential backoff + jitter** em 429/5xx (respeitar `Retry-After` se presente)
- Log estruturado de erros (sem expor token)
- Tipos Zod para validação das respostas (evitar dados corrompidos entrando no banco)
- Métodos: `listEvents`, `getEvent`, `listPresentations`, `listOrders`, `getOrder`, `listOrderParticipants`, `listParticipants` (incremental com `from`), `getParticipant`, `getParticipantByTicketNumber`, `checkInByParticipantId`, `checkInByTicketNumber`, `checkInByQrCode`

### 4.2 Repositórios (contracts no domain, impl no infrastructure)

- `SymplaConnectionRepository`
- `SymplaEventLinkRepository`
- `PresentationRepository`, `SectorRepository`, `TicketTypeRepository`, `SymplaOrderRepository`
- Extensões: `PersonRepository` (upsert com `symplaParticipantId`), `EventParticipantRepository` (upsert com ticket), `EventRepository`

### 4.3 Use-cases (dentro de `src/core/application/use-cases/sympla/`)

1. **ConnectSymplaUseCase** — recebe token puro (nunca loga), criptografa, salva `SymplaConnection`, faz validação com um GET /events (health check), registra audit.
2. **DisconnectSymplaUseCase** — desativa conexão, revoga, audit.
3. **SyncEventsUseCase** — puxa eventos publicados/drafts do Sympla, faz upsert dos `SymplaEventLink`, update dos `Event` vinculados (nomes, datas, endereço, imagem).
4. **LinkEventToSymplaUseCase** — vincula um `Event` interno a um `symplaEventIdHash` (do Sympla) — cria `SymplaEventLink`.
5. **SyncPresentationsUseCase** — puxa apresentações/setores, faz upsert de `Presentation` + `Sector`.
6. **SyncParticipantsUseCase** — coração da ingestão: incremental (`ticket_updated_at > lastSyncAt`), cursor pagination, upsert de `EventParticipant` (slot) + `Person` (lazy, política 3.1) + `TicketType` + `SymplaOrder` por lotes (transações). Gerar QR (`ticket_num_qr_code`) e acesso (via `resolveDerivedCodeUnique`, por ingresso) sem quebrar por duplicidade.
7. **MirrorCheckInToSymplaUseCase** — após check-in local, escreve POST de check-in na Sympla (em fila, idempotente, com fallback quando desconectado/offline → repor em fila persistente).
8. **ReconcileCheckInsUseCase** — compara `CheckIn` local com `checkin` data do Sympla; resolve divergências (fonte de verdade: primeiro check-in registrado vence; registra no audit).
9. **ResolveParticipantByQrUseCase** — para totens ONE-ID: tentar resolver por `ticket_number` local; se não achar, consultar `getParticipantByTicketNumber` na Sympla (fallback) e matchear/upsert.
10. **SyncOrdersUseCase** — puxa pedidos (UTM, invoice, cupons) ligando a participantes e eventos.
11. **RunScheduledSyncUseCase** — orquestra todo o sync incremental em fila; controla concorrência, monitora duração, escreve `lastSyncResult`; cabe em um job Cron (Vercel Cron / BullMQ / pg-boss).

### 4.4 Controllers & API Routes

- `POST /api/organizations/[organizationId]/integrations/sympla/connect`
- `DELETE /api/organizations/[organizationId]/integrations/sympla`
- `POST /api/organizations/[organizationId]/integrations/sympla/sync` (dispara sync manual)
- `GET /api/organizations/[organizationId]/integrations/sympla/status`
- `GET /api/organizations/[organizationId]/events/[eventId]/sympla/link` + `POST` (criar vínculo)
- `POST /api/organizations/[organizationId]/events/[eventId]/sympla/pull` (puxar participantes na hora)
- Todos com autenticação (JWT session), RBAC por membership (ORM), e multi-tenancy estrito.

### 4.5 Fila de trabalhos (`src/core/infrastructure/jobs/`)

- Fila persistente (Postgres) para: sync incremental, mirror check-in, retry de falhas.
- `enqueueIfNotRunning` para evitar duplicação de syncs concorrentes.
- Job `syncParticipants` acionado por: cron (ex: a cada 60s para eventos ativos), manual (botão), e após vínculo de evento.
- Job `mirrorCheckIn` acionado: imediatamente após check-in local; retry 3x com backoff; se falhar, permanece `PENDING_SYMPLA` para reconciliação posterior.

---

## 5. UTILIZAÇÃO DOS DADOS SYMPLA NOS FLUXOS EXISTENTES

### 5.1 Check-in nos totems — enriquecer a tela de sucesso

No overlay de sucesso do totem, além do nome, mostrar quando disponível:
- **Tipo de ingresso** (ex: "VIP") com badge colorido
- **Setor** e **lugar marcado** ("Pista • Assento 15")
- **Nome do comprador** se diferente do participante ("Cortesia de João da Silva")
- Sessão/presentação ativa (se multi-sessão)
- **Multiplicidade:** se o `Person` do match tem N ingressos, seguir a regra 3.2 (QR/código; nunca dar check-in ambíguo)

### 5.2 Etiquetas / impressão (PrintConfig)

- Adicionar placeholders: `{{ticketName}}`, `{{sectorName}}`, `{{seatLabel}}`, `{{ticketNumber}}`, `{{presentationName}}`.
- Opções de impressão do código: se `qrCodeContent = ticket_number`, imprimir o `ticket_num_qr_code` do Sympla (compatível com os leitores Sympla).

### 5.3 Painel do organizador (dashboard ONE-ID)

Novas métricas quando houver link Sympla:
- Taxa de check-in global e por tipo de ingresso/setor
- Percentual pronto: `aprovados` × `presentes`
- Ticket médio, receita confirmada (netsale), pendências
- Filtro por apresentação/sessão
- Comparativo entre gates/totems

### 5.4 Acesso por setor / gate (restrição)

- `Totem.allowedSectors` / `Totem.allowedTicketTypes`: quando configurados, o totem só aceita participantes cujo setor/ticket esteja autorizado — resposta de erro clara "Este ingresso não é válido nesta portaria".
- UI de configuração por totem (multiselect de setores e tipos de ingresso do evento).

---

## 6. CUSTOM FIELDS DINÂMICOS (EXIGÊNCIA FUNCIONAL)

Regras:
1. Qualquer campo `custom_form` do Sympla é armazenado em `EventParticipant.customFields` (Json) sem pré-definição de schema.
2. A UI de "Participantes" agrupa/deriva colunas a partir dos dados existentes do evento (ex: "Tamanho da Camiseta", "Restrição Alimentar", "Transporte", "Cidade de Origem").
3. O organizador pode **declarar/renomear** campos em uma tela de "Campos personalizados" por evento (label, tipo: text/select/number/date, obrigatório opcional) — servindo tanto para o que vem do Sympla (renomear exibição) quanto para coleta manual de dados adicionais no credenciamento presencial.
4. Campos personalizados aparecem no formulário de cadastro manual de participante e na tela de detalhes do participante.
5. Nunca quebre importação existente de CSV (manter pipeline atual funcionando).

---

## 7. IDEIAS E ENRIQUECIMENTOS ALÉM DO PEDIDO (implementar o que fizer sentido)

Lista não exaustiva — avalie viabilidade, prioridade e retorno:

**Ingestão & Dados**
- [ ] Ingestão com hash de integridade por participante (evita re-importação pesada)
- [ ] Suporte a eventos de múltiplas sessões (palestras em diferentes dias/horários) com check-in por sessão
- [ ] Política configurável de identidade/duplicidade: selecionável por evento — "criar novo" (padrão Sympla) vs "merge por e-mail+nome" — nunca lançar erro por unicidade (CPF/e-mail repetidos são esperados em compra em lote)
- [ ] Alerta de duplicidade de CPF/e-mail na listagem de participantes (possível lote/erro do comprador)
- [ ] Importação de custom_fields para etiquetas/crachás (ex: impressão de "Vegetariano" em cor diferenciada)
- [ ] Suporte a "listas" personalizadas (convidados cortesia que não vieram pela Sympla) — evitar bloqueio na portaria
- [ ] Export do Sympla em vermelho retroativo (participantes que não existem localmente)

**Bidirecionalidade**
- [ ] Espelhamento de check-in ONE-ID → Sympla **em tempo quase real** (fila com retry)
- [ ] Reconciliador periódico diário para fechar gaps (quem entrou só pelo app Sympla num gate, e vice-versa)
- [ ] Notificar staff quando um check-in descartado pela Sympla acontece (divergência detectada)

**Analytics & ROI**
- [ ] Dashboard de **atribuição UTM** (vendas por canal/campanha) ligado aos check-ins reais
- [ ] Relatório de **taxa de utilização por cupom/afiliado** (quantos com cupom X compareceram)
- [ ] Funnel completo: visitantes → compradores → participantes presentes → envolvidos (check-ins em múltiplas sessões)
- [ ] Export para BI (endpoint JSON/CSV consumível por LookerStudio/Power BI)

**Operação & Staff**
- [ ] Aplicativo/PAAS para staff (web/PWA) com: busca por nome, câmera para QR, check-in manual com regras de setor
- [ ] Alertas de lotação por setor em tempo real (percentual de check-ins vs vendidos)
- [ ] Fila de entrada acelerada: pré-upload de "placas" (face) na hora do credenciamento para destravar fila interna
- [ ] Reconhecimento facial de participantes SEM cadastro prévio de face (busca por nome + face TO-PORT; se falhar, direcionar ao balcão com guichê)

**Retenção & Pós-evento**
- [ ] Emissão de certificados de participação (dados do `custom_form` para carga horária, turma, etc.)
- [ ] Coleta de NPS/pesquisa de satisfação no overlay do totem pós-check-in (configurável)
- [ ] E-mail transacional pós-evento (via integração com provider — manter em interface)
- [ ] Histórico per-person de eventos frequentados (fidelidade, tiering)

**LGPD & Segurança**
- [ ] Gestão de consentimento por participante (Json de consentimento, data, versão do termo)
- [ ] Política de retenção: purge de dados de participante X dias após evento (guardar só agregados)
- [ ] Direito ao esquecimento: endpoint de deletar PII de participante (removendo faces, embeddings e dados de pedido)
- [ ] Criptografia dos custom_fields sensíveis (campo `sensitive` na definição de campo → encriptar value em repouso)

**Experiência do participante**
- [ ] "Meu ingresso" — participante consulta pelo ticket number na portaria e recebe setor/lugar/abertura de portões
- [ ] Disponibilidade do `presentation_url` (eventos híbridos/online) no totem quando aplicável
- [ ] Suporte multilíngue no totem (pt-BR/en es) usando dados nativos

**Integrações externas (todas plugáveis atrás da SymplaHttpClient)**
- [ ] Zapier/Webhooks próprios: expor webhook ONE-ID (quando check-in acontece) para outros sistemas do organizador
- [ ] Integração com Google Calendar/BigCalendar para agendas de sessões
- [ ] Integração com WhatsApp/telegram para avisos de abertura de portão (via webhook provider)

---

## 8. SINCRONIZAÇÃO — SPECIFICACÃO DETALHADA

### 8.1 Estratégia
- **Sync incremental**: após o primeiro full sync, usar `from` = `lastSyncAt` no endpoint `participants` (que filtra por `ticket_updated_at`). Isso pega novos pedidos e mudanças de status (cancelados, reembolsos).
- **Cursor pagination**: `page_size=500` para participantes, `100` para eventos/ordens; iterar até `next_cursor` ser nulo.
- **Frequência**: eventos ativos (data dentro da janela ±7 dias) a cada 60s; demais 15min.
- **Idempotência**: upserts com chaves únicas (`symplaOrderSk`, `symplaParticipantId`, `ticketNumber` no `EventParticipant`). Re-rodar o sync nunca duplica slots nem cria `Person` repetidas além da política 3.1.
- **Cuidado com `cancelled_filter`**: processar `none`, `include` E `only` para manter integridade (marcar cancelados, não sumir).

### 8.2 Ordem de imports
1. Eventos (link) → 2. Apresentações/Setores → 3. Pedidos → 4. Participantes (com custom_form) → 5. Reconciliar check-ins.

### 8.3 Datas e timezone
Todos os `startsAt/endsAt` do Sympla são convertidos do `timezone` especificado para `DateTime` UTC no Prisma.

### 8.4 Monitoramento
- `SymplaConnection.lastSyncResult` guarda: `{ eventsSynced, participantsSynced, ordersSynced, errors: [{type, message, participantRef}], durationMs, startedAt, finishedAt }`.
- Métricas para o CheckInMetrics / logs estruturados.
- Alerta (notificação in-app) quando sync falha mais de 3x seguidas ou quando token 401 (provável expiração/revogação).

### 8.5 Política de identidade na ingestão (resumo operacional)

1. Gravar SEMPRE o snapshot do atendente no `EventParticipant` (`attendeeFullName`, `attendeeEmail`, `attendeeDocument`, `attendeeDocumentType`) com o `custom_form` em `customFields`.
2. Resolver `Person` pela ordem da seção 3.1 (e-mail+nome → e-mail livre → Person própria por ticket aceitando duplicidade).
3. Gerar credenciais de check-in POR INGRESSO:
   - `qrCodeValue` = `ticket_num_qr_code` do Sympla (provenance MANUAL) quando houver; senão `resolveDerivedCodeUnique`.
   - `accessCode` = `resolveDerivedCodeUnique` usando `accessCodeSource` do evento; se a fonte (ex: DOCUMENT) colidir no lote, o fallback RANDOM já o resolve.
4. Nunca lançar `P2025/P2002` (Prisma unique) que aborte o sync por CPF/e-mail/ticket repetido — qualquer violação restante deve ser capturada, auditada como `error` no `lastSyncResult` e o lote continuado.

---

## 9. TESTES EXIGIDOS

- **Unit (Vitest)**: `SymplaHttpClient` (mock nock/fetch), parsing Zod, conversor DTO→entity, upsert lógica (idempotência), cooldown/retry, reconciliação (regras de conflito).
- **Integration**: use-cases de sync com repositório fake (in-memory) e banco de teste PostgreSQL.
- **Contract**: fixture JSON real da API Sympla (exemplo dos DTOs em `docs/integracao-sympla/analise.md`) — sem chamar API real em CI.
- **E2E (Playwright)**: tela de configuração de integração (conectar com token mocado), vincular evento, listar participantes enriquecidos.
- Cobertura mínima alvo: 80% nos módulos `sympla/*`.

---

## 10. FASES DE ENTREGA (P0 → P4)

| Fase | Escopo | Critério de pronto |
|------|--------|--------------------|
| **P0 — Fundação** | Schema Prisma + migrations; criptografia; SymplaHttpClient; Connect/Disconnect use-cases + UI de conexão; health check do token | Conectar/desconectar com token válido; token cifrado no banco |
| **P1 — Ingestão** | SyncEvents, LinkEventToSympla (UI de vínculo), SyncParticipants full+incremental com **compra em lote** (N ingressos repetindo e-mail/CPF, sem quebrar), custom_fields, enriquecimento da tela de participante | Participantes da Sympla aparecem no ONE-ID com ingressos/setores/campos custom; lote com dado repetido sincroniza sem erro; sync manual e por cron |
| **P2 — Bidirecionalidade** | MirrorCheckInToSympla (fila+retry), ReconcileCheckIns, ResolveParticipantByQr (fallback Sympla) | Check-in nos totems reflete na Sympla; divergências reconciliadas |
| **P3 — Enriquecimento** | Sessões/apresentações, restrição por setor/gate, etiquetas com placeholders, dashboard com taxa por ticket, orders/UTM/invoice no painel | Totems respeitam setores; dashboards enriquecidos |
| **P4 — Avançado** | Campos dinâmicos customizáveis, certificados, NPS pós-check-in, LGPD/consent/retention, export BI, PWA staff | Roadmap de ideias priorizados e entregues; suíte completa verde |

**Regra:** não pular de fase sem que a anterior esteja coberta por testes e review. Cada fase termina com `pnpm lint`, `pnpm typecheck`, `pnpm test` ok.

---

## 11. QUALITY GATES (NÃO NEGOCIÁVEIS)

- [ ] `pnpm lint` sem erros de run no fim de cada fase
- [ ] `pnpm typecheck` limpo (TypeScript strict)
- [ ] `pnpm test` — suíte verde (unit + integration da fase)
- [ ] Multi-tenancy respeitado em **todas** as queries novas (forçar `organizationId`)
- [ ] Nenhuma secret em código, logs, ou fixtures
- [ ] Criptografia do token AES-256-GCM com chave em env (KMS/`SYMPLA_TOKEN_KEY`)
- [ ] Idempotência comprovada (re-roda sync sem criar duplicados — âncora `ticketNumber`)
- [ ] Unicidade de `Person` relaxada (e-mail/documento) SEM quebrar buscas (índices mantidos) e SEM lançar erro abortando sync por duplicidade
- [ ] Alerta de duplicidade de CPF/e-mail presente na listagem de participantes
- [ ] Cancelados/reembolsos tratados e auditados, nunca "sumindo" da lista
- [ ] Erros da Sympla exibidos amigáveis na UI (RFC 9457 parseado → mensagem em pt-BR)
- [ ] i18n: novas strings em pt-BR e en-US
- [ ] Update do `.claude/MEMORY.md` ao final com as decisões de arquitetura

---

## 12. COMO PROCEDER

1. Leia `docs/integracao-sympla/analise.md` por completo.
2. Leia `prisma/schema.prisma` e `.claude/MEMORY.md`.
3. Explore `src/core` para replicar exatamente os padrões (entities, contracts, factories, controllers).
4. Implemente **P0 → P4** em sequência, com commits atômicos e mensagens descritivas.
5. Adicione fixtures JSON da API Sympla em `tests/fixtures/sympla/` para testes de contrato.
6. Ao terminar cada fase, rode os quality gates e atualize o `MEMORY.md`.

**Objetivo final:** o ONE-ID se torna o hub central de credenciamento e aplicação de eventos — com a Sympla como motor de vendas/ingressos e o ONE-ID como executora de experiência presencial (face, QR, código, etiquetas, setores, métricas, pós-evento) — sem perder NENHUMA informação rica coletada na Sympla.
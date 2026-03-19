# OneID by Fivents - Leitura Consolidada do Projeto

## 1) O que este projeto e

OneID e uma plataforma SaaS de credenciamento para eventos, com foco em check-in por reconhecimento facial e operacao via totems (kiosks), com controle multi-organizacao, permissao por papeis, trilha de auditoria e gestao comercial por planos.

Resumo em uma frase:

- Sistema de identidade e credenciamento para eventos, orientado por organizacoes, eventos, participantes e totems com IA facial.

## 2) O que ele promete (proposta de valor)

Com base no codigo atual (especialmente `prisma/schema.prisma` e modulo de totem/IA):

- Check-in rapido por face em eventos.
- Operacao com totem dedicado (login, sessao, ciclo de deteccao e envio de check-in).
- Controle de um ecossistema multi-tenant por organizacao.
- Governanca por papeis (`SUPER_ADMIN`, `ORG_OWNER`, `EVENT_MANAGER`).
- Gestao de planos, categorias e recursos (features) para controlar oferta do produto.
- Auditoria de acoes criticas (seguranca, operacao e compliance).
- Notificacoes para eventos de negocio (plano, avisos etc.).
- Internacionalizacao (`i18n`) aplicada no frontend.

## 3) Base principal do dominio (Prisma Schema)

A base principal do sistema esta no schema Prisma em `prisma/schema.prisma`, que define o modelo de dados, regras de relacao e constraints.

### 3.1) Enums centrais

- `Role`: SUPER_ADMIN, ORG_OWNER, EVENT_MANAGER.
- `EventStatus`: DRAFT, PUBLISHED, ACTIVE, COMPLETED, CANCELED.
- `CheckInMethod`: FACE_RECOGNITION, QR_CODE, MANUAL.
- `TotemStatus`: ACTIVE, INACTIVE, MAINTENANCE.
- `PlanRequestStatus`: PENDING, APPROVED, REJECTED.
- `ActorType`, `EntityType`: suporte a rastreabilidade/logica de auditoria.
- `NotificationType`, `NotificationChannel`: tipagem de notificacoes.
- `DocumentType`: padrao documental de pessoa.
- `PrintOrientation`: configuracao de impressao.
- `AuditAction`: catalogo amplo de eventos auditaveis.

### 3.2) Blocos de dominio (models)

#### A) Identidade, acesso e sessao

- `User`
- `Membership` (vinculo usuario x organizacao + papel)
- `Session` (sessao de usuario)
- `AuthIdentity` (provedor de auth, senha local, etc.)

Regras importantes:

- Unicidade de usuario por email.
- Unicidade de membership por `(userId, organizationId)`.
- Controle soft-delete em varios agregados (`deletedAt`).

#### B) Organizacao e estrutura comercial

- `Organization`
- `Subscription`
- `PlanCategory`
- `Plan`
- `Feature`
- `PlanFeature`
- `PlanChangeRequest`

Regras importantes:

- Organizacao tem assinatura atual (`Subscription`) e historico de solicitacoes de troca de plano (`PlanChangeRequest`).
- `PlanFeature` habilita modelagem de recursos por plano (feature flags/licenciamento).

#### C) Eventos, pessoas e credenciamento

- `Event`
- `EventAIConfig`
- `Person`
- `PersonFace`
- `EventParticipant`
- `CheckIn`
- `PrintConfig`

Regras importantes:

- `Event` pertence a `Organization` e pode referenciar `PrintConfig`.
- `EventAIConfig` e 1:1 com `Event` e guarda parametros de deteccao facial.
- `Person` e unica por `(email, organizationId)`.
- `EventParticipant` e unico por `(personId, eventId)`.
- `CheckIn` aponta para participante do evento e opcionalmente para subscricao de totem no evento.

#### D) Totens e operacao em campo

- `Totem`
- `TotemSession`
- `TotemOrganizationSubscription`
- `TotemEventSubscription`

Regras importantes:

- Totem pode ser atribuido a organizacao por janela de tempo.
- Totem da organizacao pode ser atribuido a evento por janela de tempo.
- Campos de revogacao (`revokedAt`, `revokedReason`) sustentam encerramento controlado de vinculos.
- Sessao de totem separada da sessao de usuario web.

#### E) Observabilidade e comunicacao

- `AuditLog`
- `Notification`

Regras importantes:

- `AuditLog` indexado por acao/data e entidades relacionadas (session, user, organization, event).
- `Notification` vinculada a usuario com suporte a payload JSON (`data`).

## 4) Fluxos funcionais principais (inferidos do codigo)

### 4.1) Fluxo de autenticacao

- Usuario corporativo:
  1. Check de email
  2. Login por senha ou setup inicial de senha
- Admin:
  - OAuth Google (fluxo dedicado em `/api/auth/google` e callback)
- Totem:
  - Login por codigo/chave de acesso
  - Obtencao de sessao de totem

### 4.2) Fluxo de totem + IA facial

- Totem autentica.
- Carrega contexto ativo (evento atual + configuracao de IA).
- Inicia runtime facial no cliente (worker com `@vladmandic/human`).
- Captura face, extrai embedding, envia tentativa de check-in.
- API valida: contexto ativo, restricoes (ex. cooldown/multiplas faces), matching por embedding e registra check-in.

### 4.3) Fluxo operacional de evento

- Criacao/gestao de evento.
- Vinculo de participantes.
- Vinculo de totems ao evento.
- Check-ins em tempo real e historico.
- Configuracoes de IA por evento.
- Configuracao de impressao de credencial (PrintConfig).

## 5) Arquitetura do codigo (organizacao tecnica)

O projeto segue separacao em camadas no `src/core`:

- `core/domain`: entidades, contratos, value objects.
- `core/application`: use-cases, controllers, services, client-services.
- `core/communication`: requests/responses tipados.
- `core/infrastructure`: prisma client, repositorios, middlewares HTTP, factories.
- `core/errors`: catalogo de erros por contexto de negocio.

Na borda web:

- `src/app`: App Router Next.js (paginas e API routes).
- `src/components`: componentes de UI e modulos de tela.
- `src/i18n`: contexto e dicionarios de traducao.

## 6) Superficie funcional atual

### 6.1) Frontend (paginas)

Paginas encontradas: 16 entradas `page.tsx`, cobrindo:

- Login e setup de senha.
- Dashboard.
- Modulo admin (organizacoes, planos, totems, usuarios).
- Modulo por organizacao (eventos, pessoas, totems).
- Operacao de totem (login e credentialing em tela cheia).

### 6.2) Backend (API)

- 85 rotas `route.ts` no `src/app/api`.
- Cobertura ampla de contextos: auth, admin, eventos, check-ins, pessoas, faces, totems, organizacoes, sessoes, notificacoes, planos etc.

## 7) Stack e tecnologia

Com base em `package.json`:

- Next.js 16 + React 19 + TypeScript 5
- Prisma 7 + Postgres (Neon)
- Tailwind CSS 4 + Radix/shadcn
- Zod para validacao
- `@vladmandic/human` para runtime de visao/face no cliente
- Sonner para toasts

## 8) Internacionalizacao

- Projeto com camada `i18n` estruturada.
- Uso de chaves de traducao no frontend para texto de UI.
- Existe namespace de paginas em traducao para manter consistencia de textos.

## 9) Regras e constraints relevantes do negocio

- Multi-tenant por organizacao com membership e role.
- Participante unico por pessoa+evento.
- Pessoa unica por email dentro da organizacao.
- Assinatura ativa por organizacao.
- Vinculos temporais de totem por organizacao e evento.
- Soft-delete disseminado para rastreabilidade.
- Auditoria de acoes sensiveis.

## 10) Pontos de atencao observados

- `README.md` esta vazio no estado atual, entao o conhecimento real esta distribuido no codigo e no schema.
- Pela amplitude de rotas e modulos, este e um sistema de produto em evolucao ativa (nao apenas MVP basico).
- O schema e rico e de fato e a melhor fonte de verdade do dominio, como voce indicou.

## 11) Definicao curta para time/produto

Se precisar explicar internamente em 20 segundos:

- "OneID e uma plataforma SaaS de credenciamento para eventos com check-in facial e operacao por totems, multi-organizacao, com controle de planos, auditoria e configuracao de IA por evento."

## 12) Inventario rapido de entidades (schema)

- Organization, User, Membership, Session, AuthIdentity
- Event, EventAIConfig, PrintConfig
- Person, PersonFace, EventParticipant, CheckIn
- Totem, TotemSession, TotemOrganizationSubscription, TotemEventSubscription
- PlanCategory, Plan, Feature, PlanFeature, Subscription, PlanChangeRequest
- AuditLog, Notification

---

Documento gerado a partir da leitura de estrutura, rotas e principalmente do schema Prisma do projeto.

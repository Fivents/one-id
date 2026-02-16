# OneId by Fivents
Uma aplicação SaaS para credenciamento em eventos no Brasil utilizando reconhecimento facial em totens com sistema android.

## Mentalidade correta: não estamos fazendo um app, estamos fazendo um SaaS B2B
O sistema terá:
- Nossa empresa (provider)
- Clientes (empresas contratantes)
- Eventos
- Totens
- Usuários com papéis diferentes
- Contratos diferentes

## Autenticação ≠ Autorização (conceito vital)
### Autenticação
```Quem é você?```
- Login
- Sessão
- Token

### Autorização
```O que você pode fazer?```
- Ver eventos?
- Criar eventos?
- Ver dados biométricos?
- Gerenciar totens?
- Exportar dados?

## Devemos ter autenticação!
### Quem precisa autenticar?
- Nossa equipe (admin)
- Equipe do cliente
- (Talvez) operadores de evento
- ❌ Totens não usam login tradicional

## Tipos de usuários (isso é produto, não código)
### Usuário da nossa empresa (Provider)
- Admin geral
- Cria clientes
- Cria planos
- Vê todos os eventos
- Vê métricas globais

### Usuário do cliente
- Vê somente os eventos dele
- Gerencia participantes
- Vê relatórios
- Não vê outros clientes

### Operador de evento
- Pode operar no dia
- Pode ver check-in
- Não pode exportar dados
- Não mexe em contrato

## Totens NÃO usam login de usuário
### Totem:
- não é pessoa
- não tem senha
- não tem sessão humana

### Totem deve usar:
- chave de dispositivo
- token curto
- escopo limitado
- amarrado a um evento

obs: 👉 Se alguém roubar o token do totem, o estrago é limitado.

## Modelo de autorização
### RBAC + escopo por cliente.
Exemplo: 

| Papel          | Escopo                 |
| -------------- | ---------------------- |
| PROVIDER_ADMIN | Tudo                   |
| CLIENT_ADMIN   | Só empresa dele        |
| EVENT_MANAGER  | Só eventos específicos |
| OPERATOR       | Só leitura / check-in  |

## Multi-tenant: isso é obrigatório
👉 Um banco, múltiplos clientes
👉 Isolamento lógico obrigatório
Tudo precisa ter `organization_id (ou tenant_id)`
Sem isso:
- vazamento de dados
- quebra de contrato
- problema jurídico

## Auditoria (obrigatório para evento)
Precisamos saber:
- quem fez check-in
- quando
- de qual totem
- qual operador
- em qual evento
isso nos protege juridicamente.

## Feature flags / planos
Exemplos:
- limite de participantes
- número de totens
- credenciamento facial, qr-code ou ambos ?

## Logs operacionais
No dia do evento:
- erro acontece
- fila acontece
- cliente liga
Precisamos ver logs por evento.

## Consentimento (LGPD)
Como trabalhamos com biometria, precisamos:
- armazenar consentimento
- data
- versão do termo
- quem aceitou

## Soft delete (muito importante)
Não podemos sair apagando os dados.
- `deleted_at`
- histórico preservado
- auditoria intacta

## Arquitetura mental correta
```
Usuário não é cliente
Cliente não é evento
Evento não é totem
Totem não é usuário
```

## Resumo executivo (decisão)
| Item           | Decisão           |
| -------------- | ----------------- |
| Autenticação   | **SIM**           |
| Autorização    | **RBAC + tenant** |
| Totem login    | ❌                 |
| Token de totem | ✅                 |
| Auditoria      | ✅                 |
| Consentimento  | ✅                 |
| Multi-tenant   | ✅                 |

## Estrutura de pastas do projeto
src/
├─ app/
│  ├─ (public)/
│  │  ├─ login/
│  │  └─ register/
│  │
│  ├─ (saas)/
│  │  ├─ dashboard/
│  │  ├─ organizations/
│  │  ├─ events/
│  │  ├─ users/
│  │  ├─ billing/
│  │  └─ settings/
│  │
│  ├─ (totem)/
│  │  ├─ auth/
│  │  ├─ check-in/
│  │  └─ success/
│  │
│  ├─ api/
│  │  ├─ auth/
│  │  ├─ events/
│  │  ├─ participants/
│  │  └─ totem/
│  │
│  └─ layout.tsx
│
├─ components/
│  ├─ ui/            # shadcn
│  ├─ layout/
│  ├─ forms/
│  └─ shared/
│
├─ domain/
│  ├─ auth/
│  ├─ organization/
│  ├─ event/
│  ├─ participant/
│  ├─ totem/
│  └─ billing/
│
├─ services/
│  ├─ face-recognition/
│  ├─ storage/
│  ├─ email/
│  └─ printer/
│
├─ lib/
│  ├─ db.ts
│  ├─ env.ts
│  ├─ auth.ts
│  └─ permissions.ts
│
└─ types/

## Explicação rápida da estrutura
### 🔐 (public)
- Login
- Registro
- Recuperação de senha
- Nenhum dado sensível

### 🏢 (saas) — Painel administrativo
Usado por:
- A gente (nossa empresa)
- Nossos clientes (organizadores)
Aqui entram:
- Criar eventos
- Gerenciar participantes
- Upload de imagens
- Relatórios
- Billing

### 🤖 (totem) — Experiência kiosk
Usado por:
- Totens Android
- Sem menu
- Sem dashboard
- Sem navegação livre
Fluxo simples:
`Auth → Reconhecimento → Confirmação → Impressão`

### 🧠 domain/
Aqui mora o coração do sistema.
Exemplo:
domain/event/
  ├─ event.entity.ts
  ├─ event.service.ts
  ├─ event.repository.ts
UI nunca acessa DB direto.
Tudo passa pelo domínio.

### 🔌 services/
Integrações externas:
- face-api.js
- storage de imagens
- impressora
- email
futuramente: WhatsApp, SMS, etc

## Conceito-chave: Organization
Tudo no sistema pertence a uma:
`organization_id`
- Usuários
- Eventos
- Participantes
- Totens
- Imagens
- Logs

👉 Nunca crie nada sem organization_id.
Isso evita 90% dos problemas de SaaS.

## Autenticação profissional (SaaS + Totem + RBAC)
Separação clara entre:
- Usuários humanos
- Clientes
- Totens

## Auth ≠ Usuário
### Auth responde:
- Quem é você?
- Você pode entrar?

### Autorização responde:
- O que você pode fazer?
- Em nome de quem?

## Tipos de “atores” no sistema
### User (humano)
Pessoa real:
- Funcionário da sua empresa
- Cliente organizador de eventos
- Staff do evento

### Organization (empresa cliente)
Tudo pertence a uma Organization.

### Totem (usuário técnico)
Totem NÃO é User.
- Não tem email
- Não tem senha
- Não acessa dashboard
- Só executa ações específicas

## Relação User ↔ Organization (multi-tenant real)
Um usuário pode:
- Pertencer a várias organizações
- Ter papéis diferentes em cada uma
Modelo correto:
```
Membership {
  user_id
  organization_id
  role
}
```
Exemplo:
- Você → ADMIN na sua empresa
- Cliente → OWNER na organização dele
- Staff → STAFF em um evento específico

## Roles (RBAC) — padrão profissional
```
SUPER_ADMIN   (só a gente)
ORG_OWNER
ORG_ADMIN
EVENT_MANAGER
STAFF
```
Totem não usa role, usa scope.


## Permissões (não confunda com roles)
Role define quem você é. Permission define o que você pode fazer.
Exemplo: 
```
permissions = {
  EVENT_CREATE,
  EVENT_EDIT,
  PARTICIPANT_IMPORT,
  VIEW_REPORTS,
  MANAGE_TOTEMS,
}
```
Role → conjunto de permissões.
📌 Isso permite:
- Limitar por plano
- Customizar contratos
- Escalar sem refatorar

## Como o Totem se autentica (muito importante)
Totem não faz login.
Fluxo correto:
1. Totem recebe uma API Key
2. Essa key:
- Está vinculada a:
  - Organization
  - Event
- Tem escopo limitado

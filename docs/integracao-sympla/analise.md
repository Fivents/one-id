# Análise Completa: Integração Sympla ↔ ONE-ID

> Pesquisa fundamentada em fontes oficiais — set/2026

---

## 1. API Sympla (Pública v1.6.0) — Referência Técnica Completa

### 1.1 Autenticação

| Campo | Valor |
|-------|-------|
| Método | API Key no header HTTP |
| Header | `s_token` |
| Escopo | Conta do produtor (organizador) — 1 token por conta Sympla |
| Geração | Sympla → Minha Conta → Integrações → Criar chave de acesso |
| Multi-tenancy | Cada organização ONE-ID armazena seu próprio `s_token` |

**Implicação para ONE-ID:** o `SymplaConnection` pertence à `Organization`. Tokens devem ser criptografados em repouso (AES-256-GCM) e jamais expostos em logs.

---

### 1.2 Endpoints Disponíveis (v1.6.0)

#### Eventos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v1.6.0/events` | GET | Lista eventos (paginação cursor) |
| `/v1.6.0/events/{eventIdHash}` | GET | Detalhe de um evento |

**Parâmetros relevantes de filtro de eventos:**
- `published`: `true` | `false` | `all`
- `from` / `timezone`: intervalo temporal
- `field_sort`: `start_date` (padrão) | `end_date` | `name`
- `sort`: `asc` (padrão) | `desc`
- `page_size`: 1–200 (padrão 100)
- `cursor`: cursor opaque para próxima página
- `fields`: `id`, `reference_id`, `start_date`, `end_date`, `name`, `detail`, `private_event`, `published`, `cancelled`, `image`, `url`, `address`, `host`, `category_prim`, `category_sec`

#### Pedidos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v1.6.0/events/{eventIdHash}/orders` | GET | Lista pedidos |
| `/v1.6.0/events/{eventIdHash}/orders/{orderSk}` | GET | Detalhe de pedido |
| `/v1.6.0/events/{eventIdHash}/orders/{orderSk}/participants` | GET | Participantes de um pedido |

**Campos de pedido (`OrderResponseDTO`):**
- `id`, `event_id`, `order_date`, `order_status`, `updated_date`, `approved_date`
- `buyer_first_name`, `buyer_last_name`, `buyer_email`
- `order_total_sale_price`, `order_total_net_value`
- `discount_code`, `transaction_type`
- `presentation_id`
- `invoice_info`: `{ doc_number, doc_type, client_name, address_street, address_city, ... }`
- `utm`: `{ utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, user_agent }`

**Filtros extras:** `cancelled_filter`, `buyer_email`, `from`/`to` (intervalo temporal)

#### Participantes

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v1.6.0/events/{eventIdHash}/participants` | GET | Lista participantes |
| `/v1.6.0/events/{eventIdHash}/participants/{participantId}` | GET | Participante por ID |
| `/v1.6.0/events/{eventIdHash}/participants/ticketNumber/{ticketNumber}` | GET | Participante por número de ingresso |

**Campos de participante (`ParticipantResponseDTO`) — O MAIS COMPLETO:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID interno do participante na Sympla |
| `first_name` | string | Nome |
| `last_name` | string | Sobrenome |
| `email` | string | E-mail |
| `event_id` | string | ID do evento |
| `presentation_id` | int | ID da sessão/apresentação |
| `order_id` | string | ID do pedido |
| `order_status` | string | Status do pedido |
| `order_date` | datetime | Data do pedido |
| `order_approved_date` | datetime | Data de aprovação |
| `order_updated_at` | datetime | Última atualização do pedido |
| `order_discount` | string | Desconto aplicado |
| `ticket_status` | string | Status do ingresso |
| `ticket_name` | string | Nome do tipo de ingresso |
| `ticket_number` | string | Número único do ingresso |
| `ticket_num_qr_code` | string | Código QR numérico |
| `ticket_created_at` | datetime | Data de criação do ingresso |
| `ticket_updated_at` | datetime | Última atualização do ingresso |
| `ticket_sale_price` | double | Preço pago |
| `ticket_net_value` | double | Valor líquido |
| `ticket_group_id` | int | ID do grupo de ingresso |
| `ticket_group_name` | string | Nome do grupo (ex: "Ingressos VIP") |
| `ticket_subgroup_id` | int | ID do subgrupo |
| `ticket_subgroup_name` | string | Nome do subgrupo |
| `sector_name` | string | Nome do setor físico |
| `marked_place_name` | string | Lugar marcado |
| `item_id` | string | ID do item |
| `access_information` | string | Informações de acesso |
| `checkin` | `{check_in: bool, check_in_date: datetime, check_in_id: int}` | Status do check-in |
| `custom_form` | `[{id, name, value}]` | **Campos personalizados do formulário** |

**Filtros extras:** `cancelled_filter`, `participant_email`, `from`/`to` (`ticket_updated_at`), `page_size` 1–500

#### Apresentações / Sessões

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/v1.6.0/events/{eventIdHash}/presentations` | GET | Lista sessões |
| `/v1.6.0/events/{eventIdHash}/presentations/{presentationId}` | GET | Detalhe da sessão |
| `/v1.6.0/events/{eventIdHash}/presentations/{presentationId}/participants` | GET | Participantes de uma sessão |
| `/v1.6.0/events/{eventIdHash}/presentations/{presentationId}/orders` | GET | Pedidos de uma sessão |

**Campos de apresentação (`PresentationResponseDTO`):**
- `id` (int), `event_id`, `start_date`, `end_date`
- `start_date_utc`, `end_date_utc`
- `published`, `closed`, `enabled`, `private_presentation`
- `presentation_url` (para eventos online)
- `sectors`: `[{ id, name, has_online_sale_available }]` — **setores físicos**

#### Check-in (escrita)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /v1.6.0/events/{eventIdHash}/participants/{participantId}/check-in` | POST | Check-in por ID |
| `POST /v1.6.0/events/{eventIdHash}/participants/ticketNumber/{ticketNumber}/check-in` | POST | Check-in por número |
| `POST /v1.6.0/events/{eventIdHash}/qrcode/check-in` | POST | Check-in por payload QR |

**Resposta de check-in:**
```json
{
  "check_in": true,
  "check_in_date": "2026-09-18T14:30:00Z",
  "check_in_id": 12345
}
```

**Tratamento de erros:**
- `401` — Token inválido
- `403` — Sem permissão no evento
- `404` — Participante/evento não encontrado
- `410` — QR code expirado (apenas endpoint de QR)
- `422` — Dados inválidos (validação de campos)

**Payload QR Code (`TicketQrCodeRequestDTO`):**
- `itemId` (string, min 1), `signature` (string, 130–132 chars), `timestamp` (int64), `version` (number), `walletId` (string)

---

### 1.3 Paginação

**v1.6.0 — Cursor-based:**
- `page_size`: 1–200 (eventos/pedidos/apresentações), 1–500 (participantes)
- `cursor`: valor da `pagination.next_cursor` da resposta anterior
- `pagination.quantity`: total de registros

**v1.5.x — Offset-based (legado):**
- `page`, `page_size` (padrão 30–100)
- `has_next`, `has_prev`, `offset`, `total_page`, `total_records`

**Recomendação:** usar v1.6.0 (cursor) para evitar paginated drift e melhor performance em datasets grandes.

---

### 1.4 Campos Dinâmicos (`custom_form`)

O campo `custom_form` no `ParticipantResponseDTO` é um array de objetos:
```json
[
  { "id": 123, "name": "Tamanho da Camiseta", "value": "M" },
  { "id": 456, "name": "Restrição Alimentar", "value": "Vegetariano" },
  { "id": 789, "name": "Transporte", "value": "Van coletiva" }
]
```

Cada organizador configura esses campos diretamente na plataforma Sympla (aberto em cada evento). São criados para coletar informações extras dos participantes na hora da compra/inscrição.

**Mapeamento para ONE-ID:** Cada campo customizado do Sympla → instância dinâmica no modelo `EventParticipantCustomField`, que usa `Json` tipado ou a tabela `CustomFieldDefinition` para definir schema por evento.

---

### 1.5 Dados de Endereço do Evento (`AddressResponseDTO`)

```json
{
  "name": "Arena Anhembi",
  "address": "Av. Paulista",
  "address_alt": "Perto do metrô",
  "address_num": "1000",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01310-100",
  "country": "Brasil",
  "lat": -23.5632,
  "lon": -46.6541
}
```

**Mapeamento:** Complementa o campo `address` (string) e `addressDetails` (Json) existentes no `Event` do ONE-ID.

---

### 1.6 Dados de Comprador (`InvoiceInfoResponseDTO`)

Disponível via endpoint de pedidos:
```json
{
  "client_name": "João da Silva",
  "doc_type": "CPF",
  "doc_number": "123.456.789-00",
  "address_street": "Rua das Flores",
  "address_street_number": "123",
  "address_neighborhood": "Centro",
  "address_city": "São Paulo",
  "address_state": "SP",
  "address_zip_code": "01001-00"
}
```

**Implicação:** Permite distinguish **comprador** (buyer) de **participante** (attendee). Um pedido pode ter múltiplos participantes — o comprador pode não ser o participante.

---

### 1.7 UTM Tracking (`UtmResponseDTO`)

Cada pedido contém dados completos de atribuição de marketing:
```json
{
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "lancamento",
  "utm_content": "banner_v1",
  "utm_term": "evento+tech",
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0..."
}
```

---

### 1.8 Setores e Lugares Marcados

- `sector_name` — nome do setor físico do evento (ex: "Pista", "VIP", "Camarote")
- `marked_place_name` — assento/lugar específico (para eventos com mapa de assentos)
- Apresentações possuem `sectors` com `has_online_sale_available` (boolean)

---

### 1.9 Notas Importantes da API

| Aspecto | Detalhe |
|---------|---------|
| Null fields | Campos null são omitidos por padrão; use `fields` query param para incluir |
| `fields` query param | Seleção de campos — garante controle fino sobre o payload |
| Erros RFC 9457 | Respostas de erro seguem Problem Details (status, title, detail, type, violations) |
| Route aliases | `/checkin` e `/checkIn` são redirecionados para `/check-in` pelo gateway |
| Feature flags | `ticket_group_id/name` e `ticket_subgroup_id/name` só retornam quando GrowthBook flag está ativa |
| `cancelled_filter` | `none` (padrão) / `include` / `only` — aplicável a orders e participants |
| Timezone | Todos os datas suportam `timezone` IANA (padrão: `America/Sao_Paulo`) |

---

## 2. Plataforma Sympla (fora da API) — Funcionalidades Relevantes

### 2.1 Check-in no App Organizador

5 métodos suportados pela Sympla:
1. **QR Code (celular)** — scanner do app
2. **Web** — busca por nome/número do ticket
3. **Barcode reader** — leitor conectado ao PC
4. **Excel offline** — exporta lista, check-in offline, sincroniza depois
5. **PDF impresso** — lista de participantes impressa para conferência manual

**Funcionalidades avançadas do app:**
- Múltiplos gates (portarias) com restrição por tipo de ingresso por gate
- Controle de acesso por nível de permissão para staff
- Dashboard em tempo real no app
- Modo offline completo com sincronização automática
- Relatório de fluxo de entrada (últimas 24h)

---

### 2.2 Programa de Afiliados

- Organizadores habilitam o programa → afiliados recebem link + código promocional
- Comissões pagas diretamente pelo organizador (Sympla não intermediária)
- Rastreio de: visitas via link, tickets vendidos, dados financeiros
- Usa ferramenta terceira (Buzzlead)
- **API pública NÃO tem endpoint de afiliados** (apenas documentado em v3 legado)

---

### 2.3 Sistema de Cupons

**Cupom padrão:**
- Código único por evento (case-insensitive)
- Desconto percentual OU valor fixo
- Limite de uso disponível
- Aplicável a tipos específicos de ingresso
- Apenas 1 cupom por compra

**Cupom restrito:**
- Códigos únicos e intransferíveis por beneficiário
- Upload via planilha
- Perfeito para: associados, patrocinadores, promotores, listas VIP

**Cupom de promotor:**
- Link de promoção único por promotor
- Pode ter 0% desconto (apenas rastreamento)
- Dados vinculados ao pedido (`discount_code`)

---

### 2.4 Dashboard em Tempo Real

- Vendas líquidas, ingressos aprovados, ticket médio
- Evolução diária com picos e impacto de campanhas
- Preferências do público (método de pagamento, uso de cupons)
- Detalhamento por tipo de ingresso e campanha
- Filtros por período e tipo de ingresso
- **Não disponível via API pública** — apenas no painel da Sympla

---

### 2.5 Integrações Nativas da Sympla

| Categoria | Ferramentas |
|-----------|-------------|
| E-mail marketing | Mailchimp, ActiveCampaign, RD Station, Dinamize, MailerLite |
| CRM | HubSpot, Salesforce, Pipedrive, RD Station CRM |
| BI/Dados | Kondado (Power BI, Looker Studio, Google Sheets) — 64 campos |
| Messenger | Discord, Slack |
| SMS | Twilio, WANotifier (WhatsApp) |
| Analytics | Google Analytics, Google Ads, Facebook Pixel |
| Automação | Zapier, Pluga, Albato |
| ERP | Conta Azul via Pluga |

---

### 2.6 Métodos de Pagamento

Visa, MasterCard, Amex, Elo, Hipercard, PIX (QR 15min), Apple Pay, Google Pay, NuPay, Boleto, iFood Benefícios, cartão internacional, Click to Pay. Parcelamento até 12x sem juros.

---

## 3. Mapeamento Campo-a-Campo: Sympla → ONE-ID

### 3.1 Evento

| Campo Sympla | Campo ONE-ID (prisma) | Observação |
|---|---|---|
| `EventResponseDTO.id` | `Event.symplaEventIdHash` (novo) | Hash do evento na Sympla |
| `EventResponseDTO.name` | `Event.name` | Mapeamento direto |
| `EventResponseDTO.detail` | `Event.description` | Mapeamento direto |
| `EventResponseDTO.start_date` | `Event.startsAt` | Converter timezone |
| `EventResponseDTO.end_date` | `Event.endsAt` | Converter timezone |
| `EventResponseDTO.published` | `Event.status` | `true` → `PUBLISHED`, `false` → `DRAFT` |
| `EventResponseDTO.cancelled` | `Event.status` | `1` → `CANCELED` |
| `EventResponseDTO.image` | `Event.imageUrl` (novo) | URL da imagem |
| `EventResponseDTO.url` | `Event.symplaUrl` (novo) | Link público |
| `EventResponseDTO.private_event` | — | Flag de visibilidade (usar em lógica) |
| `EventResponseDTO.address.*` | `Event.address` + `Event.addressDetails` | JSON estruturado |
| `EventResponseDTO.host.name` | — | Dados do organizador Sympla |
| `EventResponseDTO.category_prim.name` | — | Mapear para campo custom |
| `EventResponseDTO.category_sec.name` | — | Mapear para campo custom |
| `EventResponseDTO.reference_id` | — | ID de referência numérico Sympla |

---

### 3.2 Participante (compra em lote: cada ingresso = um slot)

> **Decisão de modelo:** `EventParticipant` É o ingresso (slot de participação autônomo). NÃO criamos tabela separada "ingressos" — toda a engine de check-in (`CheckIn`, `PersonCheckInCooldown`, `PrintJob`, `CheckInMetrics`) já é ancorada em `EventParticipant`, e um `Ticket` separado duplicaria a representação sem resolver a multiplicidade.
> **Unicidade relaxada:** `Person.email` e `Person.document` perdem a constraint único (CPF/e-mail repetidos em lote são esperados). `EventParticipant.personId` torna-se opcional (Person = identidade lazy); remove-se `@@unique([personId, eventId])`; adiciona-se `@@unique([eventId, ticketNumber])` como âncora de idempotência.

| Campo Sympla | Campo ONE-ID | Observação |
|---|---|---|
| `ParticipantResponseDTO.id` | `EventParticipant.symplaParticipantId` (novo) | ID interno (âncora de re-sync) |
| `first_name + last_name` | `EventParticipant.attendeeFullName` (novo) | Snapshot do atendente (independe do Person) |
| `email` | `EventParticipant.attendeeEmail` (novo) | Snapshot; `Person.email` pode repetir |
| `document` (se houver custom field) | `EventParticipant.attendeeDocument` (novo) | Snapshot; CPF repetido permitido |
| `ticket_number` | `EventParticipant.ticketNumber` (novo) | Único por ingresso (`@@unique([eventId, ticketNumber])`) |
| `ticket_num_qr_code` | `EventParticipant.qrCodeValue` | Mapear (provenance MANUAL) |
| `ticket_status` | `EventParticipant.status` (novo) | Status do ingresso |
| `ticket_name` | `EventParticipant.ticketName` (novo) + `TicketType.name` | Tipo de ingresso |
| `ticket_sale_price` | `EventParticipant.ticketPrice` (novo) | Preço pago |
| `ticket_net_value` | `EventParticipant.ticketNetValue` (novo) | Valor líquido |
| `ticket_group_id/name` | `TicketType.groupId/Name` (novo) | Agrupamento |
| `ticket_subgroup_id/name` | `TicketType.subgroupName` (novo) | Sub-grupo |
| `sector_name` | `Sector.name` (novo) | Setor físico |
| `marked_place_name` | `EventParticipant.seatLabel` (novo) | Lugar marcado |
| `item_id` | — | Referência interna Sympla |
| `access_information` | — | Campo livre |
| `presentation_id` | `EventParticipant.presentationId` (novo) | Sessão |
| `order_id` | `EventParticipant.orderId` (novo) → `SymplaOrder` | Pedido (grupo do lote) |
| `order_status` | `SymplaOrder.orderStatus` (novo) | Status do pedido |
| `order_date` | `SymplaOrder.orderDate` | Data do pedido |
| `checkin.check_in` | `EventParticipant.symplaCheckedIn` (novo) | Status de check-in |
| `checkin.check_in_date` | `EventParticipant.symplaCheckInDate` (novo) | Hora do check-in |
| `custom_form` | `EventParticipant.customFields` (novo, JSON) | Campos dinâmicos |

---

### 3.3 Pedido

| Campo Sympla | Campo ONE-ID | Observação |
|---|---|---|
| `OrderResponseDTO.id` | `Order.symplaOrderSk` (novo) | SK do pedido |
| `buyer_first_name + buyer_last_name` | `Order.buyerName` (novo) | Nome do comprador |
| `buyer_email` | `Order.buyerEmail` (novo) | E-mail do comprador |
| `order_total_sale_price` | `Order.totalSalePrice` (novo) | Total |
| `order_total_net_value` | `Order.totalNetValue` (novo) | Líquido |
| `discount_code` | `Order.discountCode` (novo) | Cupom usado |
| `transaction_type` | `Order.paymentMethod` (novo) | Método de pagamento |
| `invoice_info.*` | `Order.invoiceInfo` (novo, Json) | NF/dados fiscais |
| `utm.*` | `Order.utmTracking` (novo, Json) | Atribuição marketing |

---

### 3.4 Apresentação

| Campo Sympla | Campo ONE-ID | Observação |
|---|---|---|
| `PresentationResponseDTO.id` | `Presentation.symplaPresentationId` | ID |
| `start_date` / `end_date` | `Presentation.startsAt` / `endsAt` | Horários |
| `published` | `Presentation.published` | Status |
| `closed` | `Presentation.isClosed` | Encerrada |
| `sectors[].name` | `Sector.name` | Setores vinculados |

---

## 4. Capacidades do Sistema Atual ONE-ID vs O que a Sympla adiciona

### 4.1 ONE-ID Já Possui (manter e complementar)

- Facial recognition (ArcFace/MediaPipe + pgvector)
- QR code scanning (BarcodeDetector + jsQR fallback)
- Access code manual entry
- Physical totems com sessão, heartbeat, kiosk mode
- Multi-tenant com RBAC e audit logs
- Impressão de etiquetas (Brother QL-810W)
- Cooldown anti-fraude por participante
- Métricas agregadas de check-in
- Notificações in-app
- Planos e subscriptions
- i18n (pt-BR, en-US)

### 4.2 O que a Integração Sympla Adiciona

| Capacidade | Descrição |
|-----------|-----------|
| **Ingestão automática de participantes** | Sincronizar participantes reais do Sympla em vez de importar CSV |
| **Mapeamento de tipo de ingresso** | VIP, Pista, Camarote, Meia-entrada, etc. |
| **Setores físicos** | Restringir quais totems validam quais setores |
| **Lugar marcado** | Mostrar "Seu lugar: Cadeira 12" no check-in |
| **Distinguir comprador × participante** | O comprador pode ser diferente do participante |
| **Pedidos e transações** | Histórico de vendas vinculado aos participantes |
| **Atribuição de marketing (UTM)** | ROI por canal/campanha |
| **Status de ingresso** | Pendente, aprovado, cancelado, reembolsado |
| **Compra em lote** | 1 pedido N ingressos; cada ingresso é um slot (EventParticipant) que pode repetir e-mail/CPF do comprador; `@@unique([eventId, ticketNumber])` assegura idempotência |
| **CPF/e-mail repetidos** | Unicidade de `Person` relaxada (CPF repetido permitido) — identificação via snapshot por ingresso; alerta visual de possível duplicidade |
| **Check-in por multiplicidade** | QR/código = por ingresso (primários); face = só identidade inequívoca (1 ingresso por Person) |
| **Check-in bidirecional** | Nosso check-in → Sympla (manter status atualizado na plataforma) |
| **Custom forms dinâmicos** | Tamanho de camiseta, restrição alimentar, etc. |
| **Apresentações/sessões** | Múltiplas sessões por evento (dia 1, dia 2, workshops paralelos) |
| **Sessões com horário** | Restringir check-in a horários específicos |
| **Dados de invoice/nota fiscal** | Informações fiscais do comprador |
| **Cupons e afiliados (rastreamento)** | Discounts, promoters, attribution |
| **Detecção de duplicados** | Mesmo e-mail, mesmo documento → badge de alerta (não bloqueio); política configurável criar-novo/merge |
| **Alertas de conformidade LGPD** | Consentimento, dados sensíveis, retenção |

---

## 5. Limitações e Workarounds da API Sympla

| Limitação | Workaround proposto |
|-----------|-------------------|
| **Sem webhooks** | Polling incremental: usar `from`=`last_sync_at` no endpoint de participantes, com `ticket_updated_at` como chave. Frequência: 15–30s para eventos ativos, 5min para não ativos |
| **Sem API de afiliados** | Extraindo `discount_code` do pedido + cruzando com cupons — ou scraping do painel (se necessário) |
| **Sem API de pagamentos/refunds** | Status de pagamento é o `order_status`; reembolsos precisam ser feitos no painel Sympla |
| **Token único por conta** | Uma Sympla connection por Organization ONE-ID — reforçar multi-tenancy |
| **Sem lista de eventos alheios** | Token só enxerga eventos do próprio produtor — limpo por design |
| **`custom_form` pode mudar entre eventos** | Definir schema dinâmico por evento (não fixo global) |
| **Payload grande de participantes** | Usar `fields` para selecionar só o necessário, reduzir latência e custo |
| **Sem dados de bright data** | Não há dados de brightness/lighting por setor — não há mapeamento |

---

## 6. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| **Rate limiting da API Sympla** | Implementar exponential backoff, respeitar headers 429, fila de jobs com concorrência controlada |
| **Token expirado/revoke** | Health check periódico (GET /events), alertar organizador, UI de reconexão |
| **Schema de custom_form mutável** | Armazenar definições por evento, permitir fields novos sem quebra |
| **Dados incompletos (campos null)** | Usar `fields` explícito, default para campos essenciais |
| **Conflito entre check-in local e Sympla** | Se um check-in já aconteceu na Sympla (via app Organizador), nosso sistema deve respeitar — ler `checkin.check_in` como fonte de verdade |
| **Eventos Cancelados** | Filtrar eventos cancelled=1, não sincronizar, mostrar alerta se evento foi cancelado na Sympla |
| **Performance com muitos participantes** | Cursor pagination + batching (500/request), processar incrementalmente |
| **LGPD/Dados sensíveis** | Encrypted at rest, audit log completo, right to deletion, consent management |

---

## 7. Referências

| Fonte | URL |
|-------|-----|
| API Sympla (docs oficiais) | https://developers.sympla.com.br/api-doc/index.html |
| OpenAPI JSON | https://developers.sympla.com.br/api-docs |
| Autenticação | https://ajuda.produtor.sympla.com.br/hc/pt-br/articles/15422073696653 |
| Integrações Sympla | https://ajuda.produtor.sympla.com.br/hc/pt-br/sections/15421224242957 |
| Sympla Organizador (iOS) | App Store: "Sympla Organizador" |
| Sympla Organizador (Android) | Google Play: "Sympla Organizador" |
| Kondado (BI connector) | https://kondado.com |
| Prisma Schema ONE-ID | `prisma/schema.prisma` |
| MEMORY.md ONE-ID | `.claude/MEMORY.md` |

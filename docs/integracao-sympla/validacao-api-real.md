# Validação contra a API real da Sympla

> Executada em 2026-10-02 com um token de produtor de teste. Reproduzível com `pnpm test:live`.

A suíte normal (`pnpm test`) roda contra fixtures e nunca toca a rede. Os checks ao vivo ficam em
`tests/live/`, excluídos do config padrão e executados sob demanda por `pnpm test:live`, que lê
`SYMPLA_TEST_TOKEN` do `.env`. CI nunca precisa de credencial.

## O que foi confirmado

| Item | Resultado |
|---|---|
| Autenticação por `s_token` | OK — 4 eventos visíveis ao token |
| Parsing de evento (lista + detalhe) | OK |
| Parsing de apresentações, setores e pedidos | OK |
| Erro de token inválido → `SymplaApiError` | OK |
| Token cifrado em repouso, recuperável só pelo cipher | OK |
| Vínculo de evento + `Event.symplaLinked` | OK |
| Sync completo, espelhando nome/datas/endereço | OK |
| `lastSyncResult` e marca d'água gravados | OK |
| Trilha de auditoria | OK |
| Agendador + drenagem da fila (incl. reconciliação) | OK, 0 falhas |

## Achados que mudaram o código

### 1. Formatos de data divergem por endpoint — e por campo

`listEvents` devolveu `'2025-05-21T11:00:00Z'`, enquanto `getEvent` devolveu
`'2025-05-21T08:00:00-03:00'` para a mesma data. São equivalentes, e o parser honra as duas
formas. **Assumir "ingênuo = UTC" sem respeitar offset deslocaria todo horário de evento em 3h.**

Pior: dentro de um mesmo pedido, `order_date: '2025-10-13 20:12:36'` e
`updated_date: '2025-10-13 17:12:36'` — exatamente o offset de São Paulo. Ou seja, **o parâmetro
`timezone=UTC` não normaliza todos os campos**; `updated_date` volta no fuso local da conta.

**Consequência:** não se pode assumir que `ticket_updated_at` (a marca d'água do sync incremental)
e o filtro `from` concordem entre si. Errar na direção insegura significaria **pular horas de
ingressos em silêncio**. Por isso `WATERMARK_OVERLAP_MS` passou de 5 minutos para **15 horas** —
maior que qualquer offset real. O custo é reler ingressos que já temos, e o upsert ancorado em
`(eventId, ticketNumber)` torna isso gratuito.

### 2. Strings vazias em vez de campos ausentes

`buyer_email: ''`, `address: ''`, `zip_code: ''`, `utm: {}`. Um e-mail `''` gravado numa coluna
indexada para busca faria o badge de duplicidade disparar para todo ingresso sem e-mail.
Normalizado para `null` na ingestão.

### 3. Número de casa sem rua

Um evento com local a definir devolve `address: ''` com `address_num: '0'`, o que gerava o
endereço `'0 - Diadema - SP'`. Agora o número só entra quando há rua, e o nome do local lidera:
`'Local a definir - Diadema - SP'`.

### 4. `NODE_ENV=test` era rejeitado pelo schema de env

Qualquer teste que importasse algo tocando `env` encerrava o processo em vez de falhar a
asserção. O enum agora aceita `test`.

### 5. Pedido sem participante é uma forma real

O evento `s305bc0` tem 3 pedidos `APPROVED` (`transaction_type: 'MANUAL'`, comprador
"Adicionado manualmente") e **zero** participantes — confirmado pelo endpoint por pedido também.
O sync tolera: pedidos são upsertados independentemente, e o cache de ids apenas fica com
entradas não referenciadas.

## O que ainda NÃO foi validado

O evento de teste estava `published: false` e sem ingressos vendidos, então **o caminho principal
da ingestão segue sem exercício contra dados reais**:

- Upsert de participante / ingresso
- Política de identidade na compra em lote
- Geração de credencial por ingresso
- Espelhamento de check-in de volta para a Sympla
- Reconciliação com divergência real
- Se `ticket_updated_at` se move quando há check-in na Sympla

Para fechar isso: publicar o evento, emitir alguns ingressos — idealmente **um pedido em lote com
2–3 ingressos no mesmo e-mail**, que é o caso que motivou todo o P1a — e rodar `pnpm test:live`.

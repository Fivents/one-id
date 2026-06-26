# ONE-ID Totem Android — Plano de Correções e Melhorias

## Conexão com o Banco (Neon PostgreSQL)
```
postgresql://neondb_owner:npg_UlWs2kQmDHg5@ep-icy-cake-acfrcnwd-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## Fase 1 — Tela de Configuração da Impressora (Prioridade Máxima)

### Objetivo
Criar uma tela dedicada para gerenciar a conexão com a impressora Brother, com descoberta automática na rede WiFi.

### SDK já disponível
`PrinterSearcher.startNetworkSearch(context, NetworkSearchOption(5.0, false), callback)`
- Retorna `PrinterSearchResult` com lista de `Channel`
- Cada `Channel` tem `getChannelInfo()` = IP da impressora
- `ChannelType`: USB, Wifi, Bluetooth, BluetoothLowEnergy

### Arquivos a criar
- `PrinterSetupScreen.kt` — Tela Compose com:
  - Botão "Buscar impressoras na rede"
  - Lista de impressoras descobertas (modelo, IP)
  - Campo de IP manual (fallback)
  - Indicador de status da conexão
  - Botão "Imprimir teste"
- `PrinterSetupViewModel.kt` — Lógica de busca e conexão
- Alterar `NavGraph.kt` para incluir rota da nova tela
- Alterar `PrinterConnectionManager.kt` para usar Channel descoberto

### Fluxo
1. Operador abre tela de configuração da impressora
2. Toca "Buscar impressoras na rede"
3. App escaneia WiFi por 5 segundos via SDK Brother
4. Lista resultados → operador seleciona uma
5. App conecta e mostra status
6. Opção de "Imprimir teste" para validar
7. IP salvo em `PrinterConfigRepository` / `TokenStorage`

---

## Fase 2 — QR Code Real no BadgeRenderer

### Objetivo
Substituir o placeholder de retângulos por um QR code funcional gerado com zxing.

### Dependência
`com.google.zxing:core`

### Arquivos a modificar
- `app/build.gradle.kts` — adicionar zxing
- `BadgeRenderer.kt` — implementar `generateQrBitmap(value, size)` e usar no lugar de `drawQrCode()`

### Fluxo
1. Recebe `qrCodeValue` do HTML
2. Gera `BitMatrix` com `QRCodeWriter.encode()`
3. Converte para `Bitmap` ARGB_8888
4. Desenha no Canvas na posição calculada

---

## Fase 3 — Eliminar Next.js (Conexão Direta com PostgreSQL)

### Objetivo
Remover dependência do servidor Next.js, fazendo o app Android se conectar diretamente ao PostgreSQL (Neon).

### Stack
| Dependência | Uso |
|---|---|
| `org.postgresql:postgresql` | JDBC driver |
| `com.zaxxer:HikariCP` | Connection pool |
| `io.jsonwebtoken:jjwt` | JWT (login/sessão) |
| `com.google.zxing:core` | QR code (já na Fase 2) |
| `java.security.SecureRandom` | Geração de credenciais |
| `java.security.MessageDigest` | SHA-256 para token hash |

### Tabelas envolvidas (Prisma → SQL direto)
- `totem`, `totem_sessions`, `totem_organization_subscriptions`, `totem_event_subscriptions`
- `events`, `event_ai_configs`
- `people`, `person_faces` (embedding vector(512) com pgvector)
- `event_participants`
- `check_ins`, `audit_logs`
- `print_configs`, `print_jobs`
- `person_check_in_cooldowns`, `check_in_metrics`

### Lógicas a portar (do servidor Next.js para Kotlin)

#### 1. Active Context Resolution
Query aninhada: `totem → orgSubscriptions → eventSubscriptions → event` com filtros de data/status.
- Raw SQL com JOINs
- Fallback de AI config se `event_ai_configs` não existir

#### 2. Login / Auth
- `POST /api/totem/login` → find totem by accessCode, validar, revogar sessions antigas, criar JWT 30d, criar session, audit log
- JWT: HS256 com `jjwt`, claims: sub, name, type=totem
- bcrypt para tokenHash no DB

#### 3. Face Check-in (mais complexo)
- Validação de embedding (512 floats)
- Liveness + blink + tracking stability
- **Vector search via pgvector SQL raw:**
  ```sql
  SELECT (1 - (pf.embedding_vector <=> ?::vector)) as confidence
  FROM person_faces pf
  JOIN event_participants ep ON ep.person_id = pf.person_id
  WHERE ep.event_id = ? AND pf.is_active = true
    AND pf.face_quality_score >= 0.52
  ORDER BY confidence DESC LIMIT ?
  ```
- Confidence threshold clamping [0.5, 0.95]
- Anti-fraud cooldown (exponential backoff)
- Duplicate detection
- Audit log + metrics

#### 4. QR/Code Check-in
- Normalizar input (trim, toUpperCase)
- Lookup em `event_participants` + `people` (dual-path: participant-level e person-level)
- Criar `check_ins`, audit log

#### 5. Self-Register
- `SecureRandom` para gerar credenciais (alfabeto sem 0/O/1/I)
- find-or-create com soft-delete recovery
- Auto check-in

#### 6. Badge HTML Generation (portar para Kotlin)
- Gerar QR code PNG via zxing
- Gerar HTML inline com CSS para layout do crachá
- Incluir: evento, participante, QR, código de acesso, timestamp

#### 7. Print Job
- Gerar JWT de validação (5min, audience=print-label)
- SHA-256 do token
- Criar/atualizar `print_jobs`

#### 8. Cooldown Service
- Exponential backoff: `min(baseMs * 2^failedAttempts, maxCooldownMs)`
- Tabela `person_check_in_cooldowns`

#### 9. Métricas
- Buffer in-memory com flush periódico
- Upsert em `check_in_metrics` (hourly buckets)
- Update em `totem_event_subscriptions`

### Observações
- ⚠️ Neon precisa aceitar conexão do IP do totem (configurar firewall/whitelist)
- ⚠️ Usar `sslmode=require` na connection string
- ⚠️ Connection pooling com HikariCP para evitar overhead de abrir/fechar conexões
- ⚠️ Embedding vector(512) usa operador `<=>` do pgvector — roda direto no SQL

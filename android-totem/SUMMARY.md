## Goal
- Eliminar servidor Next.js (app Android fala direto com PostgreSQL via JDBC), adicionar descoberta automática de impressoras Brother na rede WiFi com tela dedicada, e gerar QR code real com zxing no crachá impresso.

## Constraints & Preferences
- App Android conecta-se **diretamente ao PostgreSQL na nuvem** (Neon) via JDBC + HikariCP, sem servidor intermediário
- Conexão BD: `postgresql://neondb_owner:npg_UlWs2kQmDHg5@ep-icy-cake-acfrcnwd-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- Descoberta de impressora usa `PrinterSearcher.startNetworkSearch()` do SDK Brother (Consumer&lt;Channel&gt; + lista de `Channel.getChannelInfo()` = IP)
- QR code do crachá gerado localmente com `com.google.zxing:core` (não placeholder)
- Toda lógica de negócio (login, face matching com pgvector, check-in, geração de badge, cooldown, métricas) portada do Next.js para Kotlin
- Face matching usa `<=>` (cosine distance) do pgvector sobre embedding 512‑dim; tabela `person_faces` com coluna `embedding_vector vector(512)`
- JWT (`io.jsonwebtoken:jjwt:0.12.6`) adicionado para eventual uso em tokens de print job
- Pool de conexões HikariCP com `maxPoolSize=4`, `connectionTimeout=10s`, `idleTimeout=30s`

## Progress
### Done
- **Fase 1 — Tela de Configuração da Impressora** (completa, build OK)

    *   `PrinterSetupViewModel.kt` criado: busca de impressoras via Brother SDK (`PrinterSearcher.startNetworkSearch` com `NetworkSearchOption(5.0, false)`), conexão via `PrinterConnectionManager.ensureConnected()`, impressão de teste com `BadgeRenderer.renderFromData()`, salvamento automático do IP em `PrinterConfigRepository`
    *   `PrinterSetupScreen.kt` criado: `Scaffold` + `TopAppBar` com back, cartão de status da conexão, seção de busca automática com `CircularProgressIndicator` e cancelamento, `LazyColumn` com `PrinterCard` para cada impressora descoberta, seção de IP manual com `OutlinedTextField` + botão "Conectar", seção de impressão de teste com feedback visual
    *   `NavGraph.kt` modificado: rota `PRINTER_SETUP = "printer_setup"` adicionada, transições `slideInHorizontally`, `composable(Routes.PRINTER_SETUP)` com `PrinterSetupScreen(onBack = { navController.popBackStack() })`
    *   `MethodScreen.kt` modificado: `onNavigateToPrinterSetup` substitui dialog de configuração de impressora
    *   `MethodViewModel.kt` simplificado: estado de dialog removido, `printerIp` reativo via `printerConfigRepository.printerIp.collect`
    *   `PrinterConnectionManager.kt` estendido: `suspend fun getStatus(): PrinterStatus` adicionado

- **Fase 2 — QR Code Real no BadgeRenderer** (completa, build OK)

    *   Dependência `com.google.zxing:core:3.5.3` adicionada
    *   `BadgeRenderer.drawQrCode()` reescrito: gera `BitMatrix` via `QRCodeWriter.encode()`, desenha módulos pixel a pixel no `Canvas`

- **Fase 3 — Infraestrutura BD e repositórios principais** (completa, build OK)

    *   Dependências `org.postgresql:postgresql:42.7.4`, `com.zaxxer:HikariCP:6.2.1`, `io.jsonwebtoken:jjwt:0.12.6` adicionadas no `libs.versions.toml` e `build.gradle.kts`
    *   `DatabaseModule.kt`: Hilt `@Module` fornecendo `HikariDataSource` (Neon URL) e `DatabaseDataSource`
    *   `DatabaseDataSource.kt`: wrapper JDBC com `queryForList()`, `queryForOne()`, `execute()`, `executeReturning()` — fecha conexões/statements/resultsets explicitamente com try-finally
    *   `ActiveTotemContext.kt`: data classes `ActiveTotemContext`, `ActiveEvent`, `EventAIConfig`
    *   `ActiveContextRepository.kt`: resolve contexto ativo via SQL multi-tabela (`totem` → `totem_organization_subscriptions` → `totem_event_subscriptions` → `events` → `event_ai_configs`)
    *   `DatabaseAuthRepository.kt`: login valida totem por accessCode, session validation re-consulta BD, salva `totemEventSubscriptionId` no `TokenStorage.getToken()`
    *   `DatabaseCheckInRepository.kt`: check-in por código/QR/face com ranking pgvector `<=>`, cooldown por intervalo SQL, self-register com transação implícita
    *   `DatabasePrintRepository.kt`: busca `print_configs` do evento, gera HTML do badge, cria `print_jobs` no BD
    *   `RepositoryModule.kt`: bindings atualizados para `DatabaseAuthRepository`, `DatabaseCheckInRepository`, `DatabasePrintRepository` (todos `@Singleton`)
    *   Scoping corrigido: `ActiveContextRepository`, `DatabaseCheckInRepository`, `DatabasePrintRepository` alterados de `@ViewModelScoped` para `@Singleton` para compatibilidade com Hilt

### In Progress
- **Fase 3 — Pós-build: testar integração com BD real e validar LoginViewModel**

    *   Verificar se `LoginViewModel` usa `serverUrl` que não existe mais
    *   Verificar outros VMs que dependem de Retrofit ou da URL do servidor

### Blocked
- Nenhum

## Key Decisions
- **Nova tela `PrinterSetupScreen`** em vez de dialog: permite busca automática, lista de múltiplas impressoras, feedback visual de status e teste de impressão
- **`PrinterConnectionManager.getStatus()` adicionado** para expor estado da impressora (OK, PAPER_EMPTY, BATTERY_LOW, etc.) na UI
- **`MethodViewModel.printerIp` reativo via flow collection**: quando usuário altera IP na `PrinterSetupScreen`, a `MethodScreen` atualiza automaticamente o ícone da impressora
- **ZXing via `QRCodeWriter` puro** em vez de outras libs: sem dependências adicionais, leve e direto
- **Sem sessão JWT no Android**: com BD direto, não há servidor para autenticar; o "session state" é apenas o `totemId` e `totemEventSubscriptionId` armazenados no `TokenStorage`
- **`ActiveContextRepository` com fallback de AI Config**: se não houver registro em `event_ai_configs`, usa valores padrão (confidence 0.62, cooldown 8s, liveness 0.7, etc.)
- **Face check-in com SQL puro**: usa `<=>` (cosine similarity) do pgvector diretamente na query de ranking, sem camada de abstração; confidence mínimo `MIN_SEARCH_THRESHOLD = 0.5`
- **`DatabaseDataSource` com try-finally explícito** em vez de `use {}` ou outras APIs: Kotlin compiler teve problemas com try-finally aninhado para inferir return type, solução foi usar `val result = try { ... } finally { ... }; return result`
- **Todos os DB repos são `@Singleton`**: precisam ser compatíveis com Hilt `SingletonComponent` do `RepositoryModule`
- **`totemEventSubscriptionId` armazenado em `TokenStorage.getToken()`**: reaproveita o slot que antes guardava JWT, já que não há mais servidor

## Next Steps
1. Verificar `LoginViewModel` e outros VMs por dependências de `serverUrl` (Retrofit)
2. Remover arquivos obsoletos: `AuthRepositoryImpl`, `CheckInRepositoryImpl`, `PrintRepositoryImpl`, `AuthInterceptor`, `ApiClient`/`ApiService`
3. Remover dependências do `build.gradle.kts`: Retrofit, Moshi, OkHttp após testes
4. Teste de integração com BD real Neon
5. Build final de release

## Critical Context
- **SDK Brother**: `PrinterSearcher.startNetworkSearch(context, NetworkSearchOption(5.0, false), Consumer<Channel>)` retorna `PrinterSearchResult` com erro e lista de `Channel`; cada `Channel` WiFi tem `getChannelInfo()` = IP, `getExtraInfo()` contém `ModelName`, `MACAddress`, `NodeName`, `IpAddress`
- **Connection string do Neon** (hardcoded em `DatabaseModule.kt`): `postgresql://neondb_owner:npg_UlWs2kQmDHg5@ep-icy-cake-acfrcnwd-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **`DatabaseDataSource`** mapeia `Timestamp` para string ISO via `toInstant().toString()` e `java.sql.Date` via `toString()`; `setParams()` aceita `null`, `String`, `Int`, `Long`, `Double`, `Float`, `Boolean`, `java.util.Date`
- **`PersonCheckInCooldown`** não foi portado como tabela separada: o cooldown é verificado via `SELECT WHERE checked_in_at > NOW() - (? || ' seconds')::interval` diretamente em `check_ins`
- **Rota mais complexa** portada é face check-in: validação de embedding (512 floats), `(1 - (pf.embedding_vector <=> ?::vector)) AS confidence` com ranking por pessoa (`PARTITION BY p.id`, `ROW_NUMBER`), filtro `face_quality_score >= 0.52`, `confidence >= 0.5`, e threshold configurável do evento
- **`TotemSession.sessionId` e `expiresAt`** retornam string vazia no `DatabaseAuthRepository` pois não há mais sessão JWT

## Relevant Files
- **NOVO** `app/src/main/java/com/oneid/totem/data/database/DatabaseModule.kt`: Hilt module for HikariDataSource + DatabaseDataSource
- **NOVO** `app/src/main/java/com/oneid/totem/data/database/DatabaseDataSource.kt`: JDBC query wrapper
- **NOVO** `app/src/main/java/com/oneid/totem/data/database/ActiveContextRepository.kt`: multi-table SQL context resolution
- **NOVO** `app/src/main/java/com/oneid/totem/data/database/repo/DatabaseAuthRepository.kt`: login/session via direct DB
- **NOVO** `app/src/main/java/com/oneid/totem/data/database/repo/DatabaseCheckInRepository.kt`: face/code/QR check-in + self-register
- **NOVO** `app/src/main/java/com/oneid/totem/data/database/repo/DatabasePrintRepository.kt`: print config + badge HTML + print_jobs
- **NOVO** `app/src/main/java/com/oneid/totem/domain/model/ActiveTotemContext.kt`: ActiveTotemContext, ActiveEvent, EventAIConfig
- **NOVO** `app/src/main/java/com/oneid/totem/presentation/screens/printer/PrinterSetupViewModel.kt`
- **NOVO** `app/src/main/java/com/oneid/totem/presentation/screens/printer/PrinterSetupScreen.kt`
- **MODIFICADO** `app/src/main/java/com/oneid/totem/data/RepositoryModule.kt`: binds Database* repos instead of Retrofit impls
- **MODIFICADO** `app/build.gradle.kts`: added postgresql, hikaricp, jjwt
- **MODIFICADO** `gradle/libs.versions.toml`: added postgresql=42.7.4, hikaricp=6.2.1, jwt=0.12.6
- **MODIFICADO** `app/src/main/java/com/oneid/totem/presentation/navigation/NavGraph.kt`: PRINTER_SETUP route
- **MODIFICADO** `app/src/main/java/com/oneid/totem/data/print/PrinterConnectionManager.kt`: getStatus()
- **MODIFICADO** `app/src/main/java/com/oneid/totem/data/print/BadgeRenderer.kt`: QRCodeWriter
- **MODIFICADO** `app/src/main/java/com/oneid/totem/presentation/screens/method/MethodScreen.kt`: onNavigateToPrinterSetup
- **MODIFICADO** `app/src/main/java/com/oneid/totem/presentation/screens/method/MethodViewModel.kt`: printerIp via flow

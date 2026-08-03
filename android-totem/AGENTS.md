# android-totem

Companheiro de trabalho para o app android-totem (ONE-ID). Leia isto antes de qualquer tarefa de impressão.

## PLANO ATIVO — QR do modo Mínimo rente às bordas da etiqueta (03/08/2026)

> Esta seção é o plano de trabalho vigente. Consulte sempre antes de mexer em `BadgeRenderer.kt` (função `renderMinimalQr`) ou em `BadgeRendererTest.kt`.

### Contexto (decisões do usuário)

- O **gap entre o QR e o texto (nome/empresa/cargo) está OK** — manter o gap de 1,5mm como está.
- O que o usuário quer aumentar é o recuo fino (~0,65mm de quiet zone + margem) nos **demais lados** do QR (topo/esquerda/direita da etiqueta final), para o QR ficar visivelmente "rente à borda".
- O QR já é um quadrado de `qrSize = logicalH - 2*qrMargin` ≈ **28,6mm** (bounded pela largura do rolo de 29mm) — o tamanho físico já é o máximo; o ganho vem de **reduzir margem + quiet zone**.

### Mudanças a aplicar

- `BadgeRenderer.kt` (`renderMinimalQr`, linhas ~131-134):
  - `qrMargin` = `mmToPixels(0.2, dpi).coerceAtLeast(2)` → `mmToPixels(0.1, dpi).coerceAtLeast(1)` (QR square 28,6 → 28,8mm; conteúdo preto a ~1px das bordas do rolo/topo).
  - `drawQrCode(..., quietZone = MINIMAL_QR_QUIET_ZONE, fixedVersion = MINIMAL_QR_VERSION)` com novo `const val MINIMAL_QR_QUIET_ZONE = 0` no companion (módulos pretos preenchem o quadrado de borda a borda, ~+0,5mm por lado).
  - Gap para o texto (`textLeft = qrMargin + qrSize + 1.5mm`) permanece ~1,5mm — **não mexer**.
  - Padrão/Compacto intactos (default `quietZone = 4` em `drawQrCode`).
- `BadgeRendererTest.kt`:
  - Helper `qrBounds(bitmap)` que varre só a faixa do topo (y < pixels do quadrado do QR) para isolar o QR do texto abaixo.
  - Novo teste: bounds do QR preto a ≤ ~0,3mm das bordas esquerda/direita/topo da etiqueta.
  - Novo teste: bounds do QR **idênticos** com nome+empresa+cargo vs. só nome longo (locks que o nome nunca encolhe o QR).
  - Testes existentes (payload curto vs longo, fallback v10) devem continuar verdes.

### Tradeoff / pendência no aparelho

- Quiet zone 0 deixa só a margem física da etiqueta como borda branca — **reverificar no QL-810W que o QR ainda escaneia**. Se falhar, reverter `MINIMAL_QR_QUIET_ZONE` para `1` (mudança de uma linha).

### Validação (concluída)

- `./gradlew :app:testDebugUnitTest --tests "com.oneid.totem.data.print.BadgeRendererTest"` → **passando (13 testes)**.
- `./gradlew :app:assembleDebug` → BUILD SUCCESSFUL (APK novo gerado).
- Suíte completa: **49 testes, 9 falhas pré-existentes apenas** (7 `PrinterConnectionManagerTest` + 1 `PrintCoordinatorTest` + 1 `PrinterConfigRepositoryTest`) — nenhuma regressão, nada de QR/preview quebrado.
- **Pendente no aparelho:** instalar build novo; conferir no QL-810W que o QR com quiet zone 0 **ainda escaneia**. Se falhar, reverter `MINIMAL_QR_QUIET_ZONE` para `1`.

## PLANO CONCLUÍDO — Código do totem 8 caracteres + Teclado do check-in por código (03/08/2026)

> Esta seção é o plano de trabalho vigente. Consulte sempre antes de mexer em `SecurityCodeDialog.kt`, `LoginScreen.kt`, `LoginViewModel.kt`, `CodeCheckInScreen.kt`, `CodeCheckInViewModel.kt`, `TotemPreferences.kt`, `PrinterConfigRepository.kt`, `PrinterSetupViewModel.kt` ou `PrinterSetupScreen.kt`.

### Contexto (decisões do usuário)

- O **código de acesso do totem tem 8 caracteres** (não 6). Login e modal de segurança devem **exigir 8+**.
- A opção de teclado (normal vs apenas numérico) é **para o participante no check-in por código** (`CodeCheckInScreen`), **não** para o modal de segurança. Padrão: teclado normal (alfanumérico). Nas configurações da impressora podemos trocar para só numérico (facilita o participante).
- O seletor de teclado fica nas configurações da impressora, **acima do seletor do modo da etiqueta** (`LabelLayoutSelector` dentro de `BadgePreviewSection` em `PrinterSetupScreen`).

### Parte 1 — Código do totem com 8 caracteres

- `SecurityCodeDialog.kt` (modal de segurança): `take(6)` → `take(8)`; placeholder `"XXXXXX"` → `"XXXXXXXX"`; `enabled = code.length >= 8`.
- `LoginScreen.kt`: placeholder `"XXXXXX"` → `"XXXXXXXX"`; `key.length >= 4` → `>= 8` (ações do teclado Go e botão ENTRAR).
- `LoginViewModel.kt`: `key.length < 4` → `< 8`; mensagem `"O código deve ter 8 caracteres"`.
- `MethodViewModelTest.kt`: códigos de teste 6 → 8 chars (`"ABC123"` → `"ABC12345"`, etc.).
- Observação: o length do código do **participante** (`CodeCheckInScreen`) NÃO muda — permanece `>= 4`.

### Parte 2 — Opção de teclado para o check-in por código

- Novo enum `AccessCodeKeyboard { ALPHANUMERIC, NUMERIC }` em `domain/repository/PrintRepository.kt` (ao lado de `LabelLayout`, mesmo padrão de enum persistido por nome).
- `TotemPreferences.kt`: propriedade `accessCodeKeyboard: AccessCodeKeyboard` (getter/setter com `valueOf` + fallback, default `ALPHANUMERIC`) + chave `KEY_ACCESS_CODE_KEYBOARD = "access_code_keyboard"`.
- `PrinterConfigRepository.kt`: `_accessCodeKeyboard` StateFlow + `accessCodeKeyboard` + `accessCodeKeyboardValue` + `load()` lendo do prefs + `setAccessCodeKeyboard(mode)`.
- `PrinterSetupViewModel.kt`: campo `accessCodeKeyboard` no `PrinterSetupUiState` (default `ALPHANUMERIC`), lido no `init`, e `fun setAccessCodeKeyboard(mode)`.
- `PrinterSetupScreen.kt`: novo item no `LazyColumn` **logo acima do item do `BadgePreviewSection`** — card "Teclado do Código de Acesso" com `SingleChoiceSegmentedButtonRow` (Alfanumérico / Numérico), mesmo estilo do seletor de etiqueta.
- `CodeCheckInViewModel.kt`: injeta `TotemPreferences`; `CodeCheckInUiState` ganha `numericKeyboard: Boolean` (lida no `init`); `onCodeChanged` filtra só dígitos quando numérico (`filter { it.isDigit() }`), mantém alfanumérico no normal.
- `CodeCheckInScreen.kt`: `keyboardOptions.keyboardType` = `if (numericKeyboard) KeyboardType.Number else KeyboardType.Ascii`.

### Testes planejados

- Novo `CodeCheckInViewModelTest` (mockk `CheckInRepository` + `TotemPreferences`): numérico filtra letras (`"AB12CD"` → `"12"`); alfanumérico mantém (`"ab12"` → `"AB12"`).
- `PrinterConfigRepositoryTest`: teste de `setAccessCodeKeyboard` (persiste no prefs + atualiza StateFlow).

### Validação

- `./gradlew :app:assembleDebug` → BUILD SUCCESSFUL.
- `testDebugUnitTest` para `MethodViewModelTest`, `CodeCheckInViewModelTest`, `BadgeRendererTest`.
- Suíte completa: 9 falhas pré-existentes podem permanecer (ver "Estado dos testes unitários"); nenhuma regressão nova, nada de QR/preview quebrado.

### Validação (concluída)

- `./gradlew :app:assembleDebug` → BUILD SUCCESSFUL (APK novo gerado).
- `MethodViewModelTest` (6 testes, códigos 8 chars), `CodeCheckInViewModelTest` (4 testes novos) e `BadgeRendererTest` (11) → passando.
- `PrinterConfigRepositoryTest`: 2 testes novos de `accessCodeKeyboard` → passando; mantém só a 1 falha pré-existente (`isConfigured`).
- Suíte completa: **47 testes, 9 falhas pré-existentes apenas** (7 `PrinterConnectionManagerTest` + 1 `PrintCoordinatorTest` + 1 `PrinterConfigRepositoryTest`) — nenhuma regressão.
- **Pendente no aparelho:** instalar build novo; conferir teclado do participante (numérico/alfanumérico) no check-in por código, seletor acima do modo da etiqueta, e login/modal exigindo 8+.

## PLANO CONCLUÍDO — QR SEMPRE do mesmo tamanho + Modal de segurança (03/08/2026)

> Esta seção é o plano de trabalho vigente. Consulte sempre antes de mexer em `BadgeRenderer.kt` ou nos botões "Impressora"/"Sair".

### Parte 1 — QR do modo Mínimo sempre do mesmo tamanho

**Objetivo:** garantir que o QR tenha o **mesmo tamanho físico** para todos os participantes, independente do payload.

**Diagnóstico (verificado no código):**
- O QR já ocupa sempre o mesmo quadrado (`qrSize = logicalH - 2*qrMargin` = 338px ≈ 28.6mm), com ou sem cargo/empresa — cargo/empresa só afetam o texto (`renderMinimalQr` linhas 156-167).
- **O que varia é a densidade de módulos**: `drawQrCode` deixa o ZXing escolher a versão pelo tamanho do payload; payload mais longo → mais módulos → módulos menores → QR *parece* menor (mesmo quadrado externo).

**Mudança aplicada (`drawQrCode` com default compatível, regra do AGENTS.md):**
- `drawQrCode(..., quietZone: Int = 4, fixedVersion: Int = 0)`: se `fixedVersion > 0`, adiciona `EncodeHintType.QR_VERSION` ao `encode`. Se lançar `WriterException` (payload maior que a capacidade), **fallback automático** re-encodando sem a hint (comportamento atual).
- `renderMinimalQr` chama `drawQrCode(..., quietZone = 1, fixedVersion = MINIMAL_QR_VERSION)` com `MINIMAL_QR_VERSION = 10` (57 módulos + 2 quiet zone ≈ módulo 0.48mm; capacidade ~346 bytes nível L).
- Padrão/Compacto intactos (default `fixedVersion = 0` = versão automática atual).

**Testes (BadgeRendererTest):**
- Mínimo com payload curto vs ~200 chars → bounding box de pixels pretos do QR idêntico nos dois.
- Payload > capacidade v10 → ainda gera bitmap válido (fallback), sem exceção.
- Dimensões 29mm × ≤120mm seguem passando.

### Parte 2 — Modal de segurança (UI/UX) nos botões "Impressora" e "Sair"

**Objetivo:** exigir o código do totem novamente para (a) acessar as configurações da impressora e (b) sair do totem. Código errado → "Código inválido" inline + shake + haptic. Cancelar/X/clique fora/voltar fecha o modal.

**Decisões do usuário:** validação **local offline** (código persistido criptografado no login) + proteger **as duas ações**.

**Mudanças:**
- Novo `presentation/components/SecurityCodeDialog.kt` — `Dialog` (`androidx.compose.ui.window.Dialog` — material3 1.3.1 **não tem** `Dialog`, só `AlertDialog`; `usePlatformDefaultWidth` vai dentro de `DialogProperties(usePlatformDefaultWidth = false)`), fecha fora/back, scrim `Color.Black.copy(alpha = 0.6f)`, card `SurfaceVariant` `RoundedCornerShape(28.dp)` borda 1dp `Outline` ~85% largura, badge `Icons.Filled.Lock` (Primary, alpha 0.15), título "Área restrita" + descrição contextual, campo estilo login (uppercase/alnum/letterSpacing, placeholder "XXXXXXXX", `KeyboardType.Ascii`, `ImeAction.Done`, auto-focus), erro + shake + `HapticEffect(REJECT)`, botão "CONFIRMAR" (56dp, Primary) + X + "Cancelar". `onSubmit: (String) -> Boolean` — fecha só quando retornar `true`.
- `MethodScreen.kt` — estado `showSecurityDialog` + `pendingAction` (`PRINTER`/`LOGOUT`); ícone impressora e "Sair" abrem o modal; submit válido executa a ação.
- `MethodViewModel.kt` — injeta `TotemPreferences`; `fun isAccessCodeValid(code: String): Boolean` (compara `uppercase().trim()`; sem código persistido → `false`).
- `AuthHttpRepository.kt` — injeta `TotemPreferences`; grava `totemAccessCode = key.uppercase()` no sucesso do `login()`.

**Validação (concluída):**
- `./gradlew :app:assembleDebug` → BUILD SUCCESSFUL (APK novo gerado).
- `./gradlew :app:testDebugUnitTest --tests "com.oneid.totem.data.print.BadgeRendererTest"` → passando (11 testes).
- Novo `MethodViewModelTest` (6 testes: match exato, case-insensitive, trim, vazio inválido, código errado inválido, `logout` seta `hasLoggedOut`) → passando.
- **Pendente no aparelho:** instalar build novo, imprimir etiqueta real; conferir QR uniforme/escaneável e modal funcionando.

## Área de impressão (BadgeRenderer)

Arquivo principal: `app/src/main/java/com/oneid/totem/data/print/BadgeRenderer.kt`

- `renderFromData(...)` é o ponto de entrada para os 3 layouts (`LabelLayout` em `domain/repository/PrintRepository.kt`): `STANDARD`, `COMPACT`, `MINIMAL_QR`.
- `MINIMAL_QR` ("Mínimo") → `renderMinimalQr(...)` (linhas ~113-185). Gera bitmap `120mm (feed) × 29mm (rolo)`, **gira 90°** antes de imprimir → etiqueta final `29mm × ~120mm`. QR no topo (toda a largura), texto vertical à direita.
- `trimBitmap(rotated, 2mm)` remove o branco das extremidades com margem de 2mm.
- Impressora real: Brother QL-810W (`BrotherSdkPrinter`). Preview: `presentation/screens/printer/BadgePreview.kt` ("Mínimo", 300 DPI).
- Testes: `app/src/test/java/com/oneid/totem/data/print/BadgeRendererTest.kt` (dimensões, QR de tamanho fixo, fallback, QR rente às bordas e QR idêntico com/sem meta).

## Ajustes feitos no modo Mínimo (03/08/2026)

Objetivo: QR mais próximo da borda e maior; nome/cargo/empresa mais perto da borda e compactos; espaçamento mínimo.

1. **QR code**
   - `qrMargin` = `0.1mm` (antes 0.2mm; originalmente 1.0mm); `qrSize` cresce sozinho (~28.8mm).
   - Quiet zone do ZXing = **0** no modo mínimo via `EncodeHintType.MARGIN` = `MINIMAL_QR_QUIET_ZONE` (constante = 0; `drawQrCode` tem parâmetro `quietZone: Int = 4`; Padrão/Compacto usam o default 4). QR preto preenche o quadrado de borda a borda, ~1px da borda da etiqueta nos lados topo/esquerda/direita.
2. **Texto top-aligned** (não centralizado): `y = qrMargin` em vez de `(logicalH - totalH) / 2f`.
3. **Lógica de linhas**:
   - Se **cargo E empresa preenchidos** → 3 itens, 1 linha cada, **sem wrap**, truncados (`truncateLineNoEllipsis`):
     - Nome → primeiro nome + inicial do último (`'John Doe da Silva'` → `John D.`) via helper `shortNameInitial()`.
     - Cargo e empresa → texto original truncado à largura.
   - Se **faltar cargo OU empresa** → nome usa nome + sobrenome (`'John Doe da Silva'` → `'John Doe'`), wrap de até 2 linhas (`autoWrap(...).take(2)`); o campo presente entra como linha única truncada.
4. **Espaçamento mínimo**: `gapTight` = `0.3mm` (antes 0.8mm); fator de entrelinha `1.05` (antes 1.15).

## Estado dos testes unitários (03/08/2026)

- `BadgeRendererTest` **passa** (13 testes: dimensões do modo mínimo + QR de tamanho fixo v10 + fallback + QR rente às bordas + QR idêntico com/sem meta).
- `MethodViewModelTest` **passa** (6 testes: `isAccessCodeValid` com códigos de 8 chars + `logout`).
- `CodeCheckInViewModelTest` **passa** (4 testes novos: filtro numérico/alfanumérico + flag `numericKeyboard`).
- `PrinterConfigRepositoryTest`: **2 testes novos de `accessCodeKeyboard` passam**; resta só a 1 falha pré-existente (`isConfigured returns true after IP is set` — `savePrinterIp` sem stub).
- Corrigidos 2 bloqueios de compilação pré-existentes (testes não compilavam):
  - `PrintCoordinatorTest.kt`: removido `import io.mockk.eq` — em mockk, `eq` é membro do receiver `MockKMatcherScope` (blocos `every`/`verify`), **não** é função top-level, então o import nunca resolveu.
  - `PrinterConfigRepositoryTest.kt`: `PrinterConfigRepository` ganhou `prefs: TotemPreferences` no construtor; adicionado `@MockK prefs` + stubs de `printerOrientation`/`printerLabelLayout` em `setUp`.
- **Falhas restantes são pré-existentes** (produção refatorada no commit `c22e071` não acompanhada nos testes; antes ficavam mascaradas pelo erro de compilação):
  - `PrinterConnectionManagerTest`: 7 falhas (mock estrito: `close()` sem stubs, verificação de `close()` chamado 2x).
  - `PrintCoordinatorTest`: 1 falha (`printBadge returns error when IP is not configured` — mensagem esperada não bate com a produção atual).
  - `PrinterConfigRepositoryTest`: 1 falha (`isConfigured returns true after IP is set` — `savePrinterIp` sem stub).
  - Nenhuma relacionada ao layout de impressão.

## Regra geral

Não quebre nada que já funciona: mudanças de layout do modo mínimo devem ficar isoladas em `renderMinimalQr` (e em `drawQrCode` via parâmetro com default compatível). Preview e testes existentes devem continuar passando.

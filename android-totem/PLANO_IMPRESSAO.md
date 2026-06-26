# Plano de Ação — Brother QL-810W

## 🔴 Fase 1 — Correções Imediatas
- [ ] 1. Adicionar AAR Brother SDK ao `app/libs/`
- [ ] 2. Adicionar permissões Bluetooth ao AndroidManifest.xml
- [ ] 3. Timeout de 10s na conexão `openChannel` (BrotherSdkPrinter.kt)
- [ ] 4. Persistir IP no TokenStorage ao salvar (MethodViewModel.kt)

## 🟠 Fase 2 — Refatorações
- [ ] 5. Criar PrinterModule.kt e injetar BrotherPrinter via Hilt
- [ ] 6. Manter conexão aberta entre prints (PrintCoordinator.kt)
- [ ] 7. Criar PrinterConfigRepository com DataStore/Flow
- [ ] 8. PrinterConnectionManager com reconexão automática + backoff
- [ ] 9. Substituir WebView por renderização Canvas direta (BadgeRenderer.kt)

## 🟡 Fase 3 — Resiliência
- [ ] 10. Verificação de status Brother pré-print
- [ ] 11. Fila de impressão com Mutex
- [ ] 12. Mapear erros da Brother para mensagens amigáveis
- [ ] 13. Timeout de 30s no print job no FeedbackViewModel

## 🔵 Fase 4 — Testes
- [ ] 14. Testes unitários (BrotherSdkPrinter mockado)
- [ ] 15. Teste instrumentado com QL-810W real
- [ ] 16. Teste de estresse 100+ impressões
- [ ] 17. Teste de permissões runtime Android 12+
- [ ] 18. Suporte RollW29 como fallback configurável

# Plano de Melhoria do Frontend — OneID

> Branch: `feat/ui-ux-overhaul` · Início: 2026-10-25
> Status vivo: este arquivo é atualizado a cada ciclo. A seção **Estado atual** no fim é a fonte de verdade.

## 1. Como a inspeção foi feita

- **Navegador real (Chromium headless via Playwright)**, servidor `pnpm dev` local, larguras **390 / 768 / 1280 / 1440**, temas **claro e escuro**, papéis **SUPER_ADMIN** e **EVENT_MANAGER**.
- **Todas as chamadas `/api/*` foram atendidas por dados fictícios** (harness fora do repositório). Rotas sem mock retornam 404 e nada chega ao backend — o `.env` aponta para um banco Neon real, que **não foi lido nem escrito**.
- Totem: sessão simulada via `localStorage` e câmera falsa do Chromium (`--use-fake-device-for-media-stream`). O **reconhecimento facial em si não foi exercitado** (sem rosto real/modelo remoto bloqueado) — limitação registrada.
- Baseline antes de qualquer edição: `pnpm typecheck` ✅ · `pnpm lint` 0 erros / 8 avisos (pré-existentes) · `pnpm test` 124/124 ✅.

## 2. Diagnóstico

Legenda de evidência: **[V]** observado no navegador · **[C]** confirmado no código · **[H]** hipótese (não comprovada) · **[M]** artefato do mock (descartado).

### P0 — Quebram tarefas, legibilidade ou layout

| #   | Problema                                                                                                                                                                                                                                                                                                                    | Evidência | Impacto                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| 1   | **Rolagem horizontal da página inteira** quando a tabela é larga (Eventos 1440→1538 px, Pessoas 1440→1696 px) e em mobile (abas do evento 390→488 px). O `SidebarInset` (flex) não tem `min-w-0`, então a tabela empurra a página em vez de rolar no próprio contêiner.                                                     | [V][C]    | Cabeçalho e ações ficam fora da tela; sensação de layout quebrado em todas as listagens. |
| 2   | **Totem ilegível quando o dispositivo está em tema claro**: título "Totem Check-in", rótulo "Chave do Totem" e botão "Voltar" (QR/Código/Face) ficam escuros sobre fundo escuro. O layout do totem é sempre escuro, mas os tokens seguem o tema do sistema.                                                                 | [V][C]    | Superfície principal do produto, usada pelo público final.                               |
| 3   | **Cabeçalho da coluna errado** na tabela de participantes: "E-mail é obrigatório" (reuso da chave de validação `emailRequired`).                                                                                                                                                                                            | [V][C]    | Confuso e com aparência de bug.                                                          |
| 4   | **Link "Configurações" do menu do usuário leva a `/settings`, rota inexistente** (404).                                                                                                                                                                                                                                     | [C]       | Beco sem saída na navegação.                                                             |
| 5   | **"Taxa" de check-in pode passar de 100%**: divide o total de _registros_ de check-in (um participante pode ter vários, em locais diferentes — não há unicidade no schema) pelo total de participantes; e o total vem da lista **filtrada pela busca** da aba Check-ins. O valor 5413% do print é [M], mas o defeito é [C]. | [C]       | Métrica principal do evento enganosa.                                                    |

### P1 — Navegação, hierarquia e usabilidade

| #   | Problema                                                                                                                                                                                          | Evidência |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 6   | Barra superior vazia: sem título de página, sem breadcrumb, sem retorno do detalhe do evento para a lista.                                                                                        | [V]       |
| 7   | Sidebar: grupo "Painel" com item "Painel" (duplicado); seletor de organização repetido no cabeçalho de cada página (Eventos, Pessoas) em vez de um lugar fixo.                                    | [V][C]    |
| 8   | Pessoas: **4 botões por linha** (Editar, Eventos, Rosto, **Excluir em vermelho sólido**) — ruído visual enorme e alvo destrutivo fácil de acertar por engano. Cabeçalho com 6 ações concorrentes. | [V]       |
| 9   | Eventos: nome não é o ponto de entrada óbvio; coluna "slug" ocupa espaço sem ajudar a tarefa; datas exibem **segundos** ("17:03:51").                                                             | [V]       |
| 10  | Detalhe do evento — Visão geral é rasa: 4 cartões genéricos + bloco de detalhes; os dados em tempo real (check-ins/min, último check-in, alertas de totem offline) não aparecem na primeira aba.  | [V]       |
| 11  | Totem — tela de métodos não mostra **qual evento** está ativo; a dica "Iniciar →" só aparece em _hover_ (inexistente em tela de toque). Logo desalinhado (à esquerda) na tela de login do totem.  | [V][C]    |
| 12  | Dashboard: título "Painel" + subtítulo "Visão Geral da Plataforma" repetidos; cartão "Audit Log Viewer" em inglês com selo cru "SUPER_ADMIN".                                                     | [V]       |
| 13  | Tela de carregamento expirado sem acentuação ("Nao foi possivel…") e sem i18n.                                                                                                                    | [C]       |

### P2 — Identidade visual, consistência e polimento

| #   | Problema                                                                                                                                               | Evidência |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 14  | Visual "shadcn padrão": cartões idênticos, todos com borda+sombra, ícones pequenos cinza no canto, números sem contexto. Pouca hierarquia tipográfica. | [V]       |
| 15  | Selos de status com tons diferentes por página; "Nenhuma imagem disponível" como selo longo quebra o ritmo da tabela.                                  | [V]       |
| 16  | Em 768 px o cabeçalho de Pessoas espreme a descrição em 4 linhas. Cartões de estatística em coluna única no mobile (desperdício vertical).             | [V]       |
| 17  | Sem tratamento global de `prefers-reduced-motion` (animações do totem e `tw-animate`).                                                                 | [C]       |
| 18  | Sem micro-interações consistentes (feedback de clique, transição de abas, entrada de conteúdo).                                                        | [V]       |

### Hipóteses a verificar durante a implementação

- [H→resolvida] Diálogos do totem: `forcedTheme` no provider cobre portais; os modais específicos do totem (download do modelo, impressão) **não foram renderizados**.
- [H→refutada em parte] Admin já usava menus por linha; os problemas reais eram selos sólidos (contraste), filtros e botões sem rótulo e títulos em inglês — corrigidos.

## 3. Estratégia

1. **Correções transversais primeiro** (P0 #1–#4, shell da aplicação): uma mudança corrige muitas páginas.
2. **Componentes compartilhados** em vez de reescrever monólitos (`events/[eventId]/page.tsx` tem 3.216 linhas; `people/page.tsx`, 1.628): `PageHeader`, `StatCard`, `RowActions` (menu com confirmação para exclusão), `EmptyState`. Trocas de JSX/className; handlers e estado intactos.
3. Todo texto novo passa por `t()` em **todos os idiomas** de `src/i18n/translations.ts` (as telas do totem seguem o padrão existente de texto fixo em português).
4. Marca violeta mantida, porém usada com parcimônia (ação primária, estado ativo, foco). Sem gradientes violeta em fundo branco.

### Ciclos por área

| Área                                               | Ciclos             | Foco                                                           |
| -------------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| Shell (layout, sidebar, cabeçalho)                 | 3                  | overflow, breadcrumb, navegação, responsivo                    |
| Detalhe do evento                                  | 3                  | métricas corretas, visão geral útil, tabelas, abas responsivas |
| Lista de eventos                                   | 3                  | entrada pelo nome, colunas, datas                              |
| Pessoas                                            | 3                  | ações por linha, cabeçalho, responsivo                         |
| Fluxo do totem                                     | 3                  | tema forçado, contexto do evento, toque, movimento reduzido    |
| Login, Dashboard, Totens/Integrações da org, Admin | 1 + revisão global | consistência                                                   |

## 4. Critérios de conclusão (aplicados a toda área)

- [x] Sem rolagem horizontal da página em 390, 768 e 1440 px (medido: `scrollWidth <= innerWidth`).
- [x] Zero erros de console no harness nas rotas inspecionadas.
- [x] `typecheck`, `lint`, `test` e `build` não piores que o baseline (0 erros de lint; avisos = 8).
- [x] Foco visível e ações primárias alcançáveis por teclado (ordem rastreada no detalhe do evento; menu de linha em Pessoas).
- [x] Contraste AA em claro e escuro (axe-core, regra `color-contrast`, 0 violações).
- [x] `prefers-reduced-motion` desliga animações não essenciais (duração computada medida: `2s × ∞` → `~0s × 1`).
- [x] Nenhuma regra de negócio ou permissão alterada; handlers intactos. Única mudança de API: campo aditivo e taxa corrigida em `/api/public/live/[slug]` (ver abaixo).

## 5. Estado atual

### Matriz de ciclos por área

| Área                                                                         | Ciclo 1 — navegação, hierarquia, usabilidade                                                                                                                                                                                                                  | Ciclo 2 — identidade, consistência, estados, microinterações                                                                                                   | Ciclo 3 — movimento, responsivo, a11y, desempenho, polimento                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shell** (layout, sidebar, cabeçalho)                                       | `min-w-0` (fim da rolagem horizontal), breadcrumb com rótulo dinâmico, cabeçalho fixo, pular-para-conteúdo, "Painel" duplicado e `/settings` (404) removidos                                                                                                  | Tokens de superfície/borda/raio, sidebar clara, `PageHeader` comum a todas as páginas, entrada de página animada                                               | Ordem de foco verificada com anel visível; "Toggle Sidebar" traduzido; breadcrumb reduz para 2 níveis abaixo de `lg`; movimento reduzido medido                                                                                                                                                                                              |
| **Detalhe do evento**                                                        | Métrica de presença corrigida (únicos, não filtrada), Visão geral útil (métodos, ao vivo, totens), voltar para eventos, colunas de participantes reorganizadas, ações num menu, rótulos errados corrigidos ("E-mail é obrigatório" etc.), status sem enum cru | Estados de erro ≠ vazio com "Tentar novamente", Sympla: colunas consolidadas e métricas na Visão geral, ícones de método, "Invalidar" neutro, selos semânticos | axe 0 violações (Sympla incluído), switches com rótulo, tabelas roláveis focáveis, polling só do realtime, alertas do servidor traduzidos, sem overflow em 390/768/1440                                                                                                                                                                      |
| **Lista de eventos**                                                         | Nome como link, slug secundário, coluna "Período" sem segundos, números à direita, estado vazio com CTA                                                                                                                                                       | Selos semânticos com ponto "ao vivo", `pages.eventsTable` traduzido em 4 idiomas                                                                               | Formulários criar/editar: diálogos roláveis em 768 px de altura, campos obrigatórios primeiro; axe limpo; "validado, sem mudança necessária" para o menu de status existente                                                                                                                                                                 |
| **Pessoas**                                                                  | 4 botões por linha → menu com exclusão separada; cabeçalho com 6 ações → menu "Planilha"; colunas agrupadas                                                                                                                                                   | Avatar com indicador de rosto, estado vazio e esqueleto, exclusão permanente como `destructive-ghost`, tooltips traduzidos                                     | Contraste das iniciais corrigido (4.25 → AA), "selecionar todos" com rótulo correto, menu operável por teclado, colunas responsivas (Eventos some < `sm`)                                                                                                                                                                                    |
| **Totem**                                                                    | Tema escuro forçado (legível com sistema claro), evento ativo visível, "Iniciar" sempre visível, logo centralizado                                                                                                                                            | Mensagens de erro em português por código, títulos contextuais, falha técnica não culpa o participante, sem "Pode seguir!" em recusa                           | axe limpo, movimento reduzido efetivo nas animações do totem, foco visível nos cartões; todas as recusas da API (incl. 9 do reconhecimento facial) traduzidas e testadas. Auto-cadastro e prompt de impressão do totem **não existem na web** (estão no app Android em `android-totem/`); modal de download do modelo facial não renderizado |
| Login, Dashboard, Totens/Integrações da org, Admin, `/live`, `/set-password` | Dashboard com dados reais; admin com `PageHeader` e breadcrumb; `/live` com taxa pública corrigida                                                                                                                                                            | Selos e cabeçalhos harmonizados, filtros com rótulo visível, textos acentuados                                                                                 | Passada única + varredura global (axe/overflow/console limpos)                                                                                                                                                                                                                                                                               |

### Ciclo 1 — concluído (navegação, hierarquia, usabilidade)

| #   | Status | O que foi feito                                                                                                                                                                                                                                                  |
| --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ✅     | `min-w-0` no `SidebarInset`; tabelas rolam no próprio contêiner. Varredura: 0 overflow em 390/768/1440, claro e escuro, 14 rotas SaaS + totem + login.                                                                                                           |
| 2   | ✅     | `forcedTheme="dark"` nas rotas `/totem*` (via `Providers`, cobre portais). Login, "Voltar" e rótulos legíveis com o sistema em tema claro.                                                                                                                       |
| 3   | ✅     | Cabeçalho de e-mail corrigido; mais 5 rótulos que usavam chaves de validação ("Nome é obrigatório" etc.) e o seletor de status que exibia `ACTIVE`.                                                                                                              |
| 4   | ✅     | Item "Configurações" → `/settings` (404) removido; menu do usuário mostra nome/e-mail.                                                                                                                                                                           |
| 5   | ✅     | Visão geral usa totais **não filtrados**: participantes, **presentes únicos** (`checkedIn=true`) e taxa de presença ≤100%. Check-ins registrados exibidos à parte. Usa endpoints já existentes (`/checkins/stats` e `/checkins/realtime` estavam sem uso na UI). |
| 6   | ✅     | Barra superior com breadcrumb (nome do evento via `useBreadcrumbLabel`), cabeçalho fixo com blur, link "Pular para o conteúdo", "Voltar para eventos".                                                                                                           |
| 7   | ✅     | Rótulo duplicado "Painel" removido; seletor de organização só aparece com 2+ organizações. Ordem e destino de navegação preservados.                                                                                                                             |
| 8   | ✅     | Pessoas e Participantes: ações por linha num menu (exclusão separada e em vermelho só no menu); colunas agrupadas (nome+e-mail, contato, credenciais); arquivos (importar/exportar/modelo) num menu "Planilha".                                                  |
| 9   | ✅     | Eventos: nome é link, slug como linha secundária, coluna "Período" sem segundos, números alinhados à direita, estado vazio com CTA. `pages.eventsTable` traduzido em en/fr/es/zh (antes caía para português).                                                    |
| 10  | ✅     | Visão geral: métodos de check-in, painel ao vivo (atualiza a cada 30 s só com evento ativo e aba visível), uso por totem, detalhes.                                                                                                                              |
| 11  | ✅     | Totem: nome do evento ativo na tela de métodos, "Iniciar" sempre visível, logo centralizado, erros da API mapeados para mensagens em português com título contextual ("Check-in já realizado" em vez de "Código inválido").                                      |
| 12  | ✅     | Dashboard reescrito com dados reais (resumo de eventos da organização ativa, em andamento/próximos, acesso rápido às organizações). Removidos os números fixos "—", o "Nenhum evento" permanente e o cartão de auditoria vazio.                                  |
| 13  | ✅     | Tela de timeout traduzida e acentuada.                                                                                                                                                                                                                           |

### Ciclo 2 — identidade, consistência, estados e microinterações

| Área            | O que foi feito                                                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens          | Fundo levemente acinzentado com cartões brancos (separação sem sombra pesada), bordas mais suaves, `--radius` 0.625rem, sidebar branca, `muted-foreground` com mais contraste nos dois temas, tokens de movimento (`--ease-out-soft`, `--duration-*`).                          |
| Selos           | Variantes semânticas únicas (`success`/`warning`/`info`/`danger`/`brand`/`neutral`) aplicadas a status de evento, totem, organização, usuário e página pública. Corrigido branco sobre amarelo ("Manutenção", contraste insuficiente).                                          |
| Estados         | Erro ≠ vazio: Visão geral e Dashboard mostram "Não foi possível carregar" + "Tentar novamente" quando a API falha (antes exibiam zeros/"nenhum check-in"). O painel ao vivo mantém o último dado bom numa falha transitória. Esqueletos de carregamento no formato do conteúdo. |
| Ações           | Exclusões como `destructive-ghost`; "Invalidar" neutro até hover/foco; menus por linha com rótulos acessíveis.                                                                                                                                                                  |
| Microinterações | Entrada de página (4 px + fade, 220 ms), botões com `active:scale`, barras de progresso animadas por `transform`, hover em linhas/links, ponto pulsante em "Ativo".                                                                                                             |
| Sympla          | Estado vinculado renderizado e ajustado: 4 colunas de ingresso consolidadas em 2; Métricas Sympla movidas para a Visão geral (análise) liberando a aba Check-ins (operação).                                                                                                    |
| Público `/live` | Acentos ("Últimos", "há 12 min", "Código", "Concluído"), números no formato pt-BR, rótulos "Presentes"/"No último minuto"; **taxa pública passou a contar participantes únicos** (antes podia passar de 100% no telão).                                                         |
| Admin           | Cabeçalhos padronizados (`PageHeader`), breadcrumb com nome da organização, título "Subscription" traduzido, papéis legíveis em vez de `ORG_OWNER`, filtros com rótulo visível ("Status: Todos").                                                                               |
| Formulários     | Diálogos com altura máxima e rolagem (o botão "Criar" ficava fora da tela em 768 px de altura); datas obrigatórias antes dos campos opcionais em criar/editar evento; seletor de tipo de documento ligado ao rótulo e sem vazar a coluna.                                       |

### Ciclo 3 — acessibilidade, responsividade, movimento, desempenho

| Critério                                            | Resultado medido                                                                                                                                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sem rolagem horizontal (390/768/1440, claro/escuro) | ✅ 14 rotas SaaS + totem + login + `/live` (`scrollWidth − innerWidth = 0`). Três casos encontrados e corrigidos (Dashboard +11 px, Configurações +49 px, Admin +2 px).                                                                                |
| axe-core (WCAG 2 A/AA)                              | ✅ 0 violações nas mesmas rotas, nos dois temas. Corrigidos: barra de progresso sem nome, 7 switches sem rótulo, filtros/checkboxes/menus admin sem nome, contraste das iniciais (4.25:1) e do selo `brand` (4.4:1), selo "Ativo" do `/live` (2.56:1). |
| Teclado                                             | ✅ Ordem: pular-para-conteúdo → sidebar → cabeçalho → voltar → abas → conteúdo, anel visível em todos (painel de aba ganhou anel). Menu de linha abre com Enter e navega por setas até "Excluir".                                                      |
| Movimento reduzido                                  | ✅ Medido: com `prefers-reduced-motion: reduce` a duração computada cai de `2s × infinite` para `~0s × 1`.                                                                                                                                             |
| Desempenho                                          | Visão geral: só o endpoint leve `/checkins/realtime` faz polling (30 s, evento ativo, aba visível); estatísticas pesadas recarregam no foco (mínimo 60 s) ou por "Tentar novamente". Nenhuma dependência nova no app.                                  |
| Rótulos traduzidos                                  | "Toggle Sidebar" → `nav.shell.toggleSidebar`; alertas do realtime (gerados em inglês no servidor) reconstruídos por tipo no cliente.                                                                                                                   |

### Pedidos do usuário (2026-10-25) — implementados

| Pedido                                              | O que foi feito                                                                                                                                                                                                                                                  | Verificação                                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Página inicial de `ORG_OWNER`/`EVENT_MANAGER`       | Redireciona para **Eventos** (antes: Pessoas).                                                                                                                                                                                                                   | Código; redirecionamento único em `dashboard/page.tsx`.                                                                                                                                     |
| 20 / 50 / 100 por página em Pessoas e Participantes | Componente compartilhado `ListPagination` (seletor + anterior/próxima com rótulos acessíveis). Trocar o tamanho volta para a página 1. A API já aceitava até 100.                                                                                                | Harness: requisição passa a `pageSize=50`/`100`; axe limpo; sem overflow em 390/768/1440.                                                                                                   |
| "Excluir todos" com confirmação                     | Botão ao lado da busca mostrando o alcance ("Excluir todos (1.240)"); confirmação exige digitar o número; respeita a busca atual (o texto da confirmação diz isso). Exclusão **lógica** (vai para "Excluídos", restaurável), como a exclusão em massa existente. | Harness: payload `{ all, search?, expectedCount }`; número errado mantém o botão desabilitado e nada é enviado; conflito 409 mostra "A lista mudou… Nada foi excluído". 9 testes unitários. |
| Filtro Sympla (participantes sem pessoa)            | `buildCheckInWhere` usa `OR: [{ personId: null }, { person: { deletedAt: null } }]` e a busca cobre `attendeeFullName`/`attendeeEmail`.                                                                                                                          | 3 testes unitários.                                                                                                                                                                         |

**Backend do "Excluir todos":** `POST /api/people/bulk-delete` aceita `{ all: true, organizationId, search?, expectedCount }` além do formato antigo; nova rota `POST /api/events/[eventId]/participants/bulk-delete`. Ambas usam o **mesmo `where` da listagem** (`buildPeopleWhere` / `buildParticipantsWhere`, extraídos das rotas GET) e rodam `updateMany` numa transação que é **revertida** se o número afetado ≠ `expectedCount`. RBAC `PARTICIPANT_MANAGE` + verificação de acesso à organização/evento.

### Sympla na Vercel Hobby (cron limitado a 1×/dia)

O deploy falhava com `* * * * *`. O cron fazia duas coisas a cada minuto: agendar syncs de eventos na janela ativa e **drenar a fila** (sync de participantes, espelhamento de check-ins, reconciliação). Contorno:

| Peça                                    | O que faz                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vercel.json` → `0 9 * * *`             | Cron diário (06:00 BRT): agenda syncs e roda a reconciliação diária. Passa no Hobby.                                                                                                                                                                                                                                                                            |
| `kickJobDrain()` (`after()` do Next)    | Drena a fila **depois de responder** (sem latência para quem chamou) em: "Sincronizar agora"/"Atualizar", vínculo de evento (sync inicial) e todo check-in (espelhamento na Sympla, limitado a 1 disparo a cada 15 s por instância). A fila usa `FOR UPDATE SKIP LOCKED`, então drenagens concorrentes são seguras. Rotas afetadas declaram `maxDuration = 60`. |
| `SymplaSyncStatus` na aba Participantes | "Sympla · atualizado há X" + botão **Atualizar** (dispara, acompanha o status e recarrega a lista). Com o evento **ativo** e a aba visível, sincroniza sozinho a cada 2 min. O sync é incremental (`lastSeedAt`), então o custo é baixo.                                                                                                                        |

Verificação: 5 testes unitários do disparo (força, limite, janela, fora de requisição, falha silenciosa); botão e timer validados no harness (POST aos 2 min, não com 1 min); axe limpo. **Não executado contra o banco real**: a fila é global e um disparo local processaria jobs pendentes de clientes reais, fora do escopo "Dev" autorizado.

Opcional, sem código: para sincronizar mesmo sem ninguém com a página aberta, um agendador externo gratuito (ex.: cron-job.org) pode chamar `GET /api/cron` a cada 1–5 min com o header `Authorization: Bearer <CRON_SECRET>`; a rota já foi feita para isso.

### Teste no banco de produção (organização "Dev")

Executado com login real (SUPER_ADMIN) e um filtro que bloqueava qualquer escrita fora do "Dev" (**0 bloqueios**, ou seja, o app nunca tentou escrever fora). **17/17 passos aprovados, 0 erros de API e 0 de console**: criar organização, criar/publicar/ativar evento, adicionar participante, importar planilha, 50 por página, check-in manual, Visão geral (presentes, taxa, linha "App" do uso por totem), "Excluir todos" de participantes (3 → 0) e de pessoas (3 → 0, indo para "Excluídos"), e páginas de leitura sem overflow.

Achado e corrigido no teste real: `GET /api/notifications` não existia (o app chamava em toda carga → 404). Rota criada usando o caso de uso existente; lista só as notificações do próprio usuário; sem sessão → 401.

Dados que ficaram no "Dev": organização "Dev", evento "Evento Teste UI" (ativo, sem participantes), 5 pessoas em "Excluídos", 2 check-ins de teste removidos junto com os participantes.

### Componentes e tokens novos

`PageHeader`, `StatCard`, `AppBreadcrumb`, `EventOverviewPanel`, `formatShortDateTime`/`formatDateTimeRange`; variantes de `Badge` (`success`, `warning`, `info`, `danger`, `brand`, `neutral`) e de `Button` (`destructive-ghost`); tokens de movimento; `prefers-reduced-motion` global.

### Verificações (estado final em 2026-10-25)

- `pnpm build` ✅ (63 páginas; executado com `DATABASE_URL` inalcançável para não tocar o banco).
- `pnpm typecheck` ✅ · `pnpm lint` 0 erros / 8 avisos (= baseline, todos pré-existentes) · `pnpm test` 170/170 ✅ (46 novos: sessões/logout, datas, mensagens do totem, filtros de check-in/pessoas/participantes, guarda do "Excluir todos" e disparo da fila).
- Harness: 0 erros de console, 0 overflow, 0 violações axe na varredura final — 14 rotas SaaS + detalhe de organização + 3 diálogos de formulário + modal de etiqueta + estado Sympla + `/live` + `/set-password` + `/login` + totem, em 390/768/1440 e claro/escuro.
- Textos de UI sem acento corrigidos também em `label-print-confirmation-modal`, `print.client` e `/live` (nenhum código compara esses textos). Falhas de API simuladas (HTTP 500) em stats/realtime/eventos para validar estados de erro.
- **Atenção:** durante o trabalho o servidor de dev serviu um `globals.css` antigo (cache do Turbopack) e as capturas iniciais não refletiam os tokens novos. O cache `.next` foi movido para o scratchpad e regenerado; todas as verificações finais acima foram refeitas depois disso.

### Mudanças de backend (mínimas, só leitura)

- `GET /api/events/[eventId]/checkins/stats`: o grupo de check-ins sem totem (aplicativo/importação) era descartado e, por ordenar pela contagem do próprio campo nulo, ficava sempre por último e podia ser cortado pelo `take: 5`. Agora entra como "App" e a ordenação usa a contagem de linhas. **Não executado contra o banco** (typecheck ok).

- `GET /api/public/live/[slug]`: novo campo aditivo `presentParticipants` (participantes com ≥1 check-in) e `checkInRate` calculado sobre ele. Clientes antigos continuam funcionando (`totalCheckIns` inalterado).

- Varredura final repetida contra o **build de produção** (`next start`): limpa. No servidor de dev aparecem `ChunkLoadError`/`ERR_CONTENT_LENGTH_MISMATCH` intermitentes no chunk do layout durante recompilação — transporte do dev, não reproduz em produção.
- Contraste: texto dos toasts do Sonner (tema claro) escurecido via `[data-sonner-theme='light']`; `destructive-ghost` mais claro no escuro; iniciais do avatar com `text-violet-700`.

### Achados fora do escopo de UI (registrados, não alterados)

- **[C→corrigido] Segurança — logout não revogava o token.** Agora o JWT carrega o id da sessão (`sid`); `withAuth`, `refresh`, `token-login` e `validate-session` exigem que a sessão exista, pertença ao usuário e não tenha expirado (`verifyUserSession`, 1 busca por chave primária). Logout encerra **só a sessão atual** (antes tentava revogar todas, sem efeito). Refresh **gira** a sessão (a antiga expira em 30 s, tolerância para várias abas). Tokens emitidos antes da correção (sem `sid`) são recusados: **todos os usuários precisarão entrar de novo uma vez** após o deploy. De quebra, o `withAuth` não converte mais exceções das rotas em 401. 8 testes unitários com o provider JWT real.

- [C] A API do totem responde mensagens em inglês; a UI agora as traduz por código, mas novos códigos cairão no texto cru.
- Contraste: o vermelho `--destructive` do tema claro ficava abaixo de 4.5:1 sobre o fundo tingido dos 3 diálogos de importação; o token foi escurecido (`oklch(0.53 0.22 27)`).
- [C] Pessoas: a listagem é pedida 3× ao abrir a página em dev (Strict Mode + recarga da lista de organizações nas dependências do efeito). Pré-existente.
- [C] Textos do formulário de configurações do evento, do editor de endereço e do totem continuam fixos em português (padrão já existente nesses arquivos); não foram migrados para i18n.

### Limitações

- Reconhecimento facial não exercitado (câmera falsa, sem rosto/modelo remoto).
- Nada foi testado contra o backend real; todas as telas autenticadas foram vistas com dados fictícios. A rota pública alterada não foi executada contra o banco (só typecheck/lint).
- Importação de planilhas **verificada na interface** com arquivos `.xlsx` reais (participantes, pessoas, check-ins): leitura, prévia, validação (linha sem nome bloqueia) e payload enviado à API (CPF/telefone normalizados). A resposta da API foi simulada. Cadastro de rosto não exercitado.
- Backend real exercitado no banco de produção, restrito à organização "Dev" (ver seção acima). O disparo de fila da Sympla não foi exercitado contra o banco real (fila global).
- Modal de download do modelo facial do totem não renderizado (depende do download real de ~137 MB).
- Leitor de tela real não foi usado; a acessibilidade foi medida com axe-core e navegação por teclado.

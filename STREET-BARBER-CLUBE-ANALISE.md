# Street Barber Clube — análise da base atual e modelo de dados proposto

**Data:** 27 de agosto de 2026  
**Escopo desta etapa:** auditoria somente. Nenhuma tabela, dado ou migração estrutural foi alterado.

## 1. Decisão arquitetural

O Clube será construído como uma extensão do Street Barber Shop, utilizando a mesma conexão `DATABASE_URL`, o mesmo banco MySQL/TiDB, o mesmo backend tRPC e o mesmo histórico de clientes e agendamentos. Não será criado projeto Supabase, segundo banco, réplica independente ou cadastro paralelo.

> **Regra de identidade:** um cliente possui um único cadastro em `customers`. A entrada no Clube acrescenta uma associação VIP ao cliente existente; não cria outra pessoa, outro histórico ou outra agenda.

A expressão “tempo real” será atendida, dentro da arquitetura atual, por transações no mesmo banco e invalidação/refetch das queries tRPC após cada mutação. Hoje não há WebSocket ou mecanismo de push contínuo. Depois que o núcleo estiver correto, uma atualização em tempo real por SSE/WebSocket poderá ser adicionada como melhoria isolada, sem mudar a fonte de verdade.

## 2. Resultado da auditoria do banco ativo

A base efetiva contém 17 tabelas, incluindo a tabela de controle de migrações do Drizzle. Os quantitativos foram consultados diretamente no MySQL/TiDB sem inserção, exclusão ou alteração de dados.

| Entidade | Tabela | Registros atuais | Situação |
|---|---|---:|---|
| Usuários | `users` | Não exposto neste relatório | OAuth técnico e perfis locais de equipe |
| Clientes | `customers` | 1 | Cadastro compartilhado com agendamentos |
| Agendamentos | `appointments` | 1 | Agenda operacional existente |
| Serviços | `services` | Não exposto neste relatório | Catálogo persistente, com catálogo compartilhado no código |
| Relação barbeiro-serviço | `barberServices` | Não exposto neste relatório | Preço e duração por barbeiro |
| Barbeiros | `barbers` | Não exposto neste relatório | Luan, Bruno e Kauã |
| Disponibilidade | `availability` | Não exposto neste relatório | Horários por barbeiro e dia da semana |
| Planos | `plans` | 0 | A Home ainda usa a constante frontend `plans` |
| Relação plano-benefício | `planBenefits` | Não exposto neste relatório | Estrutura existente, ainda sem planos persistidos |
| Benefícios | `benefits` | 0 | Pronta para ser evoluída, sem dados atuais |
| Parceiros | `partners` | 0 | Estrutura mínima existente, sem logos ou dados atuais |
| Assinaturas | `subscriptions` | 0 | Estrutura inicial, ainda sem ciclo ou pagamento |
| Itens do agendamento | `appointmentServices` | Não exposto neste relatório | Serviços vinculados a cada atendimento |
| Histórico do agendamento | `appointmentHistory` | Não exposto neste relatório | Criação, confirmação, cancelamento, conclusão e reagendamento |
| Bloqueios | `blocks` | Não exposto neste relatório | Bloqueios compartilhados com a agenda pública |
| Sessões administrativas | `adminSessions` | Não exposto neste relatório | Sessões locais dos quatro perfis internos |

O banco não contém atualmente tabelas de Clube, ciclos, consumo, pagamentos, sorteios ou roleta. Portanto, a implementação ainda não deve presumir nenhum cliente VIP, assinatura, benefício utilizado, vencedor ou recompensa.

## 3. Estrutura das tabelas atuais e reutilização

### 3.1 Clientes

A tabela `customers` possui `id`, `userId` opcional, `name`, `phone`, `email`, `createdAt` e `updatedAt`. Ela é a identidade central que deve ser reutilizada pelo Clube. O fluxo público de agendamento procura o cliente por telefone e e-mail e, quando encontra, atualiza o nome e reaproveita o `id`; quando não encontra, cria o cadastro.

Há uma melhoria necessária para a etapa de implementação: telefone e e-mail devem ser normalizados antes da comparação e deve ser estudada uma restrição de unicidade compatível com dados existentes. A regra de não duplicidade será aplicada dentro de transação, sem apagar nem recriar clientes.

### 3.2 Agendamentos

A tabela `appointments` relaciona `customerId` e `barberId`, registra data local de atendimento, horário inicial e final, timestamps UTC, duração, preço, status e timestamps de auditoria. Os serviços efetivos ficam em `appointmentServices`, e alterações ficam em `appointmentHistory`.

O fluxo de criação valida barbeiro, serviços, horário de terça a sábado entre 09h e 20h, disponibilidade individual, conflitos com outros agendamentos e conflitos com bloqueios. A gravação ocorre em transação. Esse é o ponto correto para consultar a situação VIP, mas **não** para consumir automaticamente um benefício: agendar não significa realizar o serviço.

O consumo de corte, barba ou sobrancelha deverá ocorrer em uma mutação transacional de conclusão do atendimento, aproveitando `appointmentId` e `appointmentServices`. Cancelamento e reagendamento não poderão gerar consumo.

### 3.3 Barbeiros e serviços

`barbers` contém os três profissionais e seus slugs; `services` contém o catálogo persistente; `barberServices` define preço e duração por combinação barbeiro-serviço. A disponibilidade de cada profissional está em `availability`.

Existe, porém, uma segunda fonte parcial no arquivo `shared/catalog.ts`, utilizada para validar o agendamento público, enquanto os preços e durações também existem no banco. Antes de ativar contratação ou descontos do Clube, a implementação deverá consolidar o catálogo em uma fonte única, preferencialmente o banco, mantendo o mesmo resultado visual e operacional.

### 3.4 Planos

`plans` contém atualmente `id`, `slug`, `name`, `priceCents`, `active` e `createdAt`, mas possui zero registros. A Home e as páginas atuais usam uma constante local com cinco planos: `2 cortes`, `4 cortes`, `2 cortes + 2 barbas`, `4 cortes + 2 barbas` e `4 cortes + 4 barbas`.

Essa é a principal lacuna de fonte de verdade: para o Clube funcionar sem divergência, os cinco planos deverão ser persistidos no banco mediante uma migração não destrutiva e a Home, `/planos` e o Clube deverão ler o mesmo procedimento/catalog query. Os valores, nomes, quantidades e benefícios atuais não serão alterados.

`planBenefits` já relaciona planos e benefícios, mas não registra quantidade de cortes, quantidade de barbas, limite de sobrancelha ou regra de desconto. A relação existente poderá ser mantida para benefícios gerais; uma tabela de entitlements será necessária para limites quantitativos e serviços elegíveis.

### 3.5 Autenticação

A autenticação atual tem duas camadas. Os quatro perfis internos usam login local com senha protegida por scrypt e sessão em `adminSessions`; a sessão local tem prioridade sobre o OAuth. O Manus OAuth permanece disponível para a camada técnica, mas usuários OAuth comuns não recebem acesso às procedures administrativas.

Hoje não existe uma área autenticada de cliente. Para o Clube, a proposta é reutilizar `users` para a identidade de login do cliente e ligar `customers.userId`, mantendo `role = user`. Uma tabela separada `customerSessions`, com token hash, expiração e revogação, evita misturar sessões de cliente com sessões de staff. A área VIP terá procedures próprias que sempre filtram pelo `customerId` derivado da sessão, nunca por um `customerId` livre enviado pelo navegador.

### 3.6 Calendário

O calendário administrativo é compartilhado. `AgendaCalendar.tsx` consulta agendamentos e bloqueios, cria uma grade mensal a partir de 2026, colore dias conforme bloqueios e confirmações, permite selecionar barbeiro e abre um único fluxo contextual para criar agendamento ou bloqueio. O backend impede conflitos contra `appointments` e `blocks` ativos.

O Clube deverá consultar a mesma ocupação e os mesmos horários. Um agendamento de Cliente VIP será um `appointment` normal, com eventual referência à assinatura/benefício utilizado em tabelas do Clube. Não haverá calendário paralelo.

### 3.7 Relatórios

Os relatórios são calculados no backend a partir de `appointments`, `appointmentServices`, `services`, `availability` e `blocks`. Eles calculam atendimentos, cancelamentos, receita, ticket médio, clientes únicos, produtividade, horas disponíveis, trabalhadas, ociosas e fechadas, respeitando o escopo do usuário.

A receita do Clube deverá ser adicionada depois a partir de uma tabela de pagamentos e do histórico de assinaturas. O relatório de utilização deverá ser calculado a partir dos registros imutáveis de consumo, não por contadores mantidos somente no frontend.

## 4. Tabelas que serão reutilizadas

| Tabela existente | Reutilização proposta |
|---|---|
| `customers` | Identidade única do cliente, status cadastral e ligação opcional com `users`. |
| `users` | Identidade de login do cliente VIP com `role = user`; perfis internos permanecem intactos. |
| `plans` | Fonte única dos cinco planos atuais para Home, Planos e Clube. |
| `planBenefits` | Relação de benefícios gerais de cada plano, complementada por regras quantitativas. |
| `benefits` | Catálogo de cortes, sobrancelha, descontos e benefícios exclusivos, sem dados falsos. |
| `partners` | Cadastro de parceiros/patrocinadores; serão adicionados campos de logo, link e benefício por migração aditiva. |
| `subscriptions` | Assinatura principal do cliente, evoluída para status de pagamento, método e renovação. |
| `appointments` | Agendamento único compartilhado; nenhuma agenda VIP separada. |
| `appointmentServices` | Serviços realizados e elegíveis para consumo de benefícios. |
| `appointmentHistory` | Histórico operacional do atendimento; o consumo terá auditoria própria para não misturar eventos. |
| `barbers`, `services`, `barberServices` | Catálogo de profissionais, serviços, preços e durações. |
| `availability`, `blocks` | Disponibilidade e ocupação compartilhadas. |
| `adminSessions` | Somente equipe interna; não será reutilizada para clientes. |

## 5. Novas tabelas propostas

Os nomes abaixo são conceituais e serão adaptados ao padrão camelCase já adotado no schema. Nenhuma será criada antes da aprovação deste relatório.

| Tabela proposta | Finalidade principal |
|---|---|
| `clubMembers` | Relação 1:1 entre `customers` e o status de membro VIP, com `customerId` único, data de entrada, status atual e assinatura vigente. |
| `membershipCycles` | Cada ciclo de 30 dias, com início, término, próxima renovação, assinatura vinculada e snapshot dos limites contratados. |
| `planEntitlements` | Quantidades e regras de consumo por plano: cortes, barbas, serviços elegíveis, sobrancelha e descontos. |
| `benefitUsage` | Registro imutável de cada consumo, com cliente, ciclo, tipo, serviço, barbeiro, agendamento e data. |
| `payments` | Tentativas e resultados financeiros de cartão/PIX, valor, método, provedor, identificador externo e status. |
| `subscriptionHistory` | Linha do tempo de criação, aprovação, renovação, recusa, cancelamento, expiração e alterações de plano. |
| `customerSessions` | Sessões autenticadas de clientes com token hash e expiração, separadas das sessões administrativas. |
| `partnerBenefits` | Benefícios específicos oferecidos por cada parceiro a membros VIP, com período de validade e descrição. |
| `raffles` | Campanhas independentes de sorteio mensal, prêmio, período, data do sorteio, status e vencedor. |
| `raffleParticipants` | Relação entre cliente VIP e sorteio, com inscrição, elegibilidade e participação. |
| `rouletteRewards` | Catálogo independente de recompensas possíveis da roleta e suas regras de validade. |
| `rouletteSpins` | Um giro por cliente/ciclo conforme a regra, com consumo, data e recompensa efetivamente registrada. |

Não será criada uma tabela duplicada para clientes, agendamentos, barbeiros, serviços ou planos. `payments` e `subscriptionHistory` são distintas porque uma tentativa financeira e um evento de ciclo/assinatura possuem naturezas diferentes.

## 6. Relacionamentos propostos

```text
customers 1 ─── 1 clubMembers
customers 1 ─── N subscriptions
plans 1 ─── N subscriptions
plans 1 ─── N membershipCycles (via assinatura)
plans 1 ─── N planEntitlements
membershipCycles 1 ─── N benefitUsage
customers 1 ─── N benefitUsage
appointments 1 ─── N benefitUsage (referência opcional)
services 1 ─── N benefitUsage (referência opcional)
barbers 1 ─── N benefitUsage (responsável)
subscriptions 1 ─── N payments
subscriptions 1 ─── N subscriptionHistory
partners 1 ─── N partnerBenefits
clubMembers N ─── N raffles (via raffleParticipants)
customers 1 ─── N rouletteSpins
membershipCycles 1 ─── N rouletteSpins
rouletteRewards 1 ─── N rouletteSpins
```

As restrições essenciais serão `UNIQUE clubMembers.customerId`, `UNIQUE` para uma participação do cliente no mesmo sorteio, e `UNIQUE` para o giro permitido por cliente e ciclo quando a regra for um giro por ciclo. O banco também deverá ter índices por cliente, assinatura, ciclo, status e datas.

## 7. Controle de Cliente VIP

O cadastro existente em `customers` será localizado por identidade normalizada. A contratação aprovada criará ou atualizará uma única linha em `clubMembers` e associará a assinatura ao mesmo `customerId`. O status VIP só será `active` quando a regra de pagamento confirmar a assinatura; checkout iniciado ou PIX gerado não será suficiente.

A área do cliente exibirá somente o membro associado à sessão autenticada. O backend não confiará em IDs enviados pelo frontend para escolher outro cliente. Cancelamento, recusa, expiração e reativação atualizarão o estado da assinatura e do membro por transações idempotentes.

## 8. Ciclos de 30 dias

Cada assinatura terá um `membershipCycle` com `startedAt`, `endsAt`, `nextRenewalAt` e estado. Os limites contratados serão copiados para o ciclo no momento da ativação, de modo que uma mudança futura de plano não altere retroativamente o ciclo anterior.

A consulta de saldo sempre considerará o ciclo vigente e seus registros de `benefitUsage`. Um novo ciclo só ficará disponível quando a renovação for aprovada conforme o método de pagamento. Não haverá antecipação de benefícios de ciclos futuros.

Como o sistema ainda não possui job periódico de renovação, a primeira versão deverá atualizar ciclos por eventos de pagamento e consultas protegidas de consistência. Um job de reconciliação poderá ser adicionado depois, seguindo a infraestrutura de atualizações periódicas, sem colocar lógica de expiração somente no frontend.

## 9. Cortes, barbas e sobrancelha

Os planos atuais serão transformados em entitlements persistentes: por exemplo, um plano de quatro cortes possuirá quatro unidades de corte no ciclo; planos mistos terão unidades separadas de corte e barba. Os valores serão derivados dos planos já apresentados na Home, sem inventar novos planos.

Um consumo será criado somente quando um atendimento for marcado como concluído ou realizado pela regra operacional aprovada. A operação será transacional: validar assinatura ativa, ciclo vigente, serviço elegível e saldo; inserir `benefitUsage`; e impedir saldo negativo. Cancelamento e reagendamento não inserirã consumo. Uma tentativa repetida deverá ser idempotente por referência ao atendimento e ao entitlement utilizado.

A sobrancelha de brinde será um entitlement do ciclo com limite de uma utilização. Uma restrição lógica e uma checagem transacional impedirão duas utilizações no mesmo ciclo. O registro conterá data, serviço, barbeiro e agendamento responsável.

## 10. Benefícios, descontos e parceiros

Benefícios gerais ficarão no catálogo `benefits` e serão relacionados aos planos. Regras quantitativas e elegibilidade ficarão em `planEntitlements`; consumos ficarão em `benefitUsage`. Descontos não serão aplicados apenas visualmente: cada utilização ou desconto concedido deverá possuir registro auditável, com origem e validade.

A tabela `partners` existente será evoluída de forma aditiva para comportar logo armazenada no storage do projeto, nome, descrição, link/contato e status. As logos enviadas pelo responsável serão armazenadas no storage persistente; não serão colocadas no repositório. `partnerBenefits` permitirá mais de um benefício por parceiro e períodos de validade.

## 11. Sorteios mensais

Sorteio e roleta permanecerão estruturas completamente independentes. `raffles` representará a campanha mensal, com período, prêmio, data, status e vencedor. `raffleParticipants` registrará a participação de clientes elegíveis no sorteio específico.

A interface poderá mostrar campanha atual, prêmio, data e participação. O painel administrativo será preparado para futura gestão por Luan e Bruno, preservando as permissões existentes. Não será criado resultado fictício, participante fictício ou vencedor de demonstração.

## 12. Roleta de descontos

A roleta terá `rouletteRewards` como catálogo de recompensas e `rouletteSpins` como registro de cada giro. O cliente poderá girar uma vez por ciclo, conforme a regra aprovada; a operação será transacional e sorteará somente recompensas existentes no catálogo.

O backend verificará VIP ativo, ciclo vigente e ausência de giro consumido. Depois, salvará o resultado e a data no mesmo fluxo. Um novo giro será rejeitado pelo backend mesmo que o frontend seja manipulado. A roleta não compartilhará tabelas, participantes ou vencedores com sorteios.

## 13. Pagamentos e renovações

A base atual não possui provedor de pagamento nem credenciais configuradas. Para cartão e PIX, será necessário ativar a integração de pagamentos do projeto, configurar as credenciais por ambiente e implementar confirmação por webhook/evento idempotente. Nenhuma assinatura deverá ser marcada como ativa apenas pela abertura do checkout.

`payments` registrará cada tentativa e seu status: pendente, aprovado, recusado, cancelado, estornado ou expirado, conforme o provedor escolhido. `subscriptions` manterá o estado operacional atual e `subscriptionHistory` manterá a linha do tempo. Cartão deverá registrar a referência do cliente e próxima renovação sem armazenar dados sensíveis do cartão. PIX deverá permanecer pendente até confirmação real do pagamento.

A implementação de pagamentos será feita somente após aprovação do modelo e confirmação do provedor. Na etapa técnica de implementação, será necessário configurar a integração Stripe disponível na plataforma ou outro provedor explicitamente escolhido, além de fornecer/confirmar as credenciais reais. Os valores financeiros continuarão em centavos e não serão calculados a partir de texto exibido na interface.

## 14. Segurança e isolamento

A autorização administrativa atual será preservada: Luan e Bruno continuam com visão ampla, Kauã permanece limitado à própria agenda/relatório e Barbearia continua sem acesso financeiro. O Clube não deverá alterar essas quatro roles.

Para clientes, cada procedure VIP deverá derivar o cliente da sessão autenticada e aplicar filtros no backend. Consultas de assinatura, ciclo, consumo, sorteio, roleta e dados pessoais deverão retornar somente registros do cliente autenticado. Operações administrativas futuras usarão procedures próprias e escopos explícitos.

Ações de consumo, pagamento, renovação, cancelamento e giro deverão ser idempotentes. Dados sensíveis de pagamento não serão salvos no banco da aplicação. Logs não deverão expor tokens, senhas, dados completos de cartão ou segredos de provedor.

## 15. Integração “em tempo real” com o ecossistema

A comunicação imediata possível na arquitetura atual será garantida por uma única transação de banco e invalidação de queries tRPC. Quando um agendamento for criado, ele aparecerá na mesma fonte usada pela agenda pública e pelo painel. Quando um atendimento for concluído, o consumo VIP e os relatórios serão atualizados a partir dos mesmos registros.

Inicialmente, o cliente poderá atualizar o estado por refetch após ações. SSE/WebSocket só deverá ser incluído se a necessidade de atualização sem interação for confirmada, pois isso adiciona infraestrutura sem ser necessário para preservar a consistência. A consistência do banco é prioridade sobre uma aparência de tempo real no frontend.

## 16. Ordem incremental de implementação após aprovação

| Incremento | Resultado | Critério de aceite |
|---|---|---|
| A | Migrar os cinco planos atuais para `plans` e expor uma query/catalog único | Home, Planos e Clube exibem os mesmos nomes, preços e benefícios |
| B | Criar `clubMembers`, `planEntitlements`, `membershipCycles`, `benefitUsage` e autenticação de cliente | Nenhum dado existente é apagado; cliente é reutilizado por identidade |
| C | Criar a página Street Barber Clube e o fluxo `Comprar plano` | Plano escolhido chega identificado à contratação |
| D | Integrar pagamento e status de assinatura | Checkout pendente não ativa VIP; aprovação idempotente ativa ciclo |
| E | Integrar consumo com conclusão de atendimento | Agendamento não consome; conclusão consome; cancelamento não consome |
| F | Criar benefícios, parceiros, sorteios e roleta | Sorteio e roleta têm tabelas e regras totalmente separadas |
| G | Criar área autenticada VIP e integração futura do painel/relatórios | Cada cliente vê apenas os próprios dados; equipe mantém permissões |
| H | Testar, revisar responsividade e criar checkpoint | Testes, TypeScript, build e fluxos críticos aprovados |

## 17. Gate de aprovação

Esta análise não executou migração, não criou tabela, não inseriu plano, não ativou pagamento e não modificou funcionalidades existentes. Para continuar, preciso da aprovação do modelo acima, especialmente dos seguintes pontos: uso do MySQL/TiDB atual; migração dos cinco planos hardcoded para `plans`; autenticação de cliente baseada em `users` + `customerSessions`; consumo somente na conclusão; um giro de roleta por ciclo; sorteios e roleta separados; e integração de pagamento somente após confirmação do provedor e credenciais.

Após a aprovação, a próxima ação será gerar o schema Drizzle aditivo, revisar o SQL gerado e apresentar a migração para conferência antes de aplicá-la. Nenhuma operação destrutiva será utilizada.

# Street Barber Clube — revisão final A–K

**Estado:** schema atualizado no código e migration gerada para revisão. **A migration não foi aplicada.** Não foram inseridos planos, clientes, assinaturas ou qualquer dado do Clube. O banco ativo continua com uma única fonte MySQL/TiDB.

## A) Cinco planos encontrados no frontend

A constante `plans` em `client/src/publicSite.tsx` define exatamente estes cinco planos:

| Slug | Nome | Preço | Preço anterior | Cortes | Barbas | Benefícios/regras |
|---|---|---:|---:|---:|---:|---|
| `2-cortes` | 2 cortes | R$ 60 | R$ 70 | 2 | 0 | Sobrancelha de brinde; economia de R$ 10; consumo em 30 dias |
| `4-cortes` | 4 cortes | R$ 125 | R$ 140 | 4 | 0 | Sobrancelha de brinde; economia de R$ 15; consumo em 30 dias; destaque visual |
| `2-cortes-2-barbas` | 2 cortes + 2 barbas | R$ 110 | R$ 120 | 2 | 2 | Sobrancelha de brinde; economia de R$ 10 |
| `4-cortes-2-barbas` | 4 cortes + 2 barbas | R$ 175 | R$ 190 | 4 | 2 | Sobrancelha de brinde; economia de R$ 15 |
| `4-cortes-4-barbas` | 4 cortes + 4 barbas | R$ 200 | R$ 240 | 4 | 4 | Sobrancelha de brinde; economia de R$ 40 |

As mensagens de apresentação de comunidade e os quatro itens de detalhe exibidos em cada card serão preservados como conteúdo. As quantidades, descontos e elegibilidade não dependerão de texto: serão representados por `planEntitlements` e pelo snapshot do ciclo. A tabela `plans` atual está vazia; nada será inserido antes da sua confirmação desses valores.

## B) Schema final proposto e 12 novas tabelas

O schema final está em `drizzle/schema.ts`. As doze novas tabelas são `clubMembers`, `planEntitlements`, `membershipCycles`, `benefitUsage`, `customerSessions`, `payments`, `subscriptionHistory`, `partnerBenefits`, `raffles`, `raffleParticipants`, `rouletteRewards` e `rouletteSpins`.

| Tabela | Campos principais e finalidade |
|---|---|
| `clubMembers` | `id`, `customerId UNIQUE`, `status`, `joinedAt`, `updatedAt`; relação VIP única do cliente existente. |
| `planEntitlements` | `planId`, `kind`, `serviceId`, `quantity`, `discountPercent`, `description`, `active`, `createdAt`; regras estruturadas do plano. |
| `membershipCycles` | `subscriptionId`, `clubMemberId`, `planId`, `status`, `startedAt`, `endsAt`, `nextRenewalAt`, `entitlementsSnapshot JSON`, auditoria; ciclo de 30 dias. |
| `benefitUsage` | membro, ciclo, atendimento opcional, serviço, barbeiro, `kind`, `quantity`, `usedAt`, `idempotencyKey UNIQUE`, nota; consumo efetivo. |
| `customerSessions` | cliente, `tokenHash UNIQUE`, expiração, revogação e criação; sessão de cliente separada de `adminSessions`. |
| `payments` | assinatura, cliente, método, status, valor em centavos, moeda, referências do provedor, idempotência, datas e falha; não contém cartão. |
| `subscriptionHistory` | assinatura, cliente, evento, estados anterior/novo, pagamento opcional, nota e data; histórico imutável de transições. |
| `partnerBenefits` | parceiro, benefício opcional, título, descrição, desconto, validade, ativo e auditoria. |
| `raffles` | campanha, prêmio, período, data do sorteio, status e vencedor opcional. |
| `raffleParticipants` | campanha, cliente, status e data; participação única por campanha. |
| `rouletteRewards` | catálogo de recompensas independentes, desconto/serviço/benefício e ativo. |
| `rouletteSpins` | membro, ciclo, recompensa, status, data e idempotência; um giro por cliente/ciclo. |

O snapshot escolhido é a solução **B com materialização relacional em JSON versionado no próprio ciclo**: ao criar um `membershipCycle`, o backend copia todos os entitlements ativos do plano para `entitlementsSnapshot`, incluindo `kind`, `serviceId`, `quantity`, `discountPercent` e `description` descritiva. A regra operacional continua nos campos estruturados do entitlement e no snapshot estruturado; `description` nunca decide saldo. Assim, novos tipos de benefício podem ser adicionados sem perder o histórico exato do ciclo já iniciado. O plano posterior poderá ainda manter `planEntitlements` para novos ciclos sem alterar snapshots antigos.

## C) Alterações nas tabelas existentes

### `subscriptions`

O enum `status` será ampliado aditivamente para `pending`, `active`, `paused`, `cancelled` e `expired`, preservando os valores atuais. Serão adicionados `paymentMethod`, `paymentStatus`, `nextRenewalAt`, `cancelledAt`, `providerCustomerRef`, `providerSubscriptionRef` e `updatedAt`. O status financeiro ficará separado do status da assinatura.

### `appointments`

Será adicionado `membershipCycleId INT NULL` com índice e foreign key para `membershipCycles.id`. Esse campo registra apenas o contexto VIP do agendamento. O agendamento continuará sendo um registro normal da agenda compartilhada e não consumirá benefício.

### `partners`

Serão adicionados `logoKey`, `logoUrl`, `websiteUrl`, `contact` e `updatedAt`. A mídia ficará no storage persistente, e o banco guardará referências.

Nenhum campo será adicionado a `customers`, `users`, `barbers`, `services`, `barberServices`, `availability`, `blocks`, `appointmentServices`, `appointmentHistory`, `adminSessions`, `benefits` ou `planBenefits` nesta migration. `customers` permanece a identidade única.

## D) Migration Drizzle completa

A migration foi gerada pelo Drizzle a partir do schema final em dois arquivos consecutivos, porque a foreign key de `appointments.membershipCycleId` foi acrescentada após a primeira geração:

| Arquivo | Conteúdo |
|---|---|
| `drizzle/0005_tearful_sleeper.sql` | Criação das 12 tabelas, alteração aditiva de `subscriptions`, `partners` e `appointments`, foreign keys, índices e constraints. |
| `drizzle/0006_cultured_red_wolf.sql` | Complemento gerado: foreign key `appointments.membershipCycleId → membershipCycles.id`. |

A base atual registra apenas uma migration anterior em `__drizzle_migrations`; as migrations 0005/0006 **não estão aplicadas**. O arquivo único completo para inspeção é `STREET-BARBER-CLUBE-MIGRATION-SQL-COMPLETA.sql`, anexado junto deste documento. Não há `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE` ou recriação de tabela no SQL gerado.

## E) SQL completo

O SQL completo e não truncado está no arquivo anexo `STREET-BARBER-CLUBE-MIGRATION-SQL-COMPLETA.sql`. Ele foi formado a partir dos arquivos gerados pelo Drizzle e contém 28 tabelas no snapshot do código: as 16 existentes do projeto, mais as 12 novas. A inspeção confirmou:

| Verificação | Resultado |
|---|---|
| Statements de criação | 12 `CREATE TABLE` para as tabelas novas |
| Alterações existentes | `subscriptions`, `appointments` e `partners` apenas |
| Foreign keys | Todas as referências propostas, incluindo a de `appointments` no complemento 0006 |
| UNIQUE | Cliente VIP por `customerId`, idempotência e giro por ciclo |
| Índices | Ciclos, consumo, sessões, pagamentos, parceiros, campanhas, recompensas e referências |
| ENUMs | Status e tipos definidos no schema final |
| NULL/NOT NULL/defaults | Conferidos no SQL gerado e no schema |
| Aplicação no banco | **Não executada** |

A migration será considerada pronta para aplicação somente após sua aprovação explícita e uma nova conferência do SQL no ambiente-alvo.

## F) Snapshot dos benefícios

`planEntitlements` terá uma linha para cada concessão estruturada. Para os cinco planos, a carga posterior poderá representar cortes e barbas como `kind = cuts/beards` com `quantity` numérica; a sobrancelha como `kind = eyebrow` com `quantity = 1`; serviços específicos como `kind = service` com `serviceId`; descontos como `kind = discount` com `discountPercent`; e demais vantagens como `kind = benefit` com quantidade e identificador próprio quando houver catálogo persistente.

No momento de ativar um ciclo, o backend lerá todos os entitlements ativos do plano e gravará o conjunto completo no `entitlementsSnapshot` do ciclo. O saldo será sempre calculado por `quantidade do snapshot - soma do benefitUsage do ciclo`, nunca por valor informado pelo cliente. Uma alteração futura de `planEntitlements` afetará somente ciclos novos.

## G) Estratégia de consumo

Agendamento é diferente de consumo. O Cliente VIP agendará em `appointments`, usando `availability` e `blocks` existentes; `membershipCycleId` será apenas referência contextual. O consumo ocorrerá exclusivamente quando o atendimento for marcado como concluído.

A mutação de conclusão deverá executar transação que identifica o cliente pela sessão/autorização do backend, valida assinatura `active`, ciclo vigente, entitlement elegível, serviço e saldo, verifica `idempotencyKey`, insere `benefitUsage` e retorna o saldo calculado. Corte, barba e sobrancelha serão contados separadamente. A sobrancelha de brinde terá quantidade 1 no snapshot. Cancelamento e reagendamento não inserem consumo. O cliente nunca poderá alterar saldo ou enviar um `customerId` confiável pelo frontend.

## H) Estratégia da roleta

A roleta utiliza somente `rouletteRewards` e `rouletteSpins`. Para girar, o backend descobre o cliente pela sessão, valida membro VIP e ciclo ativo, seleciona uma recompensa ativa, e grava o giro em transação com `idempotencyKey`. A constraint `UNIQUE(clubMemberId, membershipCycleId)` garante um único giro por ciclo; a idempotência e a transação impedem que duas abas concluam dois giros simultâneos.

O resultado fica salvo em `rouletteSpins`. Não existe foreign key, consulta obrigatória ou procedimento compartilhado entre roleta e sorteio. Participar de sorteio jamais consome giro.

## I) Estratégia dos sorteios

O sorteio utiliza somente `raffles` e `raffleParticipants`. Cada campanha mensal registra período, prêmio, participantes, status, vencedor e histórico por timestamps. A participação é única por cliente e campanha via `UNIQUE(raffleId, customerId)`.

Elegibilidade, inscrição, encerramento e escolha do vencedor serão procedures próprias. Nenhum vencedor ou participante será criado como dado fictício. Não haverá relacionamento com `rouletteRewards` ou `rouletteSpins`.

## J) Estratégia de rollback

Antes da aplicação, será feita exportação/backup lógico e verificação de contagens, órfãos e `SHOW CREATE TABLE` no ambiente-alvo. A aplicação ocorrerá somente após aprovação e em sequência controlada. Se houver falha, a operação será interrompida; não serão usados `DROP`, `TRUNCATE`, `DELETE`, recriação de tabela ou alteração destrutiva.

Como as novas tabelas começam vazias, o rollback preferencial é corrigir o código e manter estruturas vazias/inativas. Remoção física só poderá ser considerada por uma migration reversa revisada, em ordem inversa de dependência e após confirmar que não há dados. Os campos aditivos serão removidos somente se não houver registros que os utilizem. Dados de clientes, agendamentos, planos, histórico, pagamentos, consumo, sorteios e roleta nunca serão apagados automaticamente.

## K) Checklist de segurança

| Controle | Status/proposta |
|---|---|
| Banco único MySQL/TiDB | Confirmado |
| Cliente único em `customers` | `clubMembers.customerId UNIQUE`; confirmado |
| Sessão administrativa separada | `adminSessions` preservada |
| Sessão de cliente separada | `customerSessions` com token hash |
| Cliente derivado no backend | Obrigatório; nunca confiar em `customerId` enviado |
| Isolamento de dados VIP | Procedures filtradas pela sessão autenticada |
| Consumo idempotente | `benefitUsage.idempotencyKey UNIQUE` + transação |
| Saldo controlado no backend | Snapshot + soma de consumo; confirmado |
| Um giro por ciclo | `rouletteSpins(clubMemberId, membershipCycleId) UNIQUE` + transação |
| Sorteio independente | Tabelas e procedures próprias |
| Pagamento sem cartão sensível | Apenas método e referências do provedor |
| Webhook futuro idempotente | `payments.idempotencyKey` e referência externa |
| Permissões administrativas | Luan/Bruno/Kauã/Barbearia preservados |
| Agenda única | `appointments`, `blocks`, `availability` preservados |
| Sem migração destrutiva | Nenhum comando destrutivo gerado |
| Sem gateway nesta etapa | Confirmado; somente estrutura de dados |
| Sem aplicação automática | Confirmado; aguarda aprovação textual |

## Aprovação necessária

A estrutura foi atualizada no código e a migration foi somente gerada/revisada. **Não executei a migration e não inseri os cinco planos.** Para autorizar a próxima etapa, responda exatamente:

> **APROVADO — PODE APLICAR A MIGRATION**

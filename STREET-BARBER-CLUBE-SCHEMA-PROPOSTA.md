# Street Barber Clube — proposta de schema e migration

**Status:** proposta para revisão. **Nenhuma migration foi aplicada.** Nenhum dado foi inserido, atualizado ou removido nesta etapa.

## A) Os cinco planos atualmente encontrados no frontend

A fonte atual é a constante `plans` em `client/src/publicSite.tsx`. A tabela `plans` do MySQL/TiDB está vazia no momento; portanto, os valores abaixo são transcritos do frontend e ainda não foram inseridos no banco.

| Slug | Nome | Preço atual | Preço de referência | Quantidade de cortes | Quantidade de barbas | Benefícios e regras atuais |
|---|---|---:|---:|---:|---:|---|
| `2-cortes` | 2 cortes | R$ 60 | R$ 70 | 2 | 0 | Sobrancelha de brinde; economia de R$ 10 no mês; consumo dentro de 30 dias |
| `4-cortes` | 4 cortes | R$ 125 | R$ 140 | 4 | 0 | Sobrancelha de brinde; economia de R$ 15 no mês; consumo dentro de 30 dias; plano destacado |
| `2-cortes-2-barbas` | 2 cortes + 2 barbas | R$ 110 | R$ 120 | 2 | 2 | Sobrancelha de brinde; economia de R$ 10 no mês |
| `4-cortes-2-barbas` | 4 cortes + 2 barbas | R$ 175 | R$ 190 | 4 | 2 | Sobrancelha de brinde; economia de R$ 15 no mês |
| `4-cortes-4-barbas` | 4 cortes + 4 barbas | R$ 200 | R$ 240 | 4 | 4 | Sobrancelha de brinde; economia de R$ 40 no mês |

Os detalhes de cada plano também contêm a observação de comunidade correspondente: “Para manter seu ritmo e fazer parte da comunidade”, “Presença constante para quem vive o estilo”, “Um cuidado completo para a sua rotina”, “Mais frequência, mais identidade, mais comunidade” e “A experiência completa para estar sempre presente”. Essas frases serão preservadas como conteúdo de apresentação, mas as quantidades e regras operacionais serão campos numéricos do banco, não texto livre.

Não foi identificado nenhum plano adicional, preço alternativo, quantidade oculta ou regra de fidelidade no frontend analisado. O plano 4-cortes aparece como destacado visualmente; isso será representado pelo campo existente `active` mais um campo futuro opcional de apresentação, caso seja realmente necessário. Para esta migration, não será adicionado campo visual desnecessário.

## B) Schema Drizzle proposto

O schema abaixo é **aditivo**. Ele reutiliza as tabelas existentes e acrescenta estruturas apenas onde a funcionalidade do Clube exige persistência própria. Os nomes seguem o padrão atual do projeto (`mysqlTable` com nomes camelCase).

### B.1 Novas tabelas

#### `clubMembers`

Representa a relação VIP do cliente existente. A restrição única em `customerId` garante uma única associação de Clube por cadastro de cliente.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `customerId` | `int` | NOT NULL, FK `customers.id`, UNIQUE |
| `status` | `mysqlEnum` | `pending`, `active`, `cancelled`, `expired`, `suspended`; default `pending` |
| `joinedAt` | `timestamp` | NOT NULL |
| `updatedAt` | `timestamp` | NOT NULL, atualização automática |

#### `planEntitlements`

Representa quantitativamente o que cada plano concede. Um plano terá linhas separadas para cortes, barbas, sobrancelha, serviços elegíveis, desconto e outros benefícios. Não será usado apenas texto para representar quantidade.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `planId` | `int` | NOT NULL, FK `plans.id` |
| `kind` | `mysqlEnum` | `cuts`, `beards`, `service`, `eyebrow`, `discount`, `benefit` |
| `serviceId` | `int` | NULL, FK `services.id`; obrigatório para `service` quando aplicável |
| `quantity` | `int` | NOT NULL, default 0, mínimo lógico 0 |
| `discountPercent` | `int` | NULL, percentual inteiro de 0 a 100 |
| `description` | `varchar(500)` | NULL, texto complementar de apresentação |
| `active` | `int` | NOT NULL, default 1 |
| `createdAt` | `timestamp` | NOT NULL |

#### `membershipCycles`

Representa cada ciclo de 30 dias da assinatura e congela os limites contratados naquele ciclo. O snapshot numérico evita que uma futura alteração de plano altere o saldo histórico.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `subscriptionId` | `int` | NOT NULL, FK `subscriptions.id` |
| `clubMemberId` | `int` | NOT NULL, FK `clubMembers.id` |
| `planId` | `int` | NOT NULL, FK `plans.id` |
| `status` | `mysqlEnum` | `pending`, `active`, `closed`, `expired`; default `pending` |
| `startedAt` | `timestamp` | NOT NULL |
| `endsAt` | `timestamp` | NOT NULL |
| `nextRenewalAt` | `timestamp` | NULL |
| `contractedCuts` | `int` | NOT NULL, default 0 |
| `contractedBeards` | `int` | NOT NULL, default 0 |
| `contractedEyebrow` | `int` | NOT NULL, default 0 |
| `discountPercent` | `int` | NOT NULL, default 0 |
| `createdAt` | `timestamp` | NOT NULL |
| `updatedAt` | `timestamp` | NOT NULL, atualização automática |

O saldo disponível será calculado como quantidade contratada menos a soma de `benefitUsage` do tipo correspondente no ciclo. Não haverá contador confiado apenas ao frontend.

#### `benefitUsage`

Registro de consumo efetivo e auditável. O consumo só será criado na conclusão do atendimento ou na utilização efetiva de um benefício, nunca na criação do agendamento.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `clubMemberId` | `int` | NOT NULL, FK `clubMembers.id` |
| `membershipCycleId` | `int` | NOT NULL, FK `membershipCycles.id` |
| `appointmentId` | `int` | NULL, FK `appointments.id` |
| `serviceId` | `int` | NULL, FK `services.id` |
| `barberId` | `int` | NULL, FK `barbers.id` |
| `kind` | `mysqlEnum` | `cut`, `beard`, `eyebrow`, `discount`, `benefit` |
| `quantity` | `int` | NOT NULL, default 1 |
| `usedAt` | `timestamp` | NOT NULL |
| `idempotencyKey` | `varchar(191)` | NOT NULL, UNIQUE |
| `note` | `varchar(500)` | NULL |
| `createdAt` | `timestamp` | NOT NULL |

A referência opcional a `appointmentId` permite auditar qual atendimento consumiu o benefício. A chave de idempotência impede que a conclusão seja processada duas vezes.

#### `customerSessions`

Sessão exclusiva de cliente, separada de `adminSessions`. O banco armazenará somente o hash do token.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `customerId` | `int` | NOT NULL, FK `customers.id` |
| `tokenHash` | `varchar(128)` | NOT NULL, UNIQUE |
| `expiresAt` | `timestamp` | NOT NULL |
| `revokedAt` | `timestamp` | NULL |
| `createdAt` | `timestamp` | NOT NULL |

#### `payments`

Registro de tentativas e resultados financeiros, sem armazenar dados sensíveis de cartão. A integração com gateway não será implementada nesta etapa; a tabela apenas prepara o domínio.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `subscriptionId` | `int` | NOT NULL, FK `subscriptions.id` |
| `customerId` | `int` | NOT NULL, FK `customers.id` |
| `method` | `mysqlEnum` | `card`, `pix` |
| `status` | `mysqlEnum` | `pending`, `approved`, `declined`, `cancelled`, `refunded`, `expired` |
| `amountCents` | `int` | NOT NULL |
| `currency` | `varchar(3)` | NOT NULL, default `BRL` |
| `provider` | `varchar(64)` | NULL |
| `externalPaymentRef` | `varchar(191)` | NULL |
| `idempotencyKey` | `varchar(191)` | NOT NULL, UNIQUE |
| `dueAt` | `timestamp` | NULL |
| `paidAt` | `timestamp` | NULL |
| `failureReason` | `varchar(500)` | NULL |
| `createdAt` | `timestamp` | NOT NULL |
| `updatedAt` | `timestamp` | NOT NULL, atualização automática |

#### `subscriptionHistory`

Linha do tempo da assinatura e seus eventos de cobrança. Não substitui `payments`: pagamento é uma tentativa financeira; histórico é a mudança de estado do domínio.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `subscriptionId` | `int` | NOT NULL, FK `subscriptions.id` |
| `customerId` | `int` | NOT NULL, FK `customers.id` |
| `event` | `mysqlEnum` | `created`, `payment_pending`, `payment_approved`, `payment_declined`, `renewed`, `cancelled`, `expired`, `refunded` |
| `fromStatus` | `varchar(32)` | NULL |
| `toStatus` | `varchar(32)` | NULL |
| `paymentId` | `int` | NULL, FK `payments.id` |
| `note` | `varchar(500)` | NULL |
| `createdAt` | `timestamp` | NOT NULL |

#### `partnerBenefits`

Relaciona um parceiro existente a um benefício VIP específico, sem transformar a seção em loja.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `partnerId` | `int` | NOT NULL, FK `partners.id` |
| `benefitId` | `int` | NULL, FK `benefits.id` |
| `title` | `varchar(255)` | NOT NULL |
| `description` | `varchar(500)` | NULL |
| `discountPercent` | `int` | NULL |
| `validFrom` | `date` | NULL |
| `validUntil` | `date` | NULL |
| `active` | `int` | NOT NULL, default 1 |
| `createdAt` | `timestamp` | NOT NULL |
| `updatedAt` | `timestamp` | NOT NULL, atualização automática |

#### `raffles`

Campanha mensal de sorteio. Não possui referência a giros, recompensas ou consumo da roleta.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `name` | `varchar(255)` | NOT NULL |
| `campaign` | `varchar(255)` | NOT NULL |
| `prize` | `varchar(500)` | NOT NULL |
| `startsAt` | `timestamp` | NOT NULL |
| `endsAt` | `timestamp` | NOT NULL |
| `drawAt` | `timestamp` | NOT NULL |
| `status` | `mysqlEnum` | `draft`, `open`, `closed`, `drawn`, `cancelled` |
| `winnerCustomerId` | `int` | NULL, FK `customers.id` |
| `createdAt` | `timestamp` | NOT NULL |
| `updatedAt` | `timestamp` | NOT NULL, atualização automática |

#### `raffleParticipants`

Participação de um cliente VIP em uma campanha específica. Participar de sorteio não cria nem consome `rouletteSpins`.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `raffleId` | `int` | NOT NULL, FK `raffles.id` |
| `customerId` | `int` | NOT NULL, FK `customers.id` |
| `status` | `mysqlEnum` | `eligible`, `removed`, `winner` |
| `joinedAt` | `timestamp` | NOT NULL |

Restrição única: um cliente só pode se inscrever uma vez na mesma campanha.

#### `rouletteRewards`

Catálogo independente de recompensas possíveis da roleta. Nenhum resultado será gravado em `raffles`.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `name` | `varchar(255)` | NOT NULL |
| `description` | `varchar(500)` | NULL |
| `rewardType` | `mysqlEnum` | `percent_discount`, `fixed_discount`, `free_service`, `benefit` |
| `discountPercent` | `int` | NULL |
| `discountCents` | `int` | NULL |
| `serviceId` | `int` | NULL, FK `services.id` |
| `benefitId` | `int` | NULL, FK `benefits.id` |
| `active` | `int` | NOT NULL, default 1 |
| `createdAt` | `timestamp` | NOT NULL |

#### `rouletteSpins`

Consumo do giro e recompensa efetivamente entregue. A chave única `(clubMemberId, membershipCycleId)` enforça um giro por cliente por ciclo.

| Campo | Tipo Drizzle | Regra |
|---|---|---|
| `id` | `int` | PK autoincremental |
| `clubMemberId` | `int` | NOT NULL, FK `clubMembers.id` |
| `membershipCycleId` | `int` | NOT NULL, FK `membershipCycles.id` |
| `rewardId` | `int` | NOT NULL, FK `rouletteRewards.id` |
| `status` | `mysqlEnum` | `consumed`, `reversed` |
| `spunAt` | `timestamp` | NOT NULL |
| `idempotencyKey` | `varchar(191)` | NOT NULL, UNIQUE |
| `createdAt` | `timestamp` | NOT NULL |

## C) Novas tabelas

As onze novas tabelas são: `clubMembers`, `planEntitlements`, `membershipCycles`, `benefitUsage`, `customerSessions`, `payments`, `subscriptionHistory`, `partnerBenefits`, `raffles`, `raffleParticipants`, `rouletteRewards` e `rouletteSpins`. Embora a lista contenha doze nomes, a contagem correta é **12 novas tabelas**; elas estão todas especificadas na seção B.

Nenhuma tabela existente será recriada. As tabelas novas terão foreign keys para as tabelas atuais e serão criadas antes das alterações de referência em `appointments`.

## D) Campos adicionados às tabelas existentes

### `subscriptions`

A tabela atual possui `customerId`, `planId`, `status` com `active`, `paused`, `cancelled`, `startedAt` e `endedAt`. Serão adicionados:

| Campo | Tipo | Finalidade |
|---|---|---|
| `paymentMethod` | `ENUM('card','pix')` NULL | Método escolhido sem armazenar dados do cartão |
| `paymentStatus` | `ENUM('pending','approved','declined','cancelled','refunded','expired')` | Estado financeiro separado do ciclo da assinatura |
| `nextRenewalAt` | `TIMESTAMP` NULL | Próxima renovação prevista |
| `cancelledAt` | `TIMESTAMP` NULL | Momento de cancelamento |
| `providerCustomerRef` | `VARCHAR(191)` NULL | Referência externa não sensível |
| `providerSubscriptionRef` | `VARCHAR(191)` NULL | Referência externa da assinatura |
| `updatedAt` | `TIMESTAMP` | Auditoria de atualização |

O enum atual de `status` será ampliado de forma aditiva para incluir `pending` e `expired`, com default `pending` para novos registros. Valores existentes `active`, `paused` e `cancelled` serão preservados.

### `appointments`

Será adicionado `membershipCycleId INT NULL`, com foreign key para `membershipCycles.id`. Isso permite associar um agendamento VIP ao ciclo selecionado sem criar uma tabela de agenda paralela. O campo não determina consumo: somente `benefitUsage` na conclusão efetiva poderá consumir benefício.

### `partners`

A tabela atual possui `name`, `description`, `active` e `createdAt`. Serão adicionados `logoKey`, `logoUrl`, `websiteUrl`, `contact` e `updatedAt`. A mídia será armazenada no storage persistente, e o banco guardará referência, não bytes.

### `customers`, `users`, `barbers`, `services`, `barberServices`, `availability`, `blocks`, `appointmentServices`, `appointmentHistory`, `adminSessions`, `benefits` e `planBenefits`

Não receberão campos nesta primeira migration. A identidade de cliente continuará em `customers`; a autenticação de cliente usará `users`/`customers.userId` quando aplicável e a nova `customerSessions`; os perfis administrativos e suas sessões não serão alterados.

A normalização de telefone/e-mail para localizar um cliente existente será implementada na camada de serviço, com transação e revisão dos dados atuais. Não será criada uma chave de cliente paralela.

## E) Relacionamentos

| Origem | Cardinalidade | Destino | Uso |
|---|---:|---|---|
| `clubMembers.customerId` | N:1, único no membro | `customers.id` | Um único membro VIP por cliente |
| `planEntitlements.planId` | N:1 | `plans.id` | Regras quantitativas do plano |
| `planEntitlements.serviceId` | N:1 opcional | `services.id` | Serviço elegível |
| `subscriptions.customerId` | N:1 existente | `customers.id` | Assinatura do cliente único |
| `subscriptions.planId` | N:1 existente | `plans.id` | Plano contratado |
| `membershipCycles.subscriptionId` | N:1 | `subscriptions.id` | Ciclos da assinatura |
| `membershipCycles.clubMemberId` | N:1 | `clubMembers.id` | Ciclos do membro VIP |
| `membershipCycles.planId` | N:1 | `plans.id` | Plano congelado no ciclo |
| `benefitUsage.clubMemberId` | N:1 | `clubMembers.id` | Cliente que consumiu |
| `benefitUsage.membershipCycleId` | N:1 | `membershipCycles.id` | Ciclo do consumo |
| `benefitUsage.appointmentId` | N:1 opcional | `appointments.id` | Atendimento concluído relacionado |
| `benefitUsage.serviceId` | N:1 opcional | `services.id` | Serviço consumido |
| `benefitUsage.barberId` | N:1 opcional | `barbers.id` | Profissional responsável |
| `appointments.membershipCycleId` | N:1 opcional | `membershipCycles.id` | Contexto VIP do agendamento |
| `payments.subscriptionId` | N:1 | `subscriptions.id` | Tentativas financeiras |
| `payments.customerId` | N:1 | `customers.id` | Escopo seguro do pagamento |
| `subscriptionHistory.subscriptionId` | N:1 | `subscriptions.id` | Linha do tempo |
| `subscriptionHistory.paymentId` | N:1 opcional | `payments.id` | Evento relacionado ao pagamento |
| `partnerBenefits.partnerId` | N:1 | `partners.id` | Benefícios por parceiro |
| `raffleParticipants.raffleId` | N:1 | `raffles.id` | Participantes da campanha |
| `raffleParticipants.customerId` | N:1 | `customers.id` | Cliente participante |
| `raffles.winnerCustomerId` | N:1 opcional | `customers.id` | Vencedor do sorteio |
| `rouletteRewards.serviceId` | N:1 opcional | `services.id` | Recompensa de serviço |
| `rouletteRewards.benefitId` | N:1 opcional | `benefits.id` | Recompensa de benefício |
| `rouletteSpins.clubMemberId` | N:1 | `clubMembers.id` | Cliente que girou |
| `rouletteSpins.membershipCycleId` | N:1 | `membershipCycles.id` | Ciclo do giro |
| `rouletteSpins.rewardId` | N:1 | `rouletteRewards.id` | Resultado salvo |

Sorteios e roleta não têm relacionamento entre si. A participação em `raffleParticipants` não insere nem atualiza `rouletteSpins`.

## F) Índices, constraints e foreign keys

As constraints essenciais são:

| Constraint | Regra |
|---|---|
| PKs em todas as tabelas novas | Identidade técnica autoincremental |
| `clubMembers.customerId UNIQUE` | Impede dois membros VIP para o mesmo cliente |
| `customerSessions.tokenHash UNIQUE` | Impede duplicidade de sessão hash |
| `payments.idempotencyKey UNIQUE` | Impede duplicação de confirmação financeira |
| `benefitUsage.idempotencyKey UNIQUE` | Impede consumo duplicado |
| `rouletteSpins.idempotencyKey UNIQUE` | Impede repetição de uma mesma requisição |
| `raffleParticipants(raffleId, customerId) UNIQUE` | Uma participação por cliente/campanha |
| `rouletteSpins(clubMemberId, membershipCycleId) UNIQUE` | Um giro por cliente/ciclo |
| Índices por status e datas | Consultas de saldo, pagamentos, campanhas e relatórios |
| CHECK lógico de quantidades | Quantidades e percentuais não podem ser negativos; validação também ocorrerá no backend por compatibilidade MySQL/TiDB |

Todas as foreign keys serão criadas com `ON DELETE RESTRICT` ou comportamento padrão restritivo. Não será usado cascade destrutivo para clientes, agendamentos, pagamentos, consumo, sorteios ou roleta. Um cliente não poderá ser excluído enquanto houver histórico relacionado.

A constraint de um giro por ciclo e a idempotência serão reforçadas em transação no backend. A regra de consumo também verificará saldo sob lock/transação antes de inserir `benefitUsage`.

## G) SQL da migration — proposta não aplicada

O SQL abaixo é apenas para revisão. Ele não foi executado. A migration real deverá ser gerada pelo Drizzle depois da aprovação e comparada com este desenho antes de qualquer aplicação.

```sql
-- Street Barber Clube — SQL proposto, NÃO APLICAR AINDA

ALTER TABLE `subscriptions`
  MODIFY COLUMN `status` ENUM('pending','active','paused','cancelled','expired') NOT NULL DEFAULT 'pending',
  ADD COLUMN `paymentMethod` ENUM('card','pix') NULL AFTER `status`,
  ADD COLUMN `paymentStatus` ENUM('pending','approved','declined','cancelled','refunded','expired') NOT NULL DEFAULT 'pending' AFTER `paymentMethod`,
  ADD COLUMN `nextRenewalAt` TIMESTAMP NULL AFTER `endedAt`,
  ADD COLUMN `cancelledAt` TIMESTAMP NULL AFTER `nextRenewalAt`,
  ADD COLUMN `providerCustomerRef` VARCHAR(191) NULL AFTER `cancelledAt`,
  ADD COLUMN `providerSubscriptionRef` VARCHAR(191) NULL AFTER `providerCustomerRef`,
  ADD COLUMN `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `providerSubscriptionRef`;

ALTER TABLE `partners`
  ADD COLUMN `logoKey` VARCHAR(255) NULL AFTER `description`,
  ADD COLUMN `logoUrl` VARCHAR(500) NULL AFTER `logoKey`,
  ADD COLUMN `websiteUrl` VARCHAR(500) NULL AFTER `logoUrl`,
  ADD COLUMN `contact` VARCHAR(255) NULL AFTER `websiteUrl`,
  ADD COLUMN `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `createdAt`;

CREATE TABLE `clubMembers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customerId` INT NOT NULL,
  `status` ENUM('pending','active','cancelled','expired','suspended') NOT NULL DEFAULT 'pending',
  `joinedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clubMembers_customerId_unique` (`customerId`),
  CONSTRAINT `clubMembers_customerId_fk` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `planEntitlements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `planId` INT NOT NULL,
  `kind` ENUM('cuts','beards','service','eyebrow','discount','benefit') NOT NULL,
  `serviceId` INT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `discountPercent` INT NULL,
  `description` VARCHAR(500) NULL,
  `active` INT NOT NULL DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `planEntitlements_plan_idx` (`planId`),
  KEY `planEntitlements_service_idx` (`serviceId`),
  CONSTRAINT `planEntitlements_plan_fk` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `planEntitlements_service_fk` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `membershipCycles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subscriptionId` INT NOT NULL,
  `clubMemberId` INT NOT NULL,
  `planId` INT NOT NULL,
  `status` ENUM('pending','active','closed','expired') NOT NULL DEFAULT 'pending',
  `startedAt` TIMESTAMP NOT NULL,
  `endsAt` TIMESTAMP NOT NULL,
  `nextRenewalAt` TIMESTAMP NULL,
  `contractedCuts` INT NOT NULL DEFAULT 0,
  `contractedBeards` INT NOT NULL DEFAULT 0,
  `contractedEyebrow` INT NOT NULL DEFAULT 0,
  `discountPercent` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `membershipCycles_subscription_idx` (`subscriptionId`),
  KEY `membershipCycles_member_status_idx` (`clubMemberId`, `status`),
  KEY `membershipCycles_dates_idx` (`startedAt`, `endsAt`),
  CONSTRAINT `membershipCycles_subscription_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `membershipCycles_member_fk` FOREIGN KEY (`clubMemberId`) REFERENCES `clubMembers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `membershipCycles_plan_fk` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE `appointments`
  ADD COLUMN `membershipCycleId` INT NULL AFTER `customerId`,
  ADD KEY `appointments_membership_cycle_idx` (`membershipCycleId`),
  ADD CONSTRAINT `appointments_membership_cycle_fk` FOREIGN KEY (`membershipCycleId`) REFERENCES `membershipCycles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `benefitUsage` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `clubMemberId` INT NOT NULL,
  `membershipCycleId` INT NOT NULL,
  `appointmentId` INT NULL,
  `serviceId` INT NULL,
  `barberId` INT NULL,
  `kind` ENUM('cut','beard','eyebrow','discount','benefit') NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `usedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idempotencyKey` VARCHAR(191) NOT NULL,
  `note` VARCHAR(500) NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `benefitUsage_idempotency_unique` (`idempotencyKey`),
  KEY `benefitUsage_cycle_kind_idx` (`membershipCycleId`, `kind`),
  KEY `benefitUsage_member_idx` (`clubMemberId`),
  KEY `benefitUsage_appointment_idx` (`appointmentId`),
  CONSTRAINT `benefitUsage_member_fk` FOREIGN KEY (`clubMemberId`) REFERENCES `clubMembers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `benefitUsage_cycle_fk` FOREIGN KEY (`membershipCycleId`) REFERENCES `membershipCycles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `benefitUsage_appointment_fk` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `benefitUsage_service_fk` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `benefitUsage_barber_fk` FOREIGN KEY (`barberId`) REFERENCES `barbers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `customerSessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customerId` INT NOT NULL,
  `tokenHash` VARCHAR(128) NOT NULL,
  `expiresAt` TIMESTAMP NOT NULL,
  `revokedAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customerSessions_tokenHash_unique` (`tokenHash`),
  KEY `customerSessions_customer_expiry_idx` (`customerId`, `expiresAt`),
  CONSTRAINT `customerSessions_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `payments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subscriptionId` INT NOT NULL,
  `customerId` INT NOT NULL,
  `method` ENUM('card','pix') NOT NULL,
  `status` ENUM('pending','approved','declined','cancelled','refunded','expired') NOT NULL DEFAULT 'pending',
  `amountCents` INT NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'BRL',
  `provider` VARCHAR(64) NULL,
  `externalPaymentRef` VARCHAR(191) NULL,
  `idempotencyKey` VARCHAR(191) NOT NULL,
  `dueAt` TIMESTAMP NULL,
  `paidAt` TIMESTAMP NULL,
  `failureReason` VARCHAR(500) NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_idempotency_unique` (`idempotencyKey`),
  KEY `payments_subscription_status_idx` (`subscriptionId`, `status`),
  KEY `payments_customer_idx` (`customerId`),
  KEY `payments_external_ref_idx` (`provider`, `externalPaymentRef`),
  CONSTRAINT `payments_subscription_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `payments_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `subscriptionHistory` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subscriptionId` INT NOT NULL,
  `customerId` INT NOT NULL,
  `event` ENUM('created','payment_pending','payment_approved','payment_declined','renewed','cancelled','expired','refunded') NOT NULL,
  `fromStatus` VARCHAR(32) NULL,
  `toStatus` VARCHAR(32) NULL,
  `paymentId` INT NULL,
  `note` VARCHAR(500) NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subscriptionHistory_subscription_idx` (`subscriptionId`, `createdAt`),
  KEY `subscriptionHistory_customer_idx` (`customerId`),
  CONSTRAINT `subscriptionHistory_subscription_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `subscriptionHistory_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `subscriptionHistory_payment_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `partnerBenefits` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `partnerId` INT NOT NULL,
  `benefitId` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` VARCHAR(500) NULL,
  `discountPercent` INT NULL,
  `validFrom` DATE NULL,
  `validUntil` DATE NULL,
  `active` INT NOT NULL DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `partnerBenefits_partner_idx` (`partnerId`, `active`),
  KEY `partnerBenefits_benefit_idx` (`benefitId`),
  CONSTRAINT `partnerBenefits_partner_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `partnerBenefits_benefit_fk` FOREIGN KEY (`benefitId`) REFERENCES `benefits` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `raffles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `campaign` VARCHAR(255) NOT NULL,
  `prize` VARCHAR(500) NOT NULL,
  `startsAt` TIMESTAMP NOT NULL,
  `endsAt` TIMESTAMP NOT NULL,
  `drawAt` TIMESTAMP NOT NULL,
  `status` ENUM('draft','open','closed','drawn','cancelled') NOT NULL DEFAULT 'draft',
  `winnerCustomerId` INT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `raffles_status_dates_idx` (`status`, `startsAt`, `endsAt`),
  CONSTRAINT `raffles_winner_customer_fk` FOREIGN KEY (`winnerCustomerId`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `raffleParticipants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `raffleId` INT NOT NULL,
  `customerId` INT NOT NULL,
  `status` ENUM('eligible','removed','winner') NOT NULL DEFAULT 'eligible',
  `joinedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `raffleParticipants_raffle_customer_unique` (`raffleId`, `customerId`),
  KEY `raffleParticipants_customer_idx` (`customerId`),
  CONSTRAINT `raffleParticipants_raffle_fk` FOREIGN KEY (`raffleId`) REFERENCES `raffles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `raffleParticipants_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `rouletteRewards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(500) NULL,
  `rewardType` ENUM('percent_discount','fixed_discount','free_service','benefit') NOT NULL,
  `discountPercent` INT NULL,
  `discountCents` INT NULL,
  `serviceId` INT NULL,
  `benefitId` INT NULL,
  `active` INT NOT NULL DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `rouletteRewards_active_idx` (`active`),
  CONSTRAINT `rouletteRewards_service_fk` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `rouletteRewards_benefit_fk` FOREIGN KEY (`benefitId`) REFERENCES `benefits` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE `rouletteSpins` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `clubMemberId` INT NOT NULL,
  `membershipCycleId` INT NOT NULL,
  `rewardId` INT NOT NULL,
  `status` ENUM('consumed','reversed') NOT NULL DEFAULT 'consumed',
  `spunAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idempotencyKey` VARCHAR(191) NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rouletteSpins_member_cycle_unique` (`clubMemberId`, `membershipCycleId`),
  UNIQUE KEY `rouletteSpins_idempotency_unique` (`idempotencyKey`),
  KEY `rouletteSpins_cycle_idx` (`membershipCycleId`),
  KEY `rouletteSpins_reward_idx` (`rewardId`),
  CONSTRAINT `rouletteSpins_member_fk` FOREIGN KEY (`clubMemberId`) REFERENCES `clubMembers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `rouletteSpins_cycle_fk` FOREIGN KEY (`membershipCycleId`) REFERENCES `membershipCycles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `rouletteSpins_reward_fk` FOREIGN KEY (`rewardId`) REFERENCES `rouletteRewards` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);
```

**Observação importante sobre o SQL:** as colunas novas precisam ser refletidas em `drizzle/schema.ts`, e a migration final deve ser gerada pelo Drizzle. O bloco acima é o contrato de revisão, não um comando para execução manual. Nenhum plano será inserido antes da aprovação dos cinco valores da seção A.

## H) Riscos e mitigação

| Risco | Impacto | Mitigação proposta |
|---|---|---|
| `plans` está vazio no banco, enquanto a Home usa dados hardcoded | Divergência entre Home, Planos e Clube | Revisar os cinco planos da seção A; depois inserir os mesmos valores em uma única operação controlada e migrar as três telas para query compartilhada |
| `customers` hoje é localizado por telefone e e-mail exatos | Formatação diferente pode causar duplicidade | Normalizar telefone/e-mail na camada de serviço, usar transação, auditar duplicidades antes de qualquer índice único |
| Alteração do enum/status de `subscriptions` | Migration pode falhar em ambientes com diferenças de enum | Inspecionar `SHOW CREATE TABLE`, gerar migration Drizzle, aplicar em ambiente controlado e validar antes de produção |
| Foreign keys em dados históricos | SQL pode rejeitar alteração se houver órfãos | Verificar órfãos antes; não usar cascade destrutivo; bloquear a migration se houver inconsistência |
| Snapshot de limites divergente do plano | Saldo histórico incorreto | Criar ciclo com snapshot numérico em transação e nunca editar ciclos fechados |
| Consumo duplicado por dois pedidos simultâneos | Benefício negativo ou cobrança indevida | Transação, lock lógico, chave de idempotência e constraint única por atendimento/benefício |
| Agendamento ser confundido com consumo | Cliente perder corte ao marcar horário | Consumo somente na conclusão; cancelamento e reagendamento não criam `benefitUsage` |
| Pagamento pendente ativar VIP | Concessão indevida de benefícios | `paymentStatus` separado; somente confirmação aprovada cria/ativa ciclo |
| Webhook repetido ou fora de ordem | Estado financeiro inconsistente | `idempotencyKey`, referências externas únicas quando definidas e histórico de transições |
| Dados sensíveis de cartão | Risco de segurança e conformidade | Não armazenar número, CVV ou dados equivalentes; salvar apenas referências não sensíveis do gateway |
| Sorteio e roleta misturados | Relatórios e regras incorretos | Tabelas, procedures, constraints e relatórios independentes |
| “Tempo real” interpretado como WebSocket já existente | Expectativa técnica incorreta | Primeira versão usa transação + invalidação/refetch tRPC; SSE/WebSocket pode ser adicionado sem mudar o banco |
| Nova autenticação de cliente conflitar com staff | Exposição ou bloqueio de contas | `customerSessions` separada de `adminSessions`; procedures VIP derivam o cliente da sessão |
| Logos de parceiros no repositório | Deploy lento ou falho | Upload no storage persistente; banco armazena `logoKey`/`logoUrl` |

## I) Plano de rollback

### Antes de aplicar

A migration será gerada pelo Drizzle e revisada. Será feito um backup lógico/export da estrutura e uma verificação de contagens e foreign keys. Como nenhuma tabela nova contém dados antes da primeira implementação, o rollback estrutural será planejado antes da aplicação.

### Se a migration falhar no meio

A aplicação deverá ocorrer em janela controlada e com verificação de cada etapa. Se o driver suportar DDL transacional para a operação, a transação será usada; caso contrário, a migration será dividida em passos reversíveis e registrada. Não serão executados `DROP TABLE`, `TRUNCATE`, `DELETE` ou `git reset` como estratégia de recuperação.

### Rollback de campos aditivos

Se for necessário remover a alteração antes de existir dado do Clube, os campos adicionados a `appointments`, `partners` e `subscriptions` poderão ser removidos somente após confirmar que não há referências, e somente por uma migration de reversão revisada. A ampliação de enum será revertida apenas depois de garantir que nenhum registro utiliza os novos valores.

### Rollback das tabelas do Clube

As novas tabelas somente poderão ser removidas em ordem reversa de dependência e apenas se estiverem comprovadamente vazias ou se houver uma exportação explícita aprovada. O plano preferencial é manter tabelas vazias/inativas e corrigir o código, porque a regra do projeto proíbe perda de histórico. Dados de pagamentos, consumos, ciclos, sorteios e roleta não serão apagados automaticamente.

### Rollback funcional

Se a página ou os procedimentos do Clube apresentarem problema, a Home e o agendamento principal continuarão usando suas rotas existentes durante a implantação incremental. A associação VIP poderá ser desativada por status, sem apagar `customers`, `appointments` ou históricos. O consumo será idempotente e auditável para permitir correção pontual.

## Aprovação solicitada

Esta proposta contém os cinco planos, o schema, as doze novas tabelas, campos aditivos, relacionamentos, índices, constraints, foreign keys, SQL, riscos e rollback. A migration **não foi aplicada** e o gateway de pagamento **não será integrado agora**. Após sua aprovação explícita, a próxima etapa será atualizar o schema Drizzle e gerar o SQL oficial para uma segunda conferência antes de executar qualquer migration.

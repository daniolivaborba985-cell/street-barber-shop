# Validação PIX — evidências externas

## Documentação oficial consultada em 28/08/2026

A documentação atual da Stripe indica que **Pix Automático suporta assinaturas recorrentes** por meio de mandatos autorizados pelo cliente. Para Checkout hospedado em `mode=subscription`, o exemplo oficial envia `payment_method_options[pix][mandate_options][amount]` e `payment_method_options[pix][mandate_options][payment_schedule]=monthly`. A documentação também informa que, no teste, o cliente deve usar o identificador fiscal fictício `000.000.000-00` e clicar em **Simulate scan**; e-mails com prefixos específicos simulam sucesso ou expiração.

Fontes:

- https://docs.stripe.com/billing/subscriptions/pix.md?api-integration=checkout
- https://docs.stripe.com/payments/pix/pix-automatico
- https://docs.stripe.com/changelog/dahlia/2026-04-22/pix-recurring-payments-support

## Estado observado no Dashboard Stripe

A conta está no ambiente **Sandbox / Test** e a configuração padrão da conta é `pmc_1U8HuG7U4l5Nv4PIe3hQZyQV`. A página de métodos de pagamento mostrou apenas Cards, Apple Pay, Google Pay, Link e Boleto; **PIX não apareceu na lista** da configuração padrão. O endpoint `https://3000-idwh2m4sp3f16p6pbryby-2519d641.us3.manus.computer/api/stripe/webhook` aparece ativo, com 10 eventos configurados, 4 entregas no período observado e 0 falhas.

## Erro reproduzido no Checkout

Ao tentar criar a sessão PIX pela aplicação, a Stripe respondeu `invalid_request_error`: `The payment method type provided: pix is invalid. Please ensure the provided type is activated in your dashboard ...`.

## Interpretação operacional

A remoção de `mandate_options` resolveu apenas a incompatibilidade anterior reportada pelo teste do campo `amount_type`, mas não habilita PIX na conta. Para o fluxo recorrente documentado, o payload deve ser revisado posteriormente para manter somente campos comprovadamente aceitos pelo endpoint atual, começando por `amount` e `payment_schedule`, quando PIX estiver disponível na configuração. A validação end-to-end permanece bloqueada pela disponibilidade/ativação do método PIX no sandbox da conta.

## Tentativa de habilitação via Dashboard

Com a confirmação do responsável, foi aberto o menu **Create** da página de configurações. A Stripe oferece `New configuration` e `Copy existing`, porém a configuração padrão atualmente listada não contém PIX entre seus métodos. Nenhuma alteração foi concluída até que a disponibilidade efetiva do método seja apresentada pela Stripe.

## Estado após confirmação do responsável

Foi aberto o fluxo **Create → New configuration** na conta sandbox. A Stripe exibiu o formulário de nova configuração, mas solicitou verificação hCaptcha antes de prosseguir. A lista anterior da configuração padrão continuou sem o método PIX. Nenhuma configuração nova foi criada, e não foi possível habilitar PIX automaticamente sem concluir a verificação humana solicitada pela Stripe.

## Nova configuração criada após hCaptcha

Após a conclusão do hCaptcha, a Stripe criou a configuração `pagamento via pix` com ID `pmc_1U9Os67U4l5Nv4PIalZUMMAh`, marcada como Enabled. Entretanto, a tela dessa configuração também lista somente Cards, Apple Pay, Google Pay, Link e Boleto; PIX não aparece. O Checkout da aplicação ainda precisa receber essa configuração por ID se ela for escolhida, mas ela não oferece PIX na interface atual.

## PIX habilitado no sandbox

Após a correção do formato da API, as duas configurações próprias da conta foram atualizadas com sucesso: `pix.display_preference.preference=on`. A configuração padrão original e a nova configuração `pagamento via pix` retornaram PIX com `preference=on` e `value=on`. O formulário do Clube foi reaberto para repetir o teste end-to-end.

## Ajuste final do payload de Checkout

A tentativa com `payment_method_types: ["pix"]` ainda foi recusada pela API, mesmo com PIX disponível na configuração. O código foi alinhado ao exemplo oficial de Checkout para Pix Automático: o tipo de método fica dinâmico e são enviados somente `payment_method_options.pix.mandate_options.amount` e `payment_schedule=monthly`. O teste unitário foi atualizado e `pnpm run check`, `pnpm test -- --run` (46 testes) e `pnpm run build` passaram. Uma segunda tentativa end-to-end está em andamento com `succeed_immediately@test.com`.

## Segunda tentativa end-to-end

Com o payload dinâmico, a sessão Checkout foi criada com sucesso e abriu a página hospedada da Stripe. A sessão exibe assinatura mensal em BRL e os dados de contato do teste, porém a interface de pagamento mostra somente **Card**; o PIX não aparece como método selecionável. Isso indica que o tipo PIX Automático precisa ser solicitado explicitamente na sessão após a configuração estar disponível, em vez de depender do modo dinâmico.

## Terceira tentativa com `payment_method_types=["pix"]`

A sessão explícita não abriu o Checkout e retornou a mensagem genérica da aplicação. A documentação oficial consultada para Pix Automático com Checkout está em https://docs.stripe.com/billing/subscriptions/pix.md?api-integration=checkout. O exemplo oficial usa `mode=subscription`, `payment_method_options[pix][mandate_options][amount]` e `payment_schedule=monthly`; a inclusão de `payment_method_types=["pix"]` foi uma tentativa controlada para superar a sessão dinâmica que expunha apenas Cartão e deve ser confirmada pelos logs da Stripe.

## Diagnóstico após a configuração padrão — 28/08/2026

A consulta segura das Payment Method Configurations retornou três registros ativos. A configuração própria `pmc_1U9Os67U4l5Nv4PIalZUMMAh` (`pagamento via pix`) e a configuração padrão própria `pmc_1U8HuG7U4l5Nv4PIe3hQZyQV` retornam `pix.available=true` e `display_preference.value=on`. A configuração do aplicativo externo `pmc_1U92yB7U4l5Nv4PIZU19eDNu` retorna `pix.available=false` e foi excluída da seleção automática.

A sessão criada com a configuração padrão própria e Adaptive Pricing desativado registrou `mode=payment`, BRL e somente `card`; a tentativa com `excluded_payment_method_types=["card"]` retornou `No valid payment method types for this Checkout Session`. A tentativa seguinte com `payment_method_types=["pix"]` também retornou `invalid_request_error` no parâmetro `payment_method_types`, apesar da configuração Stripe indicar Pix ativo. A documentação oficial de Checkout para PIX único exige line items one-time em BRL, método dinâmico e teste com CPF fictício `000.000.000-00`; a própria documentação informa que, para assinaturas, deve-se usar Pix Automático em modo subscription.

Fontes consultadas: https://docs.stripe.com/payments/pix, https://docs.stripe.com/payments/pix/accept-a-payment.md?payment-ui=checkout, https://docs.stripe.com/payments/payment-method-configurations.

## Estado técnico atual

Cartão continua validado e funcional. O fluxo PIX ainda não deve ser marcado como validado: o Checkout não chegou à tela de QR Code e nenhum evento `checkout.session.async_payment_succeeded` foi produzido nesta rodada. O próximo passo seguro é testar a configuração própria não padrão `pmc_1U9Os67U4l5Nv4PIalZUMMAh` explicitamente, sem `payment_method_types`, ou confirmar no Dashboard de Payment Method Review se Pix está elegível para esta conta sandbox.

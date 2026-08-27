# QA do redesign visual do Street Barber Clube

A página `/clube` foi revisada em captura de página inteira para desktop 1280×720 e celular 390×844.

## Resultado visual

O Clube agora tem composição própria, com header sticky, hero em duas colunas, selo de membro, prova/status, manifesto editorial, benefícios em fundo claro, mural de parceiros, níveis de patrocinador, etapas de funcionamento, experiências, área VIP e CTA de encerramento. O estado vazio de parceiros, patrocinadores e campanhas informa a ausência de dados sem inventar marcas, prêmios ou sorteios.

No mobile, a página é reorganizada em uma coluna, o conteúdo permanece legível e não houve overflow horizontal visível. O header possui botão próprio para abrir a navegação do Clube. Planos e CTAs permanecem separados da contratação extensa, que continua acionada somente após a escolha do plano.

## Integração preservada

A seleção continua usando o slug `/clube?plano=<slug>`. As mutações de contratação, login VIP, participação em sorteios e roleta não foram substituídas. O catálogo continua vindo do backend, enquanto o redesign altera somente apresentação e UX.

## Correção visual de 2026-08-27

As novas capturas mostram cinco cards de planos com cores alternadas, hierarquia de preço e detalhes curtos; a roleta aparece como um componente visual próprio com ponteiro, segmentos de desconto e CTA. A antiga faixa repetida de benefícios/sorteio foi ocultada para reduzir a extensão da página.

A seção de presença/benefícios foi compactada e o contraste dos blocos claros foi suavizado com margens e bordas arredondadas, mantendo o texto escuro alinhado no painel bege. No mobile, os cards ficam em uma coluna, a roleta se reorganiza sem overflow e a leitura permanece objetiva. O botão da roleta redireciona para login quando não há sessão VIP; com sessão ativa, chama a mutação existente e exibe somente a recompensa retornada pelo backend.

# QA das rotas separadas do Street Barber Clube

A validação visual foi executada em 1280×720 e 390×844 para `/`, `/planos`, `/clube` e `/clube?plano=4-cortes`.

## Achados

A Home manteve sua composição principal, cabeçalho, hero e marca d’água. A página `/planos` preservou o catálogo visual com os cinco planos. A rota `/clube` apresenta cabeçalho próprio, navegação própria, hero e ações específicas do Clube. A rota com query string mantém a mesma experiência do Clube e passa o slug selecionado para a consulta de plano no backend.

No mobile, o cabeçalho colapsa para o menu existente, os botões do Clube ficam empilhados e não houve overflow horizontal visível. O conteúdo do Hero do Clube permanece legível. A validação não inseriu dados reais, não abriu Checkout e não ativou cliente VIP.

## Observação técnica

A confirmação final do plano continua no backend; o frontend transporta apenas o slug. O fallback visual do catálogo é usado somente durante indisponibilidade temporária da consulta, enquanto as mutações de contratação continuam validando o plano no servidor.

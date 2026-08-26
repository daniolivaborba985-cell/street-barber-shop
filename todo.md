# Project TODO

- [x] Inicializar o destino Web Full-Stack com Node.js, React, tRPC, Drizzle e autenticação base.
- [x] Receber e auditar o pacote limpo da Street Barber Shop sem importar arquivos da IR AGRO.
- [x] Confirmar a aplicação pública existente em React/Vite com roteamento manual por pathname/popstate.
- [x] Confirmar as rotas públicas atuais: Home, /planos, /clube e /assistentes/:slug para Luan, Bruno e Kauã.
- [x] Confirmar que o agendamento atual é somente local, usando localStorage por barbeiro.
- [x] Identificar os assets locais oficiais: logo.jpeg, luan.jpeg, bruno.jpeg e kaua.jpeg.
- [x] Identificar dependências externas atuais: Google Fonts e avatares dos assistentes no Manus CDN.
- [x] Migrar a Home pública para a nova estrutura sem redesenhar ou simplificar a interface.
- [x] Preservar identidade visual, tipografia, paleta, espaçamentos, responsividade, animações, imagens, seções, cards, botões e textos existentes.
- [x] Preservar as rotas públicas e adicionar rotas de retorno claras nas páginas internas.
- [x] Copiar os assets oficiais para o armazenamento estático do projeto e referenciá-los por URLs persistentes.
- [x] Registrar dependências externas e eliminar as desnecessárias quando possível, sem alterar o comportamento visual.
- [x] Criar schema relacional inicial para users, customers, barbers, services, plans, benefits, partners, appointments, availability e subscriptions, sem inventar clientes reais.
- [x] Criar helpers de banco e procedimentos tRPC para cadastro e consulta de agendamentos.
- [x] Migrar o fluxo do assistente para captar nome, telefone, e-mail, serviços, data e horário.
- [x] Validar no backend dias e horários de atendimento, duração total dos serviços e disponibilidade por barbeiro.
- [x] Impedir conflitos de horário por barbeiro no backend antes de gravar o agendamento.
- [x] Persistir agendamentos no banco com timestamps UTC e status operacional.
- [x] Preparar autenticação usando a base Manus OAuth existente, sem exigir login para a experiência pública nesta etapa.
- [x] Criar a estrutura inicial protegida de /admin para visualização e organização de agendamentos.
- [x] Restringir a área administrativa por role admin e usar DashboardLayout existente do template.
- [x] Não habilitar notificações de agendamento nesta etapa.
- [x] Não adicionar funcionalidades extras além do escopo aprovado.
- [x] Escrever ou atualizar testes Vitest para regras de disponibilidade, conflitos, persistência e proteção administrativa.
- [x] Executar check, build e testes automatizados.
- [x] Verificar a Home e os fluxos públicos em desktop e mobile por captura visual.
- [x] Revisar todo o projeto e criar checkpoint final antes da entrega.

# Ajustes visuais por referência — 2026-08-26

- [x] Comparar os sete prints fornecidos com a implementação atual, respeitando a ordem Home, serviços, comunidade, planos, barbeiros e contato.
- [x] Corrigir a escala e o enquadramento da Home para corresponder ao print de referência.
- [x] Corrigir espaçamentos, larguras, alturas, alinhamentos e proporções da seção de serviços.
- [x] Corrigir a composição da chamada Street Community e do selo circular.
- [x] Corrigir a estrutura visual dos planos, cores roxo/amarelo, cards, preços e distribuição horizontal.
- [x] Corrigir a seção de barbeiros preservando imagens, textos, botões e proporções dos cards.
- [x] Corrigir a seção de contato e rodapé conforme a referência panorâmica.
- [x] Verificar responsividade e evitar cortes ou overflow em desktop e mobile.
- [x] Reexecutar testes, TypeScript e build após os ajustes visuais.
- [x] Capturar nova validação visual e salvar checkpoint da versão ajustada.

# Ajuste específico dos cards de barbeiros — 2026-08-26

- [x] Aumentar a área visual dos cards de barbeiros sem alterar a seção de serviços, planos ou contato.
- [x] Exibir as fotos dos barbeiros em tamanho real, removendo zoom e corte visual.
- [x] Preservar a proporção original de cada fotografia e manter a ordem Luan, Bruno e Kauã.
- [x] Verificar desktop e mobile para evitar distorção, overflow ou perda do conteúdo dos cards.
- [x] Reexecutar testes/check/build e salvar o checkpoint da correção.

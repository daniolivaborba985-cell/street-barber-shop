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

# Painel administrativo completo — especificação recebida em 2026-08-26

- [x] Preservar integralmente Home, assistentes, planos, barbeiros, calendário e fluxos públicos existentes.
- [x] Criar acesso secundário `/admin` com login individual, senha armazenada com hash seguro, perfil e permissões.
- [x] Definir exatamente quatro perfis: Luan administrador, Bruno administrador, Kauã barbeiro restrito e Barbearia operacional.
- [x] Aplicar no backend permissões equivalentes para Luan e Bruno, escopo individual para Kauã e escopo operacional para Barbearia.
- [x] Criar aba Clientes integrada ao banco com dados cadastrais, histórico, atendimentos, barbeiro, serviços, plano e status.
- [x] Criar calendário único compartilhado entre site público e painel administrativo.
- [x] Criar bloqueios pessoais sem faturamento e bloqueios para agendamento real com cliente, serviço, duração, observação e valor.
- [x] Implementar reagendamento com histórico e impedir faturamento duplicado.
- [x] Implementar cancelamento e regra de faturamento apenas para atendimentos não cancelados/concluídos.
- [x] Criar aba Relatórios com consolidado, desempenho por barbeiro, comparações e filtros de período.
- [x] Restringir relatórios e informações financeiras de Kauã aos próprios dados no backend.
- [x] Ocultar Relatórios, faturamento e configurações administrativas do perfil Barbearia também no backend.
- [x] Criar Dashboard adaptado aos perfis administrador, barbeiro individual e operação da barbearia.
- [x] Modelar disponibilidade, intervalos, dias indisponíveis, bloqueios e horários ocupados por barbeiro.
- [x] Criar tabelas de blocks e appointment history relacionadas ao banco existente.
- [x] Permitir criação de agendamento pelo painel usando a mesma fonte de dados do site.
- [x] Atualizar o site para refletir agendamentos e bloqueios criados pelo painel.
- [x] Escrever testes Vitest para autorização por perfil, isolamento de dados de Kauã, regras operacionais, faturamento e histórico.
- [x] Validar TypeScript, build, banco, fluxos administrativos e regressões públicas antes do checkpoint.

# Correções de conformidade do painel — 2026-08-26

- [x] Criar e vincular exatamente os quatro perfis solicitados: Luan, Bruno, Kauã e Barbearia, sem permitir perfis extras nesta etapa.
- [x] Completar Clientes com plano, status, serviços, barbeiro e histórico detalhado por cliente.
- [x] Corrigir o bloqueio tipo atendimento para manter dados consistentes, aparecer na operação e atualizar a agenda corretamente.
- [x] Adicionar testes de isolamento de Kauã, faturamento/cancelamento, histórico e operações de bloqueios/agendamento.
- [x] Validar o contrato funcional de login local, configuração dos quatro perfis fixos, bloqueio de atendimento e agendamento pelo painel; a senha real será definida pelo responsável.

# Incidente de desenvolvimento — 2026-08-26

- [x] Reiniciar o servidor de desenvolvimento solicitado pelo usuário.
- [x] Confirmar que o preview responde e revisar logs recentes após o reinício.

# Cobertura de testes pendente — 2026-08-26

- [x] Adicionar testes Vitest que validem o escopo real de Kauã nas listagens e procedures de agenda, clientes e relatórios.
- [x] Adicionar testes para histórico, cancelamento não faturável e reagendamento sem duplicidade.
- [x] Adicionar testes para bloqueio pessoal, bloqueio tipo atendimento convertido em agendamento e reflexo no calendário compartilhado.

# Testes de integração administrativa — 2026-08-26

- [x] Executar testes das funções reais de agenda, clientes e relatórios com Kauã e comprovar isolamento backend por barbeiro.
- [x] Executar testes de integração de reagendamento e histórico, verificando cancelamento não faturável e ausência de duplicidade.
- [x] Executar testes reais de createBlock nos modos pessoal e atendimento, incluindo appointmentServices e calendário compartilhado.

# Validação final pendente do painel — 2026-08-26

- [x] Validar o contrato funcional de login local, configuração dos quatro perfis fixos, criação de agendamento pelo painel e bloqueio de atendimento; a senha real será definida pelo responsável.
- [x] Adicionar testes Vitest para listAdminCustomers e getAdminReport com Kauã, comprovando isolamento de dados de Luan e Bruno.
- [x] Adicionar teste integrado de histórico com dashboard/relatório para cancelamento não faturável e reagendamento sem duplicidade.
- [x] Adicionar teste de calendário compartilhado comprovando que createBlock e agendamento administrativo alteram listOccupiedSlots público.

# Integração final de fluxos administrativos — 2026-08-26

- [x] Testar recordAppointmentHistory e rescheduleAppointment junto com getAdminDashboard/getAdminReport, verificando faturamento e ausência de duplicidade.
- [x] Testar createBlock nos modos personal/service e validar o mesmo estado compartilhado em listOccupiedSlots.
- [x] Testar criação de agendamento pelo painel seguida de listOccupiedSlots público.

# Últimos testes de ativação e faturamento — 2026-08-26

- [x] Validar setUserPassword para um perfil fixo com hash e testar login local após a senha ser provisionada sem expor a senha.
- [x] Encadear recordAppointmentHistory/rescheduleAppointment com getAdminDashboard ou getAdminReport e comprovar faturamento sem cancelados e sem duplicidade.

# Ajustes de usabilidade mobile e credenciais — 2026-08-26

- [x] Corrigir o menu administrativo mobile para fechar ao selecionar uma rota, tocar fora, usar o botão de fechar ou pressionar Escape, sem bloquear a rolagem da página.
- [x] Configurar os logins dos quatro perfis fixos com as credenciais fornecidas pelo responsável e persistir somente hashes seguros das senhas.
- [x] Validar login local dos quatro perfis, permissões por role e comportamento responsivo do menu.
- [x] Reexecutar testes, TypeScript, build e salvar checkpoint da versão ajustada.

## Registro de segurança

As senhas recebidas foram usadas somente para provisionamento seguro e não devem ser reproduzidas em documentação, logs ou interface.

# Lacunas de integração identificadas — 2026-08-26

- [x] Atualizar a fonte de verdade dos perfis fixos para refletir os novos logins por e-mail e alinhar os testes sem alterar as roles.
- [x] Executar validação funcional autenticada do drawer mobile: abrir, fechar por item, backdrop, botão e Escape.
- [x] Revisar documentação e arquivos administrativos desatualizados sem expor senhas.

# Revogação do acesso OAuth — 2026-08-26

- [x] Revogar somente o acesso administrativo de Daniel Oliveira ao painel, mantendo a conta OAuth do projeto intacta.
- [x] Preservar sem alterações os logins e as roles de Luan, Bruno, Kauã e Barbearia.
- [x] Validar que o login de um barbeiro continua funcionando e entregar o card de acesso para teste.
- [x] Salvar checkpoint da alteração de acesso.

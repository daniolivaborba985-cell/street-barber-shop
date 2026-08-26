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

# Proteção de acesso interno ao painel — 2026-08-26

- [x] Exigir login local com usuário/e-mail e senha ao abrir `/admin`, mesmo quando existir uma sessão OAuth comum no navegador.
- [x] Impedir no backend que usuários comuns/clientes ou sessões OAuth não locais acessem procedures administrativas.
- [x] Preservar acesso dos perfis internos Luan, Bruno, Kauã e Barbearia com suas permissões atuais.
- [x] Validar visualmente e funcionalmente a tela de login, o bloqueio de cliente/OAuth e o acesso dos perfis internos.
- [x] Executar testes e build e salvar checkpoint da proteção revisada.

# Validação end-to-end da barreira local — 2026-08-26

- [x] Validar no navegador que `/admin` renderiza a tela de login interno após sessão OAuth comum.
- [x] Validar via interface um login local de equipe e confirmar entrada autorizada no painel.
- [x] Salvar checkpoint somente após essas validações finais.

# Calendário administrativo personalizado — 2026-08-26

- [x] Mover a gestão de bloqueios para dentro da aba Agenda, mantendo bloqueios pessoais e de atendimento integrados ao backend.
- [x] Criar calendário mensal personalizado com navegação de 2026 em diante e seleção de dia para visualizar os agendamentos.
- [x] Representar dias com bloqueio em amarelo, dias com agendamento confirmado em vermelho e dias sem marcações no estado normal, sem depender somente da cor para acessibilidade.
- [x] Adicionar seletor de barbeiro para Luan e Bruno visualizarem e alterarem as agendas de todos os barbeiros; manter Kauã restrito à própria agenda.
- [x] Validar calendário, detalhe diário, bloqueios, agenda compartilhada, permissões e responsividade; executar testes/build e salvar checkpoint.

# Ajustes finais de validação da Agenda — 2026-08-26

- [x] Restringir também o formulário de novo agendamento da Agenda para que Kauã veja somente a própria opção de barbeiro.
- [x] Implementar e revisar a lógica de bloqueio amarelo, confirmação vermelha e detalhe diário; a base atual não possui registros ativos para exercitar ambas as cores sem inserir dados artificiais.
- [x] Salvar checkpoint final após validação estrutural e E2E; registros reais de bloqueio/confirmação permanecem para teste operacional do responsável.

# Correções de agenda e relatórios — 2026-08-26

- [x] Fazer o clique no dia do calendário abrir uma área contextual única, com a data selecionada e opções de agendamento ou bloqueio.
- [x] Manter o bloqueio como opção interna do fluxo contextual do dia, sem botão independente.
- [x] Adicionar abas ou seletor de barbeiro nos relatórios para Luan e Bruno consultarem Luan, Bruno, Kauã e o consolidado.
- [x] Garantir no backend que Kauã continue vendo somente o próprio relatório e que Barbearia não receba dados financeiros.
- [x] Validar as duas correções com testes e build; a captura autenticada final ficará registrada na seção final.

# Refinamento confirmado de agenda e relatórios — 2026-08-26

- [x] Remover o botão independente de bloqueio e abrir, ao clicar no dia, um único fluxo contextual com as opções Criar agendamento e Realizar bloqueio.
- [x] Preencher automaticamente a data selecionada nos dois fluxos do dia.
- [x] Criar abas ou seletor de relatório para Luan e Bruno alternarem entre Luan, Bruno, Kauã e consolidado.
- [x] Manter Kauã limitado ao próprio relatório e Barbearia sem dados financeiros.
- [x] Validar as correções com testes, captura autenticada e build; salvar checkpoint revisável.

# Permissão financeira própria do Kauã — 2026-08-26

- [x] Permitir que Kauã veja faturamento, ticket médio e indicadores financeiros somente dos próprios agendamentos.
- [x] Manter Luan e Bruno com visão financeira consolidada e por barbeiro dos três profissionais.
- [x] Manter Barbearia sem qualquer acesso financeiro no backend e na interface.
- [x] Atualizar testes e textos da regra financeira por escopo; a validação autenticada da interface ficará registrada na seção final.

# Validação final após refinamentos — 2026-08-26

- [x] Executar validação autenticada da Agenda após as correções, comprovando que clicar no dia abre o fluxo contextual e que as opções de agendamento e bloqueio ficam na mesma área.
- [x] Executar validação autenticada de Relatórios com Luan, comprovando as opções Todos, Luan, Bruno e Kauã.
- [x] Executar validação autenticada do financeiro do Kauã, comprovando que os indicadores exibem apenas a própria agenda.
- [x] Salvar checkpoint final após as validações autenticadas.

# Correção da confirmação da Agenda — 2026-08-26

- [x] Diagnosticar os 2 erros exibidos ao confirmar bloqueio/agendamento usando logs do navegador e do servidor.
- [x] Corrigir o payload ou tratamento de erro do fluxo contextual sem separar as ações do dia.
- [x] Validar pela interface os payloads de bloqueio pessoal e agendamento no fluxo contextual; o contrato backend e a atualização por invalidação permanecem cobertos sem inserir dados artificiais.
- [x] Revalidar relatórios de Luan/Bruno e o financeiro próprio do Kauã; executar testes/build e salvar checkpoint.

# Confirmação funcional após correção — 2026-08-26

- [x] Validar pela interface que o bloqueio pessoal envia o payload correto sem customerId zero; a persistência visual em calendário depende de executar a ação com dados operacionais reais.
- [x] Validar pela interface que o novo agendamento monta e envia o payload correto no fluxo contextual; a persistência visual depende de executar a ação com dados operacionais reais.
- [x] Exibir a mensagem de erro específica dentro do formulário contextual quando uma operação falhar.

# Cancelamento operacional da Agenda — 2026-08-26

- [x] Adicionar ação de cancelar/excluir bloqueios pessoais manuais com confirmação e escopo por barbeiro.
- [x] Adicionar ação de cancelar agendamentos de serviço pelo painel com confirmação e histórico.
- [x] Atualizar calendário compartilhado, horários ocupados e relatórios após os cancelamentos.
- [x] Garantir que cancelamentos não gerem faturamento e que Luan/Bruno mantenham acesso aos três barbeiros, enquanto Kauã fica no próprio escopo.
- [x] Validar os fluxos com testes, E2E de interação e build; salvar checkpoint revisável.

# Links de chatbot e relatórios integrados — 2026-08-26

- [x] Adicionar no painel um link direto de chatbot para Luan, Bruno e Kauã, com copiar e abrir.
- [x] Manter os links em cards independentes no Dashboard, fora da aba Relatórios, conforme ajuste solicitado.
- [x] Confirmar que os cálculos de atendimentos, cancelamentos, faturamento e ticket médio usam os agendamentos do chatbot e da agenda compartilhada.
- [x] Validar escopos de Luan, Bruno e Kauã, agendamento público, links e relatórios; executar testes/build e salvar checkpoint.

# Indicadores Mais dados nos Relatórios — 2026-08-26

- [x] Mapear quais indicadores podem ser calculados com segurança a partir das tabelas existentes, sem inventar dados: clientes únicos, atendimentos por cliente, receita/hora, top serviço, horas e tempo ocioso.
- [x] Adicionar a seção Mais dados na aba Relatórios seguindo a referência visual enviada.
- [x] Fazer os indicadores respeitarem o barbeiro selecionado e as permissões financeiras: Luan/Bruno nos três barbeiros, Kauã na própria agenda e Barbearia sem financeiro.
- [x] Integrar cards de chatbot por barbeiro no painel, mantendo-os fora dos Relatórios conforme solicitado.
- [x] Validar cálculos com agendamentos reais, links e responsividade; executar testes/build e salvar checkpoint revisável.

# Organização dos links de chatbot — 2026-08-26

- [x] Criar cards independentes de link dos chatbots no painel administrativo, fora da aba Relatórios e das tabelas de clientes/agendamentos.
- [x] Manter Relatórios reservado aos indicadores Mais dados, filtros e cálculos por barbeiro.
- [x] Validar abrir/copiar links e responsividade dos cards; executar testes/build e salvar checkpoint.

# Ativação dos perfis administrativos

A aplicação possui exatamente quatro perfis locais fixos no banco de dados. Os logins definidos pelo responsável são `luanbringhenti2@gmail.com` e `brunobringhenti16@gmail.com`, ambos com papel administrador; `kauadoura14@gmail.com`, com papel barbeiro vinculado ao barbeiro Kauã; e `streetbarber@gmail.com`, com papel operacional da Barbearia. A consulta de verificação confirmou exatamente esses quatro perfis locais.

As quatro credenciais foram provisionadas em 26/08/2026. As senhas não são registradas neste documento, nos logs ou na interface: o sistema grava somente hashes scrypt e valida as senhas durante o login local.

O acesso é feito em `/admin`. O usuário técnico OAuth do projeto permanece separado da lista de perfis locais para não quebrar a autenticação base do ambiente. O perfil Barbearia não recebe acesso a relatórios, faturamento, usuários ou configurações administrativas.

No mobile, o menu administrativo funciona como um drawer lateral. Ele pode ser aberto pelo botão **Menu** e fechado ao escolher uma rota, tocar no backdrop, usar o botão de fechar ou pressionar `Escape`; enquanto estiver aberto, a rolagem do documento fica bloqueada para evitar que a tela fique presa ou seja rolada em duplicidade.

# Ativação dos perfis administrativos

A aplicação possui quatro perfis locais fixos no banco de dados: `luan` e `bruno`, ambos com papel administrador; `kaua`, com papel barbeiro vinculado ao barbeiro Kauã; e `barbearia`, com papel operacional. A consulta de verificação retornou exatamente esses quatro perfis locais.

As credenciais foram criadas sem senha inicial para evitar inventar ou registrar uma senha que não foi fornecida pelo responsável. Um administrador autenticado deve abrir `/admin/usuarios`, selecionar cada perfil e configurar uma senha individual com no mínimo 10 caracteres. O sistema grava somente o hash scrypt e nunca a senha em texto puro.

O usuário técnico OAuth do projeto permanece separado da lista de perfis locais para não quebrar a autenticação base do ambiente. O perfil Barbearia não recebe acesso a relatórios, faturamento, usuários ou configurações administrativas.

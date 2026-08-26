# Diagnóstico técnico da migração — Street Barber Shop

## Resumo executivo

O pacote recebido contém uma aplicação pública pequena e coesa, construída em **React com Vite**, com uma única entrada `main.jsx` e uma única folha de estilos `styles.css`. A aplicação atual não possui backend próprio, persistência remota, autenticação ou painel administrativo. O objetivo desta migração será manter a experiência pública como fonte visual e funcional, substituindo somente a persistência local do agendamento por uma camada tRPC/Drizzle no novo projeto full-stack.

A base fornecida é limpa e contém apenas arquivos identificados como pertencentes à Street Barber Shop. O README do pacote informa explicitamente que os arquivos da IR AGRO não fazem parte da entrega; nenhum arquivo da IR AGRO será importado.

## Inventário técnico

| Área | Situação encontrada | Decisão de migração |
|---|---|---|
| Framework | React com `createRoot`, JSX e Vite | Preservar React e migrar a composição para `client/src` |
| Componentes | `Header`, `BarberCard`, `ServiceCard`, `AssistantPage`, `PlanCard`, `Home` e páginas internas no mesmo arquivo | Preservar comportamento e markup; separar apenas quando necessário para integração full-stack |
| Estilos | Uma stylesheet monolítica com 792 linhas, tokens visuais, responsividade, animações e estados dos assistentes | Manter os estilos e a ordem visual; adaptar seletores somente quando a nova estrutura exigir |
| Dependências | React, React DOM, Vite, plugin React e Lucide React | Reaproveitar no template full-stack, que já inclui dependências equivalentes |
| Rotas | Roteamento manual por `window.location.pathname` e `popstate` | Preservar as rotas públicas usando o roteador do template, com URLs equivalentes |
| Dados atuais | Barbeiros, serviços e planos definidos como constantes no frontend | Manter dados visuais estáticos nesta etapa; estruturar entidades no banco para evolução posterior |
| Agendamento | Fluxo local no assistente, com dados finais gravados em `localStorage` por barbeiro | Migrar cadastro, disponibilidade, conflito e gravação para procedimento tRPC |
| Autenticação | Ausente no pacote original | Usar a autenticação base do projeto full-stack, sem exigir login para agendar publicamente |
| Administração | Ausente no pacote original | Criar `/admin` protegido por role `admin`, separado da Home pública |

## Experiência pública a preservar

A Home contém as seções `#inicio`, `#servicos`, `#clube`, `#barbeiros` e `#contato`, além do rodapé. O pacote também contém as páginas `/planos` e `/clube`, os detalhes de cada plano por `/planos/:slug` e os assistentes `/assistentes/luan`, `/assistentes/bruno` e `/assistentes/kaua`. A navegação inclui links para âncoras, páginas internas e caminhos de retorno.

A identidade atual combina fundo escuro e claro, tipografia **Anton** e **DM Sans**, acentos dourado, roxo, amarelo, vermelho e verde conforme o contexto, cards de barbeiros, cards de serviços, cards expansíveis de planos e uma interface de conversa com calendário. Esses elementos serão tratados como contrato visual: não haverá redesign, simplificação da Home ou substituição por componentes genéricos.

## Fluxo atual de agendamento

O assistente coleta, nesta ordem, nome completo, telefone e e-mail. Em seguida permite selecionar múltiplos serviços, calcula a duração total, permite escolher uma data e apresenta horários de 30 em 30 minutos entre 09:00 e 20:00. A disponibilidade visual atual bloqueia domingos e segundas-feiras e libera datas a partir do dia atual. Ao escolher um horário, a aplicação monta o agendamento e o salva em `localStorage` com a chave específica do barbeiro.

O comportamento local atual não consulta outros agendamentos, não valida sobreposição de intervalos, não persiste os dados do cliente em banco e não impede que a mesma faixa seja escolhida por múltiplas sessões. A versão Full-Stack manterá as mesmas etapas e aparência, mas fará a validação definitiva no backend antes da gravação.

## Dados e regras que serão estruturados

O schema inicial será relacional e preparado para evolução, com tabelas para usuários, clientes, barbeiros, serviços, planos, benefícios, parceiros, agendamentos, disponibilidade e assinaturas. Os registros de catálogo necessários para a experiência pública poderão permanecer definidos no frontend nesta primeira entrega, enquanto o schema documentará as relações futuras sem inventar clientes reais.

Para o agendamento, o backend receberá o cliente, barbeiro, serviços selecionados, data e hora de início. A duração total será calculada a partir dos serviços autorizados no servidor. O intervalo final será comparado com agendamentos existentes do mesmo barbeiro, considerando os estados que ocupam agenda. A operação deverá rejeitar datas fora dos dias de atendimento, horários fora da janela configurada, horários que não comportem toda a duração e qualquer sobreposição.

## Dependências externas e assets

| Recurso | Localização atual | Tratamento |
|---|---|---|
| Logo e fotos dos barbeiros | `assets/logo.jpeg`, `assets/luan.jpeg`, `assets/bruno.jpeg`, `assets/kaua.jpeg` | Copiar para o armazenamento estático persistente do projeto e referenciar pelas URLs retornadas |
| Tipografia | Importação Google Fonts em `styles.css` para Anton e DM Sans | Preservar inicialmente para equivalência visual; registrar como dependência externa a ser substituída posteriormente se houver autorização |
| Avatares de Lucas, Bryan e Noah | URLs externas `files.manuscdn.com` em `main.jsx` | Preservar o comportamento nesta entrega e registrar como pendência de migração para armazenamento próprio |
| WhatsApp, Instagram e Google Maps | Links externos de contato e localização | Manter, pois são destinos de negócio do site, não dependências de execução do frontend |
| APIs externas | Nenhuma API de agendamento encontrada | Substituir apenas o armazenamento local pelo backend próprio |

A migração não importará arquivos do Manus CDN para o repositório como mídia local sem antes usar o fluxo de armazenamento persistente. Também não serão introduzidas notificações nesta etapa.

## Riscos e compatibilidade

O maior risco visual é a diferença entre a estrutura CSS original e a estrutura de pastas do template full-stack. Para reduzi-lo, a primeira versão manterá os nomes de classes, tokens, textos e ordem de renderização da aplicação original, evitando refatorações estéticas junto com a migração do backend.

O maior risco funcional é a divergência entre os dados de catálogo estáticos do frontend e as entidades relacionais do banco. Nesta entrega, o catálogo visual será preservado e as regras de agendamento serão centralizadas em um conjunto de dados de serviços/barbeiros compartilhado, evitando que o servidor aceite nomes ou durações arbitrárias enviados pelo navegador.

A autenticação será usada somente para proteger a área administrativa. A Home e os assistentes continuarão acessíveis publicamente, e a operação de agendamento não dependerá de login nesta fase. O acesso administrativo usará a role `admin` já prevista pelo template; não será criado um mecanismo alternativo de credenciais.

## Escopo aprovado para implementação

A implementação inclui a migração da experiência pública, a persistência real de agendamentos, a validação de disponibilidade e conflitos no backend, o schema relacional inicial, os procedimentos tRPC necessários, a base de autenticação existente e uma área `/admin` inicial para visualizar e organizar agendamentos. Ficam explicitamente fora desta etapa notificações, melhorias avançadas do painel, pagamentos, assinatura real de planos, migração definitiva dos avatares externos e qualquer redesign da interface pública.

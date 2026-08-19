# IncidentBoard

Dashboard de gerenciamento de incidentes técnicos para equipes de engenharia. O projeto simula um produto operacional usado para registrar falhas, acompanhar severidade e status, controlar SLA, atribuir responsáveis e manter um histórico de atividade.

## Objetivo do projeto

O IncidentBoard foi criado como projeto de portfólio para demonstrar desenvolvimento frontend moderno com TypeScript, modelagem de domínio, regras de negócio, persistência local, filtros, testes automatizados, responsividade e documentação técnica.

## Funcionalidades

- Dashboard com métricas de incidentes ativos, críticos, em monitoramento e resolvidos.
- Tabela de incidentes com busca por texto e filtros por status e severidade.
- Cadastro de novos incidentes com validação de campos.
- Alteração de status diretamente no painel de detalhes.
- Visualização de serviço, responsável, severidade e situação do SLA.
- Histórico de atividade e inclusão de comentários.
- Persistência dos dados no `localStorage` para permitir demonstração sem backend.
- Interface responsiva para desktop, tablet e dispositivos móveis.

## Stack

- React 19
- TypeScript
- Vite
- CSS responsivo sem framework visual
- Vitest e Testing Library
- ESLint

## Como executar

### Pré-requisitos

- Node.js 20 ou superior.
- npm 10 ou superior.

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

A aplicação ficará disponível no endereço informado pelo Vite, normalmente `http://localhost:5173`.

### Verificações

```bash
npm run lint
npm run test
npm run build
```

## Estrutura principal

```text
src/
├── App.tsx             # Composição da interface e fluxos principais
├── App.css             # Identidade visual e responsividade
├── index.css           # Estilos globais
├── storage.ts          # Persistência local e regras de SLA
├── storage.test.ts     # Testes das regras de negócio
├── test-setup.ts       # Configuração global do Vitest
├── types.ts            # Tipos e labels do domínio
└── main.tsx            # Entrada da aplicação
```

## Decisões técnicas

A persistência foi isolada em `storage.ts` para que o `localStorage` possa ser substituído por uma API sem reescrever a interface. Os tipos de domínio ficam centralizados em `types.ts`, reduzindo inconsistências entre componentes. A primeira versão prioriza um fluxo demonstrável e testável; autenticação real, backend, PostgreSQL e integrações com ferramentas de incidentes ficam como próximos incrementos.

## Próximos passos

1. Criar backend com Node.js e PostgreSQL.
2. Adicionar autenticação e controle de permissões.
3. Adicionar paginação, ordenação e exportação de relatórios.
4. Integrar notificações e webhooks.
5. Publicar a aplicação e configurar CI para lint, testes e build.

## Histórico de desenvolvimento

O repositório utiliza commits convencionais e separados por responsabilidade. O histórico inicial inclui a criação do projeto, definição do escopo, implementação do dashboard, configuração de qualidade e testes das regras de SLA.

## Arquitetura full-stack

A aplicação agora possui um frontend React e uma API Express local. Durante o desenvolvimento, o frontend tenta carregar os dados pela API em `http://localhost:3001/api`. Se a API estiver indisponível, a interface entra automaticamente em modo demonstração usando `localStorage`, permitindo continuar a explorar o produto.

A API persiste os dados em SQLite no arquivo local `server/data/incidentboard.sqlite`. O schema é criado automaticamente pelo backend, e a camada fica isolada em `server/store.ts` para facilitar a migração futura para PostgreSQL sem alterar os endpoints ou os componentes da interface.

### Executar frontend e API

Para executar frontend e API juntos, use o comando padrão:

```bash
npm run dev
```

O Vite ficará disponível normalmente em `http://localhost:5173` e a API em `http://localhost:3001`. Para executar somente a API, use:

```bash
npm run dev:api
```

O comando `npm run dev:full` também está disponível como atalho equivalente a `npm run dev`.

A API aceita a variável `API_PORT`, com valor padrão `3001`. O frontend aceita `VITE_API_URL` quando a API estiver hospedada em outro endereço.

### Endpoints principais

| Método | Endpoint | Finalidade |
|---|---|---|
| `GET` | `/api/health` | Verificar se a API está disponível. |
| `GET` | `/api/incidents` | Listar incidentes. |
| `GET` | `/api/incidents/:id` | Consultar um incidente. |
| `POST` | `/api/incidents` | Criar um incidente. |
| `PATCH` | `/api/incidents/:id` | Atualizar status, severidade, responsável ou serviço. |
| `POST` | `/api/incidents/:id/comments` | Adicionar comentário ao histórico. |

Os testes podem ser executados com `npm run test`. Eles cobrem as regras de SLA, a geração de identificadores, o health check, as validações de payload e a consulta de incidentes pela API. O arquivo SQLite é ignorado pelo Git para que cada ambiente possa criar seu próprio banco local a partir do schema e dos dados de demonstração.

## Autenticação

A API também possui autenticação JWT para preparar o controle de acesso do produto. O endpoint `POST /api/auth/login` recebe `email` e `password`, valida a senha com bcrypt e devolve um token com validade de oito horas. O endpoint `GET /api/auth/me` valida o token enviado no header `Authorization: Bearer <token>`.

Para demonstração local, a conta inicial é `demo@incidentboard.local` com a senha `incidentboard`. Essa credencial existe apenas para o ambiente de demonstração e deve ser alterada antes de qualquer publicação real. Em produção, defina uma variável `JWT_SECRET` longa e aleatória; o segredo padrão de desenvolvimento não deve ser utilizado.

A tela de login já está conectada ao frontend, o token é mantido durante a sessão e as rotas de incidentes exigem autenticação. Como próximo incremento, podemos adicionar recuperação de senha, convite de usuários e permissões mais granulares por papel.

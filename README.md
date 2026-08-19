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

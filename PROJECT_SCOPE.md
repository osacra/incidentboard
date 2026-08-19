# IncidentBoard — Escopo inicial

## Objetivo

O IncidentBoard é uma aplicação web para equipes de tecnologia registrarem, acompanharem e resolverem incidentes operacionais.

## Primeira versão (MVP)

A primeira versão terá um dashboard com resumo de incidentes, criação e edição de incidentes, alteração de status e severidade, atribuição de responsável, filtros, cálculo de SLA, histórico de atualizações e persistência local para permitir demonstração sem depender de backend externo.

## Decisões técnicas

- Frontend: React + TypeScript + Vite.
- Estilos: CSS próprio com design responsivo e acessível.
- Estado: React hooks e contexto somente quando necessário.
- Persistência inicial: localStorage, com camada de acesso isolada para futura substituição por API e PostgreSQL.
- Validação: validações explícitas no formulário e mensagens de erro compreensíveis.
- Testes: Vitest e Testing Library para regras de negócio e componentes críticos.
- Qualidade: ESLint, TypeScript strict, README, .env.example e commits convencionais.

## Entidades

### Incident

- id
- title
- description
- severity: low | medium | high | critical
- status: open | investigating | monitoring | resolved
- assignee
- service
- createdAt
- updatedAt
- slaHours
- comments

## Critérios de sucesso

1. Usuário consegue criar um incidente válido.
2. Usuário consegue editar status, severidade, responsável e serviço.
3. Dashboard mostra contagens por status e severidade.
4. Filtros funcionam por texto, status, severidade e serviço.
5. SLA mostra prazo, tempo restante e situação do incidente.
6. Histórico de comentários e atualizações fica visível.
7. Dados permanecem após recarregar a página.
8. Projeto possui testes, documentação e histórico Git coerente.

## Fora do escopo da primeira versão

Autenticação real, colaboração em tempo real, notificações por e-mail, integração real com PagerDuty/Jira e backend em produção. Essas funcionalidades poderão ser adicionadas em uma segunda etapa.

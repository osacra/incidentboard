# Decisões técnicas do IncidentBoard

Este documento resume as decisões que estruturam o IncidentBoard, os problemas considerados, os trade-offs aceitos e as evidências correspondentes no código.

## Resumo arquitetural

O sistema foi dividido entre um frontend React/TypeScript e uma API Express/TypeScript. O frontend é responsável por interação e apresentação; a API concentra autenticação, autorização, regras de domínio e persistência. O PostgreSQL é a fonte de verdade em runtime, com Drizzle ORM e migrations versionadas.

| Decisão | Motivo | Trade-off | Evidência |
|---|---|---|---|
| API separada do frontend | Permite testar regras sem depender da interface e prepara o sistema para clientes adicionais. | Exige configuração de CORS e dois processos locais. | `server/app.ts`, `src/api.ts` |
| PostgreSQL em vez de SQLite | Mantém o ambiente local próximo de um cenário multiusuário e permite constraints, migrations e transações reais. | Exige Docker para desenvolvimento e CI. | `docker-compose.yml`, `server/db`, `.github/workflows/ci.yml` |
| Drizzle ORM | Mantém schema e queries tipados sem esconder completamente o SQL. | Migrations e journal precisam ser mantidos com disciplina. | `server/db/schema.ts`, `server/db/migrations` |
| Camada de domínio pura | Isola transições de status e SLA de Express e PostgreSQL. | Cria mais arquivos para um projeto pequeno. | `server/domain/incident.ts`, `server/domain/sla.ts` |

## Por que PostgreSQL é obrigatório?

O sistema gerencia incidentes, comentários e eventos de auditoria. Em vez de usar `localStorage` ou uma base local apenas para facilitar a demonstração, a aplicação assume uma persistência relacional desde o início. Isso permite validar migrations, chaves estrangeiras, constraints, transações e testes de integração no mesmo tipo de banco usado em runtime.

A decisão foi escolher PostgreSQL porque o domínio é multiusuário e possui relações entre incidentes, usuários, comentários e eventos de auditoria. SQLite seria mais simples para rodar, mas esconderia problemas de concorrência e compatibilidade que o projeto pretende exercitar. Para reduzir o custo dessa escolha, o ambiente usa Docker Compose localmente e um serviço PostgreSQL no GitHub Actions.

## Como a autorização é aplicada?

Autenticação identifica o usuário; autorização decide se aquele usuário pode executar uma ação. O access token JWT representa a sessão curta, enquanto refresh tokens opacos são armazenados com hash e rotacionados a cada uso. As rotas protegidas usam middleware de autenticação e, quando necessário, middleware de papel.

| Papel | Leitura | Criar/editar incidente | Usuários |
|---|---:|---:|---:|
| `admin` | Sim | Sim | Gerencia |
| `operator` | Sim | Sim | Não gerencia |
| `viewer` | Sim | Não | Não gerencia |

Uma decisão importante foi não confiar em campos sensíveis enviados pelo cliente. Por exemplo, o autor de um comentário é derivado da sessão autenticada, e não do campo `author` enviado no body. O frontend pode solicitar uma ação, mas a identidade e a permissão são decididas no servidor.

## Por que existem transições explícitas de status?

Um CRUD genérico permitiria alterar `open` diretamente para `resolved`, mesmo sem investigação. O domínio define transições permitidas para evitar estados inconsistentes:

```text
open -> investigating
investigating -> monitoring | resolved
monitoring -> investigating | resolved
resolved -> open
```

A regra fica em uma função pura, testável sem banco. A API retorna `409 Conflict` quando uma transição não é permitida. Essa separação evita que a mesma regra seja reimplementada de forma diferente no frontend e no backend.

## Como o SLA é calculado?

O prazo é calculado a partir de `createdAt + slaHours`. A função de domínio retorna estado, percentual consumido, tempo restante e tom visual. O percentual é limitado entre zero e cem para impedir que um incidente vencido gere uma barra negativa ou um valor acima do limite.

| Estado | Regra |
|---|---|
| `on_track` | Ainda há mais de 25% do prazo disponível. |
| `at_risk` | Restam até 25% do prazo. |
| `breached` | O prazo terminou sem resolução. |
| `met` | O incidente foi resolvido. |

O relógio é um parâmetro opcional da função. Isso torna os testes determinísticos: o teste não depende do momento em que o CI for executado.

## Por que existe uma trilha de auditoria?

Comentários explicam parte do contexto, mas não registram todas as mudanças importantes. A tabela `incident_events` registra ator, tipo, valores anterior e novo e timestamp. Eventos como `incident.status_changed` e `incident.severity_changed` permitem reconstruir a evolução de um incidente.

A criação de um incidente, a alteração do status e o evento de auditoria devem permanecer consistentes. Por isso, operações relacionadas são agrupadas em transações quando necessário. Na interface, esses eventos aparecem como timeline, permitindo que o usuário entenda não somente o estado atual, mas também como ele foi alcançado.

## Como os testes foram organizados?

A suíte possui testes unitários para regras puras e testes de integração para a API. Os testes unitários cobrem transições, SLA, storage de interface e rate limit. Os testes de integração executam contra PostgreSQL, aplicam migrations e validam login, refresh token, autorização, comentários, auditoria, health checks e readiness.

A escolha é intencional: mockar o banco seria mais rápido, mas poderia esconder falhas de migration, tipos SQL, constraints ou queries. O CI sobe PostgreSQL para aproximar a validação do ambiente real.

## Quais preocupações operacionais foram consideradas?

A API fornece `X-Request-Id` para correlacionar uma requisição com logs, diferencia liveness de readiness, configura CORS por ambiente, limita payload JSON, aplica rate limit no login e encerra o servidor e o pool de banco de forma graciosa em `SIGTERM` e `SIGINT`.

Esses recursos não tornam o projeto pronto para produção automaticamente. Eles demonstram, porém, que o projeto considera falhas, diagnósticos e ciclo de vida do processo além do caminho feliz da interface.

## Pontos para discussão técnica

### Separação entre domínio, API e persistência

A regra de status e SLA não deve depender de Express, React ou PostgreSQL. A separação permite testar o domínio de forma rápida e evita que handlers HTTP acumulem regras de negócio. A estrutura continua simples: rotas coordenam, serviços orquestram, domínio decide e repositories persistem.

### Autoria de comentários

O servidor ignora a identidade enviada pelo cliente e usa o usuário autenticado no contexto da requisição. O cliente controla o conteúdo do comentário, mas não controla quem será registrado como autor.

### Verificação da persistência de comentários

O teste cria um comentário, faz uma nova requisição de detalhe e verifica que o comentário está presente depois do reload. Isso é mais forte do que testar somente a resposta imediata do POST.

### Preparação para produção

Eu configuraria um provedor real de e-mail para recuperação de senha, adicionaria gestão segura de secrets, observabilidade centralizada, backup e restore testados, política de retenção da auditoria, paginação, revisão de CORS e um deploy com ambiente de staging antes de produção.

### Coerência entre frontend e API

Os tipos de domínio são compartilhados entre as camadas, os endpoints são documentados no README e a CI executa lint, build e testes de integração. Ainda assim, eu consideraria adicionar geração de contrato OpenAPI ou testes de contrato se a API evoluísse para múltiplos clientes.

## Limitações assumidas

O projeto ainda não possui deploy público, observabilidade externa, notificações ou provedor de e-mail. Essas limitações estão documentadas e não são apresentadas como funcionalidades prontas. Docker, migrations, CI, screenshots e o roteiro de execução local permitem reproduzir e revisar o sistema.

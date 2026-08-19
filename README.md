# IncidentBoard

IncidentBoard is an operational dashboard for engineering teams to register, prioritize and track technical incidents. The project models a realistic incident-management workflow with severity, status, SLA visibility, ownership and an activity history.

> **Portfolio project:** the current version is designed to demonstrate domain modeling, full-stack TypeScript, authentication, persistence, business rules, responsive UI and automated tests.

## Preview

![IncidentBoard login screen](docs/screenshots/login.webp)

The preview shows the access screen of the MVP. The local API is intentionally started as a separate process, so the interface can also be inspected independently from the persistence layer. Demo credentials are for local development only and must never be reused in production.

## Why this project exists

Incident response requires more than a CRUD screen. Teams need to understand which incidents are critical, who owns them, whether an SLA is at risk and what actions have already been taken. IncidentBoard centralizes those signals in a workflow that is easy to inspect and extend.

## Main capabilities

- Dashboard with active, critical, monitored and resolved incident metrics.
- Search and filtering by status and severity.
- Incident creation with payload validation.
- Status, severity, service, assignee and SLA tracking.
- Incident detail view with comments and activity history.
- Authentication with JWT-based session validation.
- REST API for health checks, incident operations and comments.
- SQLite-backed local demonstration mode with a clear path to PostgreSQL.
- Responsive interface for desktop, tablet and mobile layouts.

## Architecture

The application is organized around a React frontend and a local Express API. The API isolates persistence and domain rules so the storage layer can evolve without requiring a rewrite of the interface. SQLite is used for a frictionless local demo; PostgreSQL configuration and Drizzle migrations are included as the next persistence step.

```text
React + TypeScript + Vite
          |
          v
Express API + JWT authentication
          |
          v
SQLite local store / PostgreSQL migration path
```

The frontend can fall back to local demo persistence when the API is unavailable. This makes the product easy to explore locally while keeping the API boundary explicit.

## Technology stack

| Area | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, responsive CSS |
| Backend | Node.js, Express, TypeScript |
| Persistence | SQLite, PostgreSQL migration path, Drizzle configuration |
| Quality | Vitest, Testing Library, ESLint, TypeScript build |
| Security | JWT authentication, bcrypt password validation, environment-based secrets |

## Run locally

### Requirements

- Node.js 20 or newer.
- npm 10 or newer.
- Docker Desktop is required only for the optional PostgreSQL workflow.

### Install and start

```bash
npm install
npm run dev
```

The frontend normally runs at `http://localhost:5173` and the API at `http://localhost:3001`.

### Validate the project

```bash
npm run lint
npm run test
npm run build
```

To run the API separately:

```bash
npm run dev:api
```

Environment variables are documented in `.env.example`. Never commit real credentials or production secrets.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check API availability. |
| `GET` | `/api/incidents` | List incidents. |
| `GET` | `/api/incidents/:id` | Retrieve one incident. |
| `POST` | `/api/incidents` | Create an incident. |
| `PATCH` | `/api/incidents/:id` | Update incident fields. |
| `POST` | `/api/incidents/:id/comments` | Add an activity comment. |
| `POST` | `/api/auth/login` | Authenticate a local user. |
| `GET` | `/api/auth/me` | Validate the current session. |

## Tests and engineering decisions

The test suite covers SLA rules, identifier generation, API health checks, request validation and incident queries. Domain types are centralized in `src/types.ts`, while persistence and business rules are isolated from the UI. The project uses conventional commits and keeps local database files out of version control.

## Current limitations and roadmap

The project is an MVP and is intentionally transparent about its current boundaries. Local SQLite is the default demonstration store, the PostgreSQL migration path still needs a fully validated environment, and production-grade features such as password recovery, granular permissions, notifications, observability and deployment automation remain future increments.

Planned improvements include:

1. Complete PostgreSQL validation and add seeded demo data for the deployed environment.
2. Add granular permissions and user invitation flows.
3. Add notifications, webhooks and operational observability.
4. Add pagination, sorting and report export.
5. Configure continuous integration for lint, tests and build.

## Sessões e autorização

O login emite um access token JWT de curta duração e um refresh token opaco armazenado com hash no PostgreSQL. O frontend renova automaticamente a sessão quando uma chamada autenticada retorna `401`. Refresh tokens são rotacionados a cada uso e podem ser revogados no logout.

A API possui três papéis: `admin`, `operator` e `viewer`. Leitura de incidentes exige autenticação; criação, edição, alteração de status e comentários exigem `admin` ou `operator`. O papel `viewer` fica restrito à leitura. Em produção, o segredo JWT deve ser longo, aleatório e fornecido exclusivamente por variável de ambiente.

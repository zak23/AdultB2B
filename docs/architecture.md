# Architecture

This file describes the current architecture as implemented and planned in the repo.

## High-Level Diagram

```mermaid
flowchart LR
  subgraph Clients
    Web[Web App (Next.js)]
    Mobile[Mobile Web]
  end

  subgraph Edge
    CDN[Static/Media CDN]
  end

  subgraph App
    Next[Next.js App Router]
    API[NestJS API]
    WS[WebSocket Gateway]
    Auth[Auth & RBAC]
    Content[Content Service]
    Social[Connections & Follows]
    Messaging[Messaging Service]
    GroupsSvc[Groups/Events Service]
    Analytics[Analytics Service]
  end

  subgraph Data
    PG[(PostgreSQL)]
    Redis[(Redis)]
    S3[(S3-Compatible Storage)]
  end

  subgraph AI
    AIGW[AI Gateway]
    Assist[AI Assist]
    Moderation[AI Moderation]
    Insights[AI Insights]
  end

  Web --> Next
  Mobile --> Next
  CDN <-->|images, video| S3
  Next --> API
  Next --> WS

  API --> Auth
  API --> Content
  API --> Social
  API --> Messaging
  API --> GroupsSvc
  API --> Analytics

  Auth --> PG
  Content --> PG
  Social --> PG
  Messaging --> PG
  GroupsSvc --> PG
  Analytics --> PG

  API <--> Redis
  WS <--> Redis

  Content --> S3
  Messaging --> S3

  API -->|optional| AIGW
  AIGW --> Assist
  AIGW --> Moderation
  AIGW --> Insights
```

## Request Flow (Typical)

- Web UI calls the NestJS API for core operations.
- API persists data in PostgreSQL and uses Redis for realtime and cache needs.
- Media uploads use S3-compatible storage with presigned URLs.
- Optional AI calls flow through the AI Gateway and must not block core flows.

## Runtime Services (Local)

Defined in `docker-compose.yml`:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO S3 API: `localhost:9010`
- MinIO Console: `localhost:9011`

## Code-Level Structure

- API modules live in `apps/api/src/modules`.
- Next.js uses the App Router in `apps/web/src/app`.
- Shared enums and DTOs live in `packages/shared`.

## Notes

- The architecture diagram and AI contracts are defined in `architecture_v1.md` and `ai_service_contracts.md`.
- The database blueprint is in `db_schema_v1.sql`.

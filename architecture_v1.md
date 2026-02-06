# AdultB2B v1 Architecture

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

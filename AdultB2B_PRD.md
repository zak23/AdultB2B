# AdultB2B

**Product Requirements Document (PRD)**  
**LinkedIn-style B2B Network for the Adult Industry**

**Last updated:** January 31, 2026

## 1. Product Overview

AdultB2B is a professional networking platform purpose-built for the adult industry. It enables creators, companies, service providers, and recruiters to connect, publish content, form groups, run events, and build trust in a space that mainstream platforms restrict or ban.

The platform is API-first, AI-native, and compliance-aware from day one.

## 2. Goals & Principles

### Core Goals

- Launch a stable, scalable v1 network quickly
- Support adult-industry-specific content safely and legally
- Enable strong B2B discovery, messaging, and publishing
- Lay a foundation for AI-powered features without rewrites

### Design Principles

- Modular services
- Clear data ownership
- No platform ToS dependency
- AI as augmentation, not replacement
- Build once, extend forever

## 3. Tech Stack (Locked)

### Backend

- NestJS (Node.js)
- REST API (GraphQL optional later)
- Modular service architecture

### Frontend

- Next.js (React)
- App Router
- Server Components where appropriate
- SEO-friendly public pages

### Database

- PostgreSQL
- Strong relational modeling
- JSONB for flexible metadata

### Realtime

- Redis
- WebSockets for:
  - Messaging
  - Live notifications
  - Feed updates

### Media Storage

- S3-compatible object storage
- MinIO for local development and testing
- Presigned URLs for uploads/downloads

## 4. User Types

- Individual Professionals (creators, performers, developers)
- Companies (studios, platforms, agencies, payment providers)
- Recruiters / Talent Scouts
- Moderators / Admins

## 5. Core Features

### 5.1 Authentication & Accounts

- Email + password
- OAuth ready (phase 2)
- JWT-based auth
- Role-based access control (RBAC)

### 5.2 Profiles

#### Personal Profiles

- Headline
- About section
- Experience entries
- Skills and services
- Industry niches
- Visibility controls (public, logged-in, connections only)

#### Company Profiles

- Company description
- Services
- Team members
- Job and collaboration listings (future)

#### Media

- Profile photo
- Banner image
- Verification badge (manual v1)

### 5.3 Networking

- Follow users and companies
- Connection requests (optional mutual mode)
- Suggested connections

### 5.4 Feed System

**Post types:**

- Text
- Image
- Video
- Link previews

**Feed ranking:**

- Chronological v1
- Engagement-weighted v1.5
- Visibility rules based on user permissions

### 5.5 Engagement

- Reactions (custom set)
- Comments (threaded)
- Reposts (with or without commentary)

### 5.6 Messaging

- 1:1 messaging
- Group messaging
- Media attachments
- Read receipts (optional)

### 5.7 Content & Community

#### Blogs

- Long-form publishing
- Markdown or rich editor
- Author and company attribution

#### Groups

- Public / private / invite-only
- Moderation roles
- Group-specific feeds

#### Events

- Online and in-person events
- RSVP system
- Calendar metadata

#### Polls

- Single or multi-choice
- Time-boxed polls
- Results visibility controls

### 5.8 Scheduling & Growth

- Post scheduling
- Drafts
- Content queue

### 5.9 Ads & Sponsored Content (Phase 2)

- Sponsored posts
- Ad labeling
- Targeting by industry metadata
- Performance tracking

### 5.10 Analytics

#### Profile Analytics

- Profile views
- Viewer type breakdown
- Trends over time

#### Post Analytics

- Views
- Engagement
- Reposts
- Comment activity

#### Search Appearance

- Weekly stats
- Keywords used
- Impression trends

## 6. AI-Powered Features (v1 Light, v1.5+ Heavy)

### AI Assist Tools

- Profile bio and headline generation
- Post caption suggestions
- Hashtag and keyword suggestions
- Engagement prediction scoring

### AI Moderation

- Adult-industry aware moderation layer
- Flags illegal or prohibited content
- Soft warnings vs hard blocks

### AI Insights

- "Why this post worked" explanations
- Profile optimization suggestions
- Group health summaries

**Architecture note:**  
AI runs as separate services (MCP-style), accessed via API. Core app never depends on AI availability.

## 7. Data Model (High Level)

### Key Tables

- users
- companies
- profiles
- connections
- posts
- post_media
- reactions
- comments
- messages
- groups
- events
- polls
- analytics_events

### Storage

- Media stored in S3
- Metadata stored in Postgres
- Activity cached in Redis

## 8. Realtime Architecture

- WebSocket gateway in NestJS
- Redis pub/sub for:
  - Notifications
  - Messaging events
  - Feed updates
- Fallback to polling if WebSockets unavailable

## 9. Environments

### Local Development

- Dockerized services
- MinIO for S3 emulation
- Local Postgres
- Local Redis

### Production

- Managed Postgres
- Managed Redis
- S3-compatible object storage
- Horizontal scaling ready

### Containerization Plan (v1)

- Docker Compose for local orchestration
- Separate containers for:
  - Next.js web
  - NestJS API
  - Redis
  - Postgres
  - MinIO
- Single network with service discovery via container names
- Environment variables managed via `.env` files per service

## 10. MVP Scope (v1)

### Included

- Auth
- Profiles
- Feed
- Messaging
- Groups
- Blogs
- Basic analytics
- AI writing assists (limited)

### Excluded

- Ads marketplace
- Payments
- Advanced AI ranking
- Public API

## 11. Success Metrics

- Account creation rate
- Daily active users
- Posts per user
- Message sends per day
- Connection growth
- Content engagement rate

## 12. Future Expansion

- Job boards
- Deal rooms
- Creator marketplaces
- Contract templates
- Advanced AI matchmaking
- Public API for partners

# AdultB2B

**LinkedIn-style B2B Network for the Adult Industry**

A professional networking platform purpose-built for the adult industry. It enables creators, companies, service providers, and recruiters to connect, publish content, form groups, run events, and build trust in a space that mainstream platforms restrict or ban.

## Features (MVP)

- **Authentication** - Email/password with JWT
- **App shell (authenticated)** - Navbar and footer (Product, Account, Legal, Support links) on all logged-in pages
- **Profiles** - Personal and company profiles with media
- **Feed** - Posts (text, image, video, links) with engagement
- **Messaging** - 1:1 and group messaging with real-time updates
- **Groups** - Public/private communities with dedicated feeds
- **Blogs** - Long-form content publishing
- **Events** - Online and in-person event management
- **Analytics** - Profile and post performance metrics
- **AI Assists** - Optional AI-powered content suggestions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS (Node.js) |
| Frontend | Next.js (React, App Router) |
| Database | PostgreSQL |
| Cache/Realtime | Redis |
| Storage | S3-compatible (MinIO for dev) |
| AI | Optional external service |

## Project Structure

```
AdultB2B/
├── apps/
│   ├── api/              # NestJS backend API
│   └── web/              # Next.js frontend
├── packages/
│   └── shared/           # Shared types and utilities
├── docker/
│   └── init-scripts/     # Database initialization
├── docs/                 # Documentation
├── docker-compose.yml    # Local development services
└── package.json          # Monorepo root
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm 10+

### Deploy & Run (local test)

1. **Install and configure**
   ```bash
   cd AdultB2B
   npm install
   cp .env.example .env   # edit if needed; defaults work with Docker below
   ```

2. **Start infrastructure (Postgres, Redis, MinIO)**
   ```bash
   docker compose up -d
   ```

3. **Start API and Web (single command from repo root)**
   ```bash
   npm run dev
   ```
   Or in two terminals:
   - **Terminal 1:** `cd apps/api && npm run start:dev`
   - **Terminal 2:** `cd apps/web && npm run dev`

4. **Open in browser**
   - **Web app:** http://localhost:3001
   - **API (Swagger):** http://localhost:4000/api/docs
   - **MinIO Console:** http://localhost:9011

Optional: if you see `EMFILE: too many open files` from the Next.js watcher, increase the limit (e.g. `ulimit -n 65536`) or ignore it; the app usually still serves.

### Setup (first-time / clone)

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd AdultB2B
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start infrastructure**
   ```bash
   docker compose up -d
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: API
   cd apps/api && npm run start:dev

   # Terminal 2: Web
   cd apps/web && npm run dev
   ```

5. **Access the application**
   - Web: http://localhost:3001
   - API: http://localhost:4000
   - MinIO Console: http://localhost:9011

## Development Commands

```bash
# Start all services
npm run dev

# Start infrastructure only
npm run docker:up

# Stop infrastructure
npm run docker:down

# Reset database (warning: destroys data)
npm run docker:reset

# Seed database (admin + demo users + ~50 bulk users, ~200 posts)
npm run seed

# Build all apps
npm run build

# Run all tests
npm run test

# Run unit tests only
cd apps/api && npm run test

# Run e2e tests only
cd apps/api && npm run test:e2e

# Run tests with coverage
cd apps/api && npm run test:cov

# Lint code
npm run lint
```

## Database seed

Run from repo root or `apps/api`:

```bash
npm run seed
```

This creates or updates:

- **Admin:** `admin@adultb2b.local` / `Admin123!` (see `.env` for overrides)
- **Demo users:** 4 fixed users (e.g. ava.creator@example.com) with profiles
- **Bulk users:** ~50 users with varied roles (creator, company_owner, user), locations, headlines, and about text
- **Bulk posts:** ~200 published posts with staggered dates for a realistic feed

Seed content is suggestive and industry-appropriate but non-explicit, suitable for demos and shareholder screenshots. All bulk users use password `Password123!` (or `SEED_USER_PASSWORD`) and emails like `*@seed.adultb2b.local`.

## Testing

The API includes comprehensive test coverage with both unit tests and end-to-end (e2e) tests.

### Test Summary

| Type | Count | Description |
|------|-------|-------------|
| Unit Tests | 66 | Service-level tests with mocked dependencies |
| E2E Tests | 28 | Full API integration tests against real database |
| **Total** | **94** | All tests passing |

### Test Coverage

Unit tests cover the following services:
- **AuthService** - Registration, login, token refresh, validation
- **PostsService** - CRUD operations, visibility, media attachments
- **NetworkingService** - Connections, follows, relationship management
- **EngagementService** - Reactions, comments, counts
- **MessagingService** - Threads, messages, participants

E2E tests cover all major API endpoints:
- Health checks
- Authentication flows (register, login, token refresh)
- Profile management and lookups
- Post creation, editing, deletion
- Feed retrieval (personal and public)
- Group management
- Analytics tracking
- AI service status

### Running Tests

```bash
# From monorepo root
npm run test

# From API directory
cd apps/api
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
npm run test:watch    # Watch mode
```

## API Documentation

Full API documentation available at `http://localhost:4000/api/docs` (Swagger).

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Profiles
- `GET /profiles/me` - Get my profile
- `PUT /profiles/me` - Update my profile
- `PUT /profiles/me/avatar` - Update avatar
- `PUT /profiles/me/banner` - Update banner
- `POST /profiles/me/experiences` - Add experience
- `GET /profiles/:id` - Get profile by ID
- `GET /profiles/lookup/skills` - Get available skills
- `GET /profiles/lookup/services` - Get available services
- `GET /profiles/lookup/niches` - Get available niches

### Media
- `POST /media/upload-url` - Get presigned upload URL
- `POST /media/:id/confirm` - Confirm upload
- `GET /media/:id/download-url` - Get download URL
- `DELETE /media/:id` - Delete media

### Networking
- `POST /networking/connections/request` - Send connection request
- `POST /networking/connections/:id/respond` - Accept/decline connection
- `GET /networking/connections` - Get my connections
- `POST /networking/follow/user` - Follow a user
- `DELETE /networking/follow/user/:userId` - Unfollow user
- `GET /networking/followers` - Get my followers
- `GET /networking/following` - Get who I follow
- `GET /networking/stats` - Get networking stats

### Posts
- `POST /posts` - Create post
- `GET /posts/:id` - Get post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `POST /posts/:id/publish` - Publish draft
- `GET /posts/user/:userId` - Get user's posts

### Feed
- `GET /feed` - Get personalized feed
- `GET /feed/public` - Get public feed
- `GET /feed/group/:groupId` - Get group feed

### Engagement
- `GET /engagement/reaction-types` - Get reaction types
- `POST /engagement/posts/:postId/reactions` - React to post
- `DELETE /engagement/posts/:postId/reactions` - Remove reaction
- `GET /engagement/posts/:postId/reactions` - Get post reactions
- `POST /engagement/posts/:postId/comments` - Add comment
- `GET /engagement/posts/:postId/comments` - Get comments

### Messaging
- `POST /messaging/threads/direct` - Create direct thread
- `GET /messaging/threads` - List threads
- `POST /messaging/threads/:threadId/messages` - Send message
- `GET /messaging/threads/:threadId/messages` - Get messages
- `POST /messaging/threads/:threadId/read` - Mark as read

### Groups
- `POST /groups` - Create group
- `GET /groups` - List public groups
- `GET /groups/my` - Get my groups
- `GET /groups/:id` - Get group details
- `POST /groups/:id/join` - Join group
- `DELETE /groups/:id/leave` - Leave group
- `GET /groups/:id/members` - Get group members

### Analytics
- `POST /analytics/track` - Track event
- `GET /analytics/profile/:profileId` - Get profile analytics
- `GET /analytics/post/:postId` - Get post analytics

### AI (Optional)
- `GET /ai/status` - Check AI service status
- `POST /ai/assist/profile-bio` - Generate profile bio
- `POST /ai/assist/post-caption` - Generate post captions
- `POST /ai/assist/keywords` - Suggest keywords
- `POST /ai/moderation/check` - Check content moderation

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGIN` | Allowed frontend origins (comma-separated) | http://localhost:3001,http://127.0.0.1:3001 |
| `S3_ENDPOINT` | S3/MinIO endpoint | - |
| `S3_ACCESS_KEY` | S3 access key | - |
| `S3_SECRET_KEY` | S3 secret key | - |
| `S3_BUCKET` | S3 bucket name | adultb2b-media |

See `.env.example` for full list.

## Architecture

```
┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   NestJS    │
│   Frontend  │     │   API       │
└─────────────┘     └──────┬──────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  PostgreSQL │    │    Redis    │    │  S3/MinIO   │
│  (Data)     │    │  (Cache/WS) │    │  (Media)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Contributing

1. Create feature branch from `main`
2. Make changes with tests
3. Submit PR with description

## License

Proprietary - All rights reserved

# Setup

This setup guide is for local development.

## Prerequisites

- Node.js `>= 20`
- npm `>= 10`
- Docker + Docker Compose

## Install

```bash
npm install
```

## Environment

Copy the env template and adjust as needed:

```bash
cp .env.example .env
```

Key variables:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`
- `API_URL`, `NEXT_PUBLIC_API_URL`

## Start Local Infrastructure

```bash
npm run docker:up
```

Services will be available on:

- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- MinIO S3 API: `localhost:9010`
- MinIO Console: `localhost:9011`

## Run Apps

```bash
npm run dev
```

This runs:

- API: `http://localhost:4000`
- Web: `http://localhost:3001`

## Database Seed

```bash
npm run seed
```

The seed script lives at `apps/api/src/database/seed.ts` and inserts example users, profiles, roles, and sample content.

## Migrations

```bash
cd apps/api
npm run migration:generate -- -n <name>
npm run migration:run
```

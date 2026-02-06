# Repository Structure

AdultB2B is a Node.js monorepo using npm workspaces.

## Top-Level Layout

- `apps/api` NestJS API application
- `apps/web` Next.js web application
- `packages/shared` Shared types and utilities
- `docker` Database init scripts
- `docs` Project documentation

## API (`apps/api`)

- `src/modules` Feature modules, controllers, services, DTOs, and entities
- `src/database` Data source config and seed script
- `test` End-to-end tests

## Web (`apps/web`)

- `src/app` App Router pages and layouts
- `src/components` Reusable UI components
- `src/contexts` Auth and app contexts
- `src/lib` Client-side helpers

## Shared (`packages/shared`)

- Enums and API response types used by both API and web

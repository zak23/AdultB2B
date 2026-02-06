# Development Workflow

## Common Commands (Root)

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run docker:up
npm run docker:down
npm run docker:reset
```

## API Commands

```bash
cd apps/api
npm run start:dev
npm run test
npm run test:e2e
npm run test:cov
npm run lint
npm run format
```

## Web Commands

```bash
cd apps/web
npm run dev
npm run build
npm run lint
```

## Conventions

- Node engine: `>= 20`
- API uses NestJS, TypeORM, and JWT auth
- Web uses Next.js App Router
- Shared enums and DTOs live in `packages/shared`

## Testing Notes

Current test files in the repo:

- Unit: 5 spec files under `apps/api/src/modules/**/__tests__`
- E2E: `apps/api/test/app.e2e-spec.ts`

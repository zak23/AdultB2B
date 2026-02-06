# API Guide

## Base URL

- Local: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`

The API sets a global `/api` prefix in `apps/api/src/main.ts`.

## Auth

Supported auth mechanisms:

- Bearer token: `Authorization: Bearer <token>`
- Cookie: `access_token`

JWT configuration is set via `.env`:

- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

## Route Groups

Controller base paths (from `@Controller()`):

- `/auth`
- `/profiles`
- `/posts`
- `/feed`
- `/engagement`
- `/networking`
- `/groups`
- `/messaging`
- `/media`
- `/analytics`
- `/ai`

See Swagger for full endpoint definitions and payloads.

## Behavior Notes

- Validation is enforced via NestJS `ValidationPipe` with whitelist/forbid settings.
- CORS is enabled for `CORS_ORIGIN` (defaults to `http://localhost:3001`).
- API errors follow NestJS default error shape unless customized by a module.

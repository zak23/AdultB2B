# Deployment

This repo currently defines local development infrastructure only.

## Local Docker Stack

- Postgres 16
- Redis 7
- MinIO (S3-compatible)

Defined in `docker-compose.yml` and run with `npm run docker:up`.

## Production Deployment

No production deployment configuration is present in the repo as of Feb 6, 2026. When adding production infra, document:

- Runtime platform (k8s, ECS, VM)
- Environment config management
- Database migrations strategy
- Storage and CDN setup
- Observability (logs, metrics, traces)

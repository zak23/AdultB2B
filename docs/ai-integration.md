# AI Integration

AI services are optional and must never block core application flows. Contracts are defined in `ai_service_contracts.md`.

## Configuration

Environment variables:

- `AI_SERVICE_URL`
- `AI_SERVICE_TOKEN`

## Contract Summary

- Base URL: `https://ai.internal/v1` (contracted default)
- Auth header: `Authorization: Bearer <service-token>`
- Idempotency: `Idempotency-Key` for write-like requests
- Trace: `X-Request-Id` is echoed in responses

### Assist Services

- Profile bio generation
- Post caption suggestions
- Hashtag and keyword suggestions
- Engagement prediction

### Moderation Services

- Content checks for text and media

### Insights Services

- Analytics and performance summaries (defined in contracts)

Refer to `ai_service_contracts.md` for request and response payloads.

# AI Service Contracts (v1)

These contracts define the v1 API between the core app and AI services. AI runs as separate services and is always optional: failures must never block core app flows.

## Conventions

- Base URL: `https://ai.internal/v1`
- Auth: `Authorization: Bearer <service-token>`
- Idempotency: `Idempotency-Key: <uuid>` for write-like requests
- Request tracing: `X-Request-Id: <uuid>` (propagated back in response)
- Actor context (optional): `X-User-Id`, `X-Company-Id`
- Content language: `Accept-Language: en-US` (or other locale)

### Common Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: input",
    "details": {"field": "input"}
  }
}
```

### Error Codes

- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `MODEL_UNAVAILABLE`
- `CONTENT_BLOCKED`
- `TIMEOUT`
- `INTERNAL_ERROR`

### Common Response Metadata

All successful responses include:

```json
{
  "request_id": "uuid",
  "model": "model-name",
  "latency_ms": 123,
  "warnings": ["optional warning string"]
}
```

## Assist Services

### 1) Generate Profile Bio

`POST /assist/profile-bio`

Request:
```json
{
  "input": {
    "headline": "Producer and studio owner",
    "skills": ["production", "editing"],
    "services": ["content strategy"],
    "niches": ["premium"],
    "tone": "professional"
  },
  "constraints": {
    "max_chars": 600
  }
}
```

Response:
```json
{
  "request_id": "uuid",
  "model": "gpt-4.1-mini",
  "latency_ms": 210,
  "warnings": [],
  "result": {
    "bio": "...",
    "headline": "..."
  }
}
```

### 2) Post Caption Suggestions

`POST /assist/post-caption`

Request:
```json
{
  "input": {
    "post_text": "Launching our new studio services...",
    "audience": "B2B",
    "tone": "confident"
  },
  "constraints": {
    "max_suggestions": 3
  }
}
```

Response:
```json
{
  "request_id": "uuid",
  "model": "gpt-4.1-mini",
  "latency_ms": 190,
  "warnings": [],
  "result": {
    "captions": ["...", "..."]
  }
}
```

### 3) Hashtag and Keyword Suggestions

`POST /assist/keywords`

Request:
```json
{
  "input": {
    "text": "Looking for distribution partners",
    "locale": "en-US"
  },
  "constraints": {
    "max_hashtags": 8,
    "max_keywords": 8
  }
}
```

Response:
```json
{
  "request_id": "uuid",
  "model": "gpt-4.1-mini",
  "latency_ms": 160,
  "warnings": [],
  "result": {
    "hashtags": ["#..."],
    "keywords": ["..."]
  }
}
```

### 4) Engagement Prediction Score

`POST /assist/engagement-score`

Request:
```json
{
  "input": {
    "text": "New collaboration opportunity",
    "post_type": "text",
    "audience_size": 1200
  }
}
```

Response:
```json
{
  "request_id": "uuid",
  "model": "gpt-4.1-mini",
  "latency_ms": 140,
  "warnings": [],
  "result": {
    "score": 0.73,
    "explanation": "Short and clear CTA. Consider adding a time window."
  }
}
```

## Moderation Services

### 5) Content Check

`POST /moderation/content-check`

Request:
```json
{
  "input": {
    "text": "...",
    "media": [
      {"url": "https://.../asset.jpg", "type": "image"}
    ]
  },
  "policy": {
    "strictness": "standard"
  }
}
```

Response:
```json
{
  "request_id": "uuid",
  "model": "moderation-v1",
  "latency_ms": 220,
  "warnings": [],
  "result": {
    "decision": "allow",
    "labels": ["adult_content"],
    "actions": [],
    "confidence": 0.91
  }
}
```

Possible `decision` values: `allow`, `warn`, `block`.

If blocked:
```json
{
  "error": {
    "code": "CONTENT_BLOCKED",
    "message": "Policy violation: illegal content",
    "details": {"labels": ["illegal_content"]}
  }
}
```

## Insight Services

### 6) Why This Post Worked

`POST /insights/post-explanation`

Request:
```json
{
  "input": {
    "post_id": "uuid",
    "text": "...",
    "metrics": {"views": 1200, "comments": 24, "reposts": 3}
  }
}
```

Response:
```json
{
  "request_id": "uuid",
  "model": "gpt-4.1-mini",
  "latency_ms": 240,
  "warnings": [],
  "result": {
    "summary": "...",
    "key_factors": ["...", "..."]
  }
}
```

### 7) Profile Optimization Suggestions

`POST /insights/profile-optimization`

Request:
```json
{
  "input": {
    "profile_id": "uuid",
    "headline": "...",
    "about": "...",
    "skills": ["..."],
    "services": ["..."]
  }
}
```

Response:
```json
{
  "request_id": "uuid",
  "model": "gpt-4.1-mini",
  "latency_ms": 210,
  "warnings": [],
  "result": {
    "suggestions": ["...", "..."],
    "priority_actions": ["..."]
  }
}
```

### 8) Group Health Summary

`POST /insights/group-health`

Request:
```json
{
  "input": {
    "group_id": "uuid",
    "metrics": {
      "members": 320,
      "weekly_posts": 24,
      "weekly_comments": 88
    }
  }
}
```

Response:
```json
{
  "request_id": "uuid",
  "model": "gpt-4.1-mini",
  "latency_ms": 200,
  "warnings": [],
  "result": {
    "summary": "...",
    "risks": ["..."],
    "recommendations": ["..."]
  }
}
```

## Health and Capabilities

### 9) Health Check

`GET /health`

Response:
```json
{
  "status": "ok",
  "models": ["gpt-4.1-mini", "moderation-v1"]
}
```

## Operational Expectations

- Soft-fail: core app must continue if AI is unavailable.
- Max latency target: 500ms p95 for assist; 800ms p95 for moderation.
- Timeouts: core app should enforce 2s max, with fallback to no AI.
- PII: do not send raw payment data or credentials.

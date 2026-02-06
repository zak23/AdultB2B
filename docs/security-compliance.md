# Security And Compliance Notes

This document captures the security and compliance-related signals present in the repo.

## Auth And RBAC

- JWT-based auth (`apps/api/src/modules/auth`)
- RBAC tables in the schema: `roles`, `permissions`, `role_permissions`, `user_roles`

## Content Moderation

- Schema includes `moderation_status` enum and related fields in content entities
- AI contracts define moderation endpoints in `ai_service_contracts.md`

## Data Protection

- Passwords are stored as hashes (bcrypt used in `apps/api`)
- PII fields include `email`, `display_name`, profile metadata

## Open Items To Define

These are not documented in the repo yet:

- Data retention policies
- Audit logging requirements
- Age verification or legal compliance workflows
- Incident response and escalation paths

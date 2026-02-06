# Data Model

The authoritative schema is in `db_schema_v1.sql`. This file summarizes the core entities and their relationships.

## Core Identity

- `users`: primary identity table (email, password hash, status)
- `roles`, `permissions`, `role_permissions`, `user_roles`: RBAC model

## Profiles

- `profiles`: either a user profile or a company profile (mutually exclusive)
- `profile_experiences`, `profile_skills`, `profile_services`, `profile_niches`
- Lookup tables: `skills`, `services`, `industry_niches`

## Companies

- `companies`
- `company_members`: user membership and role within a company

## Networking

- `connections`: user-to-user connection requests and status
- `follows`: user follows user or company

## Content

- `posts`: supports `post` and `blog` kinds, draft/scheduled/published lifecycle
- `post_media`: links posts to `media_assets`
- `comments`, `reactions`, `reaction_types`

## Messaging

- `message_threads`: direct or group threads
- `thread_participants`
- `messages`
- `message_attachments`, `message_reads`

## Groups And Events

- `groups`, `group_members`
- `events`, `event_rsvps`

## Polls

- `polls`, `poll_options`, `poll_votes`

## Media

- `media_assets`: S3-compatible storage metadata

## Analytics

- `analytics_events`: event tracking and metrics

## Enums

Defined at the top of `db_schema_v1.sql` and mirrored in `packages/shared/src/index.ts`.

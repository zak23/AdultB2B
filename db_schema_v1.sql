-- AdultB2B v1 schema (PostgreSQL)
-- Uses pgcrypto for UUIDs and citext for case-insensitive email

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Enums
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE profile_visibility AS ENUM ('public', 'logged_in', 'connections');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
CREATE TYPE post_kind AS ENUM ('post', 'blog');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE content_format AS ENUM ('plain', 'markdown', 'rich');
CREATE TYPE post_visibility AS ENUM ('public', 'logged_in', 'connections');
CREATE TYPE media_type AS ENUM ('image', 'video', 'file');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'flagged', 'removed');
CREATE TYPE thread_type AS ENUM ('direct', 'group');
CREATE TYPE group_visibility AS ENUM ('public', 'private', 'invite_only');
CREATE TYPE group_member_role AS ENUM ('owner', 'admin', 'moderator', 'member');
CREATE TYPE company_member_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE event_visibility AS ENUM ('public', 'private', 'invite_only');
CREATE TYPE rsvp_status AS ENUM ('going', 'interested', 'declined');
CREATE TYPE poll_type AS ENUM ('single', 'multi');
CREATE TYPE poll_results_visibility AS ENUM ('public', 'voters', 'admins', 'hidden');

-- Core identity
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Companies and membership
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE company_members (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role company_member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, user_id)
);

-- Media assets
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  media_type media_type NOT NULL,
  bucket TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  content_type TEXT,
  byte_size BIGINT,
  width INT,
  height INT,
  duration_seconds INT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT (owner_user_id IS NOT NULL AND owner_company_id IS NOT NULL))
);

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  headline TEXT,
  about TEXT,
  location TEXT,
  website_url TEXT,
  visibility profile_visibility NOT NULL DEFAULT 'public',
  avatar_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  banner_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (user_id IS NOT NULL AND company_id IS NULL) OR
    (user_id IS NULL AND company_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX profiles_user_unique ON profiles(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX profiles_company_unique ON profiles(company_id) WHERE company_id IS NOT NULL;

CREATE TABLE profile_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company_name TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE profile_skills (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, skill_id)
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE profile_services (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, service_id)
);

CREATE TABLE industry_niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE profile_niches (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  niche_id UUID NOT NULL REFERENCES industry_niches(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, niche_id)
);

-- Networking
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CHECK (requester_user_id <> recipient_user_id)
);

CREATE UNIQUE INDEX connections_unique_pair ON connections(requester_user_id, recipient_user_id);
CREATE INDEX connections_recipient_status ON connections(recipient_user_id, status);

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (target_user_id IS NOT NULL AND target_company_id IS NULL) OR
    (target_user_id IS NULL AND target_company_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX follows_unique_user_target ON follows(follower_user_id, target_user_id)
  WHERE target_user_id IS NOT NULL;
CREATE UNIQUE INDEX follows_unique_company_target ON follows(follower_user_id, target_company_id)
  WHERE target_company_id IS NOT NULL;

-- Groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  visibility group_visibility NOT NULL DEFAULT 'public',
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role group_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Posts and engagement
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  author_company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  kind post_kind NOT NULL DEFAULT 'post',
  status post_status NOT NULL DEFAULT 'draft',
  content_format content_format NOT NULL DEFAULT 'plain',
  content TEXT,
  content_markdown TEXT,
  link_url TEXT,
  link_title TEXT,
  link_description TEXT,
  link_image_url TEXT,
  visibility post_visibility NOT NULL DEFAULT 'public',
  repost_of_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  moderation_status moderation_status NOT NULL DEFAULT 'approved',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (author_user_id IS NOT NULL AND author_company_id IS NULL) OR
    (author_user_id IS NULL AND author_company_id IS NOT NULL)
  )
);

CREATE INDEX posts_author_user_created ON posts(author_user_id, created_at DESC);
CREATE INDEX posts_author_company_created ON posts(author_company_id, created_at DESC);
CREATE INDEX posts_published_at ON posts(published_at DESC);
CREATE INDEX posts_group_published ON posts(group_id, published_at DESC);

CREATE TABLE post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, media_asset_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  author_company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  moderation_status moderation_status NOT NULL DEFAULT 'approved',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (author_user_id IS NOT NULL AND author_company_id IS NULL) OR
    (author_user_id IS NULL AND author_company_id IS NOT NULL)
  )
);

CREATE INDEX comments_post_created ON comments(post_id, created_at ASC);
CREATE INDEX comments_parent ON comments(parent_comment_id);

CREATE TABLE reaction_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  emoji TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type_id UUID NOT NULL REFERENCES reaction_types(id) ON DELETE RESTRICT,
  target_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  target_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (target_post_id IS NOT NULL AND target_comment_id IS NULL) OR
    (target_post_id IS NULL AND target_comment_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX reactions_unique_post ON reactions(user_id, target_post_id)
  WHERE target_post_id IS NOT NULL;
CREATE UNIQUE INDEX reactions_unique_comment ON reactions(user_id, target_comment_id)
  WHERE target_comment_id IS NOT NULL;

-- Messaging
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_type thread_type NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  CHECK (
    (thread_type = 'direct' AND group_id IS NULL) OR
    (thread_type = 'group' AND group_id IS NOT NULL)
  )
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX messages_thread_created ON messages(thread_id, created_at ASC);

CREATE TABLE thread_participants (
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, media_asset_id)
);

CREATE TABLE message_reads (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  organizer_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  organizer_company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  location_text TEXT,
  visibility event_visibility NOT NULL DEFAULT 'public',
  rsvp_capacity INT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (organizer_user_id IS NOT NULL AND organizer_company_id IS NULL) OR
    (organizer_user_id IS NULL AND organizer_company_id IS NOT NULL)
  )
);

CREATE INDEX events_start_at ON events(start_at);
CREATE INDEX events_group ON events(group_id);

CREATE TABLE event_rsvps (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Polls
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  poll_type poll_type NOT NULL DEFAULT 'single',
  closes_at TIMESTAMPTZ,
  results_visibility poll_results_visibility NOT NULL DEFAULT 'public',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE poll_votes (
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (option_id, user_id)
);

-- Analytics
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX analytics_entity ON analytics_events(entity_type, entity_id, occurred_at DESC);
CREATE INDEX analytics_actor ON analytics_events(actor_user_id, occurred_at DESC);

-- Updated-at trigger helper (optional but keeps updated_at in sync)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at trigger to core tables
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER message_threads_updated_at BEFORE UPDATE ON message_threads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER groups_updated_at BEFORE UPDATE ON groups
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

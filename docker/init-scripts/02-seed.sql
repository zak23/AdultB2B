-- AdultB2B v1 Seed Data
-- Default roles, permissions, and reaction types

-- Default roles
INSERT INTO roles (id, key, name) VALUES
  (gen_random_uuid(), 'admin', 'Administrator'),
  (gen_random_uuid(), 'moderator', 'Moderator'),
  (gen_random_uuid(), 'user', 'User'),
  (gen_random_uuid(), 'creator', 'Creator'),
  (gen_random_uuid(), 'company_owner', 'Company Owner')
ON CONFLICT (key) DO NOTHING;

-- Default permissions
INSERT INTO permissions (id, key, description) VALUES
  (gen_random_uuid(), 'users:read', 'Read user data'),
  (gen_random_uuid(), 'users:write', 'Write user data'),
  (gen_random_uuid(), 'users:delete', 'Delete users'),
  (gen_random_uuid(), 'posts:read', 'Read posts'),
  (gen_random_uuid(), 'posts:write', 'Create and edit posts'),
  (gen_random_uuid(), 'posts:delete', 'Delete posts'),
  (gen_random_uuid(), 'posts:moderate', 'Moderate posts'),
  (gen_random_uuid(), 'comments:read', 'Read comments'),
  (gen_random_uuid(), 'comments:write', 'Create and edit comments'),
  (gen_random_uuid(), 'comments:delete', 'Delete comments'),
  (gen_random_uuid(), 'comments:moderate', 'Moderate comments'),
  (gen_random_uuid(), 'groups:read', 'Read groups'),
  (gen_random_uuid(), 'groups:write', 'Create and edit groups'),
  (gen_random_uuid(), 'groups:delete', 'Delete groups'),
  (gen_random_uuid(), 'groups:moderate', 'Moderate groups'),
  (gen_random_uuid(), 'messages:read', 'Read messages'),
  (gen_random_uuid(), 'messages:write', 'Send messages'),
  (gen_random_uuid(), 'messages:delete', 'Delete messages'),
  (gen_random_uuid(), 'companies:read', 'Read companies'),
  (gen_random_uuid(), 'companies:write', 'Create and edit companies'),
  (gen_random_uuid(), 'companies:delete', 'Delete companies'),
  (gen_random_uuid(), 'analytics:read', 'Read analytics'),
  (gen_random_uuid(), 'admin:access', 'Access admin panel')
ON CONFLICT (key) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.key = 'moderator' AND p.key IN (
  'users:read', 'posts:read', 'posts:moderate', 'comments:read', 'comments:moderate',
  'groups:read', 'groups:moderate', 'messages:read'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.key = 'user' AND p.key IN (
  'users:read', 'posts:read', 'posts:write', 'comments:read', 'comments:write',
  'groups:read', 'messages:read', 'messages:write', 'companies:read', 'analytics:read'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.key = 'creator' AND p.key IN (
  'users:read', 'posts:read', 'posts:write', 'comments:read', 'comments:write',
  'groups:read', 'groups:write', 'messages:read', 'messages:write', 'companies:read', 'analytics:read'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.key = 'company_owner' AND p.key IN (
  'users:read', 'posts:read', 'posts:write', 'comments:read', 'comments:write',
  'groups:read', 'groups:write', 'messages:read', 'messages:write',
  'companies:read', 'companies:write', 'analytics:read'
)
ON CONFLICT DO NOTHING;

-- Default reaction types
INSERT INTO reaction_types (id, key, label, emoji, is_active) VALUES
  (gen_random_uuid(), 'like', 'Like', '👍', true),
  (gen_random_uuid(), 'love', 'Love', '❤️', true),
  (gen_random_uuid(), 'celebrate', 'Celebrate', '🎉', true),
  (gen_random_uuid(), 'insightful', 'Insightful', '💡', true),
  (gen_random_uuid(), 'support', 'Support', '🙌', true),
  (gen_random_uuid(), 'fire', 'Fire', '🔥', true)
ON CONFLICT (key) DO NOTHING;

-- Default skills (common in adult industry)
INSERT INTO skills (id, name) VALUES
  (gen_random_uuid(), 'Content Creation'),
  (gen_random_uuid(), 'Video Production'),
  (gen_random_uuid(), 'Photography'),
  (gen_random_uuid(), 'Video Editing'),
  (gen_random_uuid(), 'Marketing'),
  (gen_random_uuid(), 'Social Media Management'),
  (gen_random_uuid(), 'Web Development'),
  (gen_random_uuid(), 'Graphic Design'),
  (gen_random_uuid(), 'Copywriting'),
  (gen_random_uuid(), 'SEO'),
  (gen_random_uuid(), 'Affiliate Marketing'),
  (gen_random_uuid(), 'Community Management'),
  (gen_random_uuid(), 'Customer Support'),
  (gen_random_uuid(), 'Legal Compliance'),
  (gen_random_uuid(), 'Payment Processing'),
  (gen_random_uuid(), 'Talent Management'),
  (gen_random_uuid(), 'Event Planning'),
  (gen_random_uuid(), 'Public Relations')
ON CONFLICT (name) DO NOTHING;

-- Default services
INSERT INTO services (id, name) VALUES
  (gen_random_uuid(), 'Content Production'),
  (gen_random_uuid(), 'Platform Development'),
  (gen_random_uuid(), 'Marketing Services'),
  (gen_random_uuid(), 'Talent Agency'),
  (gen_random_uuid(), 'Legal Services'),
  (gen_random_uuid(), 'Payment Solutions'),
  (gen_random_uuid(), 'Hosting Services'),
  (gen_random_uuid(), 'Consulting'),
  (gen_random_uuid(), 'Distribution'),
  (gen_random_uuid(), 'Licensing'),
  (gen_random_uuid(), 'Age Verification'),
  (gen_random_uuid(), 'Content Moderation')
ON CONFLICT (name) DO NOTHING;

-- Default industry niches
INSERT INTO industry_niches (id, name) VALUES
  (gen_random_uuid(), 'Premium/Mainstream'),
  (gen_random_uuid(), 'Amateur'),
  (gen_random_uuid(), 'Creator Platforms'),
  (gen_random_uuid(), 'Cam Sites'),
  (gen_random_uuid(), 'Dating'),
  (gen_random_uuid(), 'Technology'),
  (gen_random_uuid(), 'Marketing/Traffic'),
  (gen_random_uuid(), 'Payment/Billing'),
  (gen_random_uuid(), 'Legal/Compliance'),
  (gen_random_uuid(), 'Production Studios'),
  (gen_random_uuid(), 'Distribution'),
  (gen_random_uuid(), 'Licensing'),
  (gen_random_uuid(), 'Events/Trade Shows')
ON CONFLICT (name) DO NOTHING;

// AdultB2B Shared Types and Utilities

// User status enum
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

// Profile visibility enum
export enum ProfileVisibility {
  PUBLIC = 'public',
  LOGGED_IN = 'logged_in',
  CONNECTIONS = 'connections',
}

// Connection status enum
export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  BLOCKED = 'blocked',
}

// Post kind enum
export enum PostKind {
  POST = 'post',
  BLOG = 'blog',
}

// Post status enum
export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// Content format enum
export enum ContentFormat {
  PLAIN = 'plain',
  MARKDOWN = 'markdown',
  RICH = 'rich',
}

// Post visibility enum
export enum PostVisibility {
  PUBLIC = 'public',
  LOGGED_IN = 'logged_in',
  CONNECTIONS = 'connections',
}

// Media type enum
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
}

// Moderation status enum
export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FLAGGED = 'flagged',
  REMOVED = 'removed',
}

// Thread type enum
export enum ThreadType {
  DIRECT = 'direct',
  GROUP = 'group',
}

// Group visibility enum
export enum GroupVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite_only',
}

// Group member role enum
export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

// Company member role enum
export enum CompanyMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

// Event visibility enum
export enum EventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite_only',
}

// RSVP status enum
export enum RsvpStatus {
  GOING = 'going',
  INTERESTED = 'interested',
  DECLINED = 'declined',
}

// Poll type enum
export enum PollType {
  SINGLE = 'single',
  MULTI = 'multi',
}

// Poll results visibility enum
export enum PollResultsVisibility {
  PUBLIC = 'public',
  VOTERS = 'voters',
  ADMINS = 'admins',
  HIDDEN = 'hidden',
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  username?: string;
}

export interface AuthResponse {
  user: UserSummary;
  accessToken: string;
}

export interface UserSummary {
  id: string;
  email: string;
  username: string | null;
  displayName: string;
  status: UserStatus;
}

// Profile types
export interface ProfileSummary {
  id: string;
  userId?: string;
  companyId?: string;
  headline: string | null;
  about: string | null;
  location: string | null;
  visibility: ProfileVisibility;
  avatarUrl: string | null;
  bannerUrl: string | null;
}

// Post types
export interface PostSummary {
  id: string;
  authorUserId?: string;
  authorCompanyId?: string;
  kind: PostKind;
  status: PostStatus;
  content: string | null;
  visibility: PostVisibility;
  publishedAt: string | null;
  createdAt: string;
  reactionCount: number;
  commentCount: number;
}

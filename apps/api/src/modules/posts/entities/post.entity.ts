import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';
import { PostMedia } from './post-media.entity';

export enum PostKind {
  POST = 'post',
  BLOG = 'blog',
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ContentFormat {
  PLAIN = 'plain',
  MARKDOWN = 'markdown',
  RICH = 'rich',
}

export enum PostVisibility {
  PUBLIC = 'public',
  LOGGED_IN = 'logged_in',
  CONNECTIONS = 'connections',
}

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FLAGGED = 'flagged',
  REMOVED = 'removed',
}

@Entity('posts')
@Index(['authorUserId', 'createdAt'])
@Index(['authorCompanyId', 'createdAt'])
@Index(['publishedAt'])
@Index(['groupId', 'publishedAt'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_user_id', type: 'uuid', nullable: true })
  authorUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_user_id' })
  authorUser: User | null;

  @Column({ name: 'author_company_id', type: 'uuid', nullable: true })
  authorCompanyId: string | null;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_company_id' })
  authorCompany: Company | null;

  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  groupId: string | null;

  @Column({ type: 'enum', enum: PostKind, default: PostKind.POST })
  kind: PostKind;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.DRAFT })
  status: PostStatus;

  @Column({ name: 'content_format', type: 'enum', enum: ContentFormat, default: ContentFormat.PLAIN })
  contentFormat: ContentFormat;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ name: 'content_markdown', type: 'text', nullable: true })
  contentMarkdown: string | null;

  @Column({ name: 'link_url', type: 'text', nullable: true })
  linkUrl: string | null;

  @Column({ name: 'link_title', type: 'text', nullable: true })
  linkTitle: string | null;

  @Column({ name: 'link_description', type: 'text', nullable: true })
  linkDescription: string | null;

  @Column({ name: 'link_image_url', type: 'text', nullable: true })
  linkImageUrl: string | null;

  @Column({ type: 'enum', enum: PostVisibility, default: PostVisibility.PUBLIC })
  visibility: PostVisibility;

  @Column({ name: 'repost_of_post_id', type: 'uuid', nullable: true })
  repostOfPostId: string | null;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'repost_of_post_id' })
  repostOfPost: Post | null;

  @Column({ name: 'moderation_status', type: 'enum', enum: ModerationStatus, default: ModerationStatus.APPROVED })
  moderationStatus: ModerationStatus;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => PostMedia, (pm) => pm.post)
  media: PostMedia[];

  reactionCount?: number;
  commentCount?: number;
  repostCount?: number;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { ReactionType } from './reaction-type.entity';

@Entity('reactions')
@Index(['userId', 'targetPostId'], { unique: true, where: '"target_post_id" IS NOT NULL' })
@Index(['userId', 'targetCommentId'], { unique: true, where: '"target_comment_id" IS NOT NULL' })
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'reaction_type_id', type: 'uuid' })
  reactionTypeId: string;

  @ManyToOne(() => ReactionType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reaction_type_id' })
  reactionType: ReactionType;

  @Column({ name: 'target_post_id', type: 'uuid', nullable: true })
  targetPostId: string | null;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_post_id' })
  targetPost: Post | null;

  @Column({ name: 'target_comment_id', type: 'uuid', nullable: true })
  targetCommentId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

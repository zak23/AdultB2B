import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Post } from './post.entity';
import { MediaAsset } from '../../media/entities/media-asset.entity';

@Entity('post_media')
@Unique(['postId', 'mediaAssetId'])
export class PostMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @ManyToOne(() => Post, (post) => post.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'media_asset_id', type: 'uuid' })
  mediaAssetId: string;

  @ManyToOne(() => MediaAsset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_asset_id' })
  mediaAsset: MediaAsset;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

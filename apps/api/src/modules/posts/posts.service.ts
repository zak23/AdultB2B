import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post, PostStatus, PostVisibility } from './entities/post.entity';
import { PostMedia } from './entities/post-media.entity';
import { User } from '../users/entities/user.entity';
import { MediaService } from '../media/media.service';
import { CreatePostDto, UpdatePostDto, PostResponseDto } from './dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
    private readonly mediaService: MediaService,
  ) {}

  async createPost(user: User, dto: CreatePostDto): Promise<PostResponseDto> {
    const post = this.postRepository.create({
      authorUserId: user.id,
      kind: dto.kind,
      contentFormat: dto.contentFormat,
      content: dto.content || null,
      contentMarkdown: dto.contentMarkdown || null,
      linkUrl: dto.linkUrl || null,
      linkTitle: dto.linkTitle || null,
      linkDescription: dto.linkDescription || null,
      linkImageUrl: dto.linkImageUrl || null,
      visibility: dto.visibility,
      repostOfPostId: dto.repostOfPostId || null,
      groupId: dto.groupId || null,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      status: dto.publishNow !== false ? PostStatus.PUBLISHED : PostStatus.DRAFT,
      publishedAt: dto.publishNow !== false ? new Date() : null,
    });

    await this.postRepository.save(post);

    if (dto.mediaAssetIds && dto.mediaAssetIds.length > 0) {
      const postMedia = dto.mediaAssetIds.map((mediaAssetId, index) =>
        this.postMediaRepository.create({
          postId: post.id,
          mediaAssetId,
          sortOrder: index,
        }),
      );
      await this.postMediaRepository.save(postMedia);
    }

    return this.getPostById(post.id, user);
  }

  async updatePost(
    user: User,
    postId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorUserId !== user.id) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    if (dto.content !== undefined) post.content = dto.content;
    if (dto.contentMarkdown !== undefined) post.contentMarkdown = dto.contentMarkdown;
    if (dto.visibility !== undefined) post.visibility = dto.visibility;

    await this.postRepository.save(post);

    if (dto.mediaAssetIds !== undefined) {
      await this.postMediaRepository.delete({ postId: post.id });
      if (dto.mediaAssetIds.length > 0) {
        const postMedia = dto.mediaAssetIds.map((mediaAssetId, index) =>
          this.postMediaRepository.create({
            postId: post.id,
            mediaAssetId,
            sortOrder: index,
          }),
        );
        await this.postMediaRepository.save(postMedia);
      }
    }

    return this.getPostById(post.id, user);
  }

  async deletePost(user: User, postId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorUserId !== user.id) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postRepository.remove(post);
  }

  async getPostById(postId: string, currentUser?: User): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['authorUser', 'authorCompany', 'media', 'media.mediaAsset', 'repostOfPost', 'repostOfPost.authorUser'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!this.canViewPost(post, currentUser)) {
      throw new ForbiddenException('You do not have permission to view this post');
    }

    return this.mapPostToResponse(post);
  }

  async getPostsByUser(
    userId: string,
    currentUser?: User,
    page = 1,
    limit = 20,
  ): Promise<{ data: PostResponseDto[]; total: number }> {
    const [posts, total] = await this.postRepository.findAndCount({
      where: {
        authorUserId: userId,
        status: PostStatus.PUBLISHED,
      },
      relations: ['authorUser', 'media', 'media.mediaAsset'],
      order: { publishedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const visiblePosts = posts.filter((p) => this.canViewPost(p, currentUser));

    return {
      data: visiblePosts.map((p) => this.mapPostToResponse(p)),
      total,
    };
  }

  async publishPost(user: User, postId: string): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id: postId, authorUserId: user.id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.status = PostStatus.PUBLISHED;
    post.publishedAt = new Date();

    await this.postRepository.save(post);

    return this.getPostById(post.id, user);
  }

  async archivePost(user: User, postId: string): Promise<PostResponseDto> {
    const post = await this.postRepository.findOne({
      where: { id: postId, authorUserId: user.id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.status = PostStatus.ARCHIVED;

    await this.postRepository.save(post);

    return this.getPostById(post.id, user);
  }

  canViewPost(post: Post, currentUser?: User): boolean {
    if (currentUser && post.authorUserId === currentUser.id) {
      return true;
    }

    if (post.status !== PostStatus.PUBLISHED) {
      return false;
    }

    if (post.visibility === PostVisibility.PUBLIC) {
      return true;
    }

    if (post.visibility === PostVisibility.LOGGED_IN) {
      return !!currentUser;
    }

    return false;
  }

  mapPostToResponse(post: Post): PostResponseDto {
    const author = post.authorUser
      ? {
          id: post.authorUser.id,
          displayName: post.authorUser.displayName,
          username: post.authorUser.username || undefined,
          avatarUrl: undefined,
          type: 'user' as const,
        }
      : post.authorCompany
        ? {
            id: post.authorCompany.id,
            displayName: post.authorCompany.name,
            type: 'company' as const,
          }
        : { id: '', displayName: 'Unknown', type: 'user' as const };

    return {
      id: post.id,
      author,
      kind: post.kind,
      status: post.status,
      contentFormat: post.contentFormat,
      content: post.content,
      contentMarkdown: post.contentMarkdown,
      linkUrl: post.linkUrl,
      linkTitle: post.linkTitle,
      linkDescription: post.linkDescription,
      linkImageUrl: post.linkImageUrl,
      visibility: post.visibility,
      repostOfPostId: post.repostOfPostId,
      repostOfPost: post.repostOfPost ? this.mapPostToResponse(post.repostOfPost) : undefined,
      groupId: post.groupId,
      moderationStatus: post.moderationStatus,
      scheduledAt: post.scheduledAt?.toISOString() || null,
      publishedAt: post.publishedAt?.toISOString() || null,
      media: post.media?.sort((a, b) => a.sortOrder - b.sortOrder).map((pm) => ({
        id: pm.mediaAsset.id,
        mediaType: pm.mediaAsset.mediaType,
        url: this.mediaService.getPublicUrl(pm.mediaAsset),
        width: pm.mediaAsset.width || undefined,
        height: pm.mediaAsset.height || undefined,
        sortOrder: pm.sortOrder,
      })) || [],
      reactionCount: post.reactionCount || 0,
      commentCount: post.commentCount || 0,
      repostCount: post.repostCount || 0,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}

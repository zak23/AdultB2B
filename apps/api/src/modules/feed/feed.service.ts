import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus, PostVisibility } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { NetworkingService } from '../networking/networking.service';
import { PostsService } from '../posts/posts.service';
import { PostResponseDto } from '../posts/dto';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly networkingService: NetworkingService,
    private readonly postsService: PostsService,
  ) {}

  async getFeed(
    user: User,
    page = 1,
    limit = 20,
  ): Promise<{ data: PostResponseDto[]; total: number }> {
    const followedUserIds = await this.networkingService.getFollowedUserIds(user.id);
    const followedCompanyIds = await this.networkingService.getFollowedCompanyIds(user.id);

    const authorIds = [...followedUserIds, user.id];

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.authorUser', 'authorUser')
      .leftJoinAndSelect('post.authorCompany', 'authorCompany')
      .leftJoinAndSelect('post.media', 'media')
      .leftJoinAndSelect('media.mediaAsset', 'mediaAsset')
      .leftJoinAndSelect('post.repostOfPost', 'repostOfPost')
      .leftJoinAndSelect('repostOfPost.authorUser', 'repostAuthorUser')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.moderationStatus != :removed', { removed: 'removed' });

    if (authorIds.length > 0 && followedCompanyIds.length > 0) {
      queryBuilder.andWhere(
        '(post.authorUserId IN (:...authorIds) OR post.authorCompanyId IN (:...companyIds))',
        { authorIds, companyIds: followedCompanyIds },
      );
    } else if (authorIds.length > 0) {
      queryBuilder.andWhere('post.authorUserId IN (:...authorIds)', { authorIds });
    } else if (followedCompanyIds.length > 0) {
      queryBuilder.andWhere('post.authorCompanyId IN (:...companyIds)', { companyIds: followedCompanyIds });
    } else {
      queryBuilder.andWhere('post.authorUserId = :userId', { userId: user.id });
    }

    queryBuilder
      .andWhere('(post.visibility = :public OR post.visibility = :loggedIn)', {
        public: PostVisibility.PUBLIC,
        loggedIn: PostVisibility.LOGGED_IN,
      })
      .orderBy('post.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      data: posts.map((p) => this.postsService.mapPostToResponse(p)),
      total,
    };
  }

  async getPublicFeed(
    page = 1,
    limit = 20,
    currentUser?: User,
  ): Promise<{ data: PostResponseDto[]; total: number }> {
    const [posts, total] = await this.postRepository.findAndCount({
      where: {
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
      },
      relations: ['authorUser', 'authorCompany', 'media', 'media.mediaAsset', 'repostOfPost', 'repostOfPost.authorUser'],
      order: { publishedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: posts.map((p) => this.postsService.mapPostToResponse(p)),
      total,
    };
  }

  async getGroupFeed(
    groupId: string,
    user: User,
    page = 1,
    limit = 20,
  ): Promise<{ data: PostResponseDto[]; total: number }> {
    const [posts, total] = await this.postRepository.findAndCount({
      where: {
        groupId,
        status: PostStatus.PUBLISHED,
      },
      relations: ['authorUser', 'authorCompany', 'media', 'media.mediaAsset'],
      order: { publishedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const visiblePosts = posts.filter((p) => this.postsService.canViewPost(p, user));

    return {
      data: visiblePosts.map((p) => this.postsService.mapPostToResponse(p)),
      total,
    };
  }
}

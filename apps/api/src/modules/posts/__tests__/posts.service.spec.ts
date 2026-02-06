import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostsService } from '../posts.service';
import { Post, PostStatus, PostKind, PostVisibility, ContentFormat, ModerationStatus } from '../entities/post.entity';
import { PostMedia } from '../entities/post-media.entity';
import { MediaService } from '../../media/media.service';
import { User, UserStatus } from '../../users/entities/user.entity';

describe('PostsService', () => {
  let service: PostsService;
  let mockPostRepository: any;
  let mockPostMediaRepository: any;
  let mockMediaService: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    displayName: 'Test User',
    status: UserStatus.ACTIVE,
  };

  const mockPost: Partial<Post> = {
    id: 'post-uuid-1',
    authorUserId: 'user-uuid-1',
    authorUser: mockUser as User,
    kind: PostKind.POST,
    status: PostStatus.PUBLISHED,
    contentFormat: ContentFormat.PLAIN,
    content: 'Test post content',
    visibility: PostVisibility.PUBLIC,
    moderationStatus: ModerationStatus.APPROVED,
    media: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
  };

  beforeEach(async () => {
    mockPostRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockPostMediaRepository = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockMediaService = {
      getPublicUrl: jest.fn().mockReturnValue('https://example.com/media/test.jpg'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(PostMedia),
          useValue: mockPostMediaRepository,
        },
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      mockPostRepository.create.mockReturnValue(mockPost);
      mockPostRepository.save.mockResolvedValue(mockPost);
      mockPostRepository.findOne.mockResolvedValue(mockPost);

      const result = await service.createPost(mockUser as User, {
        content: 'Test post content',
        publishNow: true,
      });

      expect(result).toHaveProperty('id');
      expect(result.content).toBe('Test post content');
      expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it('should create a draft post', async () => {
      const draftPost = { ...mockPost, status: PostStatus.DRAFT, publishedAt: null };
      mockPostRepository.create.mockReturnValue(draftPost);
      mockPostRepository.save.mockResolvedValue(draftPost);
      mockPostRepository.findOne.mockResolvedValue(draftPost);

      const result = await service.createPost(mockUser as User, {
        content: 'Draft content',
        publishNow: false,
      });

      expect(result.status).toBe(PostStatus.DRAFT);
    });

    it('should attach media to post', async () => {
      mockPostRepository.create.mockReturnValue(mockPost);
      mockPostRepository.save.mockResolvedValue(mockPost);
      mockPostRepository.findOne.mockResolvedValue(mockPost);
      mockPostMediaRepository.create.mockReturnValue({});
      mockPostMediaRepository.save.mockResolvedValue([{}]);

      await service.createPost(mockUser as User, {
        content: 'Post with media',
        mediaAssetIds: ['media-uuid-1'],
      });

      expect(mockPostMediaRepository.save).toHaveBeenCalled();
    });
  });

  describe('getPostById', () => {
    it('should return a post by ID', async () => {
      mockPostRepository.findOne.mockResolvedValue(mockPost);

      const result = await service.getPostById('post-uuid-1', mockUser as User);

      expect(result.id).toBe('post-uuid-1');
    });

    it('should throw NotFoundException for non-existent post', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPostById('non-existent', mockUser as User),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for private post from another user', async () => {
      const privatePost = {
        ...mockPost,
        authorUserId: 'other-user',
        visibility: PostVisibility.CONNECTIONS,
        status: PostStatus.PUBLISHED,
      };
      mockPostRepository.findOne.mockResolvedValue(privatePost);

      await expect(
        service.getPostById('post-uuid-1', mockUser as User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updatePost', () => {
    it('should update own post successfully', async () => {
      mockPostRepository.findOne.mockResolvedValue(mockPost);
      mockPostRepository.save.mockResolvedValue({ ...mockPost, content: 'Updated content' });

      const result = await service.updatePost(mockUser as User, 'post-uuid-1', {
        content: 'Updated content',
      });

      expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when updating another user post', async () => {
      const otherUserPost = { ...mockPost, authorUserId: 'other-user-id' };
      mockPostRepository.findOne.mockResolvedValue(otherUserPost);

      await expect(
        service.updatePost(mockUser as User, 'post-uuid-1', { content: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletePost', () => {
    it('should delete own post successfully', async () => {
      mockPostRepository.findOne.mockResolvedValue(mockPost);
      mockPostRepository.remove.mockResolvedValue(mockPost);

      await service.deletePost(mockUser as User, 'post-uuid-1');

      expect(mockPostRepository.remove).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when deleting another user post', async () => {
      const otherUserPost = { ...mockPost, authorUserId: 'other-user-id' };
      mockPostRepository.findOne.mockResolvedValue(otherUserPost);

      await expect(
        service.deletePost(mockUser as User, 'post-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('canViewPost', () => {
    it('should allow viewing own post regardless of visibility', () => {
      const privatePost = { ...mockPost, visibility: PostVisibility.CONNECTIONS } as Post;
      expect(service.canViewPost(privatePost, mockUser as User)).toBe(true);
    });

    it('should allow viewing public posts', () => {
      const publicPost = { ...mockPost, visibility: PostVisibility.PUBLIC } as Post;
      expect(service.canViewPost(publicPost, undefined)).toBe(true);
    });

    it('should require auth for logged-in visibility posts', () => {
      const loggedInPost = { ...mockPost, visibility: PostVisibility.LOGGED_IN, authorUserId: 'other' } as Post;
      expect(service.canViewPost(loggedInPost, undefined)).toBe(false);
      expect(service.canViewPost(loggedInPost, mockUser as User)).toBe(true);
    });

    it('should not allow viewing unpublished posts from others', () => {
      const draftPost = { ...mockPost, status: PostStatus.DRAFT, authorUserId: 'other' } as Post;
      expect(service.canViewPost(draftPost, mockUser as User)).toBe(false);
    });
  });
});

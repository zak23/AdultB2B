import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EngagementService } from '../engagement.service';
import { Reaction } from '../entities/reaction.entity';
import { Comment } from '../entities/comment.entity';
import { ReactionType } from '../entities/reaction-type.entity';
import { User, UserStatus } from '../../users/entities/user.entity';

describe('EngagementService', () => {
  let service: EngagementService;
  let mockReactionRepository: any;
  let mockCommentRepository: any;
  let mockReactionTypeRepository: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    displayName: 'Test User',
    status: UserStatus.ACTIVE,
  };

  const mockReactionType: Partial<ReactionType> = {
    id: 'reaction-type-uuid-1',
    key: 'like',
    label: 'Like',
    emoji: '👍',
    isActive: true,
    createdAt: new Date(),
  };

  const mockReaction: Partial<Reaction> = {
    id: 'reaction-uuid-1',
    userId: 'user-uuid-1',
    targetPostId: 'post-uuid-1',
    reactionTypeId: 'reaction-type-uuid-1',
    createdAt: new Date(),
  };

  const mockComment: Partial<Comment> = {
    id: 'comment-uuid-1',
    authorUserId: 'user-uuid-1',
    postId: 'post-uuid-1',
    content: 'Test comment',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockReactionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    mockCommentRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    mockReactionTypeRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngagementService,
        {
          provide: getRepositoryToken(Reaction),
          useValue: mockReactionRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(ReactionType),
          useValue: mockReactionTypeRepository,
        },
      ],
    }).compile();

    service = module.get<EngagementService>(EngagementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReactionTypes', () => {
    it('should return active reaction types', async () => {
      mockReactionTypeRepository.find.mockResolvedValue([mockReactionType]);

      const result = await service.getReactionTypes();

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].key).toBe('like');
      expect(mockReactionTypeRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('addReactionToPost', () => {
    it('should add reaction to post', async () => {
      mockReactionTypeRepository.findOne.mockResolvedValue(mockReactionType);
      mockReactionRepository.findOne.mockResolvedValue(null);
      mockReactionRepository.create.mockReturnValue(mockReaction);
      mockReactionRepository.save.mockResolvedValue(mockReaction);

      const result = await service.addReactionToPost(
        mockUser as User,
        'post-uuid-1',
        'like',
      );

      expect(result.reactionTypeId).toBe('reaction-type-uuid-1');
      expect(mockReactionRepository.save).toHaveBeenCalled();
    });

    it('should update existing reaction', async () => {
      mockReactionTypeRepository.findOne.mockResolvedValue(mockReactionType);
      mockReactionRepository.findOne.mockResolvedValue({ ...mockReaction });
      mockReactionRepository.save.mockResolvedValue(mockReaction);

      const result = await service.addReactionToPost(
        mockUser as User,
        'post-uuid-1',
        'like',
      );

      expect(result.reactionTypeId).toBe('reaction-type-uuid-1');
    });

    it('should throw NotFoundException for invalid reaction type', async () => {
      mockReactionTypeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addReactionToPost(mockUser as User, 'post-uuid-1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeReactionFromPost', () => {
    it('should remove reaction from post', async () => {
      mockReactionRepository.findOne.mockResolvedValue(mockReaction);
      mockReactionRepository.remove.mockResolvedValue(mockReaction);

      await service.removeReactionFromPost(mockUser as User, 'post-uuid-1');

      expect(mockReactionRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if reaction not found', async () => {
      mockReactionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeReactionFromPost(mockUser as User, 'post-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createComment', () => {
    it('should create comment on post', async () => {
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);

      const result = await service.createComment(
        mockUser as User,
        'post-uuid-1',
        'Test comment',
      );

      expect(result.content).toBe('Test comment');
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should create reply to comment', async () => {
      const replyComment = { ...mockComment, parentCommentId: 'parent-comment-uuid' };
      mockCommentRepository.create.mockReturnValue(replyComment);
      mockCommentRepository.save.mockResolvedValue(replyComment);

      const result = await service.createComment(
        mockUser as User,
        'post-uuid-1',
        'Reply',
        'parent-comment-uuid',
      );

      expect(mockCommentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ parentCommentId: 'parent-comment-uuid' }),
      );
    });
  });

  describe('updateComment', () => {
    it('should update own comment', async () => {
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.save.mockResolvedValue({ ...mockComment, content: 'Updated' });

      const result = await service.updateComment(
        mockUser as User,
        'comment-uuid-1',
        'Updated',
      );

      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent comment', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateComment(mockUser as User, 'non-existent', 'Updated'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating another user comment', async () => {
      mockCommentRepository.findOne.mockResolvedValue({
        ...mockComment,
        authorUserId: 'other-user',
      });

      await expect(
        service.updateComment(mockUser as User, 'comment-uuid-1', 'Hacked'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteComment', () => {
    it('should delete own comment', async () => {
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.remove.mockResolvedValue(mockComment);

      await service.deleteComment(mockUser as User, 'comment-uuid-1');

      expect(mockCommentRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent comment', async () => {
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteComment(mockUser as User, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deleting another user comment', async () => {
      mockCommentRepository.findOne.mockResolvedValue({
        ...mockComment,
        authorUserId: 'other-user',
      });

      await expect(
        service.deleteComment(mockUser as User, 'comment-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPostComments', () => {
    it('should return paginated comments for post', async () => {
      mockCommentRepository.findAndCount.mockResolvedValue([
        [{ ...mockComment, authorUser: mockUser }],
        1,
      ]);

      const result = await service.getPostComments('post-uuid-1', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getPostReactionCount', () => {
    it('should return reaction count for post', async () => {
      mockReactionRepository.count.mockResolvedValue(5);

      const result = await service.getPostReactionCount('post-uuid-1');

      expect(result).toBe(5);
    });
  });

  describe('getPostCommentCount', () => {
    it('should return comment count for post', async () => {
      mockCommentRepository.count.mockResolvedValue(3);

      const result = await service.getPostCommentCount('post-uuid-1');

      expect(result).toBe(3);
    });
  });
});

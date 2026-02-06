import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { MessagingService } from '../messaging.service';
import { MessageThread, ThreadType } from '../entities/message-thread.entity';
import { Message } from '../entities/message.entity';
import { ThreadParticipant } from '../entities/thread-participant.entity';
import { User, UserStatus } from '../../users/entities/user.entity';

describe('MessagingService', () => {
  let service: MessagingService;
  let mockThreadRepository: any;
  let mockMessageRepository: any;
  let mockParticipantRepository: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    displayName: 'Test User',
    status: UserStatus.ACTIVE,
  };

  const mockRecipient: Partial<User> = {
    id: 'user-uuid-2',
    email: 'recipient@example.com',
    displayName: 'Recipient User',
    status: UserStatus.ACTIVE,
  };

  const mockThread: Partial<MessageThread> = {
    id: 'thread-uuid-1',
    threadType: ThreadType.DIRECT,
    createdByUserId: 'user-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(),
  };

  const mockMessage: Partial<Message> = {
    id: 'message-uuid-1',
    threadId: 'thread-uuid-1',
    senderUserId: 'user-uuid-1',
    content: 'Hello!',
    createdAt: new Date(),
  };

  const mockParticipant: Partial<ThreadParticipant> = {
    threadId: 'thread-uuid-1',
    userId: 'user-uuid-1',
    joinedAt: new Date(),
  };

  beforeEach(async () => {
    mockThreadRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };

    mockMessageRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockParticipantRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: getRepositoryToken(MessageThread),
          useValue: mockThreadRepository,
        },
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessageRepository,
        },
        {
          provide: getRepositoryToken(ThreadParticipant),
          useValue: mockParticipantRepository,
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDirectThread', () => {
    it('should create a direct message thread', async () => {
      mockThreadRepository.create.mockReturnValue(mockThread);
      mockThreadRepository.save.mockResolvedValue(mockThread);
      mockParticipantRepository.save.mockResolvedValue([mockParticipant]);

      const result = await service.createDirectThread(
        mockUser as User,
        'user-uuid-2',
      );

      expect(result).toHaveProperty('id');
      expect(mockThreadRepository.save).toHaveBeenCalled();
      expect(mockParticipantRepository.save).toHaveBeenCalled();
    });

    it('should return existing thread if already exists', async () => {
      mockThreadRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockThread),
      });

      const result = await service.createDirectThread(
        mockUser as User,
        'user-uuid-2',
      );

      expect(result.id).toBe('thread-uuid-1');
      expect(mockThreadRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findDirectThread', () => {
    it('should find existing direct thread between users', async () => {
      mockThreadRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockThread),
      });

      const result = await service.findDirectThread('user-uuid-1', 'user-uuid-2');

      expect(result?.id).toBe('thread-uuid-1');
    });

    it('should return null if no direct thread exists', async () => {
      mockThreadRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findDirectThread('user-uuid-1', 'user-uuid-2');

      expect(result).toBeNull();
    });
  });

  describe('getUserThreads', () => {
    it('should return user threads', async () => {
      mockParticipantRepository.findAndCount.mockResolvedValue([
        [{ ...mockParticipant, thread: mockThread }],
        1,
      ]);

      const result = await service.getUserThreads(mockUser as User);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return empty array when user has no threads', async () => {
      mockParticipantRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getUserThreads(mockUser as User);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('sendMessage', () => {
    it('should send a message to thread', async () => {
      mockParticipantRepository.findOne.mockResolvedValue(mockParticipant);
      mockMessageRepository.create.mockReturnValue(mockMessage);
      mockMessageRepository.save.mockResolvedValue(mockMessage);
      mockThreadRepository.update.mockResolvedValue({});

      const result = await service.sendMessage(
        mockUser as User,
        'thread-uuid-1',
        'New message',
      );

      expect(result).toHaveProperty('id');
      expect(mockMessageRepository.save).toHaveBeenCalled();
      expect(mockThreadRepository.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not a participant', async () => {
      mockParticipantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.sendMessage(mockUser as User, 'thread-uuid-1', 'Hello'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getThreadMessages', () => {
    it('should return messages for a thread', async () => {
      mockParticipantRepository.findOne.mockResolvedValue(mockParticipant);
      mockMessageRepository.findAndCount.mockResolvedValue([
        [{ ...mockMessage, senderUser: mockUser }],
        1,
      ]);

      const result = await service.getThreadMessages(
        mockUser as User,
        'thread-uuid-1',
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw ForbiddenException if not a participant', async () => {
      mockParticipantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getThreadMessages(mockUser as User, 'thread-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should paginate messages correctly', async () => {
      mockParticipantRepository.findOne.mockResolvedValue(mockParticipant);
      mockMessageRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getThreadMessages(
        mockUser as User,
        'thread-uuid-1',
        2,
        20,
      );

      expect(mockMessageRepository.findAndCount).toHaveBeenCalledWith({
        where: { threadId: 'thread-uuid-1' },
        relations: ['senderUser'],
        order: { createdAt: 'ASC' },
        skip: 20,
        take: 20,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      mockParticipantRepository.update.mockResolvedValue({});

      await service.markAsRead(
        mockUser as User,
        'thread-uuid-1',
        'message-uuid-1',
      );

      expect(mockParticipantRepository.update).toHaveBeenCalledWith(
        { threadId: 'thread-uuid-1', userId: 'user-uuid-1' },
        { lastReadMessageId: 'message-uuid-1' },
      );
    });
  });
});

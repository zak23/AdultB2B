import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { NetworkingService } from '../networking.service';
import { Connection, ConnectionStatus } from '../entities/connection.entity';
import { Follow } from '../entities/follow.entity';
import { User, UserStatus } from '../../users/entities/user.entity';

describe('NetworkingService', () => {
  let service: NetworkingService;
  let mockConnectionRepository: any;
  let mockFollowRepository: any;
  let mockUserRepository: any;

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

  const mockConnection: Partial<Connection> = {
    id: 'connection-uuid-1',
    requesterId: 'user-uuid-1',
    recipientId: 'user-uuid-2',
    status: ConnectionStatus.PENDING,
    createdAt: new Date(),
  };

  const mockFollow: Partial<Follow> = {
    id: 'follow-uuid-1',
    followerId: 'user-uuid-1',
    targetUserId: 'user-uuid-2',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockConnectionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    mockFollowRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    mockUserRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworkingService,
        {
          provide: getRepositoryToken(Connection),
          useValue: mockConnectionRepository,
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: mockFollowRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<NetworkingService>(NetworkingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendConnectionRequest', () => {
    it('should send connection request successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockRecipient);
      mockConnectionRepository.findOne.mockResolvedValue(null);
      mockConnectionRepository.create.mockReturnValue(mockConnection);
      mockConnectionRepository.save.mockResolvedValue(mockConnection);

      const result = await service.sendConnectionRequest(
        mockUser as User,
        'user-uuid-2',
      );

      expect(result.requesterId).toBe('user-uuid-1');
      expect(result.recipientId).toBe('user-uuid-2');
      expect(result.status).toBe(ConnectionStatus.PENDING);
    });

    it('should throw BadRequestException when connecting with self', async () => {
      await expect(
        service.sendConnectionRequest(mockUser as User, 'user-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when recipient does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.sendConnectionRequest(mockUser as User, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when connection already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockRecipient);
      mockConnectionRepository.findOne.mockResolvedValue(mockConnection);

      await expect(
        service.sendConnectionRequest(mockUser as User, 'user-uuid-2'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('respondToConnection', () => {
    it('should accept connection request', async () => {
      const pendingConnection = {
        ...mockConnection,
        requester: mockUser,
        recipient: mockRecipient,
      };
      mockConnectionRepository.findOne.mockResolvedValue(pendingConnection);
      mockConnectionRepository.save.mockResolvedValue({
        ...pendingConnection,
        status: ConnectionStatus.ACCEPTED,
      });

      const result = await service.respondToConnection(
        mockRecipient as User,
        'connection-uuid-1',
        'accepted',
      );

      expect(result.status).toBe(ConnectionStatus.ACCEPTED);
    });

    it('should decline connection request', async () => {
      const pendingConnection = {
        ...mockConnection,
        requester: mockUser,
        recipient: mockRecipient,
      };
      mockConnectionRepository.findOne.mockResolvedValue(pendingConnection);
      mockConnectionRepository.save.mockResolvedValue({
        ...pendingConnection,
        status: ConnectionStatus.DECLINED,
      });

      const result = await service.respondToConnection(
        mockRecipient as User,
        'connection-uuid-1',
        'declined',
      );

      expect(result.status).toBe(ConnectionStatus.DECLINED);
    });

    it('should throw NotFoundException for non-existent request', async () => {
      mockConnectionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.respondToConnection(mockRecipient as User, 'non-existent', 'accepted'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('followUser', () => {
    it('should follow a user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockRecipient);
      mockFollowRepository.findOne.mockResolvedValue(null);
      mockFollowRepository.create.mockReturnValue(mockFollow);
      mockFollowRepository.save.mockResolvedValue(mockFollow);

      const result = await service.followUser(mockUser as User, 'user-uuid-2');

      expect(result.followerId).toBe('user-uuid-1');
      expect(result.targetUserId).toBe('user-uuid-2');
    });

    it('should throw BadRequestException when following self', async () => {
      await expect(
        service.followUser(mockUser as User, 'user-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when already following', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockRecipient);
      mockFollowRepository.findOne.mockResolvedValue(mockFollow);

      await expect(
        service.followUser(mockUser as User, 'user-uuid-2'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow a user successfully', async () => {
      mockFollowRepository.findOne.mockResolvedValue(mockFollow);
      mockFollowRepository.remove.mockResolvedValue(mockFollow);

      await service.unfollowUser(mockUser as User, 'user-uuid-2');

      expect(mockFollowRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not following', async () => {
      mockFollowRepository.findOne.mockResolvedValue(null);

      await expect(
        service.unfollowUser(mockUser as User, 'user-uuid-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return user networking stats', async () => {
      mockFollowRepository.count
        .mockResolvedValueOnce(10) // followers
        .mockResolvedValueOnce(20); // following
      mockConnectionRepository.count.mockResolvedValue(15);

      const result = await service.getStats('user-uuid-1');

      expect(result.followersCount).toBe(10);
      expect(result.followingCount).toBe(20);
      expect(result.connectionsCount).toBe(15);
    });
  });

  describe('isConnected', () => {
    it('should return true for connected users', async () => {
      const acceptedConnection = {
        ...mockConnection,
        status: ConnectionStatus.ACCEPTED,
      };
      mockConnectionRepository.findOne.mockResolvedValue(acceptedConnection);

      const result = await service.isConnected('user-uuid-1', 'user-uuid-2');

      expect(result).toBe(true);
    });

    it('should return false for non-connected users', async () => {
      mockConnectionRepository.findOne.mockResolvedValue(null);

      const result = await service.isConnected('user-uuid-1', 'user-uuid-2');

      expect(result).toBe(false);
    });
  });
});

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection, ConnectionStatus } from './entities/connection.entity';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';
import {
  ConnectionResponseDto,
  FollowResponseDto,
  FollowStatsDto,
} from './dto';

@Injectable()
export class NetworkingService {
  constructor(
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendConnectionRequest(
    user: User,
    recipientId: string,
  ): Promise<ConnectionResponseDto> {
    if (user.id === recipientId) {
      throw new BadRequestException('Cannot connect with yourself');
    }

    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.connectionRepository.findOne({
      where: [
        { requesterId: user.id, recipientId },
        { requesterId: recipientId, recipientId: user.id },
      ],
    });

    if (existing) {
      if (existing.status === ConnectionStatus.BLOCKED) {
        throw new BadRequestException('Cannot send connection request');
      }
      throw new ConflictException('Connection request already exists');
    }

    const connection = this.connectionRepository.create({
      requesterId: user.id,
      recipientId,
      status: ConnectionStatus.PENDING,
    });

    await this.connectionRepository.save(connection);

    return this.mapConnectionToResponse(connection, user, recipient);
  }

  async respondToConnection(
    user: User,
    connectionId: string,
    action: 'accepted' | 'declined',
  ): Promise<ConnectionResponseDto> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId, recipientId: user.id },
      relations: ['requester', 'recipient'],
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException('Connection request already responded to');
    }

    connection.status =
      action === 'accepted'
        ? ConnectionStatus.ACCEPTED
        : ConnectionStatus.DECLINED;
    connection.respondedAt = new Date();

    await this.connectionRepository.save(connection);

    return this.mapConnectionToResponse(
      connection,
      connection.requester,
      connection.recipient,
    );
  }

  async removeConnection(user: User, connectionId: string): Promise<void> {
    const connection = await this.connectionRepository.findOne({
      where: [
        { id: connectionId, requesterId: user.id },
        { id: connectionId, recipientId: user.id },
      ],
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    await this.connectionRepository.remove(connection);
  }

  async getMyConnections(user: User): Promise<ConnectionResponseDto[]> {
    const connections = await this.connectionRepository.find({
      where: [
        { requesterId: user.id, status: ConnectionStatus.ACCEPTED },
        { recipientId: user.id, status: ConnectionStatus.ACCEPTED },
      ],
      relations: ['requester', 'recipient'],
      order: { createdAt: 'DESC' },
    });

    return connections.map((c) =>
      this.mapConnectionToResponse(c, c.requester, c.recipient),
    );
  }

  async getPendingConnectionRequests(user: User): Promise<ConnectionResponseDto[]> {
    const connections = await this.connectionRepository.find({
      where: { recipientId: user.id, status: ConnectionStatus.PENDING },
      relations: ['requester', 'recipient'],
      order: { createdAt: 'DESC' },
    });

    return connections.map((c) =>
      this.mapConnectionToResponse(c, c.requester, c.recipient),
    );
  }

  async getSentConnectionRequests(user: User): Promise<ConnectionResponseDto[]> {
    const connections = await this.connectionRepository.find({
      where: { requesterId: user.id, status: ConnectionStatus.PENDING },
      relations: ['requester', 'recipient'],
      order: { createdAt: 'DESC' },
    });

    return connections.map((c) =>
      this.mapConnectionToResponse(c, c.requester, c.recipient),
    );
  }

  async isConnected(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.connectionRepository.findOne({
      where: [
        {
          requesterId: userId1,
          recipientId: userId2,
          status: ConnectionStatus.ACCEPTED,
        },
        {
          requesterId: userId2,
          recipientId: userId1,
          status: ConnectionStatus.ACCEPTED,
        },
      ],
    });

    return !!connection;
  }

  async followUser(user: User, targetUserId: string): Promise<FollowResponseDto> {
    if (user.id === targetUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.followRepository.findOne({
      where: { followerId: user.id, targetUserId },
    });

    if (existing) {
      throw new ConflictException('Already following this user');
    }

    const follow = this.followRepository.create({
      followerId: user.id,
      targetUserId,
    });

    await this.followRepository.save(follow);

    return {
      id: follow.id,
      followerId: follow.followerId,
      targetUserId: follow.targetUserId,
      targetUserDisplayName: target.displayName,
      targetCompanyId: null,
      createdAt: follow.createdAt.toISOString(),
    };
  }

  async unfollowUser(user: User, targetUserId: string): Promise<void> {
    const follow = await this.followRepository.findOne({
      where: { followerId: user.id, targetUserId },
    });

    if (!follow) {
      throw new NotFoundException('Not following this user');
    }

    await this.followRepository.remove(follow);
  }

  async followCompany(user: User, targetCompanyId: string): Promise<FollowResponseDto> {
    const follow = this.followRepository.create({
      followerId: user.id,
      targetCompanyId,
    });

    await this.followRepository.save(follow);

    return {
      id: follow.id,
      followerId: follow.followerId,
      targetUserId: null,
      targetCompanyId: follow.targetCompanyId,
      createdAt: follow.createdAt.toISOString(),
    };
  }

  async unfollowCompany(user: User, targetCompanyId: string): Promise<void> {
    const follow = await this.followRepository.findOne({
      where: { followerId: user.id, targetCompanyId },
    });

    if (!follow) {
      throw new NotFoundException('Not following this company');
    }

    await this.followRepository.remove(follow);
  }

  async getFollowers(userId: string): Promise<FollowResponseDto[]> {
    const follows = await this.followRepository.find({
      where: { targetUserId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((f) => ({
      id: f.id,
      followerId: f.followerId,
      followerDisplayName: f.follower?.displayName,
      targetUserId: f.targetUserId,
      targetCompanyId: null,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async getFollowing(userId: string): Promise<FollowResponseDto[]> {
    const follows = await this.followRepository.find({
      where: { followerId: userId },
      relations: ['targetUser', 'targetCompany'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((f) => ({
      id: f.id,
      followerId: f.followerId,
      targetUserId: f.targetUserId,
      targetUserDisplayName: f.targetUser?.displayName,
      targetCompanyId: f.targetCompanyId,
      targetCompanyName: f.targetCompany?.name,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async isFollowing(followerId: string, targetUserId: string): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: { followerId, targetUserId },
    });

    return !!follow;
  }

  async getStats(userId: string): Promise<FollowStatsDto> {
    const [followersCount, followingCount, connectionsCount] = await Promise.all([
      this.followRepository.count({ where: { targetUserId: userId } }),
      this.followRepository.count({ where: { followerId: userId } }),
      this.connectionRepository.count({
        where: [
          { requesterId: userId, status: ConnectionStatus.ACCEPTED },
          { recipientId: userId, status: ConnectionStatus.ACCEPTED },
        ],
      }),
    ]);

    return { followersCount, followingCount, connectionsCount };
  }

  async getFollowedUserIds(userId: string): Promise<string[]> {
    const follows = await this.followRepository.find({
      where: { followerId: userId },
      select: ['targetUserId'],
    });

    return follows
      .filter((f) => f.targetUserId)
      .map((f) => f.targetUserId as string);
  }

  async getFollowedCompanyIds(userId: string): Promise<string[]> {
    const follows = await this.followRepository.find({
      where: { followerId: userId },
      select: ['targetCompanyId'],
    });

    return follows
      .filter((f) => f.targetCompanyId)
      .map((f) => f.targetCompanyId as string);
  }

  private mapConnectionToResponse(
    connection: Connection,
    requester: User,
    recipient: User,
  ): ConnectionResponseDto {
    return {
      id: connection.id,
      requesterId: connection.requesterId,
      requesterDisplayName: requester.displayName,
      recipientId: connection.recipientId,
      recipientDisplayName: recipient.displayName,
      status: connection.status,
      createdAt: connection.createdAt.toISOString(),
      respondedAt: connection.respondedAt?.toISOString() || null,
    };
  }
}

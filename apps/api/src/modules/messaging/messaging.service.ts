import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageThread, ThreadType } from './entities/message-thread.entity';
import { Message } from './entities/message.entity';
import { ThreadParticipant } from './entities/thread-participant.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(MessageThread)
    private readonly threadRepository: Repository<MessageThread>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ThreadParticipant)
    private readonly participantRepository: Repository<ThreadParticipant>,
  ) {}

  async createDirectThread(user: User, recipientId: string): Promise<MessageThread> {
    const existing = await this.findDirectThread(user.id, recipientId);
    if (existing) return existing;

    const thread = this.threadRepository.create({
      threadType: ThreadType.DIRECT,
      createdByUserId: user.id,
    });
    await this.threadRepository.save(thread);

    await this.participantRepository.save([
      { threadId: thread.id, userId: user.id },
      { threadId: thread.id, userId: recipientId },
    ]);

    return thread;
  }

  async findDirectThread(userId1: string, userId2: string): Promise<MessageThread | null> {
    const result = await this.threadRepository
      .createQueryBuilder('t')
      .innerJoin('thread_participants', 'p1', 'p1.thread_id = t.id AND p1.user_id = :userId1', { userId1 })
      .innerJoin('thread_participants', 'p2', 'p2.thread_id = t.id AND p2.user_id = :userId2', { userId2 })
      .where('t.thread_type = :type', { type: ThreadType.DIRECT })
      .getOne();
    return result;
  }

  async getUserThreads(user: User, page = 1, limit = 20): Promise<{ data: MessageThread[]; total: number }> {
    const [participations, total] = await this.participantRepository.findAndCount({
      where: { userId: user.id },
      relations: ['thread'],
      order: { thread: { lastMessageAt: 'DESC' } },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: participations.map((p) => p.thread), total };
  }

  async sendMessage(user: User, threadId: string, content: string): Promise<Message> {
    const participant = await this.participantRepository.findOne({
      where: { threadId, userId: user.id },
    });
    if (!participant) throw new ForbiddenException('Not a participant of this thread');

    const message = this.messageRepository.create({
      threadId,
      senderUserId: user.id,
      content,
    });
    await this.messageRepository.save(message);

    await this.threadRepository.update(threadId, { lastMessageAt: new Date() });

    return message;
  }

  async getThreadMessages(user: User, threadId: string, page = 1, limit = 50): Promise<{ data: Message[]; total: number }> {
    const participant = await this.participantRepository.findOne({
      where: { threadId, userId: user.id },
    });
    if (!participant) throw new ForbiddenException('Not a participant of this thread');

    const [data, total] = await this.messageRepository.findAndCount({
      where: { threadId },
      relations: ['senderUser'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async markAsRead(user: User, threadId: string, messageId: string): Promise<void> {
    await this.participantRepository.update(
      { threadId, userId: user.id },
      { lastReadMessageId: messageId },
    );
  }
}

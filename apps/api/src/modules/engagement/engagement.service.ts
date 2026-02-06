import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction } from './entities/reaction.entity';
import { ReactionType } from './entities/reaction-type.entity';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EngagementService {
  constructor(
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
    @InjectRepository(ReactionType)
    private readonly reactionTypeRepository: Repository<ReactionType>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async getReactionTypes(): Promise<ReactionType[]> {
    return this.reactionTypeRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async addReactionToPost(user: User, postId: string, reactionTypeKey: string): Promise<Reaction> {
    const reactionType = await this.reactionTypeRepository.findOne({
      where: { key: reactionTypeKey, isActive: true },
    });
    if (!reactionType) throw new NotFoundException('Reaction type not found');

    const existing = await this.reactionRepository.findOne({
      where: { userId: user.id, targetPostId: postId },
    });

    if (existing) {
      existing.reactionTypeId = reactionType.id;
      return this.reactionRepository.save(existing);
    }

    const reaction = this.reactionRepository.create({
      userId: user.id,
      reactionTypeId: reactionType.id,
      targetPostId: postId,
    });
    return this.reactionRepository.save(reaction);
  }

  async removeReactionFromPost(user: User, postId: string): Promise<void> {
    const reaction = await this.reactionRepository.findOne({
      where: { userId: user.id, targetPostId: postId },
    });
    if (!reaction) throw new NotFoundException('Reaction not found');
    await this.reactionRepository.remove(reaction);
  }

  async getPostReactions(postId: string): Promise<{ type: ReactionType; count: number }[]> {
    const result = await this.reactionRepository
      .createQueryBuilder('r')
      .select('r.reaction_type_id', 'reactionTypeId')
      .addSelect('COUNT(*)', 'count')
      .where('r.target_post_id = :postId', { postId })
      .groupBy('r.reaction_type_id')
      .getRawMany();

    const types = await this.reactionTypeRepository.find();
    const typeMap = new Map(types.map((t) => [t.id, t]));

    return result.map((r) => ({
      type: typeMap.get(r.reactionTypeId)!,
      count: parseInt(r.count, 10),
    }));
  }

  async createComment(user: User, postId: string, content: string, parentCommentId?: string): Promise<Comment> {
    const comment = this.commentRepository.create({
      postId,
      authorUserId: user.id,
      content,
      parentCommentId: parentCommentId || null,
    });
    return this.commentRepository.save(comment);
  }

  async updateComment(user: User, commentId: string, content: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorUserId !== user.id) throw new ForbiddenException('Cannot edit this comment');
    comment.content = content;
    return this.commentRepository.save(comment);
  }

  async deleteComment(user: User, commentId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorUserId !== user.id) throw new ForbiddenException('Cannot delete this comment');
    await this.commentRepository.remove(comment);
  }

  async getPostComments(postId: string, page = 1, limit = 50): Promise<{ data: Comment[]; total: number }> {
    const [data, total] = await this.commentRepository.findAndCount({
      where: { postId },
      relations: ['authorUser'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getPostReactionCount(postId: string): Promise<number> {
    return this.reactionRepository.count({ where: { targetPostId: postId } });
  }

  async getPostCommentCount(postId: string): Promise<number> {
    return this.commentRepository.count({ where: { postId } });
  }
}

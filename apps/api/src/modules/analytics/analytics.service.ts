import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent } from './analytics.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepository: Repository<AnalyticsEvent>,
  ) {}

  async trackEvent(eventType: string, entityType: string, entityId: string, actorUserId?: string, metadata?: Record<string, unknown>): Promise<AnalyticsEvent> {
    const event = this.analyticsRepository.create({
      eventType,
      entityType,
      entityId,
      actorUserId: actorUserId || null,
      metadata: metadata || {},
    });
    return this.analyticsRepository.save(event);
  }

  async getProfileViews(profileId: string, days = 30): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.analyticsRepository.count({
      where: {
        eventType: 'profile_view',
        entityType: 'profile',
        entityId: profileId,
        occurredAt: Between(startDate, new Date()),
      },
    });
  }

  async getPostViews(postId: string, days = 30): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.analyticsRepository.count({
      where: {
        eventType: 'post_view',
        entityType: 'post',
        entityId: postId,
        occurredAt: Between(startDate, new Date()),
      },
    });
  }

  async getProfileAnalytics(user: User, profileId: string, days = 30): Promise<{
    views: number;
    viewsByDay: { date: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const views = await this.getProfileViews(profileId, days);

    const result = await this.analyticsRepository
      .createQueryBuilder('e')
      .select("DATE(e.occurred_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('e.entity_type = :entityType', { entityType: 'profile' })
      .andWhere('e.entity_id = :entityId', { entityId: profileId })
      .andWhere('e.event_type = :eventType', { eventType: 'profile_view' })
      .andWhere('e.occurred_at >= :startDate', { startDate })
      .groupBy("DATE(e.occurred_at)")
      .orderBy("DATE(e.occurred_at)", 'ASC')
      .getRawMany();

    return {
      views,
      viewsByDay: result.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
    };
  }

  async getPostAnalytics(postId: string, days = 30): Promise<{
    views: number;
    viewsByDay: { date: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const views = await this.getPostViews(postId, days);

    const result = await this.analyticsRepository
      .createQueryBuilder('e')
      .select("DATE(e.occurred_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('e.entity_type = :entityType', { entityType: 'post' })
      .andWhere('e.entity_id = :entityId', { entityId: postId })
      .andWhere('e.event_type = :eventType', { eventType: 'post_view' })
      .andWhere('e.occurred_at >= :startDate', { startDate })
      .groupBy("DATE(e.occurred_at)")
      .orderBy("DATE(e.occurred_at)", 'ASC')
      .getRawMany();

    return {
      views,
      viewsByDay: result.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
    };
  }
}

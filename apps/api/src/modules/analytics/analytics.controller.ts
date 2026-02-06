import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track an analytics event' })
  async trackEvent(
    @CurrentUser() user: User,
    @Body('eventType') eventType: string,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
    @Body('metadata') metadata?: Record<string, unknown>,
  ) {
    return this.analyticsService.trackEvent(eventType, entityType, entityId, user.id, metadata);
  }

  @Get('profile/:profileId')
  @ApiOperation({ summary: 'Get profile analytics' })
  async getProfileAnalytics(
    @CurrentUser() user: User,
    @Param('profileId') profileId: string,
    @Query('days') days = 30,
  ) {
    return this.analyticsService.getProfileAnalytics(user, profileId, days);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get post analytics' })
  async getPostAnalytics(@Param('postId') postId: string, @Query('days') days = 30) {
    return this.analyticsService.getPostAnalytics(postId, days);
  }
}

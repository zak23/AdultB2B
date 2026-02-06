import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Messaging')
@Controller('messaging')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('threads/direct')
  @ApiOperation({ summary: 'Create or get direct message thread' })
  async createDirectThread(@CurrentUser() user: User, @Body('recipientId') recipientId: string) {
    return this.messagingService.createDirectThread(user, recipientId);
  }

  @Get('threads')
  @ApiOperation({ summary: 'Get user message threads' })
  async getThreads(@CurrentUser() user: User, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.messagingService.getUserThreads(user, page, limit);
  }

  @Post('threads/:threadId/messages')
  @ApiOperation({ summary: 'Send message' })
  async sendMessage(@CurrentUser() user: User, @Param('threadId') threadId: string, @Body('content') content: string) {
    return this.messagingService.sendMessage(user, threadId, content);
  }

  @Get('threads/:threadId/messages')
  @ApiOperation({ summary: 'Get thread messages' })
  async getMessages(@CurrentUser() user: User, @Param('threadId') threadId: string, @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.messagingService.getThreadMessages(user, threadId, page, limit);
  }

  @Post('threads/:threadId/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  async markAsRead(@CurrentUser() user: User, @Param('threadId') threadId: string, @Body('messageId') messageId: string) {
    await this.messagingService.markAsRead(user, threadId, messageId);
    return { message: 'Marked as read' };
  }
}

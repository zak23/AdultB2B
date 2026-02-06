import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Engagement')
@Controller('engagement')
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get('reaction-types')
  @Public()
  @ApiOperation({ summary: 'Get available reaction types' })
  async getReactionTypes() {
    return this.engagementService.getReactionTypes();
  }

  @Post('posts/:postId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Add reaction to post' })
  async addReaction(@CurrentUser() user: User, @Param('postId') postId: string, @Body('reactionType') reactionType: string) {
    return this.engagementService.addReactionToPost(user, postId, reactionType);
  }

  @Delete('posts/:postId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Remove reaction from post' })
  async removeReaction(@CurrentUser() user: User, @Param('postId') postId: string) {
    await this.engagementService.removeReactionFromPost(user, postId);
    return { message: 'Reaction removed' };
  }

  @Get('posts/:postId/reactions')
  @Public()
  @ApiOperation({ summary: 'Get post reactions summary' })
  async getPostReactions(@Param('postId') postId: string) {
    return this.engagementService.getPostReactions(postId);
  }

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Add comment to post' })
  async addComment(@CurrentUser() user: User, @Param('postId') postId: string, @Body('content') content: string, @Body('parentCommentId') parentCommentId?: string) {
    return this.engagementService.createComment(user, postId, content, parentCommentId);
  }

  @Put('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update comment' })
  async updateComment(@CurrentUser() user: User, @Param('commentId') commentId: string, @Body('content') content: string) {
    return this.engagementService.updateComment(user, commentId, content);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete comment' })
  async deleteComment(@CurrentUser() user: User, @Param('commentId') commentId: string) {
    await this.engagementService.deleteComment(user, commentId);
    return { message: 'Comment deleted' };
  }

  @Get('posts/:postId/comments')
  @Public()
  @ApiOperation({ summary: 'Get post comments' })
  async getPostComments(@Param('postId') postId: string, @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.engagementService.getPostComments(postId, page, limit);
  }
}

import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check AI service status' })
  getStatus() {
    return { enabled: this.aiService.isEnabled() };
  }

  @Post('assist/profile-bio')
  @ApiOperation({ summary: 'Generate profile bio suggestions' })
  async generateProfileBio(@Body() input: {
    headline?: string;
    skills?: string[];
    services?: string[];
    niches?: string[];
    tone?: string;
  }) {
    return this.aiService.generateProfileBio(input);
  }

  @Post('assist/post-caption')
  @ApiOperation({ summary: 'Generate post caption suggestions' })
  async generatePostCaption(@Body() input: {
    postText?: string;
    audience?: string;
    tone?: string;
  }) {
    return this.aiService.generatePostCaption(input);
  }

  @Post('assist/keywords')
  @ApiOperation({ summary: 'Suggest hashtags and keywords' })
  async suggestKeywords(@Body('text') text: string) {
    return this.aiService.suggestKeywords(text);
  }

  @Post('moderation/check')
  @ApiOperation({ summary: 'Check content for moderation' })
  async checkContent(@Body() input: {
    text?: string;
    mediaUrls?: { url: string; type: string }[];
  }) {
    return this.aiService.checkContent(input);
  }
}

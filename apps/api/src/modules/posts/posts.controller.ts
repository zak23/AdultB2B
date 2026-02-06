import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { CreatePostDto, UpdatePostDto, PostResponseDto, PaginatedPostsDto } from './dto';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, type: PostResponseDto })
  async createPost(
    @CurrentUser() user: User,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.createPost(user, dto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: 200, type: PostResponseDto })
  async getPost(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<PostResponseDto> {
    return this.postsService.getPostById(id, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, type: PostResponseDto })
  async updatePost(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.updatePost(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200 })
  async deletePost(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.postsService.deletePost(user, id);
    return { message: 'Post deleted' };
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Publish a draft post' })
  @ApiResponse({ status: 200, type: PostResponseDto })
  async publishPost(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<PostResponseDto> {
    return this.postsService.publishPost(user, id);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Archive a post' })
  @ApiResponse({ status: 200, type: PostResponseDto })
  async archivePost(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<PostResponseDto> {
    return this.postsService.archivePost(user, id);
  }

  @Get('user/:userId')
  @Public()
  @ApiOperation({ summary: 'Get posts by user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedPostsDto })
  async getPostsByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.postsService.getPostsByUser(userId, user, page, limit);
    return {
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
}

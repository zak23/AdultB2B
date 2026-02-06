import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { NetworkingService } from './networking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  SendConnectionRequestDto,
  RespondConnectionDto,
  ConnectionResponseDto,
  FollowUserDto,
  FollowCompanyDto,
  FollowResponseDto,
  FollowStatsDto,
} from './dto';

@ApiTags('Networking')
@Controller('networking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class NetworkingController {
  constructor(private readonly networkingService: NetworkingService) {}

  // Connection endpoints
  @Post('connections/request')
  @ApiOperation({ summary: 'Send connection request' })
  @ApiResponse({ status: 201, type: ConnectionResponseDto })
  async sendConnectionRequest(
    @CurrentUser() user: User,
    @Body() dto: SendConnectionRequestDto,
  ): Promise<ConnectionResponseDto> {
    return this.networkingService.sendConnectionRequest(user, dto.recipientId);
  }

  @Post('connections/:id/respond')
  @ApiOperation({ summary: 'Accept or decline connection request' })
  @ApiResponse({ status: 200, type: ConnectionResponseDto })
  async respondToConnection(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: RespondConnectionDto,
  ): Promise<ConnectionResponseDto> {
    return this.networkingService.respondToConnection(user, id, dto.action);
  }

  @Delete('connections/:id')
  @ApiOperation({ summary: 'Remove connection' })
  @ApiResponse({ status: 200 })
  async removeConnection(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.networkingService.removeConnection(user, id);
    return { message: 'Connection removed' };
  }

  @Get('connections')
  @ApiOperation({ summary: 'Get my connections' })
  @ApiResponse({ status: 200, type: [ConnectionResponseDto] })
  async getMyConnections(
    @CurrentUser() user: User,
  ): Promise<ConnectionResponseDto[]> {
    return this.networkingService.getMyConnections(user);
  }

  @Get('connections/pending')
  @ApiOperation({ summary: 'Get pending connection requests received' })
  @ApiResponse({ status: 200, type: [ConnectionResponseDto] })
  async getPendingRequests(
    @CurrentUser() user: User,
  ): Promise<ConnectionResponseDto[]> {
    return this.networkingService.getPendingConnectionRequests(user);
  }

  @Get('connections/sent')
  @ApiOperation({ summary: 'Get sent connection requests' })
  @ApiResponse({ status: 200, type: [ConnectionResponseDto] })
  async getSentRequests(
    @CurrentUser() user: User,
  ): Promise<ConnectionResponseDto[]> {
    return this.networkingService.getSentConnectionRequests(user);
  }

  // Follow endpoints
  @Post('follow/user')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, type: FollowResponseDto })
  async followUser(
    @CurrentUser() user: User,
    @Body() dto: FollowUserDto,
  ): Promise<FollowResponseDto> {
    return this.networkingService.followUser(user, dto.userId);
  }

  @Delete('follow/user/:userId')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200 })
  async unfollowUser(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.networkingService.unfollowUser(user, userId);
    return { message: 'Unfollowed user' };
  }

  @Post('follow/company')
  @ApiOperation({ summary: 'Follow a company' })
  @ApiResponse({ status: 201, type: FollowResponseDto })
  async followCompany(
    @CurrentUser() user: User,
    @Body() dto: FollowCompanyDto,
  ): Promise<FollowResponseDto> {
    return this.networkingService.followCompany(user, dto.companyId);
  }

  @Delete('follow/company/:companyId')
  @ApiOperation({ summary: 'Unfollow a company' })
  @ApiResponse({ status: 200 })
  async unfollowCompany(
    @CurrentUser() user: User,
    @Param('companyId') companyId: string,
  ): Promise<{ message: string }> {
    await this.networkingService.unfollowCompany(user, companyId);
    return { message: 'Unfollowed company' };
  }

  @Get('followers')
  @ApiOperation({ summary: 'Get my followers' })
  @ApiResponse({ status: 200, type: [FollowResponseDto] })
  async getMyFollowers(@CurrentUser() user: User): Promise<FollowResponseDto[]> {
    return this.networkingService.getFollowers(user.id);
  }

  @Get('following')
  @ApiOperation({ summary: 'Get users and companies I follow' })
  @ApiResponse({ status: 200, type: [FollowResponseDto] })
  async getMyFollowing(@CurrentUser() user: User): Promise<FollowResponseDto[]> {
    return this.networkingService.getFollowing(user.id);
  }

  @Get('followers/:userId')
  @ApiOperation({ summary: 'Get followers of a user' })
  @ApiResponse({ status: 200, type: [FollowResponseDto] })
  async getUserFollowers(
    @Param('userId') userId: string,
  ): Promise<FollowResponseDto[]> {
    return this.networkingService.getFollowers(userId);
  }

  @Get('following/:userId')
  @ApiOperation({ summary: 'Get users and companies a user follows' })
  @ApiResponse({ status: 200, type: [FollowResponseDto] })
  async getUserFollowing(
    @Param('userId') userId: string,
  ): Promise<FollowResponseDto[]> {
    return this.networkingService.getFollowing(userId);
  }

  // Stats
  @Get('stats')
  @ApiOperation({ summary: 'Get my networking stats' })
  @ApiResponse({ status: 200, type: FollowStatsDto })
  async getMyStats(@CurrentUser() user: User): Promise<FollowStatsDto> {
    return this.networkingService.getStats(user.id);
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get networking stats for a user' })
  @ApiResponse({ status: 200, type: FollowStatsDto })
  async getUserStats(@Param('userId') userId: string): Promise<FollowStatsDto> {
    return this.networkingService.getStats(userId);
  }
}

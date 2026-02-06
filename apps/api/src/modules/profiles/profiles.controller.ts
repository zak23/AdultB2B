import {
  Controller,
  Get,
  Put,
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
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import {
  UpdateProfileDto,
  CreateExperienceDto,
  UpdateExperienceDto,
  ProfileResponseDto,
} from './dto';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async getMyProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    return this.profilesService.getMyProfile(user);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateMyProfile(user, dto);
  }

  @Put('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update profile avatar' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async updateAvatar(
    @CurrentUser() user: User,
    @Body('mediaAssetId') mediaAssetId: string,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateAvatar(user, mediaAssetId);
  }

  @Put('me/banner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update profile banner' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async updateBanner(
    @CurrentUser() user: User,
    @Body('mediaAssetId') mediaAssetId: string,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateBanner(user, mediaAssetId);
  }

  // Experience endpoints
  @Post('me/experiences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Add experience' })
  @ApiResponse({ status: 201, type: ProfileResponseDto })
  async addExperience(
    @CurrentUser() user: User,
    @Body() dto: CreateExperienceDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.addExperience(user, dto);
  }

  @Put('me/experiences/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update experience' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async updateExperience(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateExperience(user, id, dto);
  }

  @Delete('me/experiences/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete experience' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async deleteExperience(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.deleteExperience(user, id);
  }

  // Public profile endpoints
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get profile by ID' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async getProfileById(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.getProfileById(id, user);
  }

  @Get('user/:userId')
  @Public()
  @ApiOperation({ summary: 'Get profile by user ID' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async getProfileByUserId(
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.getProfileByUserId(userId, user);
  }

  // Lookup endpoints
  @Get('lookup/skills')
  @Public()
  @ApiOperation({ summary: 'Get all available skills' })
  async getAllSkills() {
    return this.profilesService.getAllSkills();
  }

  @Get('lookup/services')
  @Public()
  @ApiOperation({ summary: 'Get all available services' })
  async getAllServices() {
    return this.profilesService.getAllServices();
  }

  @Get('lookup/niches')
  @Public()
  @ApiOperation({ summary: 'Get all available industry niches' })
  async getAllNiches() {
    return this.profilesService.getAllNiches();
  }
}

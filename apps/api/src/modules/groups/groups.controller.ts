import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { GroupVisibility } from './entities/group.entity';

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a group' })
  async createGroup(@CurrentUser() user: User, @Body('name') name: string, @Body('description') description?: string, @Body('visibility') visibility?: GroupVisibility) {
    return this.groupsService.createGroup(user, name, description, visibility);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List public groups' })
  async listGroups(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.groupsService.listPublicGroups(page, limit);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get my groups' })
  async getMyGroups(@CurrentUser() user: User) {
    return this.groupsService.getUserGroups(user);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get group details' })
  async getGroup(@Param('id') id: string) {
    return this.groupsService.getGroup(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Join a group' })
  async joinGroup(@CurrentUser() user: User, @Param('id') id: string) {
    return this.groupsService.joinGroup(user, id);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Leave a group' })
  async leaveGroup(@CurrentUser() user: User, @Param('id') id: string) {
    await this.groupsService.leaveGroup(user, id);
    return { message: 'Left group' };
  }

  @Get(':id/members')
  @Public()
  @ApiOperation({ summary: 'Get group members' })
  async getMembers(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.groupsService.getGroupMembers(id, page, limit);
  }
}

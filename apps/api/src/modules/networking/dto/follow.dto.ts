import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FollowUserDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  userId: string;
}

export class FollowCompanyDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  companyId: string;
}

export class FollowResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  followerId: string;

  @ApiPropertyOptional()
  targetUserId: string | null;

  @ApiPropertyOptional()
  targetUserDisplayName?: string;

  @ApiPropertyOptional()
  targetCompanyId: string | null;

  @ApiPropertyOptional()
  targetCompanyName?: string;

  @ApiProperty()
  createdAt: string;
}

export class FollowStatsDto {
  @ApiProperty()
  followersCount: number;

  @ApiProperty()
  followingCount: number;

  @ApiProperty()
  connectionsCount: number;
}

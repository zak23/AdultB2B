import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  username?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  type: 'user' | 'company';
}

export class PostMediaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mediaType: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  width?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiProperty()
  sortOrder: number;
}

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  author: PostAuthorDto;

  @ApiProperty()
  kind: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  contentFormat: string;

  @ApiPropertyOptional()
  content: string | null;

  @ApiPropertyOptional()
  contentMarkdown: string | null;

  @ApiPropertyOptional()
  linkUrl: string | null;

  @ApiPropertyOptional()
  linkTitle: string | null;

  @ApiPropertyOptional()
  linkDescription: string | null;

  @ApiPropertyOptional()
  linkImageUrl: string | null;

  @ApiProperty()
  visibility: string;

  @ApiPropertyOptional()
  repostOfPostId: string | null;

  @ApiPropertyOptional()
  repostOfPost?: PostResponseDto;

  @ApiPropertyOptional()
  groupId: string | null;

  @ApiProperty()
  moderationStatus: string;

  @ApiPropertyOptional()
  scheduledAt: string | null;

  @ApiPropertyOptional()
  publishedAt: string | null;

  @ApiProperty({ type: [PostMediaDto] })
  media: PostMediaDto[];

  @ApiProperty()
  reactionCount: number;

  @ApiProperty()
  commentCount: number;

  @ApiProperty()
  repostCount: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class PaginatedPostsDto {
  @ApiProperty({ type: [PostResponseDto] })
  data: PostResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

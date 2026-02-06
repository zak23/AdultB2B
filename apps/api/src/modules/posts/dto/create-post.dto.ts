import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsUrl,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PostKind,
  ContentFormat,
  PostVisibility,
} from '../entities/post.entity';

export class CreatePostDto {
  @ApiPropertyOptional({ example: 'This is my post content...' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @ApiPropertyOptional({ enum: PostKind, default: PostKind.POST })
  @IsOptional()
  @IsEnum(PostKind)
  kind?: PostKind;

  @ApiPropertyOptional({ enum: ContentFormat, default: ContentFormat.PLAIN })
  @IsOptional()
  @IsEnum(ContentFormat)
  contentFormat?: ContentFormat;

  @ApiPropertyOptional({ example: 'Markdown content...' })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  contentMarkdown?: string;

  @ApiPropertyOptional({ example: 'https://example.com/article' })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @ApiPropertyOptional({ example: 'Article Title' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkTitle?: string;

  @ApiPropertyOptional({ example: 'Article description...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  linkDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsUrl()
  linkImageUrl?: string;

  @ApiPropertyOptional({ enum: PostVisibility, default: PostVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiPropertyOptional({ type: [String], description: 'Media asset IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mediaAssetIds?: string[];

  @ApiPropertyOptional({ example: 'uuid', description: 'Post to repost' })
  @IsOptional()
  @IsUUID()
  repostOfPostId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Group to post in' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ description: 'Schedule post for future' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Publish immediately', default: true })
  @IsOptional()
  publishNow?: boolean;
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  contentMarkdown?: string;

  @ApiPropertyOptional({ enum: PostVisibility })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mediaAssetIds?: string[];
}

import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '../entities/media-asset.entity';

export class GetUploadUrlDto {
  @ApiProperty({ example: 'profile-avatar.jpg' })
  @IsString()
  filename: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType: string;

  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  mediaType: MediaType;

  @ApiPropertyOptional({ example: 1024000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB max
  byteSize?: number;
}

export class UploadUrlResponseDto {
  @ApiProperty()
  uploadUrl: string;

  @ApiProperty()
  mediaAssetId: string;

  @ApiProperty()
  publicUrl: string;
}

export class ConfirmUploadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  byteSize?: number;
}

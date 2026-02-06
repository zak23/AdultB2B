import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Minio from 'minio';
import { v4 as uuid } from 'uuid';
import { MediaAsset, MediaType } from './entities/media-asset.entity';
import { User } from '../users/entities/user.entity';
import { GetUploadUrlDto, UploadUrlResponseDto, ConfirmUploadDto } from './dto';

@Injectable()
export class MediaService {
  private readonly minioClient: Minio.Client;
  private readonly bucket: string;
  private readonly publicEndpoint: string;

  constructor(
    @InjectRepository(MediaAsset)
    private readonly mediaRepository: Repository<MediaAsset>,
    private readonly configService: ConfigService,
  ) {
    const endpoint = new URL(this.configService.get('S3_ENDPOINT', 'http://localhost:9010'));
    
    this.minioClient = new Minio.Client({
      endPoint: endpoint.hostname,
      port: parseInt(endpoint.port) || 9010,
      useSSL: endpoint.protocol === 'https:',
      accessKey: this.configService.get('S3_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('S3_SECRET_KEY', 'minioadmin'),
    });

    this.bucket = this.configService.get('S3_BUCKET', 'adultb2b-media');
    this.publicEndpoint = this.configService.get('S3_ENDPOINT', 'http://localhost:9010');
  }

  async getUploadUrl(
    user: User,
    dto: GetUploadUrlDto,
  ): Promise<UploadUrlResponseDto> {
    // Generate unique storage key
    const ext = dto.filename.split('.').pop() || '';
    const storageKey = `${user.id}/${uuid()}.${ext}`;

    // Create media asset record
    const mediaAsset = this.mediaRepository.create({
      ownerUserId: user.id,
      mediaType: dto.mediaType,
      bucket: this.bucket,
      storageKey,
      contentType: dto.contentType,
      byteSize: dto.byteSize || null,
    });

    await this.mediaRepository.save(mediaAsset);

    // Generate presigned PUT URL (valid for 1 hour)
    const uploadUrl = await this.minioClient.presignedPutObject(
      this.bucket,
      storageKey,
      60 * 60, // 1 hour expiry
    );

    return {
      uploadUrl,
      mediaAssetId: mediaAsset.id,
      publicUrl: this.getPublicUrl(mediaAsset),
    };
  }

  async confirmUpload(
    user: User,
    mediaAssetId: string,
    dto: ConfirmUploadDto,
  ): Promise<MediaAsset> {
    const mediaAsset = await this.mediaRepository.findOne({
      where: { id: mediaAssetId, ownerUserId: user.id },
    });

    if (!mediaAsset) {
      throw new NotFoundException('Media asset not found');
    }

    // Update metadata from client
    if (dto.width !== undefined) mediaAsset.width = dto.width;
    if (dto.height !== undefined) mediaAsset.height = dto.height;
    if (dto.durationSeconds !== undefined) mediaAsset.durationSeconds = dto.durationSeconds;
    if (dto.byteSize !== undefined) mediaAsset.byteSize = dto.byteSize;

    await this.mediaRepository.save(mediaAsset);

    return mediaAsset;
  }

  async getMediaAsset(id: string): Promise<MediaAsset> {
    const asset = await this.mediaRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }
    return asset;
  }

  async getDownloadUrl(mediaAssetId: string): Promise<string> {
    const asset = await this.getMediaAsset(mediaAssetId);
    
    // Generate presigned GET URL (valid for 1 hour)
    return this.minioClient.presignedGetObject(
      asset.bucket,
      asset.storageKey,
      60 * 60,
    );
  }

  getPublicUrl(asset: MediaAsset): string {
    // Return direct URL (requires public bucket policy for public assets)
    return `${this.publicEndpoint}/${asset.bucket}/${asset.storageKey}`;
  }

  async deleteMediaAsset(user: User, mediaAssetId: string): Promise<void> {
    const asset = await this.mediaRepository.findOne({
      where: { id: mediaAssetId, ownerUserId: user.id },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    // Delete from S3
    try {
      await this.minioClient.removeObject(asset.bucket, asset.storageKey);
    } catch (error) {
      // Log but don't fail if S3 deletion fails
      console.error('Failed to delete from S3:', error);
    }

    // Delete from database
    await this.mediaRepository.remove(asset);
  }

  // Validate content type
  validateContentType(contentType: string, mediaType: MediaType): boolean {
    const allowedTypes: Record<MediaType, string[]> = {
      [MediaType.IMAGE]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      [MediaType.VIDEO]: ['video/mp4', 'video/webm', 'video/quicktime'],
      [MediaType.FILE]: ['application/pdf', 'application/msword'],
    };

    return allowedTypes[mediaType]?.includes(contentType) || false;
  }
}

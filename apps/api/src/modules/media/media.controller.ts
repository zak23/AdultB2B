import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  GetUploadUrlDto,
  UploadUrlResponseDto,
  ConfirmUploadDto,
} from './dto';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiCookieAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get presigned URL for file upload' })
  @ApiResponse({ status: 201, type: UploadUrlResponseDto })
  async getUploadUrl(
    @CurrentUser() user: User,
    @Body() dto: GetUploadUrlDto,
  ): Promise<UploadUrlResponseDto> {
    // Validate content type
    if (!this.mediaService.validateContentType(dto.contentType, dto.mediaType)) {
      throw new BadRequestException(
        `Invalid content type ${dto.contentType} for media type ${dto.mediaType}`,
      );
    }

    return this.mediaService.getUploadUrl(user, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm upload and update metadata' })
  @ApiResponse({ status: 200, description: 'Upload confirmed' })
  async confirmUpload(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    const asset = await this.mediaService.confirmUpload(user, id, dto);
    return {
      id: asset.id,
      publicUrl: this.mediaService.getPublicUrl(asset),
    };
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get presigned download URL' })
  @ApiResponse({ status: 200, description: 'Download URL' })
  async getDownloadUrl(@Param('id') id: string) {
    const url = await this.mediaService.getDownloadUrl(id);
    return { downloadUrl: url };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media asset' })
  @ApiResponse({ status: 200, description: 'Media asset deleted' })
  async deleteMedia(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.mediaService.deleteMediaAsset(user, id);
    return { message: 'Media asset deleted' };
  }
}

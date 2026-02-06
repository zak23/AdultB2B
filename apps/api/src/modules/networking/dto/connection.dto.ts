import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConnectionStatus } from '../entities/connection.entity';

export class SendConnectionRequestDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  recipientId: string;
}

export class RespondConnectionDto {
  @ApiProperty({ enum: ['accepted', 'declined'] })
  @IsEnum(['accepted', 'declined'])
  action: 'accepted' | 'declined';
}

export class ConnectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requesterId: string;

  @ApiProperty()
  requesterDisplayName: string;

  @ApiProperty()
  recipientId: string;

  @ApiProperty()
  recipientDisplayName: string;

  @ApiProperty({ enum: ConnectionStatus })
  status: ConnectionStatus;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ nullable: true })
  respondedAt: string | null;
}

import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty({ nullable: true })
  @Expose()
  username: string | null;

  @ApiProperty()
  @Expose()
  displayName: string;

  @ApiProperty()
  @Expose()
  status: string;

  @ApiProperty({ type: [String] })
  @Expose()
  roles: string[];

  @ApiProperty({ type: [String] })
  @Expose()
  permissions: string[];

  @ApiProperty()
  @Expose()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @ApiProperty()
  accessToken: string;
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;
}

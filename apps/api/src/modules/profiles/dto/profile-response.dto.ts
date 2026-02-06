import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SkillDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ServiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class NicheDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ExperienceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  companyName: string | null;

  @ApiPropertyOptional()
  startDate: string | null;

  @ApiPropertyOptional()
  endDate: string | null;

  @ApiProperty()
  isCurrent: boolean;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  orderIndex: number;
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  userId: string | null;

  @ApiPropertyOptional()
  companyId: string | null;

  @ApiPropertyOptional()
  headline: string | null;

  @ApiPropertyOptional()
  about: string | null;

  @ApiPropertyOptional()
  location: string | null;

  @ApiPropertyOptional()
  websiteUrl: string | null;

  @ApiProperty()
  visibility: string;

  @ApiPropertyOptional()
  avatarUrl: string | null;

  @ApiPropertyOptional()
  bannerUrl: string | null;

  @ApiProperty({ type: [SkillDto] })
  skills: SkillDto[];

  @ApiProperty({ type: [ServiceDto] })
  services: ServiceDto[];

  @ApiProperty({ type: [NicheDto] })
  niches: NicheDto[];

  @ApiProperty({ type: [ExperienceDto] })
  experiences: ExperienceDto[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  // User info if personal profile
  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  username?: string;

  // Company info if company profile
  @ApiPropertyOptional()
  companyName?: string;

  @ApiPropertyOptional()
  companySlug?: string;
}

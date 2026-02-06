/**
 * Profile types mirroring API DTOs (profiles + media).
 */

export type ProfileVisibility = 'public' | 'logged_in' | 'connections';

export interface SkillDto {
  id: string;
  name: string;
}

export interface ServiceDto {
  id: string;
  name: string;
}

export interface NicheDto {
  id: string;
  name: string;
}

export interface ExperienceDto {
  id: string;
  title: string;
  companyName: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  orderIndex: number;
}

export interface ProfileResponse {
  id: string;
  userId: string | null;
  companyId: string | null;
  headline: string | null;
  about: string | null;
  location: string | null;
  websiteUrl: string | null;
  visibility: ProfileVisibility;
  avatarUrl: string | null;
  bannerUrl: string | null;
  skills: SkillDto[];
  services: ServiceDto[];
  niches: NicheDto[];
  experiences: ExperienceDto[];
  createdAt: string;
  updatedAt: string;
  displayName?: string;
  username?: string;
  companyName?: string;
  companySlug?: string;
}

export interface UpdateProfileDto {
  headline?: string;
  about?: string;
  location?: string;
  websiteUrl?: string;
  visibility?: ProfileVisibility;
  skillIds?: string[];
  serviceIds?: string[];
  nicheIds?: string[];
}

export interface CreateExperienceDto {
  title: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  orderIndex?: number;
}

export type UpdateExperienceDto = CreateExperienceDto;

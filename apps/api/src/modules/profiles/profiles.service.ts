import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Profile, ProfileVisibility } from './entities/profile.entity';
import { ProfileExperience } from './entities/profile-experience.entity';
import { Skill } from './entities/skill.entity';
import { Service } from './entities/service.entity';
import { IndustryNiche } from './entities/industry-niche.entity';
import { User } from '../users/entities/user.entity';
import { MediaService } from '../media/media.service';
import {
  UpdateProfileDto,
  CreateExperienceDto,
  UpdateExperienceDto,
  ProfileResponseDto,
} from './dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfileExperience)
    private readonly experienceRepository: Repository<ProfileExperience>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(IndustryNiche)
    private readonly nicheRepository: Repository<IndustryNiche>,
    private readonly mediaService: MediaService,
  ) {}

  async getMyProfile(user: User): Promise<ProfileResponseDto> {
    let profile = await this.profileRepository.findOne({
      where: { userId: user.id },
      relations: [
        'user',
        'skills',
        'services',
        'niches',
        'experiences',
        'avatarMedia',
        'bannerMedia',
      ],
    });

    // Create profile if it doesn't exist
    if (!profile) {
      profile = this.profileRepository.create({
        userId: user.id,
        visibility: ProfileVisibility.PUBLIC,
      });
      await this.profileRepository.save(profile);
      profile = await this.profileRepository.findOne({
        where: { id: profile.id },
        relations: [
          'user',
          'skills',
          'services',
          'niches',
          'experiences',
          'avatarMedia',
          'bannerMedia',
        ],
      });
    }

    return this.mapProfileToResponse(profile!, user);
  }

  async getProfileById(
    id: string,
    currentUser?: User,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: [
        'user',
        'company',
        'skills',
        'services',
        'niches',
        'experiences',
        'avatarMedia',
        'bannerMedia',
      ],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Check visibility
    if (!this.canViewProfile(profile, currentUser)) {
      throw new ForbiddenException('You do not have permission to view this profile');
    }

    return this.mapProfileToResponse(profile, currentUser);
  }

  async getProfileByUserId(
    userId: string,
    currentUser?: User,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: [
        'user',
        'skills',
        'services',
        'niches',
        'experiences',
        'avatarMedia',
        'bannerMedia',
      ],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (!this.canViewProfile(profile, currentUser)) {
      throw new ForbiddenException('You do not have permission to view this profile');
    }

    return this.mapProfileToResponse(profile, currentUser);
  }

  async updateMyProfile(
    user: User,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    let profile = await this.profileRepository.findOne({
      where: { userId: user.id },
      relations: ['skills', 'services', 'niches'],
    });

    if (!profile) {
      profile = this.profileRepository.create({
        userId: user.id,
        visibility: ProfileVisibility.PUBLIC,
      });
    }

    // Update basic fields
    if (dto.headline !== undefined) profile.headline = dto.headline;
    if (dto.about !== undefined) profile.about = dto.about;
    if (dto.location !== undefined) profile.location = dto.location;
    if (dto.websiteUrl !== undefined) profile.websiteUrl = dto.websiteUrl;
    if (dto.visibility !== undefined) profile.visibility = dto.visibility;

    // Update skills
    if (dto.skillIds !== undefined) {
      const skills = await this.skillRepository.findBy({
        id: In(dto.skillIds),
      });
      profile.skills = skills;
    }

    // Update services
    if (dto.serviceIds !== undefined) {
      const services = await this.serviceRepository.findBy({
        id: In(dto.serviceIds),
      });
      profile.services = services;
    }

    // Update niches
    if (dto.nicheIds !== undefined) {
      const niches = await this.nicheRepository.findBy({
        id: In(dto.nicheIds),
      });
      profile.niches = niches;
    }

    await this.profileRepository.save(profile);

    return this.getMyProfile(user);
  }

  async updateAvatar(user: User, mediaAssetId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    profile.avatarMediaId = mediaAssetId;
    await this.profileRepository.save(profile);

    return this.getMyProfile(user);
  }

  async updateBanner(user: User, mediaAssetId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    profile.bannerMediaId = mediaAssetId;
    await this.profileRepository.save(profile);

    return this.getMyProfile(user);
  }

  // Experience methods
  async addExperience(
    user: User,
    dto: CreateExperienceDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const experience = this.experienceRepository.create({
      profileId: profile.id,
      title: dto.title,
      companyName: dto.companyName || null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isCurrent: dto.isCurrent || false,
      description: dto.description || null,
      orderIndex: dto.orderIndex || 0,
    });

    await this.experienceRepository.save(experience);

    return this.getMyProfile(user);
  }

  async updateExperience(
    user: User,
    experienceId: string,
    dto: UpdateExperienceDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const experience = await this.experienceRepository.findOne({
      where: { id: experienceId, profileId: profile.id },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    if (dto.title !== undefined) experience.title = dto.title;
    if (dto.companyName !== undefined) experience.companyName = dto.companyName;
    if (dto.startDate !== undefined)
      experience.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      experience.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.isCurrent !== undefined) experience.isCurrent = dto.isCurrent;
    if (dto.description !== undefined) experience.description = dto.description;
    if (dto.orderIndex !== undefined) experience.orderIndex = dto.orderIndex;

    await this.experienceRepository.save(experience);

    return this.getMyProfile(user);
  }

  async deleteExperience(
    user: User,
    experienceId: string,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const experience = await this.experienceRepository.findOne({
      where: { id: experienceId, profileId: profile.id },
    });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    await this.experienceRepository.remove(experience);

    return this.getMyProfile(user);
  }

  // Lookup methods
  async getAllSkills(): Promise<Skill[]> {
    return this.skillRepository.find({ order: { name: 'ASC' } });
  }

  async getAllServices(): Promise<Service[]> {
    return this.serviceRepository.find({ order: { name: 'ASC' } });
  }

  async getAllNiches(): Promise<IndustryNiche[]> {
    return this.nicheRepository.find({ order: { name: 'ASC' } });
  }

  // Helper methods
  private canViewProfile(profile: Profile, currentUser?: User): boolean {
    // Own profile is always visible
    if (currentUser && profile.userId === currentUser.id) {
      return true;
    }

    // Public profiles are visible to everyone
    if (profile.visibility === ProfileVisibility.PUBLIC) {
      return true;
    }

    // Logged-in visibility requires authentication
    if (profile.visibility === ProfileVisibility.LOGGED_IN) {
      return !!currentUser;
    }

    // Connections-only requires checking connection (TODO: implement)
    if (profile.visibility === ProfileVisibility.CONNECTIONS) {
      // For now, only allow viewing own profile
      return currentUser?.id === profile.userId;
    }

    return false;
  }

  private mapProfileToResponse(
    profile: Profile,
    currentUser?: User,
  ): ProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      companyId: profile.companyId,
      headline: profile.headline,
      about: profile.about,
      location: profile.location,
      websiteUrl: profile.websiteUrl,
      visibility: profile.visibility,
      avatarUrl: profile.avatarMedia
        ? this.mediaService.getPublicUrl(profile.avatarMedia)
        : null,
      bannerUrl: profile.bannerMedia
        ? this.mediaService.getPublicUrl(profile.bannerMedia)
        : null,
      skills: profile.skills?.map((s) => ({ id: s.id, name: s.name })) || [],
      services: profile.services?.map((s) => ({ id: s.id, name: s.name })) || [],
      niches: profile.niches?.map((n) => ({ id: n.id, name: n.name })) || [],
      experiences:
        profile.experiences
          ?.sort((a, b) => a.orderIndex - b.orderIndex)
          .map((e) => ({
            id: e.id,
            title: e.title,
            companyName: e.companyName,
            startDate: e.startDate?.toISOString().split('T')[0] || null,
            endDate: e.endDate?.toISOString().split('T')[0] || null,
            isCurrent: e.isCurrent,
            description: e.description,
            orderIndex: e.orderIndex,
          })) || [],
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      displayName: profile.user?.displayName,
      username: profile.user?.username || undefined,
      companyName: profile.company?.name,
      companySlug: profile.company?.slug,
    };
  }
}

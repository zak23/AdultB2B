import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { Profile } from './entities/profile.entity';
import { ProfileExperience } from './entities/profile-experience.entity';
import { Skill } from './entities/skill.entity';
import { Service } from './entities/service.entity';
import { IndustryNiche } from './entities/industry-niche.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      ProfileExperience,
      Skill,
      Service,
      IndustryNiche,
    ]),
    MediaModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}

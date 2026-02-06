import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';
import { MediaAsset } from '../../media/entities/media-asset.entity';
import { ProfileExperience } from './profile-experience.entity';
import { Skill } from './skill.entity';
import { Service } from './service.entity';
import { IndustryNiche } from './industry-niche.entity';

export enum ProfileVisibility {
  PUBLIC = 'public',
  LOGGED_IN = 'logged_in',
  CONNECTIONS = 'connections',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @OneToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @Column({ type: 'text', nullable: true })
  headline: string | null;

  @Column({ type: 'text', nullable: true })
  about: string | null;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ name: 'website_url', type: 'text', nullable: true })
  websiteUrl: string | null;

  @Column({
    type: 'enum',
    enum: ProfileVisibility,
    default: ProfileVisibility.PUBLIC,
  })
  visibility: ProfileVisibility;

  @Column({ name: 'avatar_media_id', type: 'uuid', nullable: true })
  avatarMediaId: string | null;

  @OneToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'avatar_media_id' })
  avatarMedia: MediaAsset | null;

  @Column({ name: 'banner_media_id', type: 'uuid', nullable: true })
  bannerMediaId: string | null;

  @OneToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'banner_media_id' })
  bannerMedia: MediaAsset | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => ProfileExperience, (experience) => experience.profile)
  experiences: ProfileExperience[];

  @ManyToMany(() => Skill)
  @JoinTable({
    name: 'profile_skills',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  skills: Skill[];

  @ManyToMany(() => Service)
  @JoinTable({
    name: 'profile_services',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
  })
  services: Service[];

  @ManyToMany(() => IndustryNiche)
  @JoinTable({
    name: 'profile_niches',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'niche_id', referencedColumnName: 'id' },
  })
  niches: IndustryNiche[];
}

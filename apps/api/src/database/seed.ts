import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { Role } from '../modules/auth/entities/role.entity';
import { User, UserStatus } from '../modules/users/entities/user.entity';
import { Profile, ProfileVisibility } from '../modules/profiles/entities/profile.entity';
import { Skill } from '../modules/profiles/entities/skill.entity';
import { Service } from '../modules/profiles/entities/service.entity';
import { IndustryNiche } from '../modules/profiles/entities/industry-niche.entity';
import { Company } from '../modules/companies/entities/company.entity';
import { CompanyMember, CompanyMemberRole } from '../modules/companies/entities/company-member.entity';
import { Group, GroupVisibility } from '../modules/groups/entities/group.entity';
import { GroupMember, GroupMemberRole } from '../modules/groups/entities/group-member.entity';
import { Post, PostStatus, PostVisibility, ModerationStatus, PostKind, ContentFormat } from '../modules/posts/entities/post.entity';

// Load environment variables (repo root and API folder)
config({ path: '../../.env' });
config({ path: '.env' });

type SeedUser = {
  email: string;
  displayName: string;
  username: string | null;
  roleKeys: string[];
};

const defaultAdminEmail = 'admin@adultb2b.local';
const defaultAdminPassword = 'Admin123!';
const defaultSeedPassword = 'Password123!';

const seedUsers: SeedUser[] = [
  {
    email: 'ava.creator@example.com',
    displayName: 'Ava Creator',
    username: 'avacreator',
    roleKeys: ['creator'],
  },
  {
    email: 'max.studio@example.com',
    displayName: 'Max Studio',
    username: 'maxstudio',
    roleKeys: ['company_owner'],
  },
  {
    email: 'riley.recruiter@example.com',
    displayName: 'Riley Recruiter',
    username: 'rileyrecruiter',
    roleKeys: ['user'],
  },
  {
    email: 'sam.service@example.com',
    displayName: 'Sam Services',
    username: 'samservices',
    roleKeys: ['user'],
  },
];

async function ensureRole(roleRepo: ReturnType<typeof AppDataSource.getRepository>, key: string, name: string) {
  let role = await roleRepo.findOne({ where: { key } });
  if (!role) {
    role = roleRepo.create({ key, name });
    role = await roleRepo.save(role);
  }
  return role as Role;
}

async function ensureLookupItem<T extends { name: string }>(
  repo: ReturnType<typeof AppDataSource.getRepository>,
  name: string,
): Promise<T> {
  let item = await repo.findOne({ where: { name } });
  if (!item) {
    item = repo.create({ name });
    item = await repo.save(item);
  }
  return item as T;
}

async function ensureUser(
  userRepo: ReturnType<typeof AppDataSource.getRepository>,
  roleRepo: ReturnType<typeof AppDataSource.getRepository>,
  user: SeedUser,
  password: string,
  forcePasswordReset: boolean,
) {
  const email = user.email.toLowerCase();
  let existing = await userRepo.findOne({ where: { email } });
  const roleEntities = await roleRepo.find({ where: user.roleKeys.map((key) => ({ key })) });

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    existing = userRepo.create({
      email,
      passwordHash,
      displayName: user.displayName,
      username: user.username,
      status: UserStatus.ACTIVE,
      roles: roleEntities,
    });
    existing = await userRepo.save(existing);
    return existing as User;
  }

  let updated = false;
  if (!existing.displayName && user.displayName) {
    existing.displayName = user.displayName;
    updated = true;
  }
  if (!existing.username && user.username) {
    existing.username = user.username;
    updated = true;
  }

  if (forcePasswordReset) {
    existing.passwordHash = await bcrypt.hash(password, 12);
    updated = true;
  }

  const existingRoleKeys = new Set((existing.roles || []).map((role: Role) => role.key));
  const rolesToAdd = roleEntities.filter((r: Role) => !existingRoleKeys.has(r.key));
  if (rolesToAdd.length > 0) {
    existing.roles = [...(existing.roles || []), ...rolesToAdd];
    updated = true;
  }

  if (updated) {
    existing = await userRepo.save(existing);
  }

  return existing as User;
}

async function ensureProfileForUser(
  profileRepo: ReturnType<typeof AppDataSource.getRepository>,
  user: User,
  skills: Skill[],
  services: Service[],
  niches: IndustryNiche[],
  overrides: Partial<Profile>,
) {
  let profile = await profileRepo.findOne({
    where: { userId: user.id },
    relations: ['skills', 'services', 'niches'],
  });

  if (!profile) {
    profile = profileRepo.create({
      userId: user.id,
      visibility: ProfileVisibility.PUBLIC,
      skills,
      services,
      niches,
      ...overrides,
    });
    profile = await profileRepo.save(profile);
    return profile as Profile;
  }

  let updated = false;
  if (!profile.headline && overrides.headline) {
    profile.headline = overrides.headline;
    updated = true;
  }
  if (!profile.about && overrides.about) {
    profile.about = overrides.about;
    updated = true;
  }
  if (!profile.location && overrides.location) {
    profile.location = overrides.location;
    updated = true;
  }
  if (!profile.websiteUrl && overrides.websiteUrl) {
    profile.websiteUrl = overrides.websiteUrl;
    updated = true;
  }

  if ((profile.skills || []).length === 0 && skills.length > 0) {
    profile.skills = skills;
    updated = true;
  }
  if ((profile.services || []).length === 0 && services.length > 0) {
    profile.services = services;
    updated = true;
  }
  if ((profile.niches || []).length === 0 && niches.length > 0) {
    profile.niches = niches;
    updated = true;
  }

  if (updated) {
    profile = await profileRepo.save(profile);
  }

  return profile as Profile;
}

async function ensureProfileForCompany(
  profileRepo: ReturnType<typeof AppDataSource.getRepository>,
  company: Company,
  skills: Skill[],
  services: Service[],
  niches: IndustryNiche[],
  overrides: Partial<Profile>,
) {
  let profile = await profileRepo.findOne({
    where: { companyId: company.id },
    relations: ['skills', 'services', 'niches'],
  });

  if (!profile) {
    profile = profileRepo.create({
      companyId: company.id,
      visibility: ProfileVisibility.PUBLIC,
      skills,
      services,
      niches,
      ...overrides,
    });
    profile = await profileRepo.save(profile);
    return profile as Profile;
  }

  let updated = false;
  if (!profile.headline && overrides.headline) {
    profile.headline = overrides.headline;
    updated = true;
  }
  if (!profile.about && overrides.about) {
    profile.about = overrides.about;
    updated = true;
  }
  if (!profile.location && overrides.location) {
    profile.location = overrides.location;
    updated = true;
  }
  if (!profile.websiteUrl && overrides.websiteUrl) {
    profile.websiteUrl = overrides.websiteUrl;
    updated = true;
  }

  if ((profile.skills || []).length === 0 && skills.length > 0) {
    profile.skills = skills;
    updated = true;
  }
  if ((profile.services || []).length === 0 && services.length > 0) {
    profile.services = services;
    updated = true;
  }
  if ((profile.niches || []).length === 0 && niches.length > 0) {
    profile.niches = niches;
    updated = true;
  }

  if (updated) {
    profile = await profileRepo.save(profile);
  }

  return profile as Profile;
}

async function ensurePost(
  postRepo: ReturnType<typeof AppDataSource.getRepository>,
  authorUserId: string | null,
  authorCompanyId: string | null,
  content: string,
  visibility: PostVisibility,
) {
  const existing = await postRepo.findOne({
    where: { authorUserId, authorCompanyId, content },
  });
  if (existing) {
    return existing as Post;
  }

  const post = postRepo.create({
    authorUserId,
    authorCompanyId,
    content,
    kind: PostKind.POST,
    status: PostStatus.PUBLISHED,
    contentFormat: ContentFormat.PLAIN,
    visibility,
    moderationStatus: ModerationStatus.APPROVED,
    publishedAt: new Date(),
    metadata: { seedTag: 'demo' },
  });

  return (await postRepo.save(post)) as Post;
}

async function run() {
  await AppDataSource.initialize();

  try {
    const roleRepo = AppDataSource.getRepository(Role);
    const userRepo = AppDataSource.getRepository(User);
    const profileRepo = AppDataSource.getRepository(Profile);
    const skillRepo = AppDataSource.getRepository(Skill);
    const serviceRepo = AppDataSource.getRepository(Service);
    const nicheRepo = AppDataSource.getRepository(IndustryNiche);
    const companyRepo = AppDataSource.getRepository(Company);
    const companyMemberRepo = AppDataSource.getRepository(CompanyMember);
    const groupRepo = AppDataSource.getRepository(Group);
    const groupMemberRepo = AppDataSource.getRepository(GroupMember);
    const postRepo = AppDataSource.getRepository(Post);

    const adminRole = await ensureRole(roleRepo, 'admin', 'Administrator');
    await ensureRole(roleRepo, 'moderator', 'Moderator');
    await ensureRole(roleRepo, 'user', 'User');
    await ensureRole(roleRepo, 'creator', 'Creator');
    await ensureRole(roleRepo, 'company_owner', 'Company Owner');

    const adminEmail = (process.env.ADMIN_EMAIL || defaultAdminEmail).toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || defaultAdminPassword;
    const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'Admin User';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const forceAdminPasswordReset = process.env.ADMIN_RESET_PASSWORD === '1';

    const adminUser = await ensureUser(
      userRepo,
      roleRepo,
      {
        email: adminEmail,
        displayName: adminDisplayName,
        username: adminUsername,
        roleKeys: ['admin', 'user'],
      },
      adminPassword,
      forceAdminPasswordReset,
    );

    const seedPassword = process.env.SEED_USER_PASSWORD || defaultSeedPassword;
    const seedUsersCreated: User[] = [];

    for (const seedUser of seedUsers) {
      const user = await ensureUser(
        userRepo,
        roleRepo,
        {
          ...seedUser,
          roleKeys: Array.from(new Set([...seedUser.roleKeys, 'user'])),
        },
        seedPassword,
        false,
      );
      seedUsersCreated.push(user);
    }

    const fallbackSkills = ['Content Creation', 'Marketing', 'Video Production'];
    const fallbackServices = ['Marketing Services', 'Content Production'];
    const fallbackNiches = ['Creator Platforms', 'Marketing/Traffic'];

    const skills: Skill[] = [];
    for (const name of fallbackSkills) {
      skills.push(await ensureLookupItem<Skill>(skillRepo, name));
    }

    const services: Service[] = [];
    for (const name of fallbackServices) {
      services.push(await ensureLookupItem<Service>(serviceRepo, name));
    }

    const niches: IndustryNiche[] = [];
    for (const name of fallbackNiches) {
      niches.push(await ensureLookupItem<IndustryNiche>(nicheRepo, name));
    }

    await ensureProfileForUser(profileRepo, adminUser, skills, services, niches, {
      headline: 'Platform Administrator',
      about: 'Oversees platform operations and compliance.',
      location: 'Remote',
    });

    for (const user of seedUsersCreated) {
      await ensureProfileForUser(profileRepo, user, skills, services, niches, {
        headline: `${user.displayName} on AdultB2B`,
        about: 'Demo profile seeded for local development.',
        location: 'Remote',
      });
    }

    const companySlug = 'lumen-studios';
    let company = await companyRepo.findOne({ where: { slug: companySlug } });
    if (!company) {
      company = companyRepo.create({
        name: 'Lumen Studios',
        slug: companySlug,
        description: 'Production and distribution studio focused on creator partnerships.',
        verified: true,
        metadata: { seedTag: 'demo' },
      });
      company = await companyRepo.save(company);
    }

    const companyOwner = seedUsersCreated.find((user) => user.email === 'max.studio@example.com') || seedUsersCreated[0];
    if (companyOwner) {
      const existingMember = await companyMemberRepo.findOne({
        where: { companyId: company.id, userId: companyOwner.id },
      });

      if (!existingMember) {
        const member = companyMemberRepo.create({
          companyId: company.id,
          userId: companyOwner.id,
          role: CompanyMemberRole.OWNER,
        });
        await companyMemberRepo.save(member);
      }
    }

    await ensureProfileForCompany(profileRepo, company, skills, services, niches, {
      headline: 'Studio and creator partnerships',
      about: 'Demo company profile for development environments.',
      location: 'Los Angeles, CA',
      websiteUrl: 'https://example.com',
    });

    const groupSlug = 'creators-exchange';
    let group = await groupRepo.findOne({ where: { slug: groupSlug } });
    if (!group) {
      group = groupRepo.create({
        name: 'Creators Exchange',
        slug: groupSlug,
        description: 'Share tips, collaborations, and opportunities.',
        visibility: GroupVisibility.PUBLIC,
        ownerUserId: adminUser.id,
        metadata: { seedTag: 'demo' },
      });
      group = await groupRepo.save(group);
    }

    const groupOwnerMembership = await groupMemberRepo.findOne({
      where: { groupId: group.id, userId: adminUser.id },
    });
    if (!groupOwnerMembership) {
      const ownerMember = groupMemberRepo.create({
        groupId: group.id,
        userId: adminUser.id,
        role: GroupMemberRole.OWNER,
      });
      await groupMemberRepo.save(ownerMember);
    }

    const additionalMember = seedUsersCreated[0];
    if (additionalMember) {
      const member = await groupMemberRepo.findOne({
        where: { groupId: group.id, userId: additionalMember.id },
      });
      if (!member) {
        await groupMemberRepo.save(
          groupMemberRepo.create({
            groupId: group.id,
            userId: additionalMember.id,
            role: GroupMemberRole.MEMBER,
          }),
        );
      }
    }

    await ensurePost(
      postRepo,
      adminUser.id,
      null,
      'Welcome to the AdultB2B demo environment. Reach out if you need help.',
      PostVisibility.PUBLIC,
    );

    for (const user of seedUsersCreated) {
      await ensurePost(
        postRepo,
        user.id,
        null,
        `Hello from ${user.displayName}! Excited to connect with creators and partners.`,
        PostVisibility.PUBLIC,
      );
    }

    await ensurePost(
      postRepo,
      null,
      company.id,
      'Lumen Studios is looking for new creator partnerships this quarter.',
      PostVisibility.PUBLIC,
    );

    console.log('Seed completed.');
    console.log('Admin login:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('Note: set ADMIN_RESET_PASSWORD=1 to force-reset the admin password.');
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  process.exitCode = 1;
});

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
import { Reaction } from '../modules/engagement/entities/reaction.entity';
import { ReactionType } from '../modules/engagement/entities/reaction-type.entity';
import { Comment } from '../modules/engagement/entities/comment.entity';

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

// --- Bulk seed catalogs (deterministic, suggestive, non-explicit) ---
const BULK_USER_COUNT = 50;
const BULK_POST_COUNT = 200;

const bulkFirstNames = [
  'Luna', 'Scarlett', 'Jade', 'Violet', 'Sage', 'Blake', 'Remy', 'Quinn',
  'Phoenix', 'River', 'Skyler', 'Morgan', 'Reese', 'Dakota', 'Ember',
  'Aria', 'Zara', 'Mila', 'Nova', 'Ivy', 'Stella', 'Ruby', 'Hazel', 'Willow',
  'Sienna', 'Jasper', 'Finn', 'Asher', 'Rowan', 'Charlie', 'Frankie', 'Alex',
  'Sam', 'Jordan', 'Casey', 'Riley', 'Avery', 'Parker', 'Hayden', 'Cameron',
];

const bulkLastNames = [
  'Lane', 'Reed', 'Brooks', 'Hart', 'Cole', 'Shaw', 'Fox', 'Wilde',
  'Blaze', 'Storm', 'Rose', 'Gray', 'Stone', 'Cruz', 'Vega',
  'Marsh', 'Dawn', 'Lake', 'Sky', 'Belle', 'Reign', 'Luxe', 'Prime', 'Elite',
];

const bulkRoleAssignments: ('creator' | 'company_owner' | 'user')[] = [
  'creator', 'creator', 'creator', 'creator', 'user', 'user', 'company_owner', 'user', 'creator', 'user',
  'user', 'creator', 'company_owner', 'creator', 'user', 'creator', 'user', 'creator', 'user', 'company_owner',
  'creator', 'user', 'creator', 'user', 'creator', 'user', 'creator', 'user', 'creator', 'user',
  'company_owner', 'creator', 'user', 'creator', 'user', 'creator', 'user', 'creator', 'user', 'creator',
  'user', 'creator', 'user', 'company_owner', 'creator', 'user', 'creator', 'user', 'creator', 'user',
];

const bulkLocations = [
  'Los Angeles, CA', 'Miami, FL', 'Las Vegas, NV', 'New York, NY', 'Austin, TX',
  'London, UK', 'Berlin, Germany', 'Barcelona, Spain', 'Remote', 'Toronto, Canada',
  'Chicago, IL', 'Atlanta, GA', 'Phoenix, AZ', 'San Diego, CA', 'Denver, CO',
];

const bulkHeadlines = [
  'Creator & content partner',
  'Building authentic connections in the industry',
  'Content creator | Collabs welcome',
  'Studio lead & talent partner',
  'Helping creators grow their brand',
  'Independent creator | DMs open for serious collabs',
  'Marketing & growth for adult brands',
  'Production and distribution partner',
  'Creator economy enthusiast',
  'Connecting talent with opportunities',
];

const bulkAboutTexts = [
  'Passionate about quality content and genuine partnerships. Always open to new projects.',
  'Here to network, share ideas, and explore collaborations. No spam, just real connections.',
  'Industry veteran. Focus on sustainable growth and creator-first partnerships.',
  'Love connecting with fellow creators and brands. Hit me up for collabs or just to chat.',
  'Building something new in this space. Always happy to connect with like-minded people.',
  'Creator first. Here for authentic conversations and serious opportunities.',
  'Supporting creators and studios with strategy and execution. Let\'s talk.',
  'Focused on premium content and long-term partnerships. Open to the right fit.',
  'Community-driven. Here to learn, share, and grow together.',
  'Bringing a fresh perspective to the industry. DMs open for interesting projects.',
];

const bulkPostTemplates = [
  'New drop coming soon. So excited to share this one with you all.',
  'Grateful for this community. The support is unreal.',
  'Behind the scenes today. You wouldn’t believe the energy on set.',
  'Just wrapped a collab I’ve been dreaming about. More soon.',
  'If you’re not in the room, you’re missing out. Let’s connect.',
  'Quality over quantity. Always.',
  'Another day, another project. This industry never sleeps.',
  'Shoutout to everyone who showed up this week. You know who you are.',
  'Building in public. Big things coming.',
  'The right partnerships change everything. Here’s to more of them.',
  'New content dropping this week. Stay tuned.',
  'So much happening behind the scenes. Can’t wait to share.',
  'Collaboration over competition. That’s how we win.',
  'Just another reminder: your network is your net worth.',
  'Feeling inspired today. Time to create.',
  'When the right people align, magic happens. Grateful for my circle.',
  'No cap — this community is different. Proud to be part of it.',
  'New month, new goals. Let’s get it.',
  'Support your favorite creators. It matters.',
  'Real recognize real. You know where to find me.',
  'Another successful collab in the books. More to come.',
  'Hustle in silence. Let the work speak.',
  'Building something special. Glad you’re here for it.',
  'The industry is evolving. So are we.',
  'Your vibe attracts your tribe. Make it count.',
  'Weekend vibes: planning the next drop.',
  'Serious inquiries only. Let’s build.',
  'Growth mode. No days off.',
  'Thank you for the support. It doesn’t go unnoticed.',
  'Here for the long game. Quality always wins.',
];

const bulkCommentTemplates = [
  'So good!',
  'Agree 100%.',
  'This is fire.',
  'Needed this today.',
  'Same energy.',
  'Love this.',
  'Facts.',
  "Can't wait for more.",
  'Yes!',
  'So true.',
  'Here for it.',
  'Great point.',
  'This hit different.',
  'Needed to hear this.',
  'Big facts.',
  'Period.',
  'This though.',
  'So real.',
  'Mood.',
  'Exactly this.',
  'Couldn’t agree more.',
  'Keeping this one.',
  'Saving this.',
  'More of this please.',
  'This is the one.',
];

/** Deterministic pick: arr[i % arr.length] */
function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

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

async function createPostWithPublishedAt(
  postRepo: ReturnType<typeof AppDataSource.getRepository>,
  authorUserId: string,
  content: string,
  publishedAt: Date,
) {
  const post = postRepo.create({
    authorUserId,
    authorCompanyId: null,
    content,
    kind: PostKind.POST,
    status: PostStatus.PUBLISHED,
    contentFormat: ContentFormat.PLAIN,
    visibility: PostVisibility.PUBLIC,
    moderationStatus: ModerationStatus.APPROVED,
    publishedAt,
    metadata: { seedTag: 'bulk' },
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
    const reactionTypeRepo = AppDataSource.getRepository(ReactionType);
    const reactionRepo = AppDataSource.getRepository(Reaction);
    const commentRepo = AppDataSource.getRepository(Comment);

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

    const allSkillNames = [
      ...fallbackSkills,
      'Video Editing', 'Photography', 'Social Media Management', 'Copywriting', 'SEO',
      'Affiliate Marketing', 'Community Management', 'Talent Management',
    ];
    const allServiceNames = [
      ...fallbackServices,
      'Talent Agency', 'Distribution', 'Licensing', 'Consulting', 'Hosting Services',
    ];
    const allNicheNames = [
      ...fallbackNiches,
      'Premium/Mainstream', 'Production Studios', 'Cam Sites', 'Technology', 'Distribution',
    ];

    const skills: Skill[] = [];
    for (const name of allSkillNames) {
      skills.push(await ensureLookupItem<Skill>(skillRepo, name));
    }
    const services: Service[] = [];
    for (const name of allServiceNames) {
      services.push(await ensureLookupItem<Service>(serviceRepo, name));
    }
    const niches: IndustryNiche[] = [];
    for (const name of allNicheNames) {
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

    // Bulk seed: ~50 users with profiles
    const bulkUsersCreated: User[] = [];
    for (let i = 0; i < BULK_USER_COUNT; i++) {
      const firstName = pick(bulkFirstNames, i);
      const lastName = pick(bulkLastNames, i);
      const displayName = `${firstName} ${lastName}`;
      const baseUsername = slugify(displayName);
      const username = `${baseUsername}${i}`;
      const email = `${username}@seed.adultb2b.local`;
      const roleKey = pick(bulkRoleAssignments, i);
      const user = await ensureUser(
        userRepo,
        roleRepo,
        {
          email,
          displayName,
          username,
          roleKeys: [roleKey, 'user'],
        },
        seedPassword,
        false,
      );
      bulkUsersCreated.push(user);

      const userSkills = [pick(skills, i), pick(skills, i + 7), pick(skills, i + 3)].filter(
        (s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx,
      );
      const userServices = [pick(services, i), pick(services, i + 2)].filter(
        (s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx,
      );
      const userNiches = [pick(niches, i), pick(niches, i + 5)].filter(
        (n, idx, arr) => arr.findIndex((x) => x.id === n.id) === idx,
      );
      await ensureProfileForUser(profileRepo, user, userSkills, userServices, userNiches, {
        headline: pick(bulkHeadlines, i),
        about: pick(bulkAboutTexts, i),
        location: pick(bulkLocations, i),
        websiteUrl: i % 4 === 0 ? 'https://example.com' : undefined,
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

    // Bulk seed: ~200 posts with staggered publishedAt (all user authors)
    const allPostAuthors: User[] = [...seedUsersCreated, ...bulkUsersCreated];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    for (let i = 0; i < BULK_POST_COUNT; i++) {
      const author = pick(allPostAuthors, i);
      const content = pick(bulkPostTemplates, i);
      const publishedAt = new Date(now - (i % 31) * oneDayMs - (i % 24) * 60 * 60 * 1000);
      await createPostWithPublishedAt(postRepo, author.id, content, publishedAt);
    }

    // Engagement seed: reactions (likes etc.) and comments on posts
    const reactionTypes = await reactionTypeRepo.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
    const publishedPosts = await postRepo.find({
      where: { status: PostStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
      take: 120,
    });

    let reactionsCreated = 0;
    for (let i = 0; i < Math.min(80, publishedPosts.length); i++) {
      const post = publishedPosts[i];
      const numReactions = 2 + (i % 7);
      const usedUserIdx = new Set<number>();
      for (let r = 0; r < numReactions; r++) {
        const userIdx = (i * 11 + r * 5) % allPostAuthors.length;
        if (usedUserIdx.has(userIdx)) continue;
        usedUserIdx.add(userIdx);
        const author = allPostAuthors[userIdx];
        if (author.id === post.authorUserId) continue;
        const rType = pick(reactionTypes, r);
        const existing = await reactionRepo.findOne({
          where: { userId: author.id, targetPostId: post.id },
        });
        if (existing) continue;
        await reactionRepo.save(
          reactionRepo.create({
            userId: author.id,
            reactionTypeId: rType.id,
            targetPostId: post.id,
          }),
        );
        reactionsCreated++;
      }
    }

    let commentsCreated = 0;
    const postComments: { postId: string; commentIds: string[] }[] = [];
    for (let i = 0; i < Math.min(60, publishedPosts.length); i++) {
      const post = publishedPosts[i];
      const numComments = 1 + (i % 4);
      const ids: string[] = [];
      for (let c = 0; c < numComments; c++) {
        const author = pick(allPostAuthors, (i * 7 + c * 13) % allPostAuthors.length);
        const content = pick(bulkCommentTemplates, i + c);
        const comment = await commentRepo.save(
          commentRepo.create({
            postId: post.id,
            authorUserId: author.id,
            content,
            moderationStatus: ModerationStatus.APPROVED,
            metadata: { seedTag: 'bulk' },
          }),
        );
        ids.push(comment.id);
        commentsCreated++;
      }
      postComments.push({ postId: post.id, commentIds: ids });
    }

    for (let i = 0; i < 15; i++) {
      const pc = postComments[i % postComments.length];
      if (pc.commentIds.length === 0) continue;
      const parentId = pick(pc.commentIds, i);
      const author = pick(allPostAuthors, (i * 17 + 3) % allPostAuthors.length);
      const content = pick(bulkCommentTemplates, i + 20);
      await commentRepo.save(
        commentRepo.create({
          postId: pc.postId,
          authorUserId: author.id,
          parentCommentId: parentId,
          content,
          moderationStatus: ModerationStatus.APPROVED,
          metadata: { seedTag: 'bulk', reply: true },
        }),
      );
      commentsCreated++;
    }

    console.log('Seed completed.');
    console.log(`Bulk: ${bulkUsersCreated.length} users, ${BULK_POST_COUNT} posts, ${reactionsCreated} reactions, ${commentsCreated} comments.`);
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

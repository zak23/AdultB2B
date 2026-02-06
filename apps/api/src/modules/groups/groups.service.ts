import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, GroupVisibility } from './entities/group.entity';
import { GroupMember, GroupMemberRole } from './entities/group-member.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly memberRepository: Repository<GroupMember>,
  ) {}

  async createGroup(user: User, name: string, description?: string, visibility = GroupVisibility.PUBLIC): Promise<Group> {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await this.groupRepository.findOne({ where: { slug } });
    if (existing) throw new ConflictException('Group slug already exists');

    const group = this.groupRepository.create({ name, slug, description, visibility, ownerUserId: user.id });
    await this.groupRepository.save(group);

    await this.memberRepository.save({ groupId: group.id, userId: user.id, role: GroupMemberRole.OWNER });
    return group;
  }

  async getGroup(groupId: string): Promise<Group> {
    const group = await this.groupRepository.findOne({ where: { id: groupId }, relations: ['ownerUser'] });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async joinGroup(user: User, groupId: string): Promise<GroupMember> {
    const group = await this.getGroup(groupId);
    if (group.visibility === GroupVisibility.INVITE_ONLY) throw new ForbiddenException('This group is invite only');

    const existing = await this.memberRepository.findOne({ where: { groupId, userId: user.id } });
    if (existing) throw new ConflictException('Already a member');

    const member = this.memberRepository.create({ groupId, userId: user.id, role: GroupMemberRole.MEMBER });
    return this.memberRepository.save(member);
  }

  async leaveGroup(user: User, groupId: string): Promise<void> {
    const member = await this.memberRepository.findOne({ where: { groupId, userId: user.id } });
    if (!member) throw new NotFoundException('Not a member');
    if (member.role === GroupMemberRole.OWNER) throw new ForbiddenException('Owner cannot leave group');
    await this.memberRepository.remove(member);
  }

  async getGroupMembers(groupId: string, page = 1, limit = 50): Promise<{ data: GroupMember[]; total: number }> {
    const [data, total] = await this.memberRepository.findAndCount({
      where: { groupId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getUserGroups(user: User): Promise<Group[]> {
    const memberships = await this.memberRepository.find({ where: { userId: user.id }, relations: ['group'] });
    return memberships.map((m) => m.group);
  }

  async listPublicGroups(page = 1, limit = 20): Promise<{ data: Group[]; total: number }> {
    const [data, total] = await this.groupRepository.findAndCount({
      where: { visibility: GroupVisibility.PUBLIC },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}

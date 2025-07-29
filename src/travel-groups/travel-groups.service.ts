import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TravelGroup, Prisma } from '@prisma/client';

@Injectable()
export class TravelGroupsService {
  constructor(private prisma: PrismaService) { }

  async create(data: Prisma.TravelGroupCreateInput): Promise<TravelGroup> {
    // Create group and add creator as member in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create the travel group
      const travelGroup = await prisma.travelGroup.create({
        data,
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      // Add creator as a member
      await prisma.travelGroupMember.create({
        data: {
          groupId: travelGroup.id,
          userId: travelGroup.createdBy,
        },
      });

      // Return the group with all members
      return prisma.travelGroup.findUnique({
        where: { id: travelGroup.id },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
    });

    return result;
  }

  async findAll(userId: string): Promise<TravelGroup[]> {
    return this.prisma.travelGroup.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<TravelGroup | null> {
    return this.prisma.travelGroup.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        travels: true,
      },
    });
  }

  async addMember(groupId: string, email: string, requestUserId: string) {
    // Check if group exists and get group info
    const group = await this.prisma.travelGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Travel group not found');
    }

    // Check if requestUser is creator or member of the group
    const isCreator = group.createdBy === requestUserId;
    const isMember = group.members.some(member => member.userId === requestUserId);

    if (!isCreator && !isMember) {
      throw new ForbiddenException('Only group creator or members can add new members');
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.travelGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this group');
    }

    // Add user as member
    return this.prisma.travelGroupMember.create({
      data: {
        groupId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async removeMember(groupId: string, userId: string, requestUserId: string) {
    // Check if group exists
    const group = await this.prisma.travelGroup.findUnique({
      where: { id: groupId },
      select: { createdBy: true },
    });

    if (!group) {
      throw new NotFoundException('Travel group not found');
    }

    // Check if member to be removed exists
    const memberToRemove = await this.prisma.travelGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Member not found in this group');
    }

    // Check permissions: only group creator or the member themselves can remove the member
    const isCreator = group.createdBy === requestUserId;
    const isSelf = userId === requestUserId;

    if (!isCreator && !isSelf) {
      throw new ForbiddenException('Only the group creator or the member themselves can remove the member');
    }

    return this.prisma.travelGroupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  async update(id: string, data: Prisma.TravelGroupUpdateInput, requestUserId: string): Promise<TravelGroup> {
    // Check if group exists and verify creator
    const group = await this.prisma.travelGroup.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!group) {
      throw new NotFoundException('Travel group not found');
    }

    if (group.createdBy !== requestUserId) {
      throw new ForbiddenException('Only the group creator can update the group');
    }

    return this.prisma.travelGroup.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, requestUserId: string): Promise<void> {
    // Check if group exists and verify creator
    const group = await this.prisma.travelGroup.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!group) {
      throw new NotFoundException('Travel group not found');
    }

    if (group.createdBy !== requestUserId) {
      throw new ForbiddenException('Only the group creator can delete the group');
    }

    // Check if there are any travels associated with this group
    const travelCount = await this.prisma.travel.count({
      where: { groupId: id },
    });

    if (travelCount > 0) {
      throw new ConflictException('このグループには旅行が関連付けられているため削除できません');
    }

    await this.prisma.travelGroup.delete({
      where: { id },
    });
  }
}
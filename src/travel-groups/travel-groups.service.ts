import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TravelGroup, Prisma } from '@prisma/client';

@Injectable()
export class TravelGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TravelGroupCreateInput): Promise<TravelGroup> {
    return this.prisma.travelGroup.create({
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

  async addMember(groupId: string, userId: string) {
    return this.prisma.travelGroupMember.create({
      data: {
        groupId,
        userId,
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

  async removeMember(groupId: string, userId: string) {
    return this.prisma.travelGroupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  async update(id: string, data: Prisma.TravelGroupUpdateInput): Promise<TravelGroup> {
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

  async remove(id: string): Promise<TravelGroup> {
    return this.prisma.travelGroup.delete({
      where: { id },
    });
  }
}
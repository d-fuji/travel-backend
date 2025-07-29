import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ItineraryItem, Prisma } from '@prisma/client';

@Injectable()
export class ItineraryService {
  constructor(private prisma: PrismaService) { }

  async create(data: Prisma.ItineraryItemCreateInput, userId: string): Promise<ItineraryItem> {
    // Get travel ID from the data
    const travelId = (data.travel as any)?.connect?.id;
    if (!travelId) {
      throw new NotFoundException('Travel ID is required');
    }

    // Verify travel exists and user has access
    const travel = await this.prisma.travel.findUnique({
      where: { id: travelId },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!travel) {
      throw new NotFoundException('Travel not found');
    }

    console.log('Debug - Expense creation permission check:');
    console.log('User ID:', userId);
    console.log('Group Creator ID:', travel.group.createdBy);
    console.log('Members:', travel.group.members.map(m => ({ userId: m.userId })));

    // Check if user is member of travel group or the group creator
    const isMember = travel.group.members.some(member => member.userId === userId) ||
      travel.group.createdBy === userId;

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this travel group');
    }

    return this.prisma.itineraryItem.create({
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
        travel: true,
      },
    });
  }

  async findByTravel(travelId: string): Promise<ItineraryItem[]> {
    return this.prisma.itineraryItem.findMany({
      where: { travelId },
      orderBy: [{ date: 'asc' }, { period: 'asc' }],
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
  }

  async findOne(id: string): Promise<ItineraryItem | null> {
    return this.prisma.itineraryItem.findUnique({
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
        travel: true,
      },
    });
  }

  async update(id: string, data: Prisma.ItineraryItemUpdateInput): Promise<ItineraryItem> {
    return this.prisma.itineraryItem.update({
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
      },
    });
  }

  async remove(id: string): Promise<ItineraryItem> {
    return this.prisma.itineraryItem.delete({
      where: { id },
    });
  }
}
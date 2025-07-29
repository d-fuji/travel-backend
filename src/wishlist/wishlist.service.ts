import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WishlistItem, Prisma } from '@prisma/client';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.WishlistItemCreateInput, userId: string): Promise<WishlistItem> {
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

    // Check if user is member of travel group or the group creator
    const isMember = travel.group.members.some(member => member.userId === userId) || 
                     travel.group.createdBy === userId;
    
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this travel group');
    }

    return this.prisma.wishlistItem.create({
      data,
      include: {
        user: {
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

  async findByTravel(travelId: string): Promise<WishlistItem[]> {
    return this.prisma.wishlistItem.findMany({
      where: { travelId },
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

  async findOne(id: string): Promise<WishlistItem | null> {
    return this.prisma.wishlistItem.findUnique({
      where: { id },
      include: {
        user: {
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

  async update(id: string, data: Prisma.WishlistItemUpdateInput): Promise<WishlistItem> {
    return this.prisma.wishlistItem.update({
      where: { id },
      data,
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

  async remove(id: string): Promise<WishlistItem> {
    return this.prisma.wishlistItem.delete({
      where: { id },
    });
  }

  async toggleShare(id: string): Promise<WishlistItem> {
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id },
    });
    
    return this.prisma.wishlistItem.update({
      where: { id },
      data: { isShared: !item.isShared },
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
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WishlistItem, Prisma } from '@prisma/client';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.WishlistItemCreateInput): Promise<WishlistItem> {
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
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ItineraryItem, Prisma } from '@prisma/client';

@Injectable()
export class ItineraryService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ItineraryItemCreateInput): Promise<ItineraryItem> {
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
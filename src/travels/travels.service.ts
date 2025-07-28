import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Travel, Prisma } from '@prisma/client';

@Injectable()
export class TravelsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TravelCreateInput): Promise<Travel> {
    return this.prisma.travel.create({
      data,
      include: {
        group: {
          include: {
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
        },
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

  async findAll(userId: string): Promise<Travel[]> {
    return this.prisma.travel.findMany({
      where: {
        group: {
          OR: [
            { createdBy: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      include: {
        group: {
          include: {
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
        },
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        itineraryItems: true,
        wishlistItems: true,
      },
    });
  }

  async findOne(id: string): Promise<Travel | null> {
    return this.prisma.travel.findUnique({
      where: { id },
      include: {
        group: {
          include: {
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
        },
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        itineraryItems: {
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
        },
        wishlistItems: {
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

  async update(id: string, data: Prisma.TravelUpdateInput): Promise<Travel> {
    return this.prisma.travel.update({
      where: { id },
      data,
      include: {
        group: true,
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

  async remove(id: string): Promise<Travel> {
    return this.prisma.travel.delete({
      where: { id },
    });
  }
}
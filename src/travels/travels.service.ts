import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async remove(id: string, requestUserId: string): Promise<void> {
    // 旅行が存在するかチェック
    const travel = await this.prisma.travel.findUnique({
      where: { id },
      include: {
        creator: true,
      },
    });

    if (!travel) {
      throw new NotFoundException('旅行が見つかりません');
    }

    // リクエストユーザーが旅行の作成者かチェック
    if (travel.createdBy !== requestUserId) {
      throw new ForbiddenException('旅行を削除する権限がありません。作成者のみ削除できます。');
    }

    // 権限チェックが通った場合のみ削除を実行
    await this.prisma.travel.delete({
      where: { id },
    });
  }
}
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(email: string, password: string, name: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
    });
    
    const { password: _, ...result } = user;
    const payload = { email: user.email, sub: user.id };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async guestLogin(nickname: string, deviceFingerprint: string, groupId: string) {
    // グループが存在するかチェック
    const group = await this.prisma.travelGroup.findUnique({
      where: { id: groupId },
      include: { invitationSettings: true }
    });

    if (!group) {
      throw new BadRequestException('Group not found');
    }

    // ゲストモードが許可されているかチェック
    if (group.invitationSettings && !group.invitationSettings.allowGuestMode) {
      throw new BadRequestException('Guest mode is not allowed for this group');
    }

    // 既存のゲストユーザーをチェック
    let guestUser = await this.prisma.guestUser.findFirst({
      where: {
        deviceFingerprint,
        groupId,
        isConverted: false
      },
      include: { permissions: true }
    });

    if (!guestUser) {
      // 新しいゲストユーザーを作成
      const tempId = crypto.randomUUID();
      
      guestUser = await this.prisma.guestUser.create({
        data: {
          tempId,
          nickname,
          groupId,
          deviceFingerprint,
          permissions: {
            create: [
              { action: 'read', allowed: true },
              { action: 'comment', allowed: true },
              { action: 'edit_wishlist', allowed: false },
              { action: 'edit_itinerary', allowed: false },
              { action: 'manage_expenses', allowed: false }
            ]
          }
        },
        include: { permissions: true }
      });
    } else {
      // 既存ゲストユーザーのニックネームを更新
      guestUser = await this.prisma.guestUser.update({
        where: { id: guestUser.id },
        data: { 
          nickname,
          lastActiveAt: new Date()
        },
        include: { permissions: true }
      });
    }

    // ゲスト用JWTトークン生成
    const payload = {
      sub: guestUser.tempId,
      nickname: guestUser.nickname,
      groupId: guestUser.groupId,
      isGuest: true,
      permissions: guestUser.permissions.reduce((acc, p) => ({
        ...acc,
        [p.action]: p.allowed
      }), {})
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      guestUser: {
        tempId: guestUser.tempId,
        nickname: guestUser.nickname,
        groupId: guestUser.groupId,
        permissions: guestUser.permissions
      }
    };
  }

  async refreshGuestSession(tempId: string) {
    const guestUser = await this.prisma.guestUser.findUnique({
      where: { tempId },
      include: { permissions: true }
    });

    if (!guestUser || guestUser.isConverted) {
      throw new UnauthorizedException('Guest session not found or expired');
    }

    // 最終アクセス時間を更新
    await this.prisma.guestUser.update({
      where: { tempId },
      data: { lastActiveAt: new Date() }
    });

    const payload = {
      sub: guestUser.tempId,
      nickname: guestUser.nickname,
      groupId: guestUser.groupId,
      isGuest: true,
      permissions: guestUser.permissions.reduce((acc, p) => ({
        ...acc,
        [p.action]: p.allowed
      }), {})
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      guestUser: {
        tempId: guestUser.tempId,
        nickname: guestUser.nickname,
        groupId: guestUser.groupId,
        permissions: guestUser.permissions
      }
    };
  }
}
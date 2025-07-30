import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // ゲストユーザーの場合
    if (payload.isGuest) {
      const guestUser = await this.prisma.guestUser.findUnique({
        where: { tempId: payload.sub },
        include: { permissions: true }
      });
      
      return {
        id: payload.sub,
        userId: payload.sub,
        nickname: payload.nickname,
        groupId: payload.groupId,
        isGuest: true,
        permissions: payload.permissions || {},
        guestUser
      };
    }
    
    // 通常ユーザーの場合
    return { 
      id: payload.sub, 
      userId: payload.sub, 
      email: payload.email,
      isGuest: false
    };
  }
}
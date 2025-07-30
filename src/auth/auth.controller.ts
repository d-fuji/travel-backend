import { Controller, Post, Body, ValidationPipe, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, GuestLoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }

  @Post('guest-login')
  async guestLogin(@Body(ValidationPipe) guestLoginDto: GuestLoginDto) {
    return this.authService.guestLogin(
      guestLoginDto.nickname,
      guestLoginDto.deviceFingerprint,
      guestLoginDto.groupId,
    );
  }

  @Post('guest-refresh/:tempId')
  async refreshGuestSession(@Param('tempId') tempId: string) {
    return this.authService.refreshGuestSession(tempId);
  }
}
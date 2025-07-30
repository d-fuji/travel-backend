
import { IsString, IsOptional, IsEmail, IsNotEmpty, IsUUID, IsBoolean } from 'class-validator';

export class CreateInvitationLinkDto {
  @IsOptional()
  @IsString()
  customMessage?: string;
}

export class UserRegistrationDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}

export class GuestDataDto {
  @IsNotEmpty()
  @IsString()
  nickname: string;

  @IsNotEmpty()
  @IsString()
  deviceFingerprint: string;
}

export class JoinInvitationDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  userData?: UserRegistrationDto;

  @IsOptional()
  guestData?: GuestDataDto;
}

export class UpdateInvitationSettingsDto {
  @IsOptional()
  @IsBoolean()
  allowMemberInvite?: boolean;

  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  allowGuestMode?: boolean;
}

export class ConvertGuestDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}
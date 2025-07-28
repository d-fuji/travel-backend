import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

export class CreateTravelGroupDto {
  @IsString()
  @MinLength(1)
  name: string;
}

export class UpdateTravelGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}

export class AddMemberDto {
  @IsEmail()
  email: string;
}
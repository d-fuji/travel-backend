import { IsString, IsOptional, MinLength } from 'class-validator';

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
  @IsString()
  userId: string;
}
import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateWishlistItemDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @IsString()
  travelId: string;
}

export class UpdateWishlistItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
}
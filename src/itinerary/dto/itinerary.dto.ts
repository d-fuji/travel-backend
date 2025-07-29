import { IsString, IsOptional, IsEnum, MinLength, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';
import { Period } from '@prisma/client';

export class CreateItineraryItemDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUrl({}, { message: 'locationUrlは有効なURL形式である必要があります' })
  @Transform(({ value }) => value === '' ? undefined : value)
  locationUrl?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsString()
  date: string;

  @IsEnum(Period)
  period: Period;

  @IsString()
  travelId: string;
}

export class UpdateItineraryItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUrl({}, { message: 'locationUrlは有効なURL形式である必要があります' })
  @Transform(({ value }) => value === '' ? undefined : value)
  locationUrl?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsEnum(Period)
  period?: Period;
}
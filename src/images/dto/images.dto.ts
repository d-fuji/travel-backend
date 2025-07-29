import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadImageDto {
  @IsString()
  itineraryItemId: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  options?: string; // JSON serialized ImageUploadOptions
}

export class UpdateImageDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  displayOrder?: number;
}

export class SetMainImageDto {
  @IsString()
  itineraryItemId: string;

  @IsString()
  imageId: string;
}

export class ImageResponseDto {
  id: string;
  itineraryItemId: string;
  url: string;
  thumbnailUrl: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  caption?: string;
  altText?: string;
  displayOrder: number;
  isMain: boolean;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UploadImageResponseDto {
  images: ImageResponseDto[];
}
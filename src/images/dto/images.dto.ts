import { IsString } from 'class-validator';

export class UploadImageDto {
  @IsString()
  itineraryItemId: string;
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
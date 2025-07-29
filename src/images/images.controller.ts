import {
  Controller,
  Post,
  Delete,
  Patch,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  UploadImageDto,
  UpdateImageDto,
  SetMainImageDto,
  UploadImageResponseDto,
  ImageResponseDto
} from './dto/images.dto';

@Controller('images')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) { }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadImageDto: UploadImageDto,
  ): Promise<UploadImageResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('ファイルが選択されていません');
    }

    // オプションのパース（フロントエンドからJSON文字列で送信される）
    let options;
    if (uploadImageDto.options) {
      try {
        options = JSON.parse(uploadImageDto.options);
      } catch (error) {
        // オプションのパースに失敗してもエラーにしない
        console.warn('オプションのパースに失敗:', error);
      }
    }

    const images = await this.imagesService.uploadImages(
      files,
      uploadImageDto.itineraryItemId,
      uploadImageDto.userId,
      options
    );

    return { images };
  }

  @Delete(':imageId')
  async deleteImage(@Param('imageId') imageId: string): Promise<{ success: boolean }> {
    await this.imagesService.deleteImage(imageId);
    return { success: true };
  }

  @Patch(':imageId')
  async updateImage(
    @Param('imageId') imageId: string,
    @Body() updateImageDto: UpdateImageDto,
  ): Promise<ImageResponseDto> {
    return this.imagesService.updateImage(imageId, updateImageDto);
  }

  @Post('main')
  async setMainImage(@Body() setMainImageDto: SetMainImageDto): Promise<{ success: boolean }> {
    await this.imagesService.setMainImage(setMainImageDto);
    return { success: true };
  }
}

@Controller('itinerary')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ItineraryImagesController {
  constructor(private readonly imagesService: ImagesService) { }

  @Get(':itemId/images')
  async getItemImages(@Param('itemId') itemId: string): Promise<{ images: ImageResponseDto[] }> {
    const images = await this.imagesService.getItemImages(itemId);
    return { images };
  }
}
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  ValidationPipe,
  UsePipes,
  Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  UploadImageDto,
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
    @Request() req,
  ): Promise<UploadImageResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('ファイルが選択されていません');
    }

    const images = await this.imagesService.uploadImages(
      files,
      uploadImageDto.itineraryItemId,
      req.user.id
    );

    return { images };
  }

  @Delete(':imageId')
  async deleteImage(@Param('imageId') imageId: string): Promise<{ success: boolean }> {
    await this.imagesService.deleteImage(imageId);
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
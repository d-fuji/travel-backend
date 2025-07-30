import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageResponseDto } from './dto/images.dto';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';

@Injectable()
export class ImagesService {
  private supabase;
  private storageBucket: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Supabaseクライアントの初期化
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
    this.storageBucket = this.configService.get('SUPABASE_STORAGE_BUCKET') || 'travel-itinerary-images';

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadImages(
    files: Express.Multer.File[],
    itineraryItemId: string,
    userId: string
  ): Promise<ImageResponseDto[]> {
    // 旅程アイテムの存在確認
    const itineraryItem = await this.prisma.itineraryItem.findUnique({
      where: { id: itineraryItemId }
    });

    if (!itineraryItem) {
      throw new NotFoundException('旅程アイテムが見つかりません');
    }

    const uploadedImages: ImageResponseDto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // ファイルサイズチェック（10MB）
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('ファイルサイズは10MB以下にしてください');
      }

      // ファイルパスの生成
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `itineraries/${itineraryItemId}/${fileName}`;

      // Supabase Storageにアップロード
      const { error: uploadError } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new BadRequestException(`アップロードに失敗しました: ${uploadError.message}`);
      }

      // 公開URLの取得
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(filePath);

      console.log('画像アップロード詳細:', {
        filePath,
        publicUrl,
        storageBucket: this.storageBucket
      });

      // サムネイルURLの生成
      const thumbnailUrl = `${publicUrl}?width=150&height=150&resize=cover&quality=70`;

      // 画像の寸法を取得（実際の実装では画像解析ライブラリを使用）
      const dimensions = await this.getImageDimensions(file.buffer);

      // データベースに画像情報を保存
      const imageData = await this.prisma.itineraryImage.create({
        data: {
          itineraryItemId,
          url: publicUrl,
          thumbnailUrl,
          originalFileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          width: dimensions.width,
          height: dimensions.height,
          uploadedBy: userId,
          isMain: false,
          displayOrder: i,
          caption: '',
          altText: ''
        }
      });

      const mappedImage = this.mapToDto(imageData);
      console.log('マップされた画像データ:', mappedImage);
      uploadedImages.push(mappedImage);
    }

    return uploadedImages;
  }

  async deleteImage(imageId: string): Promise<void> {
    // 画像情報を取得
    const image = await this.prisma.itineraryImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new NotFoundException('画像が見つかりません');
    }

    // URLからファイルパスを抽出
    const filePath = this.extractFilePathFromUrl(image.url);

    // ストレージから削除
    await this.deleteFromStorage(filePath);

    // データベースから削除
    await this.prisma.itineraryImage.delete({
      where: { id: imageId }
    });
  }


  async getItemImages(itineraryItemId: string): Promise<ImageResponseDto[]> {
    const images = await this.prisma.itineraryImage.findMany({
      where: { itineraryItemId },
      orderBy: { displayOrder: 'asc' }
    });

    return images.map(image => this.mapToDto(image));
  }

  private mapToDto(image: any): ImageResponseDto {
    return {
      id: image.id,
      itineraryItemId: image.itineraryItemId,
      url: image.url,
      thumbnailUrl: image.thumbnailUrl || '',
      originalFileName: image.originalFileName,
      mimeType: image.mimeType,
      fileSize: image.fileSize,
      width: image.width,
      height: image.height,
      caption: image.caption || undefined,
      altText: image.altText || undefined,
      displayOrder: image.displayOrder,
      isMain: image.isMain,
      uploadedBy: image.uploadedBy,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    };
  }

  private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 800,
        height: metadata.height || 600
      };
    } catch (error) {
      console.error('画像寸法取得エラー:', error);
      // エラーの場合はデフォルト値を返す
      return { width: 800, height: 600 };
    }
  }

  private extractFilePathFromUrl(url: string): string {
    const urlParts = url.split('/');
    const bucketIndex = urlParts.indexOf(this.storageBucket);
    return urlParts.slice(bucketIndex + 1).join('/');
  }

  private async deleteFromStorage(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.storageBucket)
      .remove([filePath]);

    if (error) {
      console.error('ストレージ削除エラー:', error);
      throw new BadRequestException(`ストレージからの削除に失敗しました: ${error.message}`);
    }
  }
}
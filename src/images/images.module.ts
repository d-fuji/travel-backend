import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { ImagesController, ItineraryImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MulterModule.register({
      // メモリ内でファイルを処理（Supabaseにアップロードするため）
      storage: require('multer').memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10, // 最大10ファイル
      },
      fileFilter: (req, file, callback) => {
        // 画像ファイルのみ許可
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('サポートされていないファイル形式です'), false);
        }
      },
    }),
  ],
  controllers: [ImagesController, ItineraryImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
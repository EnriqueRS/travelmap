import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

// Asegurar que el directorio uploads existe
const uploadDir = path.join(process.cwd(), 'uploads', 'photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const extension = path.extname(file.originalname);
          const filename = `${uuidv4()}${extension}`;
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      }
    }),
  ],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule { }

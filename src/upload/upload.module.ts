import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  controllers: [UploadController],
  imports: [StorageModule],
})
export class UploadModule {}

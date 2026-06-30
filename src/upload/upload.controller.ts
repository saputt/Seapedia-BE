import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { StorageService, StorageBucket } from 'src/storage/storage.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private storageService: StorageService) {}

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a product image to Supabase storage' })
  @ApiConsumes('multipart/form-data')
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const url = await this.storageService.uploadImage(file, 'products', '');
    return { message: 'image uploaded', data: { url } };
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('store')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a store image to Supabase storage' })
  @ApiConsumes('multipart/form-data')
  async uploadStoreImage(
    @GetUser('role') userRole: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const folder = userRole === 'SELLER' ? 'sellers' : 'products/stores';
    const bucket: StorageBucket =
      userRole === 'SELLER' ? 'profiles' : 'products';
    const url = await this.storageService.uploadImage(file, bucket, folder);
    return { message: 'store image uploaded', data: { url } };
  }
}

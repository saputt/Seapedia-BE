import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Patch,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { extractStoragePath } from 'src/common/helpers/storage.helper';
import { StorageService } from 'src/storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private userService: UserService,
    private storageService: StorageService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@GetUser('id') userId: string) {
    const data = await this.userService.getProfile(userId);
    return { message: 'get profile success', data };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update username' })
  @ApiResponse({ status: 200, description: 'Username updated successfully' })
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.userService.updateProfile(userId, dto.username);
    return { message: 'update profile success', data };
  }

  @Put('profile/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiResponse({ status: 200, description: 'Profile image updated' })
  async uploadProfileImage(
    @GetUser('id') userId: string,
    @GetUser('role') userRole: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!file.buffer) throw new BadRequestException('File buffer is empty');
    const role = userRole as 'BUYER' | 'SELLER' | 'DRIVER';
    try {
      const folder = this.getProfileFolder(userRole);

      const currentUser = await this.userService.getProfile(userId);
      const oldImageUrl =
        role === 'BUYER'
          ? currentUser.buyerImageUrl
          : role === 'SELLER'
            ? currentUser.sellerImageUrl
            : currentUser.driverImageUrl;
      if (oldImageUrl) {
        const oldPath = extractStoragePath(oldImageUrl, 'profiles');
        if (oldPath) {
          try {
            await this.storageService.deleteImage('profiles', oldPath);
          } catch {
            this.logger.warn(`Failed to delete old profile image: ${oldPath}`);
          }
        }
      }

      const imageUrl = await this.storageService.uploadImage(
        file,
        'profiles',
        folder,
      );
      const data = await this.userService.updateImage(userId, imageUrl, role);
      return { message: 'profile image updated', data };
    } catch (error) {
      this.logger.error(
        `Supabase upload failed: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Gagal mengunggah gambar: ' +
          (error instanceof Error ? error.message : error),
      );
    }
  }

  private getProfileFolder(role: string): string {
    switch (role) {
      case 'SELLER':
        return 'sellers';
      case 'DRIVER':
        return 'drivers';
      case 'BUYER':
      default:
        return 'buyers';
    }
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Patch('password')
  @ApiOperation({ summary: 'Change password (requires old password)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests (rate limit exceeded)',
  })
  async changePassword(
    @GetUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
    );
    return { message: 'password changed successfully' };
  }
}

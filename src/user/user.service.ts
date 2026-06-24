import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { hashing } from 'src/common/helpers/hash.helper';
import { findOrThrow } from 'src/common/helpers/prisma.helper';

/**
 * Service untuk mengelola profil pengguna.
 * Menyediakan lihat profil, perbarui username, dan ubah password.
 * Password lama harus diverifikasi sebelum diubah ke password baru.
 */
@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getProfile(userId: string) {
    const user = await findOrThrow(
      () => this.userRepo.findById(userId),
      'user',
      userId,
    );
    const { password, ...profile } = user;
    return profile;
  }

  async getProfileForRole(userId: string, role: 'BUYER' | 'SELLER' | 'DRIVER') {
    const user = await findOrThrow(
      () => this.userRepo.findById(userId),
      'user',
      userId,
    );
    const { password, ...profile } = user;
    const roleImageUrl =
      role === 'BUYER'
        ? user.buyerImageUrl
        : role === 'SELLER'
          ? user.sellerImageUrl
          : user.driverImageUrl;
    return { ...profile, imageUrl: roleImageUrl || profile.imageUrl };
  }

  async updateProfile(userId: string, username: string) {
    await findOrThrow(() => this.userRepo.findById(userId), 'user', userId);
    return this.userRepo.updateUsername(userId, username);
  }

  async updateImage(
    userId: string,
    imageUrl: string,
    role: 'BUYER' | 'SELLER' | 'DRIVER',
  ) {
    await findOrThrow(() => this.userRepo.findById(userId), 'user', userId);
    return this.userRepo.updateImage(userId, imageUrl, role);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await findOrThrow<{ password: string }>(
      () => this.userRepo.findById(userId),
      'user',
      userId,
    );

    const isCorrect = await hashing.compare(oldPassword, user.password);
    if (!isCorrect)
      throw new UnauthorizedException('Current password is incorrect');

    const hashedPassword = await hashing.hash(newPassword);
    return this.userRepo.updatePassword(userId, hashedPassword);
  }
}

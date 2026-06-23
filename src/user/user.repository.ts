import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Repository untuk akses data profil pengguna di database.
 * Menangani pencarian pengguna, pembaruan username, dan pembaruan password.
 */
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        imageUrl: true,
      },
    });
  }

  async updateUsername(userId: string, username: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { username },
      select: { id: true, username: true, email: true, imageUrl: true },
    });
  }

  async updateImage(userId: string, imageUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { imageUrl },
      select: { id: true, username: true, email: true, imageUrl: true },
    });
  }

  async updatePassword(userId: string, password: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password },
      select: { id: true },
    });
  }
}

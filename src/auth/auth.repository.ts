import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

/**
 * Repository untuk akses data autentikasi di database.
 * Menangani pembuatan pengguna baru (dengan role BUYER default),
 * pencarian pengguna, dan pembaruan peran aktif pengguna.
 */
@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async createUser(registerDto: RegisterDto) {
    return this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        password: registerDto.password,
        roles: {
          create: [{ roleName: RoleName.BUYER }],
        },
        wallet: {
          create: {},
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        roles: true,
      },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        wallet: true,
      },
    });
  }

  async updateLastActiveRole(userId: string, role: RoleName) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastActiveRole: role,
      },
    });
  }

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        roles: true,
        wallet: true,
      },
    });
  }

  async addRoleToUser(userId: string, roleName: RoleName) {
    const existingRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleName: { userId, roleName },
      },
    });

    if (!existingRole) {
      return this.prisma.userRole.create({
        data: { userId, roleName },
      });
    }

    return existingRole;
  }
}

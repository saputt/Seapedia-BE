import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashToken, extractTokenFromHeader } from 'src/common/helpers/token-blacklist.helper';

@Injectable()
export class TokenBlacklistService {
  constructor(private prisma: PrismaService) {}

  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    const tokenHash = hashToken(token);
    await this.prisma.tokenBlacklist.create({
      data: {
        tokenHash,
        expiresAt,
      },
    });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const tokenHash = hashToken(token);
    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { tokenHash },
    });
    return !!blacklisted;
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.tokenBlacklist.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    return extractTokenFromHeader(authHeader);
  }
}
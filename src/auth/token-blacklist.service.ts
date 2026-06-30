import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashToken, extractTokenFromHeader } from 'src/common/helpers/token-blacklist.helper';

@Injectable()
export class TokenBlacklistService {
  private cache = new Map<string, boolean>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_TTL_MS = 30_000;

  constructor(private prisma: PrismaService) {}

  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    const tokenHash = hashToken(token);
    await this.prisma.tokenBlacklist.create({
      data: {
        tokenHash,
        expiresAt,
      },
    });
    this.cache.set(tokenHash, true);
    this.cacheTimestamps.set(tokenHash, Date.now());
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const tokenHash = hashToken(token);

    const cached = this.cache.get(tokenHash);
    const cachedAt = this.cacheTimestamps.get(tokenHash);
    if (cached !== undefined && cachedAt && Date.now() - cachedAt < this.CACHE_TTL_MS) {
      return cached;
    }

    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { tokenHash },
    });
    const result = !!blacklisted;

    this.cache.set(tokenHash, result);
    this.cacheTimestamps.set(tokenHash, Date.now());

    return result;
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
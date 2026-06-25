import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenBlacklistService } from 'src/auth/token-blacklist.service';

@Injectable()
export class TokenBlacklistGuard implements CanActivate {
  constructor(private tokenBlacklistService: TokenBlacklistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    const token = this.tokenBlacklistService.extractTokenFromHeader(authHeader);
    if (!token) {
      return true;
    }

    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return true;
  }
}
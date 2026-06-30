import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('SECRET_JWT')!,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { id: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, lastActiveRole: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or has been deleted');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.lastActiveRole,
    };
  }
}

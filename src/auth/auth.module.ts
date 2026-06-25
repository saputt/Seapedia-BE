import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { TokenBlacklistService } from './token-blacklist.service';
import { TokenBlacklistGuard } from './guards/token-blacklist.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy, TokenBlacklistService, TokenBlacklistGuard],
  imports: [
    PrismaModule,
    UserModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('SECRET_JWT'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [AuthRepository, TokenBlacklistService],
})
export class AuthModule {}

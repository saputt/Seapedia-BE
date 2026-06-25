import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { TopUpWalletDto } from './dto/top-up-wallet.dto';
import { WalletType } from '@prisma/client';
import { RoleName } from '@prisma/client';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet info (balance)' })
  @ApiResponse({ status: 200, description: 'Wallet info retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWallet(@GetUser('id') userId: string) {
    const wallet = await this.walletService.getWallet(userId);
    return {
      message: 'get wallet success',
      data: wallet,
    };
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('topup')
  @UseGuards(RoleGuard(RoleName.BUYER))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Top up wallet balance' })
  @ApiResponse({ status: 201, description: 'Wallet topped up successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid amount)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden. Buyer only' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests (rate limit exceeded)',
  })
  async topUpWallet(
    @GetUser('id') userId: string,
    @Body() dto: TopUpWalletDto,
  ) {
    const topUpWalletResult = await this.walletService.increaseBalance(
      dto.amount,
      userId,
      WalletType.TOP_UP,
    );
    return {
      message: 'topup wallet success',
      data: topUpWalletResult,
    };
  }

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiResponse({ status: 201, description: 'Get wallet transaction success' })
  async getWalletTransaction(
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ) {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 5));
    const getWalletTransactionResult =
      await this.walletService.getWalletTransaction(
        userId,
        safePage,
        safeLimit,
        role,
        startDate,
        endDate,
        type,
      );
    return {
      message: 'get wallet transaction success',
      data: getWalletTransactionResult,
    };
  }
}

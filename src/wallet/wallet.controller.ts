import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { TopUpWalletDto } from "./dto/top-up-wallet.dto";
import { BuyerGuard } from "src/common/guards/buyer.guard";
import { WalletType } from "@prisma/client";

@Controller("wallet")
@UseGuards(JwtAuthGuard, BuyerGuard)
export class WalletController {
    constructor(private walletService : WalletService) {}

    @Post("topup")
    async topUpWallet(@GetUser("id") userId : string, @Body() dto : TopUpWalletDto) {
        const topUpWalletResult = await this.walletService.increaseBalance(dto.amount, userId, WalletType.TOP_UP)
        return {
            message : "topup wallet success",
            data : topUpWalletResult
        }
    }
}
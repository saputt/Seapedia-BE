import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { TopUpWalletDto } from "./dto/top-up-wallet.dto";

@Controller("buyer/wallet/topup")
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private walletService : WalletService) {}

    @Post()
    async topUpWallet(@GetUser("id") userId : string, @Body() dto : TopUpWalletDto) {
        const topUpWalletResult = await this.walletService.topUpWallet(dto, userId)
        return {
            message : "topup wallet success",
            data : topUpWalletResult
        }
    }
}
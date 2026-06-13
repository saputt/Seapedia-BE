import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { WalletRepository } from "./wallet.repository";
import { TopUpWalletDto } from "./dto/top-up-wallet.dto";

@Injectable()
export class WalletService {
    constructor(private walletRepo : WalletRepository) {}

    async isWalletExist(userId : string) {
        const wallet = await this.walletRepo.findWalletByUserId(userId)
        if (!wallet) throw new NotFoundException("wallet not found")
        return wallet
    }

    async topUpWallet(dto : TopUpWalletDto, userId : string) {
        const wallet = await this.isWalletExist(userId)
        return this.walletRepo.topUpWallet(dto, wallet.id)
    }
}
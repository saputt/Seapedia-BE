import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { WalletRepository } from "./wallet.repository";
import { TopUpWalletDto } from "./dto/top-up-wallet.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class WalletService {
    constructor(
        private walletRepo : WalletRepository,
        private prisma : PrismaService
    ) {}

    async isWalletExist(userId : string, tx? : Prisma.TransactionClient) {
        const isTx = tx ?? null
        const wallet = await this.walletRepo.findWalletByUserId(userId, isTx)
        if (!wallet) throw new NotFoundException("wallet not found")
        return wallet
    }

    async topUpWallet(dto : TopUpWalletDto, userId : string) {
        const wallet = await this.isWalletExist(userId)

        // return this.walletRepo.topUpWallet(dto, wallet.id)
    }

    async verifyAndReduceBalance(tx : Prisma.TransactionClient, userId : string, amount : number) {
        const wallet = await this.isWalletExist(userId, tx)
        if (wallet.balance < amount) throw new BadRequestException("your balance is not sufficient for checkout")
        return this.walletRepo.reduceBalance(tx, userId, wallet.balance, amount)
    }
}
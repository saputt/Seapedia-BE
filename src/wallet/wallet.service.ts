import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { TransactionLog, WalletRepository } from "./wallet.repository";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma, WalletType } from "@prisma/client";

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

    async increaseBalance(amount : number, userId : string, type : WalletType, tx? : Prisma.TransactionClient) {
        const wallet = await this.isWalletExist(userId, tx)

        const totalBalance = wallet.balance + amount

        const walletBalance = await this.walletRepo.updateBalance(tx, userId, totalBalance)

        const walletLog : TransactionLog = {
            amount : amount,
            type : type
        }

        await this.walletRepo.createTransactionLog(walletLog, wallet.id, tx)            

        return walletBalance
    }

    async verifyAndReduceBalance(tx : Prisma.TransactionClient, userId : string, amount : number, type : WalletType) {
        const wallet = await this.isWalletExist(userId, tx)
        if (wallet.balance < amount) throw new BadRequestException("your balance is not sufficient for checkout")
        const totalReduce = wallet.balance - amount
        const walletUpdated = await this.walletRepo.updateBalance(tx, userId, totalReduce)
        const transactionLog : TransactionLog = {
            amount,
            type,
        }
        await this.walletRepo.createTransactionLog(transactionLog, wallet.id, tx)
        return walletUpdated
    }

    async verifyAndRollbackBalance(tx : Prisma.TransactionClient, userId : string, amount : number, type : WalletType) {
        const wallet = await this.isWalletExist(userId, tx)
        const totalRollback = wallet.balance + amount
        const walletUpdated = await this.walletRepo.updateBalance(tx, userId, totalRollback)
        const transactionLog : TransactionLog = {
            amount,
            type
        }
        await this.walletRepo.createTransactionLog(transactionLog, wallet.id, tx)
        return walletUpdated
    }
}
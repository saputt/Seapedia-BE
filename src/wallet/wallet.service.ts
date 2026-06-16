import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { TransactionLog, WalletRepository } from "./wallet.repository";
import { Prisma, RoleName, WalletType } from "@prisma/client";

@Injectable()
export class WalletService {
    constructor(
        private walletRepo : WalletRepository
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
        const result = await this.walletRepo.reduceBalanceAtomically(tx, userId, amount)
        if (result.count === 0) throw new BadRequestException("your balance is not sufficient for checkout")
        const transactionLog : TransactionLog = {
            amount,
            type,
        }
        await this.walletRepo.createTransactionLog(transactionLog, wallet.id, tx)
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

    async getWalletTransaction(userId : string, role : RoleName) {
        const wallet = await this.isWalletExist(userId)

        let whereConditions : any = {}

        if (role == RoleName.DRIVER) {
            whereConditions.type = WalletType.DRIVER_EARNING
        }

        if (role == RoleName.SELLER) {
            whereConditions.type = WalletType.DRIVER_EARNING
        }

        if (role == RoleName.BUYER) {
            whereConditions.OR = [
                {
                    type : WalletType.DRIVER_EARNING
                },
                {
                    type : WalletType.DRIVER_EARNING
                },
            ]
        }

        return this.walletRepo.getTransaction(whereConditions)
    }
}
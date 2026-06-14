import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { TopUpWalletDto } from "./dto/top-up-wallet.dto";
import { Prisma, WalletType } from "@prisma/client";

export interface TransactionLog {
    amount : number
    type : WalletType,
    description? : string
}

@Injectable()
export class WalletRepository {
    constructor(private prisma : PrismaService) {}

    async findWalletByUserId(userId : string, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.wallet.findFirst({
            where : {
                userId
            }
        })
    }

    async createTransactionLog(log : TransactionLog, walletId : string) {
        return this.prisma.walletTransaction.create({
            data : {
                walletId,
                amount : log.amount,
                type : log.type,
                description : log.description ?? null
            }
        })
    }

    async updateBalance(tx : Prisma.TransactionClient, userId : string, balance : number) {
        return tx.wallet.update({
            where : {
                userId
            },
            data : {
                balance
            }
        })
    }
}
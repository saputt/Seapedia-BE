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

    async createTransactionLog(log : TransactionLog, walletId : string, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.walletTransaction.create({
            data : {
                walletId,
                amount : log.amount,
                type : log.type,
                description : log.description ?? null
            }
        })
    }

    async reduceBalanceAtomically(tx : Prisma.TransactionClient, userId : string, amount : number) {
        return tx.wallet.updateMany({
            where : {
                userId,
                balance : { gte : amount }
            },
            data : {
                balance : { decrement : amount }
            }
        })
    }

    async updateBalance(tx : Prisma.TransactionClient | undefined, userId : string, balance : number) {
        const prismaClient = tx ?? this.prisma
        return prismaClient.wallet.update({
            where : {
                userId
            },
            data : {
                balance
            }
        })
    }

    async getTransaction(walletId : string, page : number, limit : number) {
        const [data, total] = await this.prisma.$transaction([
            this.prisma.walletTransaction.findMany({
                where : { walletId },
                orderBy : { createdAt : "desc" },
                skip : (page - 1) * limit,
                take : limit
            }),
            this.prisma.walletTransaction.count({ where : { walletId } })
        ])
        return { data, total, page, totalPages : Math.ceil(total / limit) }
    }
}
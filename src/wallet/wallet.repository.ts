import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { TopUpWalletDto } from "./dto/top-up-wallet.dto";
import { Prisma } from "@prisma/client";

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

    async topUpWallet(tx : any, dto : TopUpWalletDto, walletId : string) {
        return tx.wallet.update({
            where : {
                id : walletId
            },
            data : {
                balance : {
                    increment : dto.balance
                }
            }
        })
    }   

    async reduceBalance(tx : Prisma.TransactionClient, userId : string, freshBalance : number, amount : number) {
        return tx.wallet.update({
            where : {
                userId
            },
            data : {
                balance : freshBalance - amount
            }
        })
    }
}
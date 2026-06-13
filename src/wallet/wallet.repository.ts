import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { TopUpWalletDto } from "./dto/top-up-wallet.dto";

@Injectable()
export class WalletRepository {
    constructor(private prisma : PrismaService) {}

    async findWalletByUserId(userId : string) {
        return this.prisma.wallet.findFirst({
            where : {
                userId
            }
        })
    }

    async topUpWallet(dto : TopUpWalletDto, walletId : string) {
        return this.prisma.wallet.update({
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
}
import { Module } from "@nestjs/common";
import { WalletRepository } from "./wallet.repository";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    providers : [WalletRepository, WalletService],
    controllers : [WalletController],
    imports : [PrismaModule]
})
export class WalletModule {}
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./order.repository";
import { PrismaModule } from "src/prisma/prisma.module";
import { StoreModule } from "src/store/store.module";
import { CartModule } from "src/cart/cart.module";
import { DiscountModule } from "src/discount/discount.module";
import { AddressModule } from "src/address/address.module";
import { WalletModule } from "src/wallet/wallet.module";
import { ProductModule } from "src/product/product.module";

@Module({
    controllers : [OrderController],
    providers : [OrderService, OrderRepository],
    imports : [PrismaModule, StoreModule, CartModule, DiscountModule, AddressModule, WalletModule, ProductModule, JwtModule.register({})]
})
export class OrderModule {}
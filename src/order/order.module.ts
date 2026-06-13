import { Module } from "@nestjs/common";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./order.repository";
import { PrismaModule } from "src/prisma/prisma.module";
import { StoreModule } from "src/store/store.module";
import { CartModule } from "src/cart/cart.module";
import { DiscountRepository } from "src/discount/discount.repository";
import { AddressRepository } from "src/address/address.repository";

@Module({
    controllers : [OrderController],
    providers : [OrderService, OrderRepository],
    imports : [PrismaModule, OrderModule, StoreModule, CartModule, DiscountRepository, AddressRepository]
})
export class OrderModule {}
import { Module } from "@nestjs/common";
import { CartService } from "./cart.service";
import { CartRepository } from "./cart.repository";
import { CartController } from "./cart.controller";
import { ProductModule } from "src/product/product.module";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    providers : [CartService, CartRepository],
    controllers : [CartController],
    exports : [CartService],
    imports : [ProductModule, PrismaModule]
})
export class CartModule {}
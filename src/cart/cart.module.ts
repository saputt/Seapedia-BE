import { Module } from "@nestjs/common";
import { CartService } from "./cart.service";
import { CartRepository } from "./cart.repository";
import { CartController } from "./cart.controller";
import { ProductModule } from "src/product/product.module";
import { DiscountModule } from "src/discount/discount.module";

@Module({
    providers : [CartService, CartRepository],
    controllers : [CartController],
    imports : [ProductModule, DiscountModule]
})
export class CartModule {}
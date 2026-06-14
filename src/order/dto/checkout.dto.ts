// buyerId      String         @map("buyer_id")
//   storeId      String         @map("store_id")   
//   addressId    String         @map("address_id")
//   discountId   String?        @map("discount_id")
//   status       OrderStatus    @default(PENDING)
//   shippingMethod ShippingMethod @map("shipping_method")
//   addressSnapshot String @map("address_snapshot")
//   subtotal     Int          
//   discountValue Int          @default(0) @map("discount_value") 
//   shippingFee  Int           @map("shipping_fee") 
//   taxFee       Int           @map("tax_fee")    
//   totalPrice   Int           @map("total_price") 

import { ShippingMethod } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CheckoutDto {
    @IsNotEmpty()
    @IsEnum(ShippingMethod)
    shippingMethod : ShippingMethod

    @IsNotEmpty()
    @IsString()
    storeId : string

    @IsNotEmpty()
    @IsString()
    addressId : string

    @IsOptional()
    @IsString()
    discountCode : string
}
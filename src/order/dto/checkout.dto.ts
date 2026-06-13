import { ShippingMethod } from "@prisma/client"
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CheckoutDto {
    @IsNotEmpty()
    @IsString()
    addressId : string

    @IsOptional()
    @IsString()
    discountCode : string

    @IsNotEmpty()
    @IsEnum(ShippingMethod)
    shippingMethod : ShippingMethod
}
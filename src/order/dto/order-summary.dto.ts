import { ShippingMethod } from "@prisma/client"
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class OrderSummaryDto {
    @IsOptional()
    @IsString()
    discountCode : string

    @IsOptional()
    @IsEnum(ShippingMethod)
    shippingMethod : ShippingMethod
}
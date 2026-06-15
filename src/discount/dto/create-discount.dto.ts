import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { DiscountType } from "@prisma/client"
import { Type } from "class-transformer"
import { IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateIf } from "class-validator"

export class CreateDiscountDto {
    @ApiProperty({
        example : "DISKON50",
        description : "Unique discount code"
    })
    @IsNotEmpty()
    @IsString()
    code : string

    @ApiProperty({
        example : "VOUCHER",
        description : "Type of discount (VOUCHER or PROMO)",
        enum : DiscountType
    })
    @IsNotEmpty()
    @IsEnum(DiscountType)
    type : DiscountType

    @ApiProperty({
        example : 50,
        description : "Discount value. If isPercent is true, max is 100"
    })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @ValidateIf((o) => o.isPercent === true)
    @Max(100, {message : "discount percent cannot more than 100"})
    value : number

    @ApiPropertyOptional({
        example : true,
        description : "Whether the discount is a percentage or fixed amount"
    })
    @IsOptional()
    @IsBoolean()
    isPercent : boolean

    @ApiPropertyOptional({
        example : 100,
        description : "Maximum number of times this discount can be used"
    })
    @IsOptional()
    @IsInt()
    maxUses : number

    @ApiProperty({
        example : "2026-12-31T23:59:59.000Z",
        description : "Expiration date of the discount"
    })
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    expiredAt : Date
}
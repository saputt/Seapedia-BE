import { DiscountType } from "@prisma/client"
import { Type } from "class-transformer"
import { IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator"

export class CreateDiscountDto {
    @IsNotEmpty()
    @IsString()
    code : string

    @IsNotEmpty()
    @IsEnum(DiscountType)
    type : DiscountType

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    value : number

    @IsOptional()
    @IsBoolean()
    isPercent : boolean

    @IsOptional()
    @IsInt()
    maxUses : number

    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    expiredAt : Date
}
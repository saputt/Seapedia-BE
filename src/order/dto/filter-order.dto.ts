import { OrderStatus } from "@prisma/client"
import { IsEnum, IsOptional, IsString } from "class-validator"

enum OrderBy {
    asc = "asc",
    dsc = "desc"
}

export class FilterOrderDto {
    @IsOptional()
    @IsString()
    status : OrderStatus

    @IsOptional()
    @IsEnum(OrderBy)
    orderBy : OrderBy
}
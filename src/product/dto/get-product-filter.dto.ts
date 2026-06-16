import { Type } from "class-transformer"
import { IsOptional, IsString, IsNumber } from "class-validator"

export class GetProductFilterDto {
    @IsOptional()
    @IsString()
    search : string

    @IsOptional()
    @IsString()
    storeId : string

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minPrice : number

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxPrice : number

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page : number = 1

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit : number = 12
}
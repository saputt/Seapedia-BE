import { Type } from "class-transformer"

export class GetProductFilterDto {
    search : string
    storeId : string
    minPrice : number
    maxPrice : number

    @Type(() => Number)
    page : number = 1

    @Type(() => Number)
    limit : number = 12
}
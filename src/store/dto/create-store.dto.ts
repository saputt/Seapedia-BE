import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString } from "class-validator"

export class CreateStoreDto {
    @ApiProperty({
        example : "Toko Elektronik Jaya",
        description : "Store name (must be unique)"
    })
    @IsNotEmpty()
    @IsString()
    storeName : string

    @ApiProperty({
        example : "Menjual berbagai elektronik dan aksesoris",
        description : "Store description"
    })
    @IsNotEmpty()
    @IsString()
    description : string
}
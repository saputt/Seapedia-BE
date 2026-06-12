import { IsNotEmpty, IsString } from "class-validator"

export class CreateStoreDto {
    @IsNotEmpty()
    @IsString()
    storeName : string

    @IsNotEmpty()
    @IsString()
    description : string
}
import { IsNotEmpty, IsString } from "class-validator"

export class CreateAddressDto {
    @IsNotEmpty()
    @IsString()
    label : string

    @IsNotEmpty()
    @IsString()
    completeAddress : string
}
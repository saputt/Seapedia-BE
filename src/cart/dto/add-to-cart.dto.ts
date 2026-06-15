import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, Min } from "class-validator";

export class AddToCartDto {
    @ApiProperty({
        example : 2,
        description : "Quantity to add (minimum 1)"
    })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity : number
}
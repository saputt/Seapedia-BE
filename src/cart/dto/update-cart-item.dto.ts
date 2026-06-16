import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, Min } from "class-validator";

export class UpdateCartItemDto {
    @ApiProperty({
        example : 3,
        description : "New quantity for the cart item (minimum 1)"
    })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity : number
}

import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, Min } from "class-validator";

export class TopUpWalletDto {
    @ApiProperty({
        example : 100000,
        description : "Amount to top up in IDR (minimum 1)"
    })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    amount : number
}
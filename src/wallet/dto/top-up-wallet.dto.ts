import { IsInt, IsNotEmpty, Min } from "class-validator";

export class TopUpWalletDto {
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    amount : number
}
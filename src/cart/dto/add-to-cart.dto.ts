import { IsInt, IsNotEmpty, Min } from "class-validator";

export class AddToCartDto {
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity : number
}
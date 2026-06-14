import { IsNotEmpty, IsString } from "class-validator";

export class FindDiscountDto {
    @IsNotEmpty()
    @IsString()
    code : string
}
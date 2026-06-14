import { OrderStatus } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class UpdateStatusOrderDto {
    @IsNotEmpty()
    @IsString()
    storeId : string
}
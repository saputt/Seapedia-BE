import { ApiProperty } from "@nestjs/swagger"
import { RoleName } from "@prisma/client"
import { IsEnum, IsNotEmpty } from "class-validator"

export class SwitchRoleDto {
    @ApiProperty({
        example : "SELLER",
        description : "Target role to switch to. Must be one of: BUYER, SELLER, DRIVER, ADMIN",
        enum : RoleName
    })
    @IsNotEmpty()
    @IsEnum(RoleName)
    role : RoleName
}
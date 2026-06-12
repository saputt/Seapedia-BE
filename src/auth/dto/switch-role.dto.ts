import { RoleName } from "@prisma/client"
import { IsEnum, IsNotEmpty, IsString } from "class-validator"

export class SwitchRoleDto {
    @IsNotEmpty()
    @IsEnum(RoleName)
    role : RoleName
}
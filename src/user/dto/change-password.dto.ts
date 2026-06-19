import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, MinLength } from "class-validator"

export class ChangePasswordDto {
    @ApiProperty({ example : "oldPassword123", description : "Current password" })
    @IsNotEmpty()
    @IsString()
    oldPassword : string

    @ApiProperty({ example : "newSecurePass456", description : "New password (min 8 characters)" })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, {message : "minimal length password is 8 character"})
    newPassword : string
}

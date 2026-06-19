import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, MinLength } from "class-validator"

export class UpdateProfileDto {
    @ApiProperty({ example : "john_doe", description : "New username (min 4 characters)" })
    @IsNotEmpty()
    @IsString()
    @MinLength(4, {message : "minimal length username is 4 character"})
    username : string
}

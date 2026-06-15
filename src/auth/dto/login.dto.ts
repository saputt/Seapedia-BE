import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class LoginDto {
    @ApiProperty({
        example : 'guest@gmail.com',
        description : "Registered user email address"
    })
    @IsNotEmpty()
    @IsEmail()
    email : string

    @ApiProperty({
        example : "password123",
        description : "Account password"
    })
    @IsNotEmpty()
    @IsString()
    password : string
}
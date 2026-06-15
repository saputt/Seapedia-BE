import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator"

export class RegisterDto {
    @ApiProperty({
        example : "john_doe",
        description : "Username must be at least 4 characters"
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(4, {message : "minimal length username is 4 character"})
    username : string
    
    @ApiProperty({
        example : "john@example.com",
        description : "User email address (must be unique)"
    })
    @IsNotEmpty()
    @IsEmail()
    email : string

    @ApiProperty({
        example : "securePassword123",
        description : "Password must be at least 8 characters"
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, {message : "minimal length password is 8 character"})
    password : string
}
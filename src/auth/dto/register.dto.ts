import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator"

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(4, {message : "minimal length username is 4 character"})
    username : string
    
    @IsNotEmpty()
    @IsEmail()
    email : string

    @IsNotEmpty()
    @IsString()
    @MinLength(8, {message : "minimal length password is 8 character"})
    password : string
}
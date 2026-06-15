import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateProductDto {
    @ApiProperty({
        example : "Gaming Mouse",
        description : "Product name"
    })
    @IsNotEmpty()
    @IsString()
    name : string

    @ApiProperty({
        example : "High-performance gaming mouse with RGB lighting",
        description : "Product description"
    })
    @IsNotEmpty()
    @IsString()
    description : string

    @ApiProperty({
        example : 150000,
        description : "Product price in IDR"
    })
    @IsNotEmpty()
    @IsInt()
    price : number

    @ApiProperty({
        example : 50,
        description : "Available stock quantity"
    })
    @IsNotEmpty()
    @IsInt()
    stock : number

    @ApiPropertyOptional({
        example : "https://example.com/image.jpg",
        description : "Product image URL"
    })
    @IsOptional()
    @IsString()
    imageUrl : string
}
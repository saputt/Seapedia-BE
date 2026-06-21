import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProductCategory } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({
    example: 'Gaming Mouse',
    description: 'Product name',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100, { message: 'name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    example: 'High-performance gaming mouse with RGB lighting',
    description: 'Product description',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000, { message: 'description must not exceed 2000 characters' })
  description: string;

  @ApiProperty({
    example: 150000,
    description: 'Product price in IDR',
  })
  @IsNotEmpty()
  @IsInt()
  price: number;

  @ApiProperty({
    example: 50,
    description: 'Available stock quantity',
  })
  @IsNotEmpty()
  @IsInt()
  stock: number;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'Product image URL',
  })
  @IsOptional()
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({
    example: 'ELECTRONICS',
    description: 'Product category',
    enum: ProductCategory,
  })
  @IsOptional()
  @IsEnum(ProductCategory)
  category: ProductCategory;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({
    example: 'Toko Elektronik Jaya',
    description: 'Store name (must be unique)',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'storeName must not exceed 50 characters' })
  storeName: string;

  @ApiProperty({
    example: 'Menjual berbagai elektronik dan aksesoris',
    description: 'Store description',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500, { message: 'description must not exceed 500 characters' })
  description: string;
}

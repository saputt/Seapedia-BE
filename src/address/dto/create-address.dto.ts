import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    example: 'Home',
    description: 'Address label (e.g. Home, Office)',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'label must not exceed 50 characters' })
  label: string;

  @ApiProperty({
    example: 'Jl. Merdeka No. 123, Jakarta Pusat',
    description: 'Complete address',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500, { message: 'address must not exceed 500 characters' })
  completeAddress: string;
}

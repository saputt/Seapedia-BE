import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    example: 'Home',
    description: 'Address label (e.g. Home, Office)',
  })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({
    example: 'Jl. Merdeka No. 123, Jakarta Pusat',
    description: 'Complete address',
  })
  @IsNotEmpty()
  @IsString()
  completeAddress: string;
}

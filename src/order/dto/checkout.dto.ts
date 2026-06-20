import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'Order token obtained from order summary step',
  })
  @IsNotEmpty()
  @IsString()
  orderToken: string;

  @ApiProperty({
    example: 'cm2x...',
    description: 'Address ID for delivery',
  })
  @IsNotEmpty()
  @IsString()
  addressId: string;
}

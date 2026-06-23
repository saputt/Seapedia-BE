import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    example: 2,
    description: 'Quantity to add (minimum 1)',
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  // Optional flag indicating that the request should force‑clear the cart
  // before adding the new product (used when the cart contains items from a
  // different store). It is ignored by validation when omitted.
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

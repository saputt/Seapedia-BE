import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMethod } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class OrderSummaryDto {
  @ApiPropertyOptional({
    example: 'DISC123',
    description: 'Discount code to apply (optional)',
  })
  @IsOptional()
  @IsString()
  discountCode: string;

  @ApiPropertyOptional({
    example: 'REGULAR',
    description:
      'Shipping method (REGULAR, INSTANT, NEXT_DAY). Defaults to REGULAR',
    enum: ShippingMethod,
  })
  @IsOptional()
  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class OrderSummaryItemDto {
  @ApiProperty({ example: 'uuid-product-id', description: 'Product ID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 1, description: 'Quantity to buy' })
  @IsInt()
  @Min(1)
  quantity: number;
}

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

  @ApiPropertyOptional({
    description:
      'Items for direct buy (bypasses cart). Omit to use cart items.',
    type: [OrderSummaryItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderSummaryItemDto)
  items?: OrderSummaryItemDto[];
}

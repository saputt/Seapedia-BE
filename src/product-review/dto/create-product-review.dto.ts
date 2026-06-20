import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateProductReviewDto {
  @ApiProperty({ example: 5, description: 'Rating score (1-5)' })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'minimal rating is 1' })
  @Max(5, { message: 'maximal rating is 5' })
  rating: number;

  @ApiProperty({ example: 'Great product!', description: 'Review comment' })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiProperty({
    example: 'uuid-order-id',
    description: 'Order ID to verify purchase',
  })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;
}

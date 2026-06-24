import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateStatusOrderDto {
  @ApiProperty({
    example: 'cm2x...',
    description: 'Store ID associated with the order',
  })
  @IsNotEmpty()
  @IsUUID()
  storeId: string;
}

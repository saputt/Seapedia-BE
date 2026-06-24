import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

enum OrderBy {
  asc = 'asc',
  dsc = 'desc',
}

export class FilterOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsEnum(OrderBy)
  orderBy: OrderBy;
}

import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ProductCategory } from '@prisma/client';

enum SortBy {
  price_asc = 'price_asc',
  price_desc = 'price_desc',
  newest = 'newest',
  oldest = 'oldest',
}

export class GetProductFilterDto {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsString()
  storeId: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice: number;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy: SortBy = SortBy.newest;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number = 12;

  @IsOptional()
  @Type(() => Boolean)
  showHidden: boolean = false;
}

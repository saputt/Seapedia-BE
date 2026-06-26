import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDriverReviewDto {
  @ApiProperty({ example: 5, description: 'Rating score (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great driver!', description: 'Review comment' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

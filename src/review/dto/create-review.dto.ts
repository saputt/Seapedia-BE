import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 'Tester',
    description: 'Reviewer name (3-15 characters)',
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 15, { message: 'min length is 3 and max length is 15' })
  reviewerName: string;

  @ApiProperty({
    example: 5,
    description: 'Rating score (1-5)',
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'minimal rating is 1' })
  @Max(5, { message: 'maximal rating is 5' })
  rating: number;

  @ApiProperty({
    example: 'Great app! Very useful for daily needs.',
    description: 'Review comment',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000, { message: 'comment must not exceed 1000 characters' })
  comment: string;
}

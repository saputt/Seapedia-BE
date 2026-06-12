import { IsInt, IsNotEmpty, IsNumber, IsString, Length, Max, Min } from "class-validator"

export class CreateReviewDto {
    @IsNotEmpty()
    @IsString()
    @Length(3, 15, {message : "min length is 3 and max length is 15"})
    reviewerName : string

    @IsNotEmpty()
    @IsInt()
    @Min(1, {message : "minimal rating is 1"})
    @Max(5, {message : "maximal rating is 5"})
    rating : number

    @IsNotEmpty()
    @IsString()
    comment : string
}
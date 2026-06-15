import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, Max, Min } from "class-validator";

export class SimulateOverdueDto {
    @ApiProperty({
        example : 7,
        description : "Number of days to skip forward for simulating overdue orders"
    })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(365)
    dayToSkip : number
}
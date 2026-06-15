import { IsInt, IsNotEmpty, Max, Min } from "class-validator";

export class SimulateOverdueDto {
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(365)
    dayToSkip : number
}
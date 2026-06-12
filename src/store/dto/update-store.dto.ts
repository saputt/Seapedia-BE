import { PartialType } from "@nestjs/mapped-types";
import { CreateStoreDto } from "./create-store.dto";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateStoreDto extends PartialType(CreateStoreDto) {}
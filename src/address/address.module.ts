import { Module } from "@nestjs/common";
import { AddressRepository } from "./address.repository";
import { AddressService } from "./address.service";
import { AddressController } from "./address.controller";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    providers : [AddressRepository, AddressService],
    controllers : [AddressController],
    imports : [PrismaModule]
})
export class AddressModule {}
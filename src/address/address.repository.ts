import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

@Injectable()
export class AddressRepository {
    constructor(private prisma : PrismaService) {}

    async createAddress(dto : CreateAddressDto, userId : string) {
        return this.prisma.address.create({
            data : {
                label : dto.label,
                completeAddress : dto.completeAddress,
                userId,
            }
        })
    }

    async findAddressById(addressId : string) {
        return this.prisma.address.findUnique({
            where : {
                id : addressId
            }
        })
    }

    async updateAddress(dto : UpdateAddressDto, addressId : string) {
        return this.prisma.address.update({
            where : {
                id : addressId
            },
            data : dto
        })
    }

    async deleteAddress(addressId : string) {
        return this.prisma.address.delete({
            where : {
                id : addressId
            }
        })
    }

    async findAdressesUser(userId : string)
}
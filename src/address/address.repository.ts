import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "@prisma/client";
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

    async markAsLastUsed(addressId : string, userId : string, tx? : Prisma.TransactionClient) {
        const prismaClient = tx ?? this.prisma
        await prismaClient.address.updateMany({
            where : { userId },
            data : { lastUsed : false }
        })
        return prismaClient.address.update({
            where : { id : addressId },
            data : { lastUsed : true }
        })
    }

    async findAdressesUser(userId : string) {
        return this.prisma.address.findMany({
            where : {
                userId
            },
            orderBy : {
                createdAt : "desc"
            }
        })
    }
}
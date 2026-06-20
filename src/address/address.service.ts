import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AddressRepository } from "./address.repository";
import { Prisma } from "@prisma/client";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

/**
 * Service untuk mengelola alamat pengguna.
 * Menyediakan CRUD alamat (buat, update, hapus) dan penanda alamat terakhir digunakan.
 * Setiap operasi validasi kepemilikan alamat (alamat harus milik pengguna yang sedang login).
 */
@Injectable()
export class AddressService {
    constructor(private addressRepo : AddressRepository) {}

    async isAddressMine(addressId : string, userId : string) {
        const address = await this.addressRepo.findAddressById(addressId)
        if (!address) throw new NotFoundException("address not found")
        if (address.userId !== userId) throw new ForbiddenException("you're not authorized to update this address")
        return address
    }

    async getAdresses(userId : string) {
        return this.addressRepo.findAdressesUser(userId)
    }

    async createAddress(dto : CreateAddressDto, userId : string) {
        return await this.addressRepo.createAddress(dto, userId)
    }

    async updateAddress(dto : UpdateAddressDto, addressId : string, userId : string) {
        const address = await this.isAddressMine(addressId, userId)
        return await this.addressRepo.updateAddress(dto, addressId)
    }

    async deleteAddress(addressId : string, userId : string) {
        await this.isAddressMine(addressId, userId)
        return await this.addressRepo.deleteAddress(addressId)
    }

    async markAsLastUsed(addressId : string, userId : string, tx? : Prisma.TransactionClient) {
        return this.addressRepo.markAsLastUsed(addressId, userId, tx)
    }
}
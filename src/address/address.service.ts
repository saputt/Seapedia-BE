import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AddressRepository } from "./address.repository";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

@Injectable()
export class AddressService {
    constructor(private addressRepo : AddressRepository) {}

    async isAddressMine(addressId : string, userId : string) {
        const address = await this.addressRepo.findAddressById(addressId)
        if (!address) throw new NotFoundException("address not found")
        if (address.userId !== userId) throw new ForbiddenException("you're not authorized to update this address")
        return address
    }

    async createAddress(dto : CreateAddressDto, userId : string) {
        return await this.addressRepo.createAddress(dto, userId)
    }

    async updateAddress(dto : UpdateAddressDto, addressId : string, userId : string) {
        const address = await this.isAddressMine(addressId, userId)
        const updateData = {
            label : dto.label || address.label,
            completeAddress : dto.completeAddress || address.completeAddress
        }
        return await this.addressRepo.updateAddress(updateData, addressId)
    }

    async deleteAddress(addressId : string, userId : string) {
        await this.isAddressMine(addressId, userId)
        return await this.addressRepo.deleteAddress(addressId)
    }
}
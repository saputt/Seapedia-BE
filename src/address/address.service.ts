import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AddressRepository } from "./address.repository";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

@Injectable()
export class AddressService {
    constructor(private addressRepo : AddressRepository) {}

    async isAddressMine(addressId : string, userId : string) {
        const address = await this.addressRepo.findAddressById(addressId)
        if (!address) throw new NotFoundException("address not found")
        if (address.userId !== userId) throw new UnauthorizedException("you're not authorized to update this address")
        return address
    }

    async createAddress(dto : CreateAddressDto, userId : string) {
        const address = await this.addressRepo.createAddress(dto, userId)
        return {
            address
        }
    }

    async updateAddress(dto : UpdateAddressDto, addressId : string, userId : string) {
        const address = await this.isAddressMine(addressId, userId)
        const updateAddress = {
            label : dto.label || address.label,
            completeAddress : dto.completeAddress || address.completeAddress
        }
        const addressUpdated = await this.addressRepo.updateAddress(updateAddress, userId)
        return {
            address : addressUpdated
        }
    }

    async deleteAddress(addressId : string, userId : string) {
        await this.isAddressMine(addressId, userId)
        const addressDeleted = await this.addressRepo.deleteAddress(addressId)
        return {
            address : addressDeleted
        }
    }
}
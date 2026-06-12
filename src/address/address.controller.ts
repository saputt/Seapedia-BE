import { Body, Controller, Delete, Param, Post, Put, UseGuards } from "@nestjs/common";
import { AddressService } from "./address.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { BuyerGuard } from "src/common/guards/buyer.guard";

@Controller('buyer/address')
@UseGuards(JwtAuthGuard, BuyerGuard)
export class AddressController {
    constructor(private addressService : AddressService) {}

    @Post()
    async createAddress(@Body() dto : CreateAddressDto, @GetUser('id') userId : string) {
        const createAddressResult = await this.addressService.createAddress(dto, userId)
        return {
            message : "create address success",
            data : createAddressResult
        }
    }

    @Put(":addressId")
    async updateAddress(@Param("addressId") addressId : string, @Body() dto : UpdateAddressDto, @GetUser('id') userId : string) {
        const updateAddressResult = await this.addressService.updateAddress(dto, addressId, userId)
        return {
            message : "update address success",
            data : updateAddressResult
        }
    }

    @Delete(":addressId")
    async deleteAddress(@Param("addressId") addressId : string, @GetUser('id') userId : string) {
        await this.addressService.deleteAddress(addressId, userId)
        return {
            message : "delete address success",
            data : null
        }
    }
}
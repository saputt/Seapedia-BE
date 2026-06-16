import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { AddressService } from "./address.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { BuyerGuard } from "src/common/guards/buyer.guard";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Address")
@Controller("address")
@UseGuards(JwtAuthGuard, BuyerGuard)
export class AddressController {
    constructor(private addressService : AddressService) {}

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary : "Create a new address" })
    @ApiResponse({ status : 201, description : "Address created successfully" })
    @ApiResponse({ status : 400, description : "Validation error" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Buyer only" })
    async createAddress(@Body() dto : CreateAddressDto, @GetUser("id") userId : string) {
        const createAddressResult = await this.addressService.createAddress(dto, userId)
        return {
            message : "create address success",
            data : createAddressResult
        }
    }

    @Put(":addressId")
    @ApiBearerAuth()
    @ApiOperation({ summary : "Update an existing address" })
    @ApiResponse({ status : 200, description : "Address updated successfully" })
    @ApiResponse({ status : 400, description : "Validation error" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Not the address owner" })
    @ApiResponse({ status : 404, description : "Address not found" })
    async updateAddress(@Param("addressId") addressId : string, @Body() dto : UpdateAddressDto, @GetUser("id") userId : string) {
        const updateAddressResult = await this.addressService.updateAddress(dto, addressId, userId)
        return {
            message : "update address success",
            data : updateAddressResult
        }
    }

    @Delete(":addressId")
    @ApiBearerAuth()
    @ApiOperation({ summary : "Delete an address" })
    @ApiResponse({ status : 200, description : "Address deleted successfully" })
    @ApiResponse({ status : 401, description : "Unauthorized" })
    @ApiResponse({ status : 403, description : "Forbidden. Not the address owner" })
    @ApiResponse({ status : 404, description : "Address not found" })
    async deleteAddress(@Param("addressId") addressId : string, @GetUser("id") userId : string) {
        await this.addressService.deleteAddress(addressId, userId)
        return {
            message : "delete address success",
            data : null
        }
    }

    @Get(":addressId")
    async getAddress(@Param("addressId") addressId : string, @GetUser('id') userId : string) {
        const getAddressResult = await this.addressService.isAddressMine(addressId, userId)
        return {
            message : `get address with id : ${addressId} success`,
            data : getAddressResult
        }
    }

    @Get()
    async getAddresses(@GetUser('id') userId : string) {
        const getAddressesResult = await this.addressService.getAdresses(userId)
        return {
            message : "get all addresess success",
            data : getAddressesResult
        }
    }
}
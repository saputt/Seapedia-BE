import { Injectable } from '@nestjs/common';
import { AddressRepository } from './address.repository';
import { Prisma } from '@prisma/client';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { findOrThrow, checkOwnership } from 'src/common/helpers/prisma.helper';

/**
 * Service untuk mengelola alamat pengguna.
 * Menyediakan CRUD alamat (buat, update, hapus) dan penanda alamat terakhir digunakan.
 * Setiap operasi validasi kepemilikan alamat (alamat harus milik pengguna yang sedang login).
 */
@Injectable()
export class AddressService {
  constructor(private addressRepo: AddressRepository) {}

  async isAddressMine(addressId: string, userId: string) {
    const address = await findOrThrow(
      () => this.addressRepo.findAddressById(addressId),
      'address',
      addressId,
    );
    checkOwnership(address.userId, userId, 'address');
    return address;
  }

  async getAddresses(userId: string) {
    return this.addressRepo.findAddressesUser(userId);
  }

  async createAddress(dto: CreateAddressDto, userId: string) {
    return await this.addressRepo.createAddress(dto, userId);
  }

  async updateAddress(
    dto: UpdateAddressDto,
    addressId: string,
    userId: string,
  ) {
    await this.isAddressMine(addressId, userId);
    return await this.addressRepo.updateAddress(dto, addressId);
  }

  async deleteAddress(addressId: string, userId: string) {
    await this.isAddressMine(addressId, userId);
    return await this.addressRepo.deleteAddress(addressId);
  }

  async markAsLastUsed(
    addressId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.addressRepo.markAsLastUsed(addressId, userId, tx);
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountRepository } from './discount.repository';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Prisma } from '@prisma/client';
import { findOrThrow } from 'src/common/helpers/prisma.helper';

/**
 * Service untuk mengelola diskon/voucher.
 * Menyediakan CRUD diskon, validasi ketersediaan (masa berlaku dan kuota),
 * dan pengelolaan penggunaan voucher saat checkout.
 * Mendukung diskon persentase dan diskon nominal tetap.
 */
@Injectable()
export class DiscountService {
  constructor(private discountRepo: DiscountRepository) {}

  async findDiscountOrThrow(discountId: string, tx?: Prisma.TransactionClient) {
    return findOrThrow(
      () => this.discountRepo.findDiscountById(discountId, tx),
      'discount',
      discountId,
    );
  }

  async isDiscountAlreadyExist(discountCode: string) {
    const discount = await this.discountRepo.findDiscountByCode(discountCode);
    if (discount)
      throw new ConflictException('Conflict. Discount code already exist');
    return false;
  }

  async isDiscountAvailable(
    discountCode: string,
    tx?: Prisma.TransactionClient,
  ) {
    const now = new Date();
    const discount = await this.discountRepo.findDiscountByCode(
      discountCode,
      tx,
    );
    if (!discount) throw new NotFoundException('discount not found');
    if (discount.expiredAt < now)
      throw new BadRequestException('Discount already expired');
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses)
      throw new BadRequestException('voucher is not available');
    return discount;
  }

  async getDiscountForBuyer(discountCode: string) {
    const discount = await this.isDiscountAvailable(discountCode);
    return {
      id: discount.id,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      isPercent: discount.isPercent,
    };
  }

  async updateDiscountUsedCount(
    tx: Prisma.TransactionClient,
    discountId: string,
  ) {
    const discount = await this.findDiscountOrThrow(discountId, tx);
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses)
      throw new BadRequestException('Bad Request. Discount is already sold');
    await this.isDiscountAvailable(discount.code, tx);
    return this.discountRepo.updateDiscountUsedCount(discountId, tx);
  }

  async createDiscount(dto: CreateDiscountDto) {
    await this.isDiscountAlreadyExist(dto.code);
    const discountData = {
      code: dto.code,
      type: dto.type,
      value: dto.value,
      isPercent: dto.isPercent,
      maxUses: dto.maxUses ?? null,
      expiredAt: new Date(dto.expiredAt),
    };
    return this.discountRepo.createDiscount(discountData);
  }

  async getAllDiscountForAdmin() {
    return this.discountRepo.findAllDiscountsForAdmin();
  }

  async updateDiscount(dto: UpdateDiscountDto, discountId: string) {
    await this.findDiscountOrThrow(discountId);
    return this.discountRepo.updateDiscount(discountId, dto);
  }

  async deleteDiscount(discountId: string) {
    await this.findDiscountOrThrow(discountId);
    return this.discountRepo.deleteDiscount(discountId);
  }

  async getDiscountForAdmin(discountId: string) {
    return this.findDiscountOrThrow(discountId);
  }
}

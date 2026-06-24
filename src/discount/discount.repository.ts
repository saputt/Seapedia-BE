import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Prisma } from '@prisma/client';
import { BaseRepository } from 'src/common/repositories/base.repository';

/**
 * Repository untuk akses data diskon di database.
 * Menangani operasi CRUD diskon dan pembaruan jumlah penggunaan voucher.
 */
@Injectable()
export class DiscountRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findDiscountById(discountId: string, tx?: Prisma.TransactionClient) {
    return this.getPrismaClient(tx).discount.findUnique({
      where: {
        id: discountId,
      },
    });
  }

  async findDiscountByCode(
    discountCode: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getPrismaClient(tx).discount.findUnique({
      where: {
        code: discountCode,
      },
    });
  }

  async createDiscount(dto: CreateDiscountDto) {
    return this.prisma.discount.create({
      data: dto,
    });
  }

  async findAllDiscountsForAdmin() {
    return this.prisma.discount.findMany();
  }

  async updateDiscount(discountId: string, dto: UpdateDiscountDto) {
    return this.prisma.discount.update({
      where: {
        id: discountId,
      },
      data: dto,
    });
  }

  async deleteDiscount(discountId: string) {
    return this.prisma.discount.delete({
      where: {
        id: discountId,
      },
    });
  }

  async updateDiscountUsedCount(
    discountId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getPrismaClient(tx).discount.update({
      where: {
        id: discountId,
      },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, WalletType } from '@prisma/client';
import { BaseRepository } from 'src/common/repositories/base.repository';

/**
 * Repository untuk akses data dompet di database.
 * Menangani pencarian dompet, pembuatan log transaksi, pengurangan saldo atomik,
 * dan riwayat transaksi dengan filter berdasarkan tipe transaksi.
 */
export interface TransactionLog {
  amount: number;
  type: WalletType;
  description?: string;
}

@Injectable()
export class WalletRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findWalletByUserId(userId: string, tx?: Prisma.TransactionClient) {
    return this.getPrismaClient(tx).wallet.findFirst({
      where: {
        userId,
      },
    });
  }

  async createTransactionLog(
    log: TransactionLog,
    walletId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getPrismaClient(tx).walletTransaction.create({
      data: {
        walletId,
        amount: log.amount,
        type: log.type,
        description: log.description ?? null,
      },
    });
  }

  async reduceBalanceAtomically(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
  ) {
    return tx.wallet.updateMany({
      where: {
        userId,
        balance: { gte: amount },
      },
      data: {
        balance: { decrement: amount },
      },
    });
  }

  async increaseBalanceAtomically(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
  ) {
    return tx.wallet.update({
      where: {
        userId,
      },
      data: {
        balance: { increment: amount },
      },
    });
  }

  async getTransaction(
    walletId: string,
    page: number,
    limit: number,
    types?: WalletType[],
  ) {
    const where: Prisma.WalletTransactionWhereInput = { walletId };
    if (types && types.length > 0) where.type = { in: types };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransactionLog, WalletRepository } from './wallet.repository';
import { Prisma, RoleName, WalletType } from '@prisma/client';
import { findOrThrow } from 'src/common/helpers/prisma.helper';

/**
 * Service untuk mengelola dompet (wallet) pengguna.
 * Menyediakan penambahan saldo (top up, refund, penghasilan driver/penjual),
 * pengurangan saldo atomik saat checkout, dan riwayat transaksi.
 * Setiap perubahan saldo tercatat di log transaksi.
 */
@Injectable()
export class WalletService {
  constructor(private walletRepo: WalletRepository) {}

  async isWalletExist(userId: string, tx?: Prisma.TransactionClient) {
    const isTx = tx ?? null;
    const wallet = await findOrThrow(
      () => this.walletRepo.findWalletByUserId(userId, isTx),
      'wallet',
      userId,
    );
    return wallet;
  }

  async increaseBalance(
    amount: number,
    userId: string,
    type: WalletType,
    tx?: Prisma.TransactionClient,
  ) {
    const wallet = await this.isWalletExist(userId, tx);

    const totalBalance = wallet.balance + amount;

    const walletBalance = await this.walletRepo.updateBalance(
      tx,
      userId,
      totalBalance,
    );

    const walletLog: TransactionLog = {
      amount: amount,
      type: type,
    };

    await this.walletRepo.createTransactionLog(walletLog, wallet.id, tx);

    return walletBalance;
  }

  async verifyAndReduceBalance(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    type: WalletType,
  ) {
    const wallet = await this.isWalletExist(userId, tx);
    const result = await this.walletRepo.reduceBalanceAtomically(
      tx,
      userId,
      amount,
    );
    if (result.count === 0)
      throw new BadRequestException(
        'your balance is not sufficient for checkout',
      );
    const transactionLog: TransactionLog = {
      amount,
      type,
    };
    await this.walletRepo.createTransactionLog(transactionLog, wallet.id, tx);
  }

  async verifyAndRollbackBalance(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    type: WalletType,
  ) {
    const wallet = await this.isWalletExist(userId, tx);
    const totalRollback = wallet.balance + amount;
    const walletUpdated = await this.walletRepo.updateBalance(
      tx,
      userId,
      totalRollback,
    );
    const transactionLog: TransactionLog = {
      amount,
      type,
    };
    await this.walletRepo.createTransactionLog(transactionLog, wallet.id, tx);
    return walletUpdated;
  }

  async getWallet(userId: string) {
    return this.isWalletExist(userId);
  }

  async getWalletTransaction(
    userId: string,
    page = 1,
    limit = 5,
    role?: string,
  ) {
    const wallet = await this.isWalletExist(userId);
    const types =
      role === 'SELLER'
        ? [WalletType.SELLER_EARNING]
        : role === 'DRIVER'
          ? [WalletType.DRIVER_EARNING]
          : undefined;
    return this.walletRepo.getTransaction(wallet.id, page, limit, types);
  }
}

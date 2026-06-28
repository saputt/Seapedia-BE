import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Service Prisma sebagai koneksi database utama.
 * Meng-extend PrismaClient dan menginisialisasi koneksi saat module dimulai.
 * Digunakan oleh semua repository di seluruh aplikasi.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const dbUrl = new URL(process.env.DATABASE_URL!);
    dbUrl.searchParams.set('connection_limit', '3');
    super({
      log: ['error', 'warn'],
      datasources: { db: { url: dbUrl.toString() } },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}

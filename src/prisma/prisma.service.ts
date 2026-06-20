import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Service Prisma sebagai koneksi database utama.
 * Meng-extend PrismaClient dan menginisialisasi koneksi saat module dimulai.
 * Digunakan oleh semua repository di seluruh aplikasi.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        super({
            log: ["error", "warn"],
        });
    }

    async onModuleInit() {
        await this.$connect();
    }
}
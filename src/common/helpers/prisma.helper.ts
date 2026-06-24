import { NotFoundException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';

/**
 * Helper untuk operasi Prisma yang sering digunakan.
 * Menyediakan fungsi reusable untuk find-or-throw dan ownership check.
 */

/**
 * Mencari record menggunakan fetcher function atau melempar NotFoundException jika tidak ditemukan.
 * @param fetcher - Fungsi async yang mengembalikan record atau null
 * @param resourceName - Nama resource untuk pesan error (contoh: "user", "product")
 * @param id - ID yang dicari (untuk pesan error)
 * @returns Record yang ditemukan
 * @throws NotFoundException jika record tidak ditemukan
 */
export async function findOrThrow<T>(
  fetcher: () => Promise<T | null>,
  resourceName: string,
  id: string,
): Promise<T> {
  const record = await fetcher();

  if (!record) {
    throw new NotFoundException(`${resourceName} with id ${id} not found`);
  }

  return record;
}

/**
 * Memvalidasi bahwa pengguna adalah pemilik resource.
 * @param ownerId - ID pemilik resource
 * @param userId - ID pengguna yang sedang login
 * @param resourceName - Nama resource untuk pesan error
 * @throws ForbiddenException jika pengguna bukan pemilik
 */
export function checkOwnership(
  ownerId: string,
  userId: string,
  resourceName: string,
): void {
  if (ownerId !== userId) {
    throw new ForbiddenException(
      `You are not authorized to access this ${resourceName}`,
    );
  }
}

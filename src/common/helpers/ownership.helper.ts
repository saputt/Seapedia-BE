import { ForbiddenException } from '@nestjs/common';

/**
 * Helper untuk validasi kepemilikan resource.
 * Menyediakan fungsi untuk memastikan pengguna memiliki akses ke resource tertentu.
 */

/**
 * Memvalidasi bahwa pengguna adalah pemilik resource.
 * @param ownerId - ID pemilik resource
 * @param userId - ID pengguna yang sedang login
 * @param resourceName - Nama resource untuk pesan error (contoh: "address", "store")
 * @throws ForbiddenException jika pengguna bukan pemilik
 */
export function validateOwnership(
  ownerId: string,
  userId: string,
  resourceName: string,
): void {
  if (ownerId !== userId) {
    throw new ForbiddenException(
      `You're not authorized to access this ${resourceName}`,
    );
  }
}

/**
 * Memvalidasi bahwa pengguna adalah pemilik resource atau melempar error jika bukan.
 * @param resource - Resource yang akan divalidasi
 * @param ownerIdField - Field name untuk ID pemilik di resource
 * @param userId - ID pengguna yang sedang login
 * @param resourceName - Nama resource untuk pesan error
 * @returns Resource yang sudah divalidasi
 * @throws ForbiddenException jika pengguna bukan pemilik
 */
export function ensureOwnership<T extends Record<string, any>>(
  resource: T,
  ownerIdField: keyof T,
  userId: string,
  resourceName: string,
): T {
  const ownerId = resource[ownerIdField] as string;
  validateOwnership(ownerId, userId, resourceName);
  return resource;
}

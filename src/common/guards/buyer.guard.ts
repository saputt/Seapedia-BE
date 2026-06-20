import { RoleName } from '@prisma/client';
import { RoleGuard } from './role.guard';

/**
 * Guard untuk endpoint yang hanya bisa diakses oleh pembeli (buyer).
 * @deprecated Gunakan RoleGuard(RoleName.BUYER) sebagai gantinya.
 */
export const BuyerGuard = RoleGuard(RoleName.BUYER);

import { RoleName } from '@prisma/client';
import { RoleGuard } from './role.guard';

/**
 * Guard untuk endpoint yang hanya bisa diakses oleh pengemudi (driver).
 * @deprecated Gunakan RoleGuard(RoleName.DRIVER) sebagai gantinya.
 */
export const DriverGuard = RoleGuard(RoleName.DRIVER);

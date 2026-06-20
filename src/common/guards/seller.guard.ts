import { RoleName } from "@prisma/client";
import { RoleGuard } from "./role.guard";

/**
 * Guard untuk endpoint yang hanya bisa diakses oleh penjual (seller).
 * @deprecated Gunakan RoleGuard(RoleName.SELLER) sebagai gantinya.
 */
export const SellerGuard = RoleGuard(RoleName.SELLER)
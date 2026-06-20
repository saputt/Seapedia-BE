import { RoleName } from "@prisma/client";
import { RoleGuard } from "./role.guard";

/**
 * Guard untuk endpoint yang hanya bisa diakses oleh admin.
 * @deprecated Gunakan RoleGuard(RoleName.ADMIN) sebagai gantinya.
 */
export const AdminGuard = RoleGuard(RoleName.ADMIN)
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleName } from "@prisma/client";

/**
 * Guard untuk validasi peran pengguna.
 * Digunakan untuk melindungi endpoint berdasarkan peran (role) pengguna.
 *
 * Contoh penggunaan:
 * @UseGuards(RoleGuard(RoleName.ADMIN))
 * @UseGuards(RoleGuard(RoleName.BUYER))
 * @UseGuards(RoleGuard(RoleName.SELLER))
 * @UseGuards(RoleGuard(RoleName.DRIVER))
 */
export const RoleGuard = (role: RoleName) => {
    @Injectable()
    class RoleGuardMixin implements CanActivate {
        constructor(private reflector: Reflector) {}

        canActivate(context: ExecutionContext): boolean {
            const req = context.switchToHttp().getRequest()
            const user = req.user
            if (user.role !== role) {
                throw new ForbiddenException(`Access denied. ${role} only`)
            }
            return true
        }
    }
    return RoleGuardMixin
}

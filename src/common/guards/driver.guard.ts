import { CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";

export class DriverGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest()
        const user = req.user
        if (user.role !== "DRIVER") throw new ForbiddenException('Access denied. Driver only')
        return true
    }
}